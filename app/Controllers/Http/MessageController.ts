import MASTER from '../../../data/master'
import Memcache from './MemcacheController'
import Reservation from './ReservationController'
import Point from './PointController'
import Common from './CommonController'
import Bot from './BotController'
import Ec from './EcController'
const common = new Common()
const reservation = new Reservation()
const point = new Point()
const ec = new Ec()

export default class Message {
  public async receive(event: {
    type: string
    message: { type: string; id: string; text: string }
    timestamp: number
    source: { type: string; userId: string }
    replyToken: string
    mode: string
  }) {
    const content: string = event.message.text
    const uId: string = event.source.userId

    const mem = new Memcache()
    const memData = await mem.get(uId)
    const process = memData && memData.process ? memData.process : null

    // ポイント付与
    let activatekey: string | null = null
    // ID:から始まる
    if (content.indexOf('ID:') === 0) activatekey = content.slice(3, content.length)
    // 半角英数記号 && 文字数が28
    if (activatekey && activatekey.match(/^[\x20-\x7e]+$/) && activatekey.length === 28) {
      return point.receivePointActivatekey(activatekey, event.source.userId)
    }

    // ポイント利用
    if (MASTER.words.usePoint.includes(content)) return point.startPointUse(uId)
    // ポイント確認
    if (MASTER.words.showPoint.includes(content)) return point.showPoint(uId)
    // ポイント利用履歴確認
    if (MASTER.words.showHistory.includes(content)) return point.showHistory(uId)
    // 予約確認
    if (MASTER.words.showReservations.includes(content)) return reservation.showReservations(uId)
    // 予約キャンセル
    if (MASTER.words.cancelReservations.includes(content)) return reservation.cancelReservation(uId)

    // EC連携
    if (MASTER.words.linkLineUser.includes(content)) return ec.startLinkLine(uId)

    // ポイント利用店舗選択
    if (
      memData &&
      memData.process &&
      memData.process.step === 2 &&
      memData.process.name === 'point-use'
    ) {
      return point.shopSelectAction(uId, content)
    }

    // ポイント数
    if (Number(content) && process && process.name === 'point-use' && process.step === 3) {
      return point.confirmUsePoint({ amount: Number(content), u_id: uId, memData })
    }

    if (process && process.name === 'link-lineUser' && process.step === 1) {
      return ec.linkLineUser(uId, content)
    }

    // はい・いいえだった場合はmemchacheのステータスで振り分け
    if (['はい', 'いいえ'].includes(content) && memData) {
      if (process.name === 'point-use') {
        if (content === 'いいえ')
          return common.resetProcess(uId, 'ポイント利用をキャンセルしました。')
        else if (process.step === 1) return point.sendShopList(uId)
        else if (process.step === 3) return point.registUsePoint(uId, process, memData.lineUserId)
      }
      if (process.name === 'reservation-cancel') {
        if (content === 'いいえ')
          return common.resetProcess(uId, 'キャンセルステップを中止しました。')
        if (process.step === 2) return reservation.execCancel(uId, memData)
      }
    }

    // そのほか
    const bot = new Bot()
    await mem.del(uId)
    return bot.pushMenuMessage(uId)
  }
}
