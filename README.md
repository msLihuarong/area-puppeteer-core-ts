# area-puppeteer-core-ts
基于 puppeteer-core 的中国行政区域抓取爬虫

## 数据来源
* 国家统计局：[统计用区划代码和城乡划分代码](https://www.stats.gov.cn/sj/tjbz/tjyqhdmhcxhfdm/2023/index.html)

## 数据更新

```
git clone git@github.com:msLihuarong/area-puppeteer-core-ts.git
or git clone https://github.com/msLihuarong/area-puppeteer-core-ts.git
yarn
需要修改 puppeteerCore.ts 的executablePath 是本地谷歌安装路径 
yarn start // 生成市县区数据
yarn format // 格式化数据
```

生成的数据包含两份：`cities.ts` 和 `areas.ts`，前者是市级数据，后者是县区数据
格式化后会生成两份数据：`pca.ts` 和 `pcaa.ts`，前者仅省市数据，后者包含省市区数据
获取新数据，请删除以上文件 数组内的数据

生成mysql的数据

```js
import Data from 'path/to/pcaa';

Data['86']
// 所有省份：{'110000': '北京市', '120000': '天津市', '130000': '河北省', ...}

Data['130000']
// 对应省份的所有城市：{'130100': '石家庄市', '130200': '唐山市', '130300': '秦皇岛市', ...}

Data['130200']
// 对应市的所有县区：{'130201': '市辖区', '130202': '路南区', '130203': '路北区', ...}
```


## License