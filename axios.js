import axios from 'axios'
import bufferingObjectStream from 'buffering-object-stream'
import { createWriteStream } from 'node:fs'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const url = 'https://jsonplaceholder.typicode.com/todos'

export const processRequestAxiosAsStream = async (data, filename) => {
  try {
    const started = new Date()
    const stream = Readable.from(selectDataAsStream(data))
    await pipeline(
      stream,
      bufferingObjectStream(200),
      promisesAxiosRequest,
      executeAxiosRequest,
      filterResponse,
      async function* (source) {
        for await (const item of source) {
          yield item.split(',').join('\n')
        }
      },
      // process.stdout
      createWriteStream(`./${filename}.njson`)
      )
      
      console.log('Stream ended!')
      console.log(`This process took: ${new Date() - started}ms`)
      // process.exit(0)
    } catch (error) {
      console.error('Stream ended with error: ', error)
      console.log(`This process took: ${new Date() - started}ms`)
  }
}

async function* selectDataAsStream(data) {
  for (const item of data) yield String(item)
}

async function axiosAsStream(chunks) {
  let result = []
  for (const promise of chunks) {
      const res = await promise
      // console.log('>>> Response: ', res.status ?? res)
      result.push(res)
     
    }
    return result
  }

const promisesAxiosRequest = new Transform({
  objectMode: true,
  transform(chunks, enc, cb) {
      const promises = chunks.map((chunk) => axios.get(`${url}/${chunk}`)
        .catch(() => `[${chunk}]: Produto-${chunk}`))
    cb(null, promises)
  }
})

const filterResponse = (res) => {
  return res.filter(i => typeof i  === 'string')
}

const executeAxiosRequest = new Transform({
  objectMode: true,
  async transform(chunks, enc, cb) {
    const res = await axiosAsStream(chunks)
    const result = filterResponse(res)
    if(result.length) return cb(null, String(result))
    cb()
  }
})