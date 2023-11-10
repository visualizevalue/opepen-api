import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import Env from '@ioc:Adonis/Core/Env'
import { delay } from 'App/Helpers/time'
import Image from 'App/Models/Image'
import Opepen from 'App/Models/Opepen'
import SetModel from 'App/Models/SetModel'
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

  public async run() {
    this.logger.info(`Importing images from metadata api for set #${this.set}`)

    const set = await SetModel.findOrFail(this.set)
    const opepenInSet = await Opepen.query().where('setId', set.id)

    if (set.isDynamic) {
      this.logger.info(`Importing dynamic set`)
      await this.importDynamicSet(opepenInSet)
    } else {
      this.logger.info(`Importing editioned set`)
      await this.importEditionSet(set, opepenInSet)
    }
  }

  private async importDynamicSet (opepenInSet: Opepen[]) {
    for (const opepen of opepenInSet) {
      const response = await axios.get(`https://metadata.opepen.art/${opepen.tokenId}/image-uri`)

      const { uri } = response.data
      const gatewayURI = uri.replace('ipfs.io', Env.get('IPFS_GATEWAY'))

      this.logger.info(`Opepen #${opepen.tokenId} image importing from: ${gatewayURI}`)
      const image = await Image.fromURI(gatewayURI)
      image.generateScaledVersions()

      opepen.imageId = image.id
      await opepen.save()

      this.logger.info(`Opepen #${opepen.tokenId} image imported: Image #${opepen.imageId}`)

      await delay(500)

    }
  }

  private async importEditionSet (set: SetModel, opepenInSet: Opepen[]) {
    for (const opepen of opepenInSet) {
      opepen.imageId = set[`edition_${opepen.data.edition}ImageId`]
      await opepen.save()

      this.logger.info(`Opepen #${opepen.tokenId} image imported: Image #${opepen.imageId}`)
    }
  }
}
