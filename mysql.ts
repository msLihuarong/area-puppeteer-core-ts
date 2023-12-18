import path from 'path'
import fs from 'fs'
import { dType } from './types'

import { pcaaData } from './pcaa';
let pcaa: dType.utilObj = pcaaData || {} 

import { spinnerDraw, errMsg } from './spinner'

function reverseStr(str: string) {
  let newStr = "";
  for (let i = str.length - 1; i >= 0; i--) {
    // newStr += str[i];
    //或者
    newStr += str.charAt(i); //charAt(i);这个函数是返回字符串中下标为i的那个字符；
  }
  return newStr;
}


let arr = [] as string[]
const handelData = function (text: string, key: string, level: number, parentCode: string) {
  let sortCode = [] as string[]
  let isStart = false
  reverseStr(key).split('').map((item: string) => {
    if (item != '0' && !isStart) {
      isStart = true
    }
    if (isStart) sortCode.push(item)
  })
  let str = "INSERT INTO `appletManage`.`areas` (`id`, `createTime`, `updateTime`, `text`, `level`, `code`, `parentCode`, `sortCode`) VALUES (NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), '"+ text + "', "+ level +", "+ key +", "+ (parentCode || 'NULL')  +", "+ reverseStr(sortCode.join('')) +");"
  arr.push(str)
}
const forData = (obj: dType.utilObj) => {
  for (let key in obj) {
    handelData(obj[key], key, 0, '')
    const pcaaObj = pcaa[key]
    if (pcaaObj) {
      // console.info(pcaaObj)
      for (let ukey in pcaaObj) {
        if (pcaa[ukey]) {
          handelData(pcaaObj[ukey], ukey, 1, key)
          for (let uukey in pcaa[ukey]) {
            if (pcaa[ukey][uukey]) handelData(pcaa[ukey][uukey], uukey, 2, ukey)
          }
        }
      }
    } 
  }
}
const init = () => {
  spinnerDraw({ text: '开始处理' })
  forData(pcaa['86'])

  fs.writeFileSync(path.resolve(__dirname, 'mysql.sql'), arr.join('\n'));

  spinnerDraw({ text: '处理完成' })
}

init()

