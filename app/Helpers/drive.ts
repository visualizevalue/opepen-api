import axios from 'axios'
import Drive from '@ioc:Adonis/Core/Drive'

export async function toDriveFromURI (url: string, name: string) {
  try {
    const response = await axios({ url, responseType: 'stream' })
    const stream = response.data
    const contentLength = response.headers['content-length'] as number
    const contentType = response.headers['content-type']
    const fileType = contentType.split('/').at(-1)
    const path = `images/${name}.${fileType}`
    await Drive.putStream(path, stream, { contentType: contentType, contentLength: contentLength })

    return {
      path,
      fileType,
      contentType,
    }
  } catch (e) {
    // ...
  }
}
