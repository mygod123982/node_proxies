import puppeteer from 'puppeteer';
import fs from 'fs'
const exportPath = './'
const proxy_list_urls = ['http://free-proxy.cz/zh/proxylist/country/CN/all/uptime/all', 'https://spys.one/en/free-proxy-list/']
async function Main(urls: Array<string>, exportPath: string) {
 
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  for (let i = 0; i < urls.length; i++) {
    await page.goto(urls[i]);
    let ip_list: any[] = []
    if (urls[i].indexOf('spys.one') > -1) {
      await page.select("#xpp", "5");
      await page.waitForNavigation();
      ip_list = await page.evaluate(evaluateSpysOne)
    }

    if (urls[i].indexOf('free-proxy.cz') > -1) {
      let current_page = 1
      ip_list = []
      const fn = async () => {
        const [flag, list] = await page.evaluate(evaluateFreeProxyCz)
        ip_list = ip_list.concat(list)
        if (flag) {
          await Promise.all([
            page.goto(`${urls[i]}/${++current_page}`),
            page.waitForNavigation()
          ])
          await fn()
        }
      }
      await fn()
    }
    const fileName = `${exportPath}/ip_list_${i}.json`
    fs.writeFileSync(fileName, JSON.stringify(ip_list || ''))
  }
  await browser.close();
}

async function evaluateSpysOne() {
  const ip_list = []
  const trs = document.querySelectorAll('tr')
  const isIpWithPort = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+)/
  const isproxy_type = /(HTTPS|HTTP|SOCKS5)/
 
  for (let i = 1; i < trs.length; i++) {
    const trText = trs[i].innerText.trim().toUpperCase()
    const ip_port = trText.match(isIpWithPort)?.[0]
    if (ip_port) {
      const ip = ip_port.split(':')[0]
      const port = ip_port.split(':')[1]
      const proxy_type = trText.match(isproxy_type)?.[0]
      ip_list.push({ip,port,proxy_type })
      continue
    } 
  }
  return ip_list
} 

async function evaluateFreeProxyCz() {
  const list: Array<any> = []
  const table = document.querySelector('#proxy_list')
  const trs =table?.querySelectorAll('tbody tr')
  const hasPage = document.querySelector('.paginator .button')
  const isIp = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/
  const isport = /^(\d+)$/
  const isproxy_type = /(HTTPS|HTTP|SOCKS5)/

  trs && trs.forEach(tr => {
    const tds = tr.querySelectorAll('td')
    console.log(tds, 'tds')
    const ip = tds[0]?.innerText.trim().match(isIp)?.[0]
    const port = tds[1]?.innerText.trim().match(isport)?.[0]
    const proxy_type = tds[2]?.innerText.trim().match(isproxy_type)?.[0]
    if (ip && port && proxy_type) {
      list.push({ ip, port, proxy_type })
    }
  })
  let flag =!( hasPage && hasPage.innerHTML.indexOf('其他') > -1)
  return [flag, list]
}


Main(proxy_list_urls, exportPath)
