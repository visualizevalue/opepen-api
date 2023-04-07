import Drive from '@ioc:Adonis/Core/Drive'
import { getRandomSafeBigInt } from 'App/Helpers/bigints'
import AiImage from 'App/Models/AiImage'
import { GeneratorInterface } from './GeneratorInterface'
import Replicate from './../Replicate'

type Input = {
  prompt: string,
  base_image?: string,
  input_image?: Buffer,
  seed?: bigint,
  detail?: number,
}

type StableDiffusionInput = {
  image: string,
  prompt: string,
  seed: number,
  num_outputs: number,
  prompt_strength: number,
  negative_prompt?: string,
  image_dimensions?: '512x512'|'768x768',
  num_inference_steps?: number, // default 50
  guidance_scale?: number, // default 7.5
  scheduler?: 'DDIM'|'K_EULER'|'DPMSolverMultistep'|'K_EULER_ANCESTRAL'|'PNDM'|'KLMS', // default DPMSolverMultistep
}

type StableDiffusionnnOutput = string[]

/**
 * Generate images using a stable diffusion edge detection technique.
 */
export default class StableDiffusion implements GeneratorInterface {
  // The local model ID
  modelId = 1

  // The global model ID
  model = 'stability-ai/stable-diffusion-img2img'

  // The model version
  version = '15a3689ee13b0d2616e98820eca31d4c3abcd36672df6afce5cb6feb1d66087d'

  // The bag of input variables for the job
  input: Input

  /**
   * Construct the edge detection generator.
   * @param input The input parameters for generating the image.
   */
  constructor(input: Input) {
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
    const input: StableDiffusionInput = {
      image: `data:image/png;base64,${
        (
          await Drive.get(this.input.input_image
            ? `images/${this.input.input_image}.png`
            : `inputs/${this.input.base_image}.png`
          )
        ).toString('base64')
      }`,
      prompt: this.input.prompt,
      prompt_strength: 0.5,
      negative_prompt: 'blurry, deformed',
      seed: Number(this.input.seed) || 0,
      num_outputs: 1,
      num_inference_steps: 25,
      guidance_scale: this.getGuidance(),
      scheduler: 'DPMSolverMultistep',
    }

    const output: StableDiffusionnnOutput = (await Replicate.run(this.modelKey, { input })) as StableDiffusionnnOutput

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
    return Number(seed % 100n)
  }

  /**
   * Calculates the guidance scale based on the input detail value.
   */
  private getGuidance(): number {
    const detail: number = this.input.detail || 0

    return detail < 10 ? 6
         : detail < 90 ? 9
         : 12
  }
}
