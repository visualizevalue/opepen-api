import puppeteer, { Browser, Page } from 'puppeteer'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import { delay } from 'App/Helpers/time'

let browser: Browser | null = null
let browserInitializing = false
let browserCreatedAt: Date | null = null
const BROWSER_MAX_AGE_MS = 30 * 60 * 1000 // 30 minutes

export const newBrowser = async () => {
  // Prevent concurrent browser initialization
  if (browserInitializing) {
    Logger.info('Browser initialization already in progress, waiting...')
    while (browserInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return
  }

  browserInitializing = true
  try {
    Logger.info(`Closing browser (if exists)`)
    if (browser) {
      try {
        await browser.close()
      } catch (e) {
        Logger.error('Error closing browser:', e)
      }
      browser = null
      browserCreatedAt = null
    }

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
    browserCreatedAt = new Date()
    Logger.info(`New browser loaded`)
  } finally {
    browserInitializing = false
  }
}

const isBrowserHealthy = async (): Promise<boolean> => {
  if (!browser) return false

  // Check if browser is too old
  if (browserCreatedAt && Date.now() - browserCreatedAt.getTime() > BROWSER_MAX_AGE_MS) {
    Logger.info('Browser exceeded max age, needs restart')
    return false
  }

  // Check if browser is still connected
  try {
    const pages = await browser.pages()
    return pages !== undefined
  } catch (e) {
    Logger.error('Browser health check failed:', e)
    return false
  }
}

export const getBrowser = async (): Promise<Browser> => {
  Logger.info(`Getting browser`)

  // Wait if browser is being initialized
  if (browserInitializing) {
    Logger.info('Waiting for browser initialization to complete')
    while (browserInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  // Check browser health
  const healthy = await isBrowserHealthy()
  if (!healthy) {
    Logger.info('Browser unhealthy or missing, creating new one')
    await newBrowser()
  }

  if (!browser) {
    throw new Error('Failed to initialize browser')
  }

  return browser
}

export const renderPage = async (url: string, dimension: number = 960, tries: number = 1) => {
  let page: Page | null = null

  try {
    Logger.info(`Trying to render page (${url}) (try ${tries})`)
    const browser = await getBrowser()
    page = await browser.newPage()

    try {
      await page.setViewport({ width: dimension, height: dimension })

      // Determine if this is a media file or HTML page
      const isImage = url.endsWith('.gif') || url.endsWith('.png')
      const isVideo = url.endsWith('.mp4') || url.endsWith('.webm')
      const isMedia = isImage || isVideo

      if (isMedia) {
        // For media files, embed them in HTML
        const item = isImage
          ? `<img src="${url}" width="${dimension}" height="${dimension}" />`
          : `<video src="${url}" playsinline loop autoplay muted width="${dimension}" height="${dimension}"></video>`
        const html = `<body style="margin:0;">${item}</body>`
        const dataUrl = `data:text/html;base64;charset=UTF-8,${Buffer.from(html).toString('base64')}`
        await page.goto(dataUrl)

        // For media files, just wait a bit for them to load
        await delay(1000)
      } else {
        // For HTML pages, navigate directly to the URL
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

        // Wait for RENDERED flag on HTML pages
        try {
          await page.waitForFunction('window.RENDERED === true || RENDERED === true', {
            timeout: 6_000,
            polling: 100,
          })
          Logger.info(`RENDERED flag detected for ${url}`)
        } catch (waitError) {
          // Page might not have RENDERED variable, continue anyway
          Logger.debug(`RENDERED flag not found for ${url}, continuing`)
        }
      }

      const image = await page.screenshot({})
      Logger.info(`Screenshot captured (${url})`)

      return image
    } finally {
      // Always close the page, even if an error occurred
      if (page) {
        try {
          await page.close()
          Logger.info(`Page closed (${url})`)
        } catch (closeError) {
          Logger.error(`Failed to close page for ${url}:`, closeError)
        }
      }
    }
  } catch (e) {
    if (tries > 3) {
      Logger.error(`Failed to render ${url} after ${tries} attempts:`, e)
      // Force browser restart for next request
      browser = null
      browserCreatedAt = null
      throw e
    }

    Logger.info(`Encountered an error – retrying to render (${url}):`, e)

    // Force new browser for retry
    await newBrowser()

    return await renderPage(url, dimension, tries + 1)
  }
}
