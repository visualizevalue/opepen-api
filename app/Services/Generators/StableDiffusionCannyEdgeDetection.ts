import AiImage from 'App/Models/AiImage'
import { GeneratorInterface } from './GeneratorInterface'
import Replicate from './../Replicate'

export type StableDiffusionCannyEdgeDetectionInput = {
  prompt: string,
  seed?: bigint,
  detail?: number,
  input_image?: Buffer,
  base_image?: Buffer
}

type ControlnetCannyInput = {
  image: string,
  prompt: string,
  num_samples?: 1|2|3|4,
  seed: number,
  image_resolution?: '256'|'512'|'768',
  low_threshold?: number,
  high_threshold?: number,
  ddim_steps?: number, // default 20
  scale?: number, // default 9
  eta?: number, // default 0
  a_prompt?: string,
  n_prompt?: string,
}

type ControlnetCannyOutput = string[]

/**
 * Generate images using a stable diffusion edge detection technique.
 */
export default class StableDiffusionCannyEdgeDetection implements GeneratorInterface {
  // The local model ID
  modelId = 4

  // The global model ID
  model = 'jagilley/controlnet-canny'

  // The model version
  version = 'aff48af9c68d162388d230a2ab003f68d2638d88307bdaf1c2f1ac95079c9613'

  // The bag of input variables for the job
  input: StableDiffusionCannyEdgeDetectionInput

  image?: AiImage

  /**
   * Construct the edge detection generator.
   * @param input The input parameters for generating the image.
   */
  constructor(input: StableDiffusionCannyEdgeDetectionInput, image?: AiImage) {
    // input.seed = input.seed || getRandomSafeBigInt()
    input.seed = BigInt(293487454108)
    input.detail = input.detail || this.getDetail(input.seed)

    this.input = input
    this.image = image
  }

  /**
   * Generates an AI image using the stable diffusion edge detection technique.
   */
  async generate(): Promise<AiImage> {
    const input: ControlnetCannyInput = {
      image: `data:image/png;base64,${
        (this.input.input_image || this.input.base_image || Buffer.from('')).toString('base64')
      }`,
      prompt: this.input.prompt,
      seed: Number(this.input.seed) || 0,
      eta: 0.5,
      ddim_steps: 20,
      scale: this.input.detail,
      a_prompt: '',
      n_prompt: '',
    }

    const output: ControlnetCannyOutput = (await Replicate.run(this.modelKey, { input })) as ControlnetCannyOutput

    const imageData = { ...input, image: undefined }
    const url = output[output.length - 1]
    if (this.image) {
      this.image.data = { ...this.image.data, ...imageData }
      return this.image.fillImageFromURI(url)
    }

    return AiImage.fromURI(url, {
      data: imageData,
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

    return input < 5  ? 5
         : input < 90 ? 9
         : input < 95 ? 12
         : 19
  }
}
