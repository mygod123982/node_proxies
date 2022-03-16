import got from 'got'
import ProxyAgent from 'proxy-agent'
const vali_ip = "https://ip.tool.lu"
const url = process.argv[2]
const type = process.argv[3]

async function valiProxy(url: string, type: string) {
  let proxyOptions: string = ''
  switch (type) {
    case 'SOCKS5':
      proxyOptions = 'socks://' + url
      break
    case 'HTTP':
      proxyOptions = 'http://' + url
      break
    case 'HTTPS':
      proxyOptions = 'https://' + url
      break
    default:
      break
  }

  const tunnel = new ProxyAgent(proxyOptions)
  try {
    const result = await got(vali_ip, {
      agent: {
        http: tunnel,
        https: tunnel,
        http2: tunnel,
      },
    }).text()
    process.stdout.write('1')
  } catch (error) {
    // console.log(error)
    process.stdout.write('0')
  }
  process.exit(0)
}
valiProxy(url, type)