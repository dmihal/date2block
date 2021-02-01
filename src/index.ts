import _blockTimeTable from './block-time-table.json'

interface Block {
  blockNum: number
  time: number
  blocksPerSecond: number
}

const blockTimeTable = _blockTimeTable as Block[]

// TODO: change recursive to iterative
function binarySearch(timestamp: number, lowerRange: number, upperRange: number): Block {
  const middle = lowerRange + Math.floor((upperRange - lowerRange) / 2)

  if (timestamp > blockTimeTable[middle].time) {
    if (middle + 1 >= blockTimeTable.length || timestamp < blockTimeTable[middle + 1].time) {
      return blockTimeTable[middle]
    } else {
      return binarySearch(timestamp, middle, upperRange)
    }
  } else {
    return binarySearch(timestamp, lowerRange, middle)
  }
}

function findClosestPreviousBlock(timestamp: number) {
  if (timestamp > blockTimeTable[blockTimeTable.length - 1].time) {
    return blockTimeTable[blockTimeTable.length - 1]
  }

  return binarySearch(timestamp, 0, blockTimeTable.length - 1)
}

export function date2block(date: Date | number): number {
  const timestamp = typeof date === 'number' ? date : Math.floor(date.getTime() / 1000)

  if (timestamp < blockTimeTable[0].time) {
    throw new Error('Date is before Ethereum genesis block')
  }

  const closestBlock = findClosestPreviousBlock(timestamp)

  const secondsSinceClosestBlock = timestamp - closestBlock.time

  return Math.floor(closestBlock.blockNum + (closestBlock.blocksPerSecond * secondsSinceClosestBlock))
}
