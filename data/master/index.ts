import { load } from 'js-yaml'
import { readFileSync } from 'fs'

const words = load(readFileSync('./data/master/words.yaml', 'utf8'))

export default {
  words,
}
