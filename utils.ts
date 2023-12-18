import path from 'path'
import fs from 'fs'

export function timeout(delay: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(1)
      } catch (e) {
        reject(0)
      }
    }, delay)
  });
}

export function writeFileSync(name: string, data: any) {
  fs.writeFileSync(path.resolve(__dirname, name), `export const ${name.replace(/.ts/, '')}Data =${JSON.stringify(data)}`);
}


export const target = 'https://www.stats.gov.cn/sj/tjbz/tjyqhdmhcxhfdm/2023/#{route}.html';

