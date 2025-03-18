import Memcache from './MemcacheController'
import Bot from './BotController'
import Common from './CommonController'
const common = new Common()

export default class PostBack {
  public async receive(event: {
    type: string
    label?: string
    postback: {
      data: string
    }
    displayText?: string
    text?: string
    inputOption?: string
    fillInText?: string
    source: {
      type: string
      userId: string
    }
  }) {
    // const value: string = event.postback.data
    const uId: string = event.source.userId

    const mem = new Memcache()

    // そのほか
    const errMsg = { message: '無効なアクションです。恐れ入りますが、初めからやり直してください。' }
    await mem.del(uId)
    await common.pushErrorMessage(uId, errMsg)
    const bot = new Bot()
    return await setTimeout(() => bot.pushMenuMessage(uId), 1200)
  }
}
