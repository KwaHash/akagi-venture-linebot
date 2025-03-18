import { Client } from '@line/bot-sdk'

const params: { channelAccessToken: string } = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
}
const client = new Client(params)

export default class Bot {
  /**
   * ユーザープロフィール取得
   */
  public async getUserProfile(uid: string) {
    try {
      const profile = await client.getProfile(uid)
      return profile
    } catch (error) {
      if (error.response) console.log(error.response.data)
      else console.log(error)
      return {
        message: 'line getProfile error',
      }
    }
  }

  public async pushTextMessage(data: {
    userId: string
    message: {
      type: 'text'
      text: string
    }
  }) {
    let result: {
      status: number
      message?: string
      detail: any
    }
    try {
      const response = await client.pushMessage(data.userId, data.message)
      result = {
        status: 200,
        detail: response,
      }
    } catch (error) {
      if (error.response) console.log(error.response.data)
      else console.log(error)
      console.log(error.response)
      result = {
        status: 500,
        message: 'failed to push message',
        detail: error.message,
      }
    }
    return result
  }

  /** メッセージ送信 */
  public async pushTemplateMessage(data: {
    userId: string
    message: {
      type: 'template'
      altText: string
      template: any
    }
  }) {
    let result: {
      status: number
      message?: string
      detail: any
    }
    try {
      const response = await client.pushMessage(data.userId, data.message)
      result = {
        status: 200,
        detail: response,
      }
    } catch (error) {
      if (error.response) console.log(error.response.data)
      else console.log(error)
      console.log(error.response)
      result = {
        status: 500,
        message: 'failed to push message',
        detail: error.message,
      }
    }
    return result
  }

  /** Flexメッセージ送信 */
  public async pushFlexMessage(data: {
    userId: string
    message: {
      type: 'flex'
      altText: string
      contents: any
    }
  }) {
    let result: {
      status: number
      message?: string
      detail: any
    }
    try {
      const response = await client.pushMessage(data.userId, data.message)
      result = {
        status: 200,
        detail: response,
      }
    } catch (error) {
      if (error.response) console.log(error.response.data)
      else console.log(error.originalError)
      console.log(error.response)
      result = {
        status: 500,
        message: 'failed to push message',
        detail: error.message,
      }
    }
    return result
  }

  /** メッセージ送信 */
  public async pushMenuMessage(u_id: string) {
    let result: {
      status: number
      message?: string
      detail: any
    }
    const msg: {
      type: 'template'
      altText: string
      template: any
    } = {
      type: 'template',
      altText: 'メニューを選択してください。',
      template: {
        type: 'buttons',
        title: 'メニュー',
        text: 'メニューを選択してください。',
        actions: [
          // {
          //   type: 'message',
          //   label: '予約を確認する',
          //   text: '予約を確認する',
          // },
          {
            type: 'message',
            label: 'ポイントを確認する',
            text: 'ポイントを確認する',
          },
          {
            type: 'message',
            label: 'ポイントを利用する',
            text: 'ポイントを利用する',
          },
          {
            type: 'message',
            label: 'ECサイトポイント連携',
            text: 'ECサイトポイント連携',
          },
        ],
      },
    }
    try {
      const response = await client.pushMessage(u_id, msg)
      result = {
        status: 200,
        detail: response,
      }
    } catch (error) {
      if (error.response) console.log(error.response.data)
      else console.log(error)
      console.log(error.response)
      result = {
        status: 500,
        message: 'failed to push message',
        detail: error.message,
      }
    }
    return result
  }
}
