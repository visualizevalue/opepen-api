import fs from 'fs'
import path from 'path'
import { BaseCommand, args } from '@adonisjs/core/build/standalone'

export default class AnalyzeFilteredOpepens extends BaseCommand {
  public static commandName = 'reveal:analyze-filtered'
  public static description = 'Analyze which opepens were filtered out of reveal data'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string({ description: 'Submission ID' })
  public submissionId: string

  public async run() {
    const { default: Opepen } = await import('App/Models/Opepen')
    const { default: Subscription } = await import('App/Models/Subscription')

    const revealInputPath = path.join(
      __dirname,
      `../app/Services/Metadata/Reveal/data/${this.submissionId}.json`
    )
    const revealData = JSON.parse(fs.readFileSync(revealInputPath, 'utf8'))
    const includedTokenIds = new Set(revealData.opepens.map((o) => o.tokenId))

    this.logger.info(`Analyzing filtered opepens for submission ${this.submissionId}`)
    this.logger.info('='.repeat(80))

    const subscriptions = await Subscription.query().where('submissionId', this.submissionId)

    const filteredByReason: {
      alreadyRevealed: Array<{ tokenId: string; edition: number; signer: string; revealedAt: string }>
      notOwnedAnymore: Array<{ tokenId: string; edition: number; signer: string; currentOwner: string; allowedOwners: string[] }>
      duplicate: Array<{ tokenId: string; edition: number; signer: string }>
    } = {
      alreadyRevealed: [],
      notOwnedAnymore: [],
      duplicate: [],
    }

    const seenTokenIds = new Set()

    for (const subscription of subscriptions) {
      const signer = subscription.address.toLowerCase()
      const delegators = subscription.delegatedBy
        ? subscription.delegatedBy.split(',').map((a) => a.toLowerCase())
        : []
      const allowedOwners = [signer, ...delegators]

      for (const tokenId of subscription.opepenIds) {
        if (includedTokenIds.has(tokenId.toString())) {
          seenTokenIds.add(tokenId.toString())
          continue
        }

        const opepen = await Opepen.find(tokenId)

        if (!opepen) {
          this.logger.warning(`Token ${tokenId} not found in database`)
          continue
        }

        if (opepen.revealedAt) {
          filteredByReason.alreadyRevealed.push({
            tokenId,
            edition: opepen.data.edition,
            signer: subscription.address,
            revealedAt: opepen.revealedAt.toFormat('yyyy-MM-dd HH:mm'),
          })
        } else if (!allowedOwners.includes(opepen.owner)) {
          filteredByReason.notOwnedAnymore.push({
            tokenId,
            edition: opepen.data.edition,
            signer: subscription.address,
            currentOwner: opepen.owner,
            allowedOwners: allowedOwners,
          })
        } else if (seenTokenIds.has(tokenId.toString())) {
          filteredByReason.duplicate.push({
            tokenId,
            edition: opepen.data.edition,
            signer: subscription.address,
          })
        }

        seenTokenIds.add(tokenId.toString())
      }
    }

    // Print results
    console.log('\n📊 FILTERING SUMMARY')
    console.log('-'.repeat(80))
    console.log(`Total opepens in reveal input: ${includedTokenIds.size}`)
    console.log(`Already revealed: ${filteredByReason.alreadyRevealed.length}`)
    console.log(`Not owned anymore: ${filteredByReason.notOwnedAnymore.length}`)
    console.log(`Duplicates: ${filteredByReason.duplicate.length}`)

    // Group not-owned-anymore by edition
    if (filteredByReason.notOwnedAnymore.length > 0) {
      console.log('\n🔍 NOT OWNED ANYMORE (by edition):')
      console.log('-'.repeat(80))

      const byEdition: Record<string, typeof filteredByReason.notOwnedAnymore> = {}
      for (const item of filteredByReason.notOwnedAnymore) {
        if (!byEdition[item.edition]) byEdition[item.edition] = []
        byEdition[item.edition].push(item)
      }

      for (const edition of ['1', '4', '5', '10', '20', '40']) {
        const items = byEdition[edition] || []
        if (items.length > 0) {
          console.log(`\nEdition ${edition}: ${items.length} opepens no longer owned`)
          for (const item of items.slice(0, 5)) {
            console.log(`  Token #${item.tokenId}`)
            console.log(`    Signer: ${item.signer}`)
            console.log(`    Current owner: ${item.currentOwner}`)
            console.log(`    Allowed: [${item.allowedOwners.join(', ')}]`)
          }
          if (items.length > 5) {
            console.log(`  ... and ${items.length - 5} more`)
          }
        }
      }
    }

    // Show already revealed
    if (filteredByReason.alreadyRevealed.length > 0) {
      console.log('\n🔍 ALREADY REVEALED:')
      console.log('-'.repeat(80))
      for (const item of filteredByReason.alreadyRevealed.slice(0, 10)) {
        console.log(
          `  Token #${item.tokenId} (edition ${item.edition}) - revealed at ${item.revealedAt}`
        )
      }
      if (filteredByReason.alreadyRevealed.length > 10) {
        console.log(`  ... and ${filteredByReason.alreadyRevealed.length - 10} more`)
      }
    }

    // Show duplicates
    if (filteredByReason.duplicate.length > 0) {
      console.log('\n🔍 DUPLICATES (opted in by multiple subscribers):')
      console.log('-'.repeat(80))
      for (const item of filteredByReason.duplicate.slice(0, 10)) {
        console.log(`  Token #${item.tokenId} (edition ${item.edition}) - signer ${item.signer}`)
      }
      if (filteredByReason.duplicate.length > 10) {
        console.log(`  ... and ${filteredByReason.duplicate.length - 10} more`)
      }
    }
  }
}
