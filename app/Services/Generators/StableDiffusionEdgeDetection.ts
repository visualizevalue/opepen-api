import Drive from '@ioc:Adonis/Core/Drive'
import { getRandomSafeBigInt } from 'App/Helpers/bigints'
import AiImage from 'App/Models/AiImage'
import { GeneratorInterface } from './GeneratorInterface'
import Replicate from './../Replicate'

type StableDiffusionEdgeDetectionInput = {
  prompt: string,
  base_image?: string,
  input_image?: Buffer,
  seed?: bigint,
  detail?: number,
}

type ControlnetHedInput = {
  input_image: string,
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

type ControlnetHedOutput = string[]

/**
 * Generate images using a stable diffusion edge detection technique.
 */
export default class StableDiffusionEdgeDetection implements GeneratorInterface {
  // The local model ID
  modelId = 2

  // The global model ID
  model = 'jagilley/controlnet-hed'

  // The model version
  version = 'cde353130c86f37d0af4060cd757ab3009cac68eb58df216768f907f0d0a0653'

  // The bag of input variables for the job
  input: StableDiffusionEdgeDetectionInput

  /**
   * Construct the edge detection generator.
   * @param input The input parameters for generating the image.
   */
  constructor(input: StableDiffusionEdgeDetectionInput) {
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
    const input: ControlnetHedInput = {
      input_image: `data:image/png;base64,${
        (this.input.input_image || await Drive.get(`inputs/${this.input.base_image}.png`)).toString('base64')
      }`,
      prompt: this.input.prompt,
      seed: Number(this.input.seed) || 0,
      scale: this.input.detail,
    }

    const output: ControlnetHedOutput = (await Replicate.run(this.modelKey, { input })) as ControlnetHedOutput
    return await AiImage.fromURI(output[output.length - 1], { data: this.input })
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

    return input < 2  ? 0.2
         : input < 10 ? 2
         : input < 50 ? 5
         : input < 80 ? 12
         : 19
  }
}
