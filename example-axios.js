import axios from 'axios'
import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import { getData } from './data.js'

const httpAxios = axios.create()

httpAxios.interceptors.response.use(({ status, data }) => ({ status, data }))

const url = 'https://jsonplaceholder.typicode.com/todos'

const data = await getData()

async function* selectAsStream(data) {
  const batch = 100 // define o tamanho a ser processado
  for (let i = 0; i < data.length; i += batch) {
    const requests = data.slice(i, i + batch)
      .map((id) => httpAxios.get(`${url}/${id}`)
        .catch((err) => ({
          status: err.response.status,
          data: `[${id}]: Produto-${id}`
        })))

    const response = await Promise.all(requests)

    yield JSON.stringify(response)
  }
}

const started = new Date()

await Promise.all([
 processRequestAsStream(data, 'c1'),
//  processRequestAsStream(data, 'c2'),
//  processRequestAsStream(data, 'c3'),
//  processRequestAsStream(data, 'c4'),
//  processRequestAsStream(data, 'c5'),
])

console.log(`This process took: ${new Date() - started}ms`)
export async function processRequestAsStream(data, filename) {
  let results = []
  const stream = Readable.from(selectAsStream(data))
  await pipeline(
    stream,
    async function* (source) {
      for await (const item of source) {
        results = results.concat(JSON.parse(item))
      }
      yield JSON.stringify(results)
    },
    createWriteStream(`./${filename}.njson`),
    // process.stdout
  )
  // console.log('>>>Result: ', results);
}

