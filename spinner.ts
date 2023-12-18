import ora,{ Ora } from "ora";
const chalk = require("chalk");

let spinner: Ora =  ora().start()

// 进度条1的状态
const spinnerOne = 'yellow'
let spinnerOneStatus = 0;

// 进度条2的状态
const spinnerTwo = 'green'
let spinnerTwoStatus = 0;


// 操作进度
export const spinnerDraw = ({ num = 1, text, type, type1 ,chalkColor= 'blue'}: { chalkColor?: 'black' |
'red' |
'green' |
'yellow' |
'blue' |
'magenta' |
'cyan' |
'white', num?: number, text: string, type?: 'start' | 'succeed' | 'fail' | 'info' | 'stopAndPersist', type1?: 'stop' | 'clear' | 'render' | 'frame' }) => {
  const status =  num === 1 ? spinnerOneStatus : spinnerTwoStatus
  spinner.color =  num === 1 ? spinnerOne : spinnerTwo
  if (status === 0) {
    spinner.start(chalk.blue(text))
    num === 1 ? spinnerOneStatus = 1 : spinnerTwoStatus = 1
  } else {
    if (type1) spinner[type1]
    if (type) spinner[type](text)
    if (!type && !type1) spinner.text = chalk[chalkColor](text)
  }
}

// 错误提示
export const errMsg = ({ chalkText, chalkColor = 'red', consoleText }: {
  chalkText: string, chalkColor?: 'black' |
    'red' |
    'green' |
    'yellow' |
    'blue' |
    'magenta' |
    'cyan' |
    'white', consoleText?: string
}) => {
  console.log('\n', chalk[chalkColor](chalkText), consoleText);
}
