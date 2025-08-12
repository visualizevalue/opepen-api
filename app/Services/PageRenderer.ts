import puppeteer, { Browser } from 'puppeteer'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'

let browser: Browser

export const newBrowser = async () => {
  Logger.info(`Closing browser (if exists)`)
  await browser?.close()

  Logger.info(`Loading new browser`)
  browser = await puppeteer.launch({
    executablePath: Env.get('CHROMIUM_EXECUTABLE'),
    headless: true,
    args: [
      '--single-process',
      '--no-zygote',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu', // harmless on servers
    ],
    protocolTimeout: 10_000,
  })
  Logger.info(`New browser loaded`)
}

export const getBrowser = async () => {
  Logger.info(`Getting browser`)
  if (!browser) {
    await newBrowser()
  }

  return browser
}

export const renderPage = async (url: string, dimension: number = 960, tries: number = 1) => {
  try {
    Logger.info(`Trying to render page (${url}) (try ${tries})`)
    const browser = await getBrowser()
    const page = await browser.newPage()

    await page.setViewport({ width: dimension, height: dimension })
    const item =
      url.endsWith('.gif') || url.endsWith('.png')
        ? `<img src="${url}" width="${dimension}" height="${dimension}" />`
        : url.endsWith('.mp4') || url.endsWith('.webm')
          ? `<video src="${url}" playsinline loop autoplay muted width="${dimension}" height="${dimension}"></video>`
          : `<iframe src="${url}" width="${dimension}" height="${dimension}" style="border:none;"></iframe>`
    const html = `<body style="margin:0;">${item}</body>`
    const dataUrl = `data:text/html;base64;charset=UTF-8,${Buffer.from(html).toString('base64')}`
    await page.goto(dataUrl)

    try {
      await page.waitForFunction('RENDERED === true', {
        timeout: 1000,
      })
      Logger.info(`Rendered page (${url})`)
    } catch (e) {}

    const image = await page.screenshot({})
    Logger.info(`Screenshot captured (${url})`)

    await page.close()
    Logger.info(`Page closed (${url})`)

    return image
  } catch (e) {
    if (tries > 3) {
      await browser?.close()

      throw e
    }

    Logger.info(`Encountered an error – retrying to render (${url})`)

    await newBrowser()

    return await renderPage(url, dimension, tries + 1)
  }
}
