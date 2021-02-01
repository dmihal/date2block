const https = require('https')
const fs = require('fs')

const rpc_url = 'https://api.mycryptoapi.com/eth'

// Special milestones we should always use as benchmarks for block estimation
// Typically dificulty bomb blocks & hardforks that affect block times
const specialBlocks = [
  1,
  200000, // Ice Age
  1150000, // Homestead
  3500000,
  3600000,
  3700000,
  3800000,
  3900000,
  4000000,
  4100000,
  4200000,
  4300000,
  4370000, // Byzantium
  4675000, // Block times seem to jump around Dec 4, 2017
  4940000, // Block times seem to return to normal around Jan 20, 2018
  6900000, // Start of difficulty bomb
  7000000,
  7100000,
  7200000,
  7280000, // Petersburg
  8800000, // Start of difficulty bomb
  8900000,
  9000000,
  9100000,
  9200000, // Muir Glacier
]

const RANGE_SIZE = 10000

function httpsPost(url, body) {
  return new Promise((resolve,reject) => {
    const [_match, hostname, path] = /https:\/\/([\w\.\-]+)(\/.*)/.exec(url)
    const data = JSON.stringify(body)

    const req = https.request({
      hostname,
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, res => {
        const chunks = [];
        res.on('data', data => chunks.push(data))
        res.on('end', () => {
          let body = JSON.parse(Buffer.concat(chunks))
          resolve(body)
        })
    })
    req.on('error',reject)

    req.write(data)
    req.end()
  })
}

async function rpc(method, ...params) {
  const { result } = await httpsPost(rpc_url, {
    id: Math.floor(Math.random() * 100000),
    jsonrpc: '2.0',
    method,
    params,
  })
  return result
}

async function getCurrentBlockNum() {
  return parseInt(await rpc('eth_blockNumber'))
}

async function getBlock(number) {
  return await rpc('eth_getBlockByNumber', '0x' + number.toString(16), false)
}

function logProgress(block, total) {
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(`Querying block ${block} of ${total}`)
}

async function generate() {
  const currentBlock = await getCurrentBlockNum()
  
  const blockSet = new Set(specialBlocks)
  for (let blockNum = RANGE_SIZE; blockNum < currentBlock; blockNum += RANGE_SIZE) {
    blockSet.add(blockNum)
  }

  const blockNums = Array.from(blockSet).sort((a, b) => a - b)

  const blocks = [
    {
      blockNum: 0,
      time: 1438269988,
      blocksPerSecond: 0,
    }
  ]

  console.log('')

  for (let i = 0; i < blockNums.length; i += 1) {
    logProgress(i + 1, blockNums.length)

    const blockNum = blockNums[i]
    const block = await getBlock(blockNums[i])
    const time = parseInt(block.timestamp)

    blocks.push({ blockNum, time })

    const lastBlock = blocks[blocks.length - 2]
    const blocksElapsed = blockNum - lastBlock.blockNum
    const secondsElapsed = time - lastBlock.time
    lastBlock.blocksPerSecond = blocksElapsed / secondsElapsed
  }

  // Remove last element, since it won't have blocksPerSecond
  blocks.pop()

  fs.writeFileSync(`${__dirname}/../src/block-time-table.json`, JSON.stringify(blocks))

  console.log('Table generated')
}

generate()
