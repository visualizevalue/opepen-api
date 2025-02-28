import fs from 'fs'
import path from 'path'
import { DateTime } from 'luxon'
import Logger from '@ioc:Adonis/Core/Logger'
import { execute } from 'App/Helpers/execute'
import { MaxReveal } from 'App/Models/types'
import Image from 'App/Models/Image'
import Opepen from 'App/Models/Opepen'
import SetModel from 'App/Models/SetModel'
import SetSubmission from 'App/Models/SetSubmission'
import Subscription from 'App/Models/Subscription'
import CID from 'App/Services/CID'
import provider from 'App/Services/RPCProvider'
import pad from 'App/Helpers/pad'
import Database from '@ioc:Adonis/Lucid/Database'

const EDITION_VOCAB = {
  "1": "One",
  "4": "Four",
  "5": "Five",
  "10": "Ten",
  "20": "Twenty",
  "40": "Forty",
}

export default class Reveal {
  public async schedule (submission: SetSubmission) {
    if (submission.revealBlockNumber) throw new Error(`Reveal block already set`)

    submission.revealBlockNumber = (await provider.getBlockNumber() + 50).toString()
    await submission.save()
    Logger.info(`Set reveal block for ${submission.name} to ${submission.revealBlockNumber}`)

    await this.prepareData(submission)
  }

  public async compute (
    submission: SetSubmission,
    set: SetModel,
  ) {
    Logger.info(`Computing reveal for ${submission.name}`)
    if (! submission.revealSubmissionsInputCid) throw new Error(`Reveal data not prepared`)

    fs.writeFileSync(this.inputPath(submission.id), submission.revealSubmissionsInput)

    const block = await provider.getBlock(parseInt(submission.revealBlockNumber))

    await execute(`python3 ${this.executablePath()} --seed "${block.hash}" --set ${submission.id}`)

    await this.handleResults(submission, set)
  }

  private async prepareData (submission: SetSubmission) {
    const optIns = await Subscription.query()
      .where('submissionId', submission.id)
      .orderBy('createdAt', 'desc')

    const addedTokens: { [key: string]: boolean } = {}
    const opepens: any[] = []
    const maxReveals: { [key: string]: MaxReveal } = {}

    for (const optIn of optIns) {
      for (const tokenId of optIn.opepenIds) {
        const opepen = await Opepen.findOrFail(tokenId)

        if (opepen.revealedAt) {
          Logger.info(`Skipping #${opepen.tokenId} cause it is already revealed`)
          continue
        }

        const signer = optIn.address.toLowerCase()
        const delegators = optIn.delegatedBy ? optIn.delegatedBy.split(',').map(a => a.toLowerCase()) : []
        const allowedOwners = [signer, ...delegators]

        if (! allowedOwners.includes(opepen.owner)) {
          Logger.info(`Skipping #${opepen.tokenId} cause not held by valid owners anymore.`)
          continue
        }

        if (addedTokens[tokenId]) {
          Logger.info(`Token #${opepen.tokenId} already added`)
          continue
        }

        opepens.push({
          tokenId,
          signer: optIn.address,
          holder: opepen.owner,
          edition: opepen.data.edition.toString(),
        })
        addedTokens[tokenId] = true
      }

      // Save the set max reveal per edition size
      const hasMaxReveals = optIn.maxReveals && (
        optIn.maxReveals['1'] ||
        optIn.maxReveals['4'] ||
        optIn.maxReveals['5'] ||
        optIn.maxReveals['10'] ||
        optIn.maxReveals['20'] ||
        optIn.maxReveals['40']
      )
      if (hasMaxReveals) {
        maxReveals[optIn.address] = {
          '1':  optIn.maxReveals['1'] ? optIn.maxReveals['1'] : undefined,
          '4':  optIn.maxReveals['4'] ? optIn.maxReveals['4'] : undefined,
          '5':  optIn.maxReveals['5'] ? optIn.maxReveals['5'] : undefined,
          '10': optIn.maxReveals['10'] ? optIn.maxReveals['10'] : undefined,
          '20': optIn.maxReveals['20'] ? optIn.maxReveals['20'] : undefined,
          '40': optIn.maxReveals['40'] ? optIn.maxReveals['40'] : undefined,
        }
      }
    }

    // Get the data
    const data = { opepens, maxReveals }
    const dataBlob = JSON.stringify(data, null, 4)

    // Get the CID for the data and save it to the submission
    submission.revealSubmissionsInput = dataBlob
    const cid = await CID.getJsonCID(data)
    submission.revealSubmissionsInputCid = cid.toString()
    Logger.info(`Prepared reveal data for ${submission.name}. CID ${submission.revealSubmissionsInputCid}`)

    // And save to submission and to file (for python execution)
    await submission.save()
  }

