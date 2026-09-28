import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { GRAB_PAGE } from '@/lib/grabPage'
import type { Raw } from '@/lib/listingExtract'

// Il nostro "servizio di scraping": Chromium headless (lo stesso dei reel social) che apre l'annuncio come una persona,
// scorre, clicca le parti nascoste e legge la pagina. Nessun servizio esterno.
// PROXY_URL (facoltativo, es. http://utente:password@host:porta): esce da un proxy invece che dai server Vercel,
// per i siti che bloccano i data center (immobiliare, idealista, casa: servono IP residenziali, a pagamento).
// Immagini, video e font non si scaricano: servono solo i loro indirizzi (e col proxy si paga a GB).
chromium.setGraphicsMode = false

const BLOCKED = /captcha|are you a robot|verifica di sicurezza|access denied|attention required|pardon our interruption|just a moment/i

export async function headlessRead(url: string): Promise<{ raw: Raw; finalUrl: string } | null> {
  const onServer = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME
  const proxy = process.env.PROXY_URL ? new URL(process.env.PROXY_URL) : null
  const browser = await puppeteer.launch({
    args: [
      ...(onServer ? chromium.args : []), '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
      ...(proxy ? [`--proxy-server=${proxy.protocol}//${proxy.host}`] : []), '--lang=it-IT',
    ],
    executablePath: onServer ? await chromium.executablePath() : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    defaultViewport: { width: 1366, height: 900 },
  })
  try {
    const page = await browser.newPage()
    if (proxy?.username) await page.authenticate({ username: decodeURIComponent(proxy.username), password: decodeURIComponent(proxy.password) })
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8' })
    await page.setRequestInterception(true)
    page.on('request', r => (['image', 'media', 'font'].includes(r.resourceType()) ? r.abort() : r.continue()).catch(() => {}))
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await new Promise(r => setTimeout(r, 1500)) // contenuti caricati dopo il load
    const head = await page.evaluate(() => document.body?.innerText?.slice(0, 3000) ?? '')
    if (BLOCKED.test(head) || head.length < 200) return null
    const raw = await page.evaluate(`(${GRAB_PAGE})()`) as Raw
    return { raw, finalUrl: page.url() }
  } catch (e) {
    console.error('headless read', e)
    return null
  } finally {
    await browser.close().catch(() => {})
  }
}
