import Memcache from './MemcacheController'
import Axios from './AxiosController'
import Bot from './BotController'
import Common from './CommonController'
import CommonTemplate from '../../FlexTemplates/Common'
import PointTemplate from '../../FlexTemplates/Point'
import { DateTime } from 'luxon'
const common = new Common()

export default class Point {
  /** ポイント利用ステップスタート */
  public async startPointUse(u_id: string) {
    const axios = new Axios()
    // lineUser情報を取得し、ecUserの紐付けがあるか確認
    const lineUser = await axios.getLineUser({
      u_id: u_id,
      withCustomer: 1,
    })
    if (lineUser.status !== 200) return common.pushErrorMessage(u_id)

    if (lineUser.detail?.ecUser.length) return this.sendPointUseAlert(u_id)
    else return this.sendShopList(u_id)
  }

  public async sendPointUseAlert(u_id: string) {
    const params = {
      title: 'ポイント利用前確認事項',
      desc: 'オンラインストアでカートに商品がある場合、ポイントの利用処理に失敗することがあります。ポイント利用ステップを開始してよろしいですか。',
    }

    const ct = new CommonTemplate()
    const template = ct.confirm(params)

    const msgObj: {
      type: 'flex'
      altText: string
      contents: any
    } = {
      type: 'flex',
      altText: 'ポイント利用確認事項',
      contents: template,
    }

    const bot = new Bot()
    const sended = await bot.pushFlexMessage({
      userId: u_id,
      message: msgObj,
    })

    // memcacheにステータス保存
    const memcache = new Memcache()
    const res = await memcache.save(u_id, { process: { name: 'point-use', step: 1 } })
    if (!res) return common.pushErrorMessage(u_id) // エラーの場合

    return sended
  }

  public async sendShopList(u_id: string) {
    // 店舗選択メッセージ送信
    const bot = new Bot()
    // 店舗情報取得
    const axios = new Axios()
    const shoplist = await axios.getShopList()
    if (shoplist.status !== 200) return common.pushErrorMessage(u_id) // エラーの場合

    const pointTemplate = new PointTemplate()
    const template = pointTemplate.selectShop(shoplist.shops)

    const sended = await bot.pushFlexMessage({
      userId: u_id,
      message: {
        type: 'flex',
        altText: '店舗を選択してください。',
        contents: template,
      },
    })

    // memcacheにステータス保存
    const memcache = new Memcache()
    const res = await memcache.save(u_id, { process: { name: 'point-use', step: 2 } })
    if (!res) return common.pushErrorMessage(u_id) // エラーの場合

    return sended
  }

  /** ポイント付与（activatekeyを受信） */
  public async receivePointActivatekey(activatekey: string, user_id: string) {
    const pParams: { activatekey: string; flags: Array<number> } = { activatekey, flags: [10] }
    const lParams: { u_id: string } = { u_id: user_id }

    const axios = new Axios()
    const point = await axios.getPointDetail(pParams)
    const lineUser = await axios.getLineUser(lParams)

    if (point.status === 200 && lineUser.status === 200) {
      return await this.addPoint(point.detail, lineUser.detail) // あればポイント付与
    }
    if (lineUser.status === 404) return await common.pushErrorMessage(user_id, lineUser) // lineUserがなかった場合（想定ではないはず）
    if (point.status === 404) return await common.pushErrorMessage(user_id, point) // ない場合は無効なID
    return await common.pushErrorMessage(user_id) // エラー
  }

  public async addPoint(
    point: { id: number; amount: number },
    lineUser: { id: number; u_id: string }
  ) {
    const data = {
      id: point.id,
      flag: 1,
      activatekey: null,
      expire: null,
      line_user_id: lineUser.id,
    }

    const axios = new Axios()
    const result = await axios.pointUpdate(data)

    if (result.status !== 200) return await common.pushErrorMessage(lineUser.u_id) // pointUpdate エラーの場合

    // ポイント取得完了のメッセージ送信
    const bot = new Bot()
    const messageData: {
      userId: string
      message: {
        type: 'text'
        text: string
      }
    } = {
      userId: lineUser.u_id,
      message: {
        type: 'text',
        text: `${point.amount}ポイント取得しました！`,
      },
    }
    const sended = bot.pushTextMessage(messageData)

    return sended
  }

