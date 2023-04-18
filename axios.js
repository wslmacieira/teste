import axios from 'axios'
import bufferingObjectStream from 'buffering-object-stream'
import { createWriteStream } from 'node:fs'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const httpAxios = axios.create()

httpAxios.interceptors.response.use(({ status, data }) => ({ status, data }))

const url = 'https://jsonplaceholder.typicode.com/todos'

export const processRequestAxiosAsStream = async (data, filename) => {
  try {
    const started = new Date()
    let results = []
    const stream = Readable.from(selectDataAsStream(data))
    await pipeline(
      stream,
      bufferingObjectStream(50),
      promisesAxiosRequest,
      executeAxiosRequest,
      async function* (source) {
        for await (const item of source) {
          results = results.concat(item)
        }
      },
      // process.stdout
      // createWriteStream(`./${filename}.njson`)
      )
      console.log('>>>Result: ', results.length);
      
      console.log('Stream ended!')
      console.log(`This process took: ${new Date() - started}ms`)
    } catch (error) {
      console.error('Stream ended with error: ', error)
      console.log(`This process took: ${new Date() - started}ms`)
  }
}

async function* selectDataAsStream(data) {
  for (const item of data) yield String(item)
}

const promisesAxiosRequest = new Transform({
  objectMode: true,
  transform(chunks, enc, cb) {
      const promises = chunks.map((chunk) => httpAxios.get(`${url}/${chunk}`)
        .catch((err) => ({
          status: err.response.status,
          data: `[${chunk}]: Produto-${chunk}`
        })))
    cb(null, promises)
  }
})

const executeAxiosRequest = new Transform({
  objectMode: true,
  async transform(chunks, enc, cb) {
    const response = await Promise.all(chunks)
    cb(null, response)
  }
})