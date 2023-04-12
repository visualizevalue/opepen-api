import axios from 'axios'
import Drive from '@ioc:Adonis/Core/Drive'

export async function toDriveFromURI (url: string, name: string) {
  try {
    const response = await axios({ url, responseType: 'stream' })
    const stream = response.data
    const contentLength = response.headers['content-length'] as number
    await Drive.putStream(
      `images/${name}.png`,
      stream,
      { contentType: 'image/png', contentLength: contentLength }
    )
  } catch (e) {
    // ...
  }
}
