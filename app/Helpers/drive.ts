import axios from 'axios'
import Drive from '@ioc:Adonis/Core/Drive'
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'

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

export async function toDriveFromFileUpload (file: MultipartFileContract, name: string) {
  const contentType = `${file.type}/${file.subtype}`
  const fileType = file.subtype
  const fileName = `${name}.${fileType}`

  await file.moveToDisk('images', {
    name: fileName,
    contentType,
  }, 's3')

  return {
    path: `images/${fileName}`,
    fileType,
    contentType,
  }
}
