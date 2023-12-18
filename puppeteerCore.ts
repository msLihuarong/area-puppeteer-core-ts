import puppeteer, { Page, Browser } from 'puppeteer-core'

export const initPuppeteerCore = async () => {
  const browser = await puppeteer.launch({
    // 是否在headless模式下运行浏览器
     headless: false,
     // 是否打开Devtool,如果设置为true，headless将强制为false
     devtools: false,
     executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
     args: ['--no-sandbox', '--disable-setuid-sandbox']
   });
 const page = await browser.newPage();
 return { page, browser }
}

export { Page, Browser }