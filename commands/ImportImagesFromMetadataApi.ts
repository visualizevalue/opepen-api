import { BaseCommand, args, flags } from '@adonisjs/core/build/standalone'
import Env from '@ioc:Adonis/Core/Env'
import { delay } from 'App/Helpers/time'
import OpenSea from 'App/Services/OpenSea'
import axios from 'axios'

export default class ImportSetImages extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'images:import-set-images'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Import images from metadata api (used for dynamic sets)'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public set: string

  @flags.string()
  public edition: string

  @flags.boolean()
  public missing: boolean

  @flags.boolean()
  public internal: boolean = true

  @flags.boolean()
  public opensea: boolean = false

  public async run() {
    const { default: Opepen } = await import('App/Models/Opepen')
    const { default: SetModel } = await import('App/Models/SetModel')

    this.logger.info(`Importing images from metadata api for set #${this.set}`)

    const set = await SetModel.query().where('id', this.set).preload('submission').firstOrFail()

    const query = Opepen.query().where('setId', set.id)
    if (this.missing) {
      query.whereNull('imageId')
    }
    if (this.edition) {
      query.whereRaw(`"data"->>'edition' = ?`, [this.edition])
    }

    const opepenInSet = await query

    if (set.submission.isDynamic) {
      this.logger.info(`Importing dynamic set`)
      await this.importDynamicSet(opepenInSet)
    } else {
      this.logger.info(`Importing editioned set`)
      await this.importEditionSet(set, opepenInSet)
    }
  }

  private async importDynamicSet (opepenInSet) {
    const { default: Image } = await import('App/Models/Image')

    for (const opepen of opepenInSet) {
      const response = await axios.get(`https://metadata.opepen.art/${opepen.tokenId}/image-uri`)

      const { uri } = response.data
      const gatewayURI = uri.replace('ipfs.io', Env.get('IPFS_GATEWAY'))

      if (this.internal) {
        this.logger.info(`Opepen #${opepen.tokenId} image importing from: ${gatewayURI}`)
        const image = await Image.fromURI(gatewayURI)
        image.generateScaledVersions()

        opepen.imageId = image.id
        await opepen.save()

        this.logger.info(`Opepen #${opepen.tokenId} image imported: Image #${opepen.imageId}`)
      }

      if (this.opensea) {
        await OpenSea.updateMetadata(opepen.tokenId.toString())
      }

      await delay(500)
    }
  }

  private async importEditionSet (set, opepenInSet) {
    for (const opepen of opepenInSet) {
      opepen.imageId = set[`edition_${opepen.data.edition}ImageId`]
      await opepen.save()

      if (this.opensea) {
        await OpenSea.updateMetadata(opepen.tokenId.toString())
      }

      this.logger.info(`Opepen #${opepen.tokenId} image imported: Image #${opepen.imageId}`)
    }
  }
}
