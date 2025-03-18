import { DateTime } from 'luxon'
import Bot from './BotController'
import Memcache from './MemcacheController'

export default class Common {
  /**
   * 日付のフォーマット
   * ISO以外の型の場合、要修正
   */
  public formatTimestamp(date: string, format: string = 'yyyy-MM-dd') {
    const dt = DateTime.fromISO(date)
    const formated = dt.toFormat(format)
    return formated
  }

  public async pushErrorMessage(
    u_id: string,
    data?: { message: string },
    pushMenu: boolean = true
  ) {
    const params: {
      userId: string
      message: {
        type: 'text'
        text: string
      }
    } = {
      userId: u_id,
      message: {
        type: 'text',
        text: data
          ? data.message
          : '処理中にエラーが発生しました。恐れ入りますが、初めからやり直してください。',
      },
    }

    this.resetProcess(u_id)
    const bot = new Bot()
    const result = await bot.pushTextMessage(params)
    if (pushMenu) await setTimeout(() => bot.pushMenuMessage(u_id), 1200)

    return result
  }

  public async resetProcess(u_id: string, text?: string) {
    // memcache削除
    const mem = new Memcache()
    mem.del(u_id)
    if (text) {
      // pushMessage
      const msg: {
        userId: string
        message: {
          type: 'text'
          text: string
        }
      } = {
        userId: u_id,
        message: {
          type: 'text',
          text,
        },
      }
      const bot = new Bot()
      const sended = await bot.pushTextMessage(msg)
      return sended
    }
    return
  }
}
