import { toDriveFromURI } from 'App/Helpers/drive'
import Replicate from '../Replicate'

export default class EnhancedSRGANUpscaler {
  public static async run (image: Buffer, name) {
    const output = (await Replicate.run(
      `xinntao/esrgan:c263265e04b16fda1046d1828997fc27b46610647a3348df1c72fbffbdbac912`,
      {
        input: {
          image: `data:image/png;base64,${image.toString('base64')}`,
        }
      }
    )) as unknown as string

    await toDriveFromURI(output , name)
  }
}
