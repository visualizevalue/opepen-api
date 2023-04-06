import Drive from '@ioc:Adonis/Core/Drive'
import { getRandomSafeBigInt } from 'App/Helpers/bigints'
import AiImage from 'App/Models/AiImage'
import { GeneratorInterface } from './GeneratorInterface'
import Replicate from './../Replicate'

type StableDiffusionShapeDetectionInput = {
  prompt: string,
  base_image?: string,
  input_image?: Buffer,
  seed?: bigint,
  detail?: number,
}

type ControlnetDpth2ImgInput = {
  image: string,
  prompt: string,
  seed: number,
  image_resolution?: '256'|'512'|'768',
  ddim_steps?: number, // default 20
  scale?: number, // default 9
  eta?: number, // default 0
  a_prompt?: string,
  n_prompt?: string,
  detect_resolution?: number, // default 512
}

type ControlnetDpth2ImgOutput = string[]

/**
 * Generate images using a stable diffusion shape detection technique.
 */
export default class StableDiffusionShapeDetection implements GeneratorInterface {
  // The local model ID
  modelId = 3

  // The global model ID
  model = 'jagilley/controlnet-depth2img'

  // The model version
  version = '922c7bb67b87ec32cbc2fd11b1d5f94f0ba4f5519c4dbd02856376444127cc60'

  // The bag of input variables for the job
  input: StableDiffusionShapeDetectionInput

  /**
   * Construct the edge detection generator.
   * @param input The input parameters for generating the image.
   */
  constructor(input: StableDiffusionShapeDetectionInput) {
    input.seed = input.seed || getRandomSafeBigInt()
    input.detail = input.detail || this.getDetail(input.seed)

    // Set the default base image if none is provided
    if (! input.input_image) {
      input.base_image = input.base_image || 'opepen-base'
    }

    this.input = input
  }

  /**
   * Generates an AI image using the stable diffusion edge detection technique.
   */
  async generate(): Promise<AiImage> {
    const input: ControlnetDpth2ImgInput = {
      image: `data:image/png;base64,${
        (this.input.input_image || await Drive.get(`inputs/${this.input.base_image}.png`)).toString('base64')
      }`,
      prompt: this.input.prompt,
      seed: Number(this.input.seed) || 0,
      eta: 0.9,
      scale: this.input.detail,
    }

    const output: ControlnetDpth2ImgOutput = (await Replicate.run(this.modelKey, { input })) as ControlnetDpth2ImgOutput

    return await AiImage.fromURI(output[output.length - 1], {
      data: this.input,
      modelId: this.modelId,
    })
  }

  /**
   * Retrieves the model key for the current model and version.
   */
  private get modelKey(): `${string}/${string}:${string}` {
    return `${this.model}:${this.version}` as `${string}/${string}:${string}`
  }

  /**
   * Calculates the detail level based on the input seed value.
   * @param seed The seed value used for generating the image.
   */
  private getDetail(seed: bigint): number {
    const input = seed % 100n

    return input < 10 ? 7
         : input < 50 ? 9
         : input < 90 ? 12
         : 19
  }
}
