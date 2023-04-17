import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import { getData } from './data.js'

const data = await getData()

async function* selectAsStream(data) {
  const batchSize = 100 // define o tamanho do lote a ser processado
  for (let i = 0; i < data.length; i += batchSize) {
    const requests = data.slice(i, i + batchSize).map(async (id) => { 
      const response = await fetch('https://jsonplaceholder.typicode.com/todos/' + id)
      return {
        id,
        status: response.status,
        nome: `Produto-${id}`
      }
    })

    const response = await Promise.all(requests)
    for (const item of response) {
      if (item.status !== 200) {
        yield `[${item.id}]: ${item.nome}`
      }
    }
  }
}

const started = new Date()

await Promise.all([
 processRequestAsStream(data, 'c1'),
 processRequestAsStream(data, 'c2'),
 processRequestAsStream(data, 'c3'),
 processRequestAsStream(data, 'c4'),
 processRequestAsStream(data, 'c5'),
])

console.log(`This process took: ${new Date() - started}ms`)

async function processRequestAsStream(data, filename) {
  const stream = Readable.from(selectAsStream(data))
  await pipeline(
    stream,
    async function* (source) {
      for await (const item of source) {
        yield item.concat("\n")
      }
    },
    // process.stdout
    createWriteStream(`./${filename}.njson`)
  )
}


