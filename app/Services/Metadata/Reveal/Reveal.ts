import fs from 'fs'
import path from 'path'
import Logger from '@ioc:Adonis/Core/Logger'
import { execute } from 'App/Helpers/execute'
import Opepen from 'App/Models/Opepen'
import SetSubmission from 'App/Models/SetSubmission'
import Subscription from 'App/Models/Subscription'
import { MaxReveal } from 'App/Models/types'
import CID from 'App/Services/CID'
import provider from 'App/Services/RPCProvider'

export default class Reveal {
  public async compute (
    submission: SetSubmission,
  ) {
    await this.prepareData(submission)

    const block = await provider.getBlock(submission.revealBlockNumber)

    await execute(`python3 randomize.py --seed "${block.hash}" --set ${submission.uuid}`)

    await this.handleResults(submission)
  }

  private async prepareData (submission: SetSubmission) {
    const submissions = await Subscription.query()
      .where('submissionId', submission.id)
      .orderBy('createdAt', 'desc')

    const opepens: any[] = []
    const maxReveals: { [key: string]: MaxReveal } = {}

    for (const submission of submissions) {
      for (const tokenId of submission.opepenIds) {
        const opepen = await Opepen.findOrFail(tokenId)

        if (opepen.revealedAt) {
          Logger.info(`Skipping #${opepen.tokenId} cause it is already revealed`)
          continue
        }

        const signer = submission.address.toLowerCase()
        const delegators = submission.delegatedBy ? submission.delegatedBy.split(',').map(a => a.toLowerCase()) : []
        const allowedOwners = [signer, ...delegators]

        if (! allowedOwners.includes(opepen.owner)) {
          Logger.info(`Skipping #${opepen.tokenId} cause not held by valid owners anymore.`)
          continue
        }

        opepens.push({
          tokenId,
          signer: submission.address,
          holder: opepen.owner,
          edition: opepen.data.edition.toString(),
        })
      }

      // Save the set max reveal per edition size
      const hasMaxReveals = submission.maxReveals && (
        submission.maxReveals['1'] ||
        submission.maxReveals['4'] ||
        submission.maxReveals['5'] ||
        submission.maxReveals['10'] ||
        submission.maxReveals['20'] ||
        submission.maxReveals['40']
      )
      if (hasMaxReveals) {
        maxReveals[submission.address] = {
          '1':  submission.maxReveals['1'] ? submission.maxReveals['1'] : undefined,
          '4':  submission.maxReveals['4'] ? submission.maxReveals['4'] : undefined,
          '5':  submission.maxReveals['5'] ? submission.maxReveals['5'] : undefined,
          '10': submission.maxReveals['10'] ? submission.maxReveals['10'] : undefined,
          '20': submission.maxReveals['20'] ? submission.maxReveals['20'] : undefined,
          '40': submission.maxReveals['40'] ? submission.maxReveals['40'] : undefined,
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

    // And save to submission and to file (for python execution)
    await submission.save()
    fs.writeFileSync(this.inputPath(submission.id), dataBlob)
  }

  private async handleResults (submission: SetSubmission) {
    const output = fs.readFileSync(this.outputPath(submission.id)).toString()
    submission.revealSubmissionsOutput = JSON.parse(output)

    const cid = await CID.getJsonCID(submission.revealSubmissionsOutput)
    submission.revealSubmissionsOutputCid = cid.toString()

    await submission.save()
  }

  private inputPath (submissionId: number) {
    return path.join(__dirname, `data/${submissionId}.json`)
  }

  private outputPath (submissionId: number) {
    return path.join(__dirname, `results/${submissionId}.json`)
  }
}
