import { validator, schema, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { ResponseContract } from '@ioc:Adonis/Core/Response'
import Drive from '@ioc:Adonis/Core/Drive'
import MetadataParser from '@ioc:MetadataParser'
import { renderPage } from 'App/Services/PageRenderer'

export default class OpepenMetadataController {

  /**
   * Get the contract metadata
   *
   * @returns {Promise} A promise that resolves to the contract metadata
   */
  public async contractMetadata () {
    return MetadataParser.contract()
  }

  /**
   * Get the base edition image
   *
   * @param {Object} ctx The HTTP context
   * @param {Object} ctx.response The HTTP response
   * @returns {Promise} A promise that resolves to the base image
   */
  public async baseImage ({ response }: HttpContextContract) {
    return this.resolveImage((await MetadataParser.base()).image, response)
  }

  /**
   * Get the metadata for the specified ID
   *
   * @param {Object} ctx The HTTP context
   * @param {Object} ctx.params The HTTP request parameters
   * @param {Number} ctx.params.id The ID of the metadata to retrieve
   * @returns {Promise} A promise that resolves to the metadata for the specified ID
   */
  public async metadata ({ params }: HttpContextContract) {
    await this.validate(params)

    const data = await MetadataParser.forId(params.id)

    if (! data.image.startsWith('http') && ! data.image.startsWith('ipfs://')) {
      data.image = `https://metadata.opepen.art/${params.id}/image`
    }

    return data
  }

  /**
   * Get the image URI for the specified ID
   *
   * @param {Object} ctx The HTTP context
   * @param {Object} ctx.params The HTTP request parameters
   * @param {Number} ctx.params.id The ID of the metadata to retrieve the image for
   * @param {Object} ctx.response The HTTP response
   * @returns {Promise} A promise that resolves to the image URI for the specified ID
   */
  public async imageURI (ctx: HttpContextContract) {
    const { params } = ctx
    await this.validate(params)

    let { image: uri } = await MetadataParser.forId(params.id)

    if (! uri) {
      uri = (await MetadataParser.base()).image
    }

    if (uri.startsWith('ipfs://')) {
      uri = uri.replace('ipfs://', 'https://ipfs.vv.xyz/ipfs/')
    }

    return { uri }
  }

  /**
   * Get the image for the specified ID
   *
   * @param {Object} ctx The HTTP context
   * @param {Object} ctx.params The HTTP request parameters
   * @param {Number} ctx.params.id The ID of the metadata to retrieve the image for
   * @param {Object} ctx.response The HTTP response
   * @returns {Promise} A promise that resolves to the image for the specified ID
   */
  public async image (ctx: HttpContextContract) {
    const { response } = ctx

    const { uri } = await this.imageURI(ctx)

    return this.resolveImage(uri, response)
  }

  public async render (ctx: HttpContextContract) {
    const { params, response } = ctx
    await this.validate(params)

    let { animation_url } = await MetadataParser.forId(params.id)

    if (! animation_url) return await this.image(ctx)

    if (animation_url.startsWith('ipfs://')) {
      animation_url = `https://ipfs.vv.xyz/ipfs/${animation_url.replace('ipfs://', '')}`
    }

    const image = await renderPage(animation_url)

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(image))
      .send(image)
  }

  /**
   * Resolve the image URL and return the image
   *
   * @param {String} image The image URL to resolve
   * @param {Object} response The HTTP response
   * @returns {Promise} A promise that resolves to the image
   */
  private async resolveImage (image: string, response: ResponseContract) {
    if (image.startsWith('ipfs://')) {
      return response.redirect(`https://ipfs.vv.xyz/ipfs/${image.replace('ipfs://', '')}`, false, 302)
    }

    if (image.startsWith('https://')) {
      return response.redirect(image, false, 302)
    }

    response.stream(await Drive.getStream(`images/${image}`))
  }

  /**
   * Validate the specified data against the validID schema
   *
   * @param {Object} data The data to validate
   * @throws {Error} Throws an error if the validation fails
   */
  private async validate (data) {
    const validID = schema.create({
      id: schema.number([
        rules.range(1, 16000),
      ]),
    })

    await validator.validate({
      schema: validID,
      data,
      messages: {
        range: `This token does not exist`
      }
    })
  }

  /**
   * Get the metadata for a specified tokenID
   *
   * @param {String|Number} id The ID of the token to provide metadata for
   * @returns {Promise} A promise that resolves to the metadata for the specified ID
   */
  public async forId (id: string|number): Promise<TokenMetadata> {
    const tokenDefinition = this.metadata.tokens[id]

    const isOneOfOne = typeof tokenDefinition === 'object'
    const isEditioned = typeof tokenDefinition === 'string'
    const isUnRevealed = isEditioned && tokenDefinition.startsWith('rare-')

    const definition = isOneOfOne
      ? tokenDefinition
      : isEditioned
        ? this.metadata.editions[tokenDefinition]
        : this.metadata.base

    const name = this.getAttribute('name', definition) as string

    return {
      name: isOneOfOne ? name : name + ` ${id}`,
      description: this.getAttribute('description', definition) as string,
      image: this.getAttribute('image', definition) as string,
      image_dark: this.getAttribute('image_dark', definition) as string,
      animation_url: this.getAttribute('animation_url', definition) as string,
      embed_url: this.getAttribute('embed_url', definition) as string,
      download_url: this.getAttribute('download_url', definition) as string,
      attributes: [
        ...this.getAttribute('attributes', definition) as Attribute[],
        {
          trait_type: 'Revealed',
          value: isUnRevealed ? 'No' : 'Yes'
        },
        {
          trait_type: 'Number',
          value: parseInt(`${id}`)
        }
      ],
    }
  }

  getAttribute (attribute: keyof TokenMetadata, bag: TokenMetadata) {
    if (bag[attribute]) return bag[attribute]

    return this.metadata.base[attribute]
  }

}
