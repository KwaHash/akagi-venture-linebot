import Bot from './BotController'
const axios = require('axios')
const baseURL = process.env.API_BASE
const Authorization = process.env.API_TOKEN

const bot = new Bot()

export default class User {
  public async follow(event: {
    type: string
    message: { type: string; id: string; text: string }
    timestamp: number
    source: { type: string; userId: string }
    replyToken: string
    mode: string
  }) {
    // ユーザーのプロフィールを取得
    const uId: string = event.source.userId

    // 未登録のユーザにのみポイントを付与（この時点でline_user_idはnull）
    const createdPoint = await this.createWelcomePoint(uId)

    const user: {
      userId?: string
      displayName?: string
      pictureUrl?: string | null
      language?: string
      message?: string
    } = await bot.getUserProfile(uId)
    let displayname: string = ''
    let thumbnail: string = ''
    if (user.displayName) displayname = user.displayName
    if (user.pictureUrl) thumbnail = user.pictureUrl

    // DBに登録（既登録であれば更新）
    const data: {
      flag: number
      u_id: string
      linename: string
      thumbnail: string
    } = {
      flag: 1,
      u_id: uId,
      linename: displayname,
      thumbnail,
    }

    let result

    // backend叩く
    await axios({
      headers: {
        Authorization,
      },
      baseURL,
      responseType: 'json',
      method: 'POST',
      url: '/v1/lineUser/create',
      data,
    })
      .then((response) => {
        result = response.data
      })
      .catch((error) => {
        console.log(error)
        result = error
      })

    // 付与したポイントレコードのline_user_idを更新
    if (createdPoint.add && createdPoint.point) {
      const welcomePoint = await this.updateWelcomePoint(
        uId,
        createdPoint.point.pointId,
        result.lineUserId
      )
      result.point = welcomePoint
    }

    return result
  }

  public async unfollow(event: {
    type: string
    message: { type: string; id: string; text: string }
    timestamp: number
    source: { type: string; userId: string }
    replyToken: string
    mode: string
  }) {
    const data: {
      u_id: string
      flag: number
    } = {
      u_id: event.source.userId,
      flag: 999,
    }

    // backend叩く
    let result
    await axios({
      headers: {
        Authorization,
      },
      baseURL,
      responseType: 'json',
      method: 'POST',
      url: '/v1/lineUser/update',
      data,
    })
      .then((response) => {
        result = response.data
      })
      .catch((error) => {
        console.log(error)
        result = error
      })

    return result
  }

  /** Welcomeポイントの付与 */
  public async createWelcomePoint(uId) {
    let result: {
      add: Boolean
      point?: { [field: string]: any }
    } = {
      add: false,
    }

    try {
      // uIdのユーザが存在するか確認
      const user = await axios({
        headers: { Authorization },
        baseURL,
        method: 'GET',
        url: '/v1/lineUser/get/detail',
        params: { u_id: uId },
      })
      // 既登録の場合は即終了
      if (user.data.detail) return { add: false }
      // この時点でline_user_idは作られていない
      const point = await axios({
        headers: { Authorization },
        baseURL,
        method: 'POST',
        url: '/v1/point/create',
        data: {
          flag: 10,
          type: 1,
          amount: 300,
        },
      })
      result.add = true
      result.point = point.data
    } catch (e) {
      console.log(e)
    }
    return result
  }

  /** 付与したポイントレコードのline_user_idを更新 */
  public async updateWelcomePoint(uId, pointId, lineUserId) {
    let result: Boolean = false
    try {
      await axios({
        headers: { Authorization },
        baseURL,
        method: 'POST',
        url: '/v1/point/update',
        data: { id: pointId, flag: 1, line_user_id: lineUserId },
      })

      // ポイントを付与した旨のメッセージ送信
      bot.pushTextMessage({
        userId: uId,
        message: {
          type: 'text',
          text: `友だち追加いただきありがとうございます\ud83d\udc81\u200d\u2642\ufe0f
お礼に、baconをはじめAKAGI VENTURE各店舗で利用可能なポイントを300ポイントプレゼントいたします！ぜひご利用ください\u2728
（ポイントのご利用は2023年6月以降となります。）`,
        },
      })

      result = true
    } catch (e) {
      console.log(e)
    }
    return result
  }
}
