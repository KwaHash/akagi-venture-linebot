// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
const crypto = require('crypto')

import Message from './MessageController'
import PostBack from './PostbackController'
import User from './UserController'

export default class LineController {
  public request: any

  constructor() {
    this.request = {}
  }

  public async callback({ request, response }) {
    this.request = request

    // 署名検証
    const isValid = await this.signatureVarification(request)
    if (!isValid) {
      // データ改竄（LINE platformからの送信未確認）
      response.send({
        status: 400,
        message: 'failed to signatureVarification',
      })
    }

    this.distribute()
  }

  public distribute() {
    const body = this.request.body()
    const events = body.events

    // event毎に振り分け
    if (events && events.length) {
      const event = events[0]
      const message = new Message()
      const postback = new PostBack()
      const user = new User()
      if (event.type === 'message') {
        message.receive(event)
      } else if (event.type === 'postback') {
        postback.receive(event)
      } else if (event.type === 'unfollow') {
        user.unfollow(event)
      } else if (event.type === 'follow') {
        user.follow(event)
      } else {
        console.log('other')
      }
    }
  }

  public async signatureVarification(request: any) {
    let result: boolean = false
    const xLineSignature: string = request.headers()['x-line-signature']
    const channelSecret: any = process.env.CHANNEL_SECRET
    const body: string = JSON.stringify(request.body())

    if (!channelSecret) return false

    const signature: string = crypto
      .createHmac('SHA256', channelSecret)
      .update(body)
      .digest('base64')

    if (xLineSignature === signature) {
      result = true
    } else {
      // TODO: ログ保存想定
      console.log(xLineSignature)
      console.log(signature)
    }

    return result
  }
}
