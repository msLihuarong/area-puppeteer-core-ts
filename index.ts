import awaitTo from 'async-await-error-handling';
import { initPuppeteerCore, Page, Browser } from './puppeteerCore'
import { timeout, writeFileSync, target } from './utils'
import { spinnerDraw, errMsg } from './spinner'

import { provincesData } from './provinces';
const provinces = provincesData['86'] as any

import { citiesData } from './cities';

let pcodes = [] as string[];
let page: Page
let browser: Browser

import { dType } from './types'

let cities = [] as dType.dataType[];

if (citiesData.length > 0) {
  cities = citiesData
}

let areas = [] as dType.dataType[];
let url = '';
let type = 0; // 0：抓取市级数据 1：抓取升级数据

// 当前正在抓取的目标
let curCity = '';
let curPCode = '';

Object.keys(provinces).forEach((code: string) => {
  if (code !== '710000' && code !== '910000') {
    // 过滤掉港澳台
    pcodes.push(code.slice(0, 2));
  }
});

const getCByPCode = async (pcode: string) => {
  url = target.replace('#{route}', pcode);
  const parentCode = `${pcode}0000` as string;

  await page.goto(url);

  spinnerDraw({ num: 1, text: `正在抓取${provinces[parentCode]}的市级数据：${url}` })

  const list = await page.$$eval('.citytable .citytr', options => options.map((option: any) => option.innerText)) as string[];

  if (!list) return false
  list.map((item: string) => {
    const t = item.split('\t');
    cities.push({
      code: t[0],
      text: t[1],
      parentCode: parentCode
    });
  })
}

const getAByCCode = async (city: dType.dataType) => {
  url = target.replace('#{route}', `${city.code.slice(0, 2)}/${city.code.slice(0, 4)}`);
  await page.goto(url);
  spinnerDraw({ num: 2, text: `正在抓取 ${provinces[city.parentCode]}/${city.text} 的县区数据：${url}` })
  let list = await page.$$eval('.countytable .countytr', options => options.map((option: any) => option.innerText));
  if (!list.length) {
    // 修正海南省-儋州市的区域数据
    list = await page.$$eval('.towntable .towntr', options => options.map((option: any) => option.innerText));
  }
  if (!list) return false
  list.map(item => {
    const t = item.split('\t');
    areas.push({
      code: t[0],
      text: t[1],
      parentCode: `${city.code}`
    });
  })
}

process.on('unhandledRejection', (err: any) => {
  errMsg({ chalkText: `抓取数据失败，失败链接: ${url}\n`, consoleText:   err.message} )
  process.exit(1);
});

(async () => {
  spinnerDraw({ num: 1, text: '开始抓取市区数据....' })
  // 初始化
  const puppeteer = await initPuppeteerCore()
  page = puppeteer.page
  browser = puppeteer.browser

  if (!cities.length) {
    for (let i = 0, l = pcodes.length; i < l; i++) {
      const pcode = pcodes[i];
      await timeout(1500);
      const [err] = await awaitTo(getCByPCode(pcode));
      if (err) {
        // 这个重试主要是处理因避免耗时(Navigation Timeout Exceeded)导致的错误
        errMsg({ chalkText: `抓取数据失败，失败链接: ${url}，错误信息: ${err.message}，正在重试....\n` })
        await getCByPCode(pcode);
      }
    }
    writeFileSync('cities.ts', cities);
    spinnerDraw({ num: 1, text: '市区数据抓取完毕，开始抓取县区数据....', type: 'succeed', chalkColor: 'green' })
  } else {
    spinnerDraw({ num: 1, text: '市区数据已经抓取过，开始抓取县区数据....', type: 'succeed', chalkColor: 'green' })
  }

  type = 1;
  console.log('\n');
  spinnerDraw({ num: 2, text: '正在抓取县区数据....' })

  for (let i = 0, l = cities.length; i < l; i++) {
    const city = cities[i];
    await timeout(3000);
    const [err] = await awaitTo(getAByCCode(city)) as any;
    if (err) {
      // 这个重试主要是处理因避免耗时(Navigation Timeout Exceeded)导致的错误
      errMsg( { chalkText: `抓取数据失败，失败链接: ${url}，错误信息: ${err.message}，正在重试....\n` })
      await getAByCCode(city);
    }
  }

  writeFileSync('areas.ts', areas);
  spinnerDraw({ num: 2, text: '县区数据抓取完毕', type: 'succeed', chalkColor: 'green' })

  spinnerDraw({ num: 1, text: '关闭', type1: 'stop' })
  await browser.close();
})();