  private async handleResults (submission: SetSubmission, set: SetModel) {
    const output = fs.readFileSync(this.outputPath(submission.id)).toString()
    submission.revealSubmissionsOutput = JSON.parse(output)

    const cid = await CID.getJsonCID(submission.revealSubmissionsOutput)
    submission.revealSubmissionsOutputCid = cid.toString()

    set.submissionId = submission.id
    submission.setId = set.id
    submission.publishedAt = DateTime.now()

    await set.save()
    await submission.save()

    await this.saveOpepenMetadata(submission, set)
    await set.notifyPublished()
  }

  private async saveOpepenMetadata (submission: SetSubmission, set: SetModel) {
    // Load images
    await submission.load(loader => {
      loader.load('edition1Image')
            .load('edition4Image')
            .load('edition5Image')
            .load('edition10Image')
            .load('edition20Image')
            .load('edition40Image')
    })
    if (submission.isDynamic) {
      await submission.load('dynamicSetImages')
    }

    const editions = Object.keys(submission.revealSubmissionsOutput)
    for (const edition of editions) {
      let index = 1
      for (const tokenId of submission.revealSubmissionsOutput[edition]) {
        await this.generateMetadataFor(tokenId, index, submission, set)
        index ++
      }
    }

    // Clear other opt ins for the revealed Opepen
    const revealedOpepenIds = Object.values(submission.revealSubmissionsOutput).flat().join(',')
    await Database.rawQuery(`
      UPDATE set_subscriptions
      SET opepen_ids = opepen_ids - '{${revealedOpepenIds}}'::text[]
      WHERE opepen_ids \\?| '{${revealedOpepenIds}}'::text[]
      AND submission_id != ${submission.id}
    `)
  }

  public async generateMetadataFor (tokenId: number, index: number, submission: SetSubmission, set: SetModel) {
    const opepen = await Opepen.findOrFail(tokenId)
    const edition = opepen.data.edition

    const image: Image = submission.isDynamic && edition > 1
      ? submission.dynamicSetImages[`image${edition}_${index}`]
      : submission[`edition${edition}Image`]

    opepen.metadata = {
      image: image.requiresAnimationUrlMetadata ? image.staticURI : image.originalURI,
      animation_url: image.requiresAnimationUrlMetadata ? image.originalURI : undefined,
      attributes: [
        {
          trait_type: `Artist`,
          value: submission.artist
        },
        {
          trait_type: `Release`,
          value: pad(set.id, 3)
        },
        {
          trait_type: `Set`,
          value: submission.name
        },
        {
          trait_type: `Opepen`,
          value: submission[`edition_${edition}Name`]
        },
        {
          trait_type: `Edition Size`,
          value: EDITION_VOCAB[edition]
        }
      ]
    }

    opepen.setId = set.id
    opepen.revealedAt = DateTime.now()
    opepen.setEditionId = index
    opepen.imageId = image.id

    if (submission.isDynamic) { // Update image cache post reveal
      image.opepenId = opepen.tokenId as bigint
      await image.save()
    }

    await opepen.save()
  }

  private inputPath (submissionId: number) {
    return path.join(__dirname, `data/${submissionId}.json`)
  }

  private executablePath () {
    return path.join(__dirname, `randomize.py`)
  }

  private outputPath (submissionId: number) {
    return path.join(__dirname, `results/${submissionId}.json`)
  }
}

