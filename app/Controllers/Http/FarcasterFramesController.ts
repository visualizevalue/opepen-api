import BaseController from './BaseController'

type Action = string|{text:string, action:'submit'|'redirect'|'txn'}

export default class FarcasterFramesController extends BaseController {

  protected entryTitle: string = 'Opepen'
  protected entryImage: string = 'https://opepen.art/og/rare.png'

  protected response (
    {
      imageUrl,
      postUrl,
      actions,
    }: {
      imageUrl: string,
      postUrl: string,
      actions?: Action[],
    })
  {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${this.entryTitle}</title>
          <meta property="og:title" content="${this.entryTitle}">
          <meta property="og:image" content="${this.entryImage}">

          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          ${
            actions
              ?.map(
                (a, i) => typeof a === 'string'
                  ? `<meta property="fc:frame:button:${i + 1}" content="${a}" />`
                  : `
                    <meta property="fc:frame:button:${i + 1}" content="${a.text}" />
                    <meta property="fc:frame:button:${i + 1}:action" content="${a.action}" />
                  `
              ).join('')
          }
          <meta property="fc:frame:post_url" content="${postUrl}" />
        </head>
      </html>
    `
  }

}
