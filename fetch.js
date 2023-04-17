import axios from 'axios'
import bufferingObjectStream from 'buffering-object-stream'
import { createWriteStream } from 'node:fs'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const url = 'https://jsonplaceholder.typicode.com/todos'

export const processRequestFetchAsStream = async (data, filename) => {
  try {
    const started = new Date()
    const stream = Readable.from(selectDataAsStream(data))
    await pipeline(
      stream,
      bufferingObjectStream(200),
      promisesFetchRequest,
      executeFetchRequest,
      async function* (source) {
        for await (const data of source) {
          // console.log(item);
          for (const item of data) {
            yield item + '\n'
          }
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

const promisesFetchRequest = new Transform({
  objectMode: true,
  transform(chunks, enc, cb) {
      const promises = chunks.map(async(chunk) => {
        const response = await fetch(`${url}/${chunk}`)
        return {
          id: chunk,
          status: response.status,
          nome: `Produto-${chunk}`
        }
      })
    cb(null, promises)
  }
})

const executeFetchRequest = new Transform({
  objectMode: true,
  async transform(chunks, enc, cb) {
    let result = []
    const response = await Promise.all(chunks)
    for (const item of response) {
      if (item.status !== 200) {
        result.push(`[${item.id}]: ${item.nome}`)
      }
    }
  cb(null, result)
  }
})