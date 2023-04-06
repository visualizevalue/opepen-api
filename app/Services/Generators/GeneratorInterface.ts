import AiImage from 'App/Models/AiImage'

export interface GeneratorInterface {
  modelId: number;
  model: string;
  version: string;
  input: any

  generate(): Promise<AiImage>
}
