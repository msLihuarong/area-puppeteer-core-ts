const awaitTo = require('async-await-error-handling');

import { initPuppeteerCore, Page, Browser } from './puppeteerCore'
import { timeout, writeFileSync, target } from './utils'
import { spinnerDraw, errMsg } from './spinner'

import { dType } from './types'

import { provincesData } from './provinces';
const provinces = provincesData['86'] as any

import { citiesData } from './cities';
import { areasData } from './areas';

const cities: dType.dataType[] = citiesData
const areas: dType.dataType[] = areasData
let page: Page
let browser: Browser
const pcodes = Object.keys(provinces);

/** 
 * 四个直辖市会将「市辖区」作为二级行政区域
 * 重庆市会将「县」作为二级行政区域
 * 河北省/河南省/湖北省/海南省 等省份会将「省直辖县级行政区划」作为第二级行政区域
 * 新疆会将「自治区直辖县级行政区划」作为第二级行政区域
 * 出于实用性考虑，省市联动会过滤掉这些，直接用第二级行政区域补充
*/
const filter = ['市辖区', '县', '省直辖县级行政区划', '自治区直辖县级行政区划'];


// 省市
let pca = {
  '86': provinces
} as any;
// 删除港澳
delete pca['86']['910000'];

// 省市区
let pcaa = {
  '86': provinces
} as any;

// 提取行政区域 code
const reg = /0(?=0{2,})/;

function formatCode(code: string, text: string = '') {
  // 特殊处理东莞市和中山市的县区数据 code
  if (text === '东莞市' || text === '中山市') {
    return code.slice(0, -3);
  }
  const index = code? reg.exec(code)!['index'] : 0;
  return index > 6 ? code.slice(0, index) : code.slice(0, 6);
}

// 省市联动
function formatPCAddress() {
  pcodes.forEach(pcode => {
    if (pcode === '710000') {
      // 台湾
      pca[pcode] = provinces['710100'];
    } else if (pcode === '910000') {
      // 港澳
      pca['86']['810000'] = '香港特别行政区';
      pca['86']['820000'] = '澳门特别行政区';
      pca['810000'] = provinces['810000'];
      pca['820000'] = provinces['820000'];
      // const t = provinces[pcode];
      // Object.keys(t).forEach(item => {
      //     pca[item] = provinces[item];
      // });
    } else {
      const res = {} as any;
      const pcities = cities.filter(city => city.parentCode === pcode);
      pcities.forEach(city => {
        if (filter.includes(city.text)) {
          // 用第三级区域数据补充
          const tmps = areas.filter(area => area.parentCode === city.code);
          tmps.forEach(tmp => {
            res[formatCode(tmp.code)] = tmp.text.indexOf('办事处') > -1 ? tmp.text.slice(0, -3) : tmp.text;
          })
        } else {
          res[formatCode(city.code)] = city.text;
        }
      });
      pca[pcode] = res;
    }
  });
  writeFileSync('pca.ts', pca);
}

// 因为部分原处于第三级的区域提升到第二级，所以要重新抓取这部分区域对应的下一级区域数据
let url = '';
async function getAreasByCCode(code: string, text: string) {
  const pCode = code.substring(0, 2);
  const cCodeSuffix = code.substring(2, 4);

  url = target.replace('#{route}', `${pCode}/${cCodeSuffix}/${code}`);
  await page.goto(url);

  spinnerDraw({ num: 1, text: `正在抓取 ${text} 的县区数据：${url}` })
  let res = await page.$$eval('.towntable .towntr', options => options.map((option: any) => option.innerText));
  if (!res.length) {
    console.log(`\n\n${text} 下没有县区数据\n\n`);
  }
  res = res.map(item => {
    const t = item.split('\t');
    return {
      code: t[0],
      text: t[1],
    }
  })
  return { err: true, data: res };
}

// 省市区联动
async function formatPCAAddress() {
  const puppeteer = await initPuppeteerCore()
  browser = puppeteer.browser
  page = puppeteer.page

  // 保留市辖区
  const f = filter.slice(1);
  for (let p = 0, pl = pcodes.length; p < pl; p++) {
    const pcode = pcodes[p];
    if (pcode === '710000') {
      // 台湾
      pcaa[pcode] = provinces[pcode];
      pcaa['710100'] = provinces['710100'];
    } else if (pcode === '910000') {
      // 港澳
      const t = provinces[pcode];
      pcaa[pcode] = t;
      if (t) {
        Object.keys(t).forEach(item => {
          pcaa[item] = provinces[item];
        });
      }
    } else {
      const res = {} as dType.utilObj;
      const pcities = cities.filter(city => city.parentCode === pcode);
      for (let c = 0, cl = pcities.length; c < cl; c++) {
        const pcity = pcities[c];
        const pareas = areas.filter(area => area.parentCode === pcity.code);

        if (f.includes(pcity.text)) {
          // 用第三级区域数据补充到第二级
          for (let i = 0, l = pareas.length; i < l; i++) {
            const pCurAreas = {} as dType.utilObj;
            const parea = pareas[i];
            const code = formatCode(parea.code);
            res[code] = parea.text.indexOf('办事处') > -1 ? parea.text.slice(0, -3) : parea.text;

            // 抓取第三级数据
            let [err, data] = await awaitTo(getAreasByCCode(code, res[code]));
            if (err) {
              // 这个重试主要是处理因避免耗时(Navigation Timeout Exceeded)导致的错误
              errMsg({ chalkText: `抓取数据失败，失败链接: ${url}，错误信息: ${err?.message}，正在重试....\n` });
              [data] = await awaitTo(getAreasByCCode(code, res[code]));
            }
            spinnerDraw({ chalkColor: 'green', text: `市级城市 ${res[code]} 的县区数据抓取完毕.` })

            if (data.length) {
              // console.log('ddddd', data[0]);
              data.forEach((item: dType.dataType) => {
                if (item.text !== '市辖区') {
                  pCurAreas[formatCode(item.code)] = item.text.indexOf('办事处') > -1 ? item.text.slice(0, -3) : item.text;
                }
              });
              pcaa[code] = pCurAreas;
            }
            await timeout(1500);
          }
        } else {
          const curAreas = {} as dType.utilObj;
          const cityCode = formatCode(pcity.code);
          res[cityCode] = pcity.text;

          // 第三级数据
          pareas.forEach(parea => {
            if (parea.text !== '市辖区') {
              curAreas[formatCode(parea.code, pcity.text)] = parea.text.indexOf('办事处') > -1 ? parea.text.slice(0, -3) : parea.text;
            }
          });
          pcaa[cityCode] = curAreas;
        }
      }
      pcaa[pcode] = res;
    }
  }

  writeFileSync('pcaa.ts', pcaa);
  spinnerDraw({ num: 2, text: '县区数据抓取完毕', type: 'succeed', chalkColor: 'green' })

  spinnerDraw({ num: 1, text: '关闭', type1: 'stop' })
  await browser.close();
}

formatPCAddress()
formatPCAAddress();