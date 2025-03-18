import Memcache from './MemcacheController'
import Bot from './BotController'
import Common from './CommonController'
import Axios from './AxiosController'

export default class EcController {
  public request: any

  constructor() {
    this.request = {}
  }

  public async startLinkLine(uId: string) {
    console.log('===== link line start!! =====')
    // email入力を促すLINE
    const mem = new Memcache()
    await mem.save(uId, {
      process: {
        name: 'link-lineUser',
        step: 1,
      },
    })

    const axios = new Axios()
    const params = {
      u_id: uId,
      withCustomer: 1,
    }
    const result = await axios.getLineUser(params)
    if (result.status === 200) {
      const lineUser = result.detail
      const ecUser = lineUser.ecUser[0]
      if (ecUser) {
        const msgObj: {
          userId: string
          message: {
            type: 'text'
            text: string
          }
        } = {
          userId: uId,
          message: {
            type: 'text',
            text: 'お客様のLINEアカウントはすでにECサイトポイント連携を完了しています。',
          },
        }

        const bot = new Bot()
        const sended = await bot.pushTextMessage(msgObj)
        return sended
      }
    } else {
      const common = new Common()
      return common.pushErrorMessage(uId)
    }

    // メッセージ送信
    const msgObj1: {
      userId: string
      message: {
        type: 'text'
        text: string
      }
    } = {
      userId: uId,
      message: {
        type: 'text',
        text: 'ECサイトポイント連携は赤城の福豚でできたHUTTE HAYASHIブランドのハムなどが購入できるオフィシャルECサイトとのポイント連携になります。\n\nECサイトポイント連携をすると店舗やキャンペーンで獲得したポイントを他店舗のみならずECでもご利用いただけます。\n\nまたECでのお買い物時に獲得したポイントを各店舗でもご利用可能になります。',
      },
    }

    const msgObj2: {
      userId: string
      message: {
        type: 'text'
        text: string
      }
    } = {
      userId: uId,
      message: {
        type: 'text',
        text: 'すでにECサイトでアカウントをお持ちの方はEメールアドレスを会話に送信してください。\n\nまだECサイトでアカウントを持っていない方は下記URLより作成したのち「ECサイトポイント連携」をしてください。\nhttps://www.hutte-hayashi.com/',
      },
    }

    const bot = new Bot()
    let sended = await bot.pushTextMessage(msgObj1)
    sended = await bot.pushTextMessage(msgObj2)
    return sended
  }

  public async linkLineUser(uId: string, email: string) {
    const axios = new Axios()
    const params = {
      email,
      u_id: uId,
    }
    const result = await axios.link2ecUser(params)

    // メッセージ送信
    const msgObj: {
      userId: string
      message: {
        type: 'text'
        text: string
      }
    } = {
      userId: uId,
      message: {
        type: 'text',
        text: '',
      },
    }
    if (result.status === 200) msgObj.message.text = 'LINE連携が完了しました！'
    else msgObj.message.text = 'LINE連携に失敗しました。恐れ入りますが再度やり直してください。'

    // memcacheリセット
    const mem = new Memcache()
    await mem.del(uId)

    const bot = new Bot()
    const sended = await bot.pushTextMessage(msgObj)
    return sended
  }
}
