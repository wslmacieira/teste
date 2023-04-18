import { getData } from './data.js'
import { processRequestAxiosAsStream } from './axios.js'
import { processRequestFetchAsStream } from './fetch.js'

const data = await getData()

const main = async() => {
  await processRequestAxiosAsStream(data, 'c1'),
  // await processRequestFetchAsStream(data, 'c2')
  process.exit(0)
}

main()
