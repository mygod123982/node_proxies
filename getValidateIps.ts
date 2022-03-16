
import {spawn} from 'child_process'
import fs from 'fs'


interface fnParams  {
  ip: string,
  port: string,
  proxy_type: string,
}


async function Main() {
  let allIps:Array<fnParams> = []
  const rule = /^ip_list_\d+\.json$/
  const filePaths = fs.readdirSync('./')
  const validFilePaths = filePaths.filter(filePath => rule.test(filePath))
  for (let i = 0; i < validFilePaths.length; i++) {
    const filePath = validFilePaths[i]
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const ipList: any[] = JSON.parse(fileContent)
    console.log( ipList.length, 'ipList.length')
    allIps = allIps.concat(ipList)
  }
  console.log(allIps.length,'validFilePaths',validFilePaths )
  const vali_ips = await valiProxys(allIps, 20)
  fs.writeFileSync('ip_list_validate.json', JSON.stringify(vali_ips))
}

async function valiProxys(ip_lists: any[], max: number = 10): Promise<any> {
  max = Math.min(max, ip_lists.length)
  
  const yildFn = function* () {
    for (let i = 0; i < ip_lists.length; i++) {
      yield fn(ip_lists[i])
    }
  }
  const fn = (paramns:fnParams ) => {
    const {ip, port, proxy_type} = paramns
    return new Promise((resolve, reject) => {
      const ps = spawn('node', ['process_valiProxy.js', ip+port, proxy_type])
      ps.stdout.on('data', (val) => {
         +val === 0 ? resolve(paramns) : resolve(null)
      })

      ps.stderr.on('data', (val) => {
        console.log('stderr:', val.toString())
        reject(val.toString())
      })
    })
  }

  return new Promise((resolve, reject) => {
    let result_list: any[] = []
    let result_size = 0
    const gen = yildFn()
    const callFn = async (genResult: IteratorResult<Promise<unknown>, any>) => {
      if (genResult.done === true || genResult === undefined) {
        if(result_size === ip_lists.length) resolve(result_list)
        return 
      }
      const result = await genResult.value
      result_size++
      if (result === undefined) return
      result && result_list.push(result)
      callFn(gen.next())
    }

    for (let i = 0; i < max; i++) {
      callFn(gen.next())
    }
  })
}


Main()