  /** ポイント確認 */
  public async showPoint(u_id: string) {
    const params: { u_id: string; withPoints: number } = { u_id, withPoints: 1 }
    const axios = new Axios()
    const lineUser = await axios.getLineUser(params)
    if (lineUser.status !== 200) return common.pushErrorMessage(u_id)

    const data: {
      userId: string
      message: {
        type: 'flex'
        altText: string
        contents: any
      }
    } = {
      userId: u_id,
      message: {
        type: 'flex',
        altText: `現在の保有ポイントは${lineUser.detail.pointSum}ポイントです`,
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '現在の保有ポイント',
                align: 'center',
                size: 'sm',
                margin: 'lg',
              },
              {
                type: 'text',
                text: `${lineUser.detail.pointSum}`,
                align: 'center',
                size: '3xl',
                margin: 'xl',
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [],
                margin: 'lg',
              },
            ],
          },
          size: 'micro',
        },
      },
    }
    const bot = new Bot()
    const sended = await bot.pushFlexMessage(data)

    if (sended.status !== 200) return common.pushErrorMessage(u_id)
    return sended
  }

  public async confirmUsePoint(data: {
    amount: number
    u_id: string
    memData: {
      process: {
        step: number
        shop: {
          id: number
          label: string
        }
        point: {
          sum: number
        }
      }
      lineUserId: number
    }
  }) {
    const point = data.memData.process.point.sum
    const shop = data.memData.process.shop
    // 入力された数字が保有ポイントより大きかった場合
    if (data.amount > point) {
      const msg: {
        userId: string
        message: {
          type: 'text'
          text: string
        }
      } = {
        userId: data.u_id,
        message: {
          type: 'text',
          text: `無効な値です。\n利用ポイントは保有ポイント以下で入力してください。\n(保有ポイント：${point})`,
        },
      }
      const bot = new Bot()
      return bot.pushTextMessage(msg)
    }
    // memcacheのステータスupdate
    const mem = new Memcache()
    const saved = await mem.save(data.u_id, {
      process: {
        name: 'point-use',
        step: 3,
        point: {
          sum: point,
          use: data.amount,
        },
        shop,
      },
      lineUserId: data.memData.lineUserId,
    })
    if (!saved) return common.pushErrorMessage(data.u_id)

    const ct = new CommonTemplate()
    const listItem = [
      { label: '利用店舗', value: `${shop.label}` },
      { label: '利用ポイント', value: `${data.amount}` },
    ]
    const list = ct.genList(listItem)
    const contents = {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '※「はい」ボタン押下前にこの画面をスタッフに見せてください。',
          size: 'xs',
          color: '#ff6768',
          wrap: true,
        },
        list,
      ],
      margin: 'xl',
    }
    const templateData = {
      title: 'ポイント利用内容確認',
      desc: '以下の内容でポイントを利用します。よろしいですか？',
      contents,
    }
    const template = ct.submit(templateData)

    // pushMessage
    const bot = new Bot()
    const params: {
      userId: string
      message: {
        type: 'flex'
        altText: string
        contents: any
      }
    } = {
      userId: data.u_id,
      message: {
        type: 'flex',
        altText: 'ポイントを利用します。よろしいですか？',
        contents: template,
      },
    }
    const sended = await bot.pushFlexMessage(params)
    return sended
  }

  public async showHistory(u_id: string) {
    const params: { u_id: string; withPoints: number } = { u_id, withPoints: 1 }
    const axios = new Axios()
    const lineUser = await axios.getLineUser(params)
    if (lineUser.status !== 200) return common.pushErrorMessage(u_id)
    if (!lineUser.detail.point.length) {
      return common.pushErrorMessage(u_id, { message: 'ポイント履歴はありません。' })
    }
    const pointTemplate = new PointTemplate()
    const template = pointTemplate.genHistoryList(lineUser.detail.point)

    // pushMessage
    const bot = new Bot()
    const msgObj: {
      userId: string
      message: {
        type: 'flex'
        altText: string
        contents: any
      }
    } = {
      userId: u_id,
      message: {
        type: 'flex',
        altText: 'ポイント利用履歴',
        contents: template,
      },
    }
    const sended = await bot.pushFlexMessage(msgObj)
    return sended
  }

  public async shopSelectAction(userId: string, shopName: string) {
    const axios = new Axios()
    // shopを確認
    const shopData = await axios.getShopList()
    if (shopData.status !== 200) return common.pushErrorMessage(userId)
    const shop = shopData.shops.find((s) => s.label === shopName)
    if (!shop) return common.resetProcess(userId, '無効な店舗名です。初めからやり直してください。')

    // 保有ポイントを確認
    const lineUser = await axios.getLineUser({ u_id: userId, withPoints: 1 })
    if (lineUser.status !== 200) return common.pushErrorMessage(userId)

    const pointSum = lineUser.detail.pointSum // 保有ポイント

    // memcacheのステータスを更新
    const mem = new Memcache()
    const saved = await mem.save(userId, {
      process: {
        name: 'point-use',
        step: 3,
        point: { sum: pointSum },
        shop: { id: shop.id, label: shop.label },
      },
      lineUserId: lineUser.detail.id,
    })
    if (!saved) return common.pushErrorMessage(userId)

    // pushMessage
    const msg: {
      userId: string
      message: {
        type: 'text'
        text: string
      }
    } = {
      userId,
      message: {
        type: 'text',
        text: `利用するポイント数を入力してください。\n（保有ポイント：${pointSum}）`,
      },
    }
    const bot = new Bot()
    const sended = bot.pushTextMessage(msg)
    return sended
  }

  public async registUsePoint(
    u_id: string,
    memProcess: {
      shop: {
        id: number
        label: string
      }
      point: {
        sum: number
        use: number
      }
    },
    lineUserId: number
  ) {
    const data: {
      flag: number
      type: number
      amount: number
      shop_id: number
      line_user_id: number
    } = {
      flag: 10, // 承認待ち
      type: 2, // 利用
      amount: memProcess.point.use,
      shop_id: memProcess.shop.id,
      line_user_id: lineUserId,
    }
    const axios = new Axios()
    const res = await axios.pointCreate(data)
    let sended
    if (res.status !== 200) {
      if (res.message === 'Point is not enough') {
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
            text: 'ご利用ポイントに対して保有ポイントが不足しています。（ECサイトでポイントをご利用された場合、反映に時間がかかるため、LINE表示されているポイント数と実際のポイント数は異なることがあります。）',
          },
        }
        const bot = new Bot()
        return await bot.pushTextMessage(msg)
      } else {
        const common = new Common()
        return common.pushErrorMessage(u_id)
      }
    } else {
      const udtParams = {
        id: res.data.pointId,
        flag: 1,
        activatekey: null,
        expire: null,
        line_user_id: lineUserId,
      }
      // ポイント有効化
      const udtPoint = await axios.pointUpdate(udtParams)

      if (udtPoint.status === 200) {
        // u_idからユーザーの名前を取得
        const axios = new Axios()
        const lineuser = await axios.getLineUser({ u_id })
        // 時間のフォーマットを整える
        const now = DateTime.now().toFormat('yyyy/MM/dd HH:mm')
        // template作成
        const pointTemplate = new PointTemplate()
        const template = pointTemplate.complete({
          name: lineuser && lineuser.detail ? `${lineuser.detail.linename}さま` : 'お客様',
          amount: data.amount,
          time: now,
          shop: memProcess.shop.label,
        })

        const bot = new Bot()
        sended = await bot.pushFlexMessage({
          userId: u_id,
          message: {
            type: 'flex',
            altText: 'ポイントの利用が完了しました！',
            contents: template,
          },
        })
      } else {
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
            text: 'ポイントの利用に失敗しました。恐れ入りますが再度初めからやり直してください。',
          },
        }

        const bot = new Bot()
        sended = await bot.pushTextMessage(msg)
      }
    }

    // memcacheのステータス削除
    const mem = new Memcache()
    mem.del(u_id)

    return sended
  }
}
