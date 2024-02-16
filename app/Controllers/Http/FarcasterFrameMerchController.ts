import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { RequestContract } from '@ioc:Adonis/Core/Request'
import Env from '@ioc:Adonis/Core/Env'
import FarcasterFramesController from './FarcasterFramesController'
import MerchRenderer from 'App/Frames/MerchRenderer'

export default class FarcasterFrameMerchController extends FarcasterFramesController {

  PRODUCTS = [
    {
      slug: 'opepen-trucker',
      name: 'Opepen Trucker',
      price: 29,
      category: 'hats',
      variant: '44032600473844',
      image: 'https://visualizevalue.com/cdn/shop/files/visualize-value-opepen-trucker-39704922587380.jpg?width=1280',
    },
    {
      slug: 'opepen-tee',
      name: 'Opepen Tee',
      price: 29,
      category: 'shirts',
      variants: [
        { id: '44033060667636', name: 'S' },
        { id: '44033060700404', name: 'M' },
        { id: '44033060733172', name: 'L' },
        { id: '44033060765940', name: 'XL' },
        { id: '44033060798708', name: '2XL' },
        { id: '44033060831476', name: '3XL' },
      ],
      image: 'https://visualizevalue.com/cdn/shop/files/visualize-value-s-opepen-tee-39706801012980.jpg?width=1280',
    },
    {
      slug: 'opepen-hoodie',
      name: 'Opepen Hoodie',
      price: 49,
      category: 'shirts',
      variants: [
        { id: '44032855572724', name: 'S' },
        { id: '44032855605492', name: 'M' },
        { id: '44032855638260', name: 'L' },
        { id: '44032855671028', name: 'XL' },
        { id: '44032855703796', name: '2XL' },
        { id: '44032855736564', name: '3XL' },
      ],
      image: 'https://visualizevalue.com/cdn/shop/files/visualize-value-s-opepen-hoodie-39705710985460.jpg?width=1280',
    },
  ]

  public async product ({ params, request }: HttpContextContract) {
    const cart = this.getCart(request)

    if (request.method() === 'GET') return this.productResponse(params.id || 0, cart)

    const id = parseInt(params.id)
    const nextProductId = this.nextProductId(id)

    const data = request.body().untrustedData
    const buttonIndex = parseInt(data.buttonIndex)

    // Skip to next product?
    if (buttonIndex == 2) {
      // If we're at the last product and have an active cart, go to the confirmation
      if (this.isLastProduct(id) && cart) return this.confirmationResponse(cart)

      return this.productResponse(nextProductId, cart)
    }

    // Maybe select Variant (Size)
    const product = this.PRODUCTS[params.id]
    if (product.variants?.length) {
      return this.productVariantResponse(params.id, cart)
    }

    // Add product to cart and go to next product
    return this.productResponse(nextProductId, this.addProduct(cart, product.variant as string))
  }

  public async variants ({ params, request }: HttpContextContract) {
    const product = this.PRODUCTS[params.id]

    const data = request.body().untrustedData
    const buttonIndex = parseInt(data.buttonIndex)

    // @ts-ignore
    const cart = this.addProduct(this.getCart(request), product.variants[buttonIndex - 1].id)

    // is last product?
    if (this.isLastProduct(parseInt(params.id))) return this.confirmationResponse(cart)

    return this.productResponse(this.nextProductId(parseInt(params.id)), cart)
  }

  public async confirmation ({ request }: HttpContextContract) {
    return this.confirmationResponse(this.getCart(request))
  }

  public async image ({ params, response }: HttpContextContract) {
    const product = this.PRODUCTS[params.id]

    return this.imageResponse(await MerchRenderer.render(product), response)
  }

  public async confirmationImage ({ request, response }: HttpContextContract) {
    const cart = this.getCart(request)
    const productsInCart = cart.split(',')
    const productVariantIds = productsInCart.map(p => p.split(':')[0])
    const products = this.PRODUCTS.filter(p => {
      if (p.variant) return productVariantIds.includes(p.variant)

      for (const { id } of p.variants || []) {
        if(productVariantIds.includes(id)) return true
      }
    })

    return this.imageResponse(await MerchRenderer.renderConfirmation(products), response)
  }

  private productResponse (id, cart) {
    const product = this.PRODUCTS[id]

    return this.response({
      imageUrl: `${Env.get('APP_URL')}/v1/frames/merch/${id}/image?v=1`,
      postUrl: `${Env.get('APP_URL')}/v1/frames/merch/${id}?cart=${cart}`,
      actions: [
        product.variants?.length
          ? 'Choose Size'
          : 'Add to Cart',

        'Next →',
      ],
    })
  }

  private productVariantResponse (id, cart) {
    const product = this.PRODUCTS[id]

    return this.response({
      imageUrl: `${Env.get('APP_URL')}/v1/frames/merch/${id}/image?v=1`,
      postUrl: `${Env.get('APP_URL')}/v1/frames/merch/${id}/variants?cart=${cart}`,
      actions: product.variants?.slice(0, 4).map(v => v.name),
    })
  }

  private confirmationResponse (cart) {
    return this.response({
      imageUrl: `${Env.get('APP_URL')}/v1/frames/merch/confirmation/image?cart=${cart}&v=1`,
      postUrl: `${Env.get('APP_URL')}/v1/frames/merch/confirmation?cart=${cart}`,
      actions: [
        {
          text: `Checkout`,
          action: `link`,
          target: `https://visualizevalue.com/cart/${cart}`
        }
      ],
    })
  }

  private nextProductId (id: number) {
    return (id + 1) % this.PRODUCTS.length
  }

  private isLastProduct (id: number) {
    return id === this.PRODUCTS.length - 1
  }

  private getCart (request: RequestContract) {
    const query = request.qs()

    // format is `${variant}:${amount}` comma separated if multiple

    return query?.cart || ''
  }

  private addProduct (cart: string, variant: string, amount: number = 1) {
    return [cart, `${variant}:${amount}`].filter(p => !!p).join(',')
  }
}
