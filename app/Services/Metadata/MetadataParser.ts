import Setting from 'App/Models/Setting'
import { Attribute, MetadataProvenance, ContractMetadata, TokenMetadata } from './MetadataTypes'
import Opepen from 'App/Models/Opepen'

/**
 * A class for parsing metadata and metadata provenance.
 */
export default class MetadataParser {
  metadata: MetadataProvenance
  baseData: TokenMetadata

  /**
   * Get the contract metadata
   *
   * @returns {Promise} A promise that resolves to the contract metadata
   */
  public async contract (): Promise<ContractMetadata> {
    const setting = await Setting.get('METADATA_CONTRACT')

    return setting.data
  }

  /**
   * Get the base token metadata
   *
   * @returns {Promise} A promise that resolves to the base metadata
   */
  public async base (): Promise<TokenMetadata> {
    if (this.baseData) return this.baseData

    const setting = await Setting.get('METADATA_BASE')

    return setting.data as TokenMetadata
  }

  /**
   * Get the metadata for a specified tokenID
   *
   * @param {String|Number} id The ID of the token to provide metadata for
   * @returns {Promise} A promise that resolves to the metadata for the specified ID
   */
  public async forId (id: string|number): Promise<TokenMetadata> {
    return this.forOpepen(await Opepen.findOrFail(id))
  }

  /**
   * Get the metadata for a specified Opepen
   *
   * @param {Opepen} opepen The token to render
   * @returns {Promise} A promise that resolves to the metadata for the specified ID
   */
  public async forOpepen (opepen: Opepen): Promise<TokenMetadata> {
    const isRevealed = !! opepen.revealedAt

    const definition = isRevealed
      ? opepen.metadata
      : (await Setting.get('METADATA_EDITIONS')).data[opepen.data.edition]

    const data = {
      name: opepen.name,
      description:   await this.getAttribute('description',   definition) as string,
      image:         await this.getAttribute('image',         definition) as string,
      image_dark:    await this.getAttribute('image_dark',    definition) as string,
      animation_url: await this.getAttribute('animation_url', definition) as string,
      embed_url:     await this.getAttribute('embed_url',     definition) as string,
      download_url:  await this.getAttribute('download_url',  definition) as string,
      generator:     await this.getAttribute('generator',     definition) as string,
      attributes: [
        ...(await this.getAttribute('attributes', definition)) as Attribute[],
        {
          trait_type: 'Revealed',
          value: isRevealed ? 'Yes' : 'No',
        },
        {
          trait_type: 'Number',
          value: parseInt(`${opepen.tokenId}`),
        }
      ],
    }

    if (! data.image.startsWith('http') && ! data.image.startsWith('ipfs://')) {
      data.image = `https://metadata.opepen.art/${opepen.tokenId}/image`
    }

    return data
  }

  async getAttribute (attribute: keyof TokenMetadata, bag: TokenMetadata) {
    if (bag[attribute]) return bag[attribute]

    return (await this.base())[attribute]
  }

}
