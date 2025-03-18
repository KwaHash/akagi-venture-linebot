import Bot from './BotController'
import Memcache from './MemcacheController'
import Axios from './AxiosController'
import Common from './CommonController'
import ReservationTemplate from '../../FlexTemplates/Reservation'
import CommonTemplate from '../../FlexTemplates/Common'
import { DateTime } from 'luxon'
const common = new Common()

export default class Reservation {
  public async showReservations(u_id: string) {
    const params: { u_id: string; withReservations: number; isFuture: number } = {
      u_id,
      withReservations: 1,
      isFuture: 1,
    }
    const axios = new Axios()
    const lineUser = await axios.getLineUser(params)
    const master = await axios.getBackendMaster()

    // データ取得失敗：エラーメッセージ送信
    if (master.status !== 200 || lineUser.status !== 200) return common.pushErrorMessage(u_id)

    // 予約がない場合
    const reservation: any =
      lineUser.detail && lineUser.detail.reservation.length ? lineUser.detail.reservation[0] : null
    if (!reservation) {
      const errMsg: { message: string } = { message: '予約はありません。' }
      return common.pushErrorMessage(u_id, errMsg, false)
    }

    // memcacheにステータス保存
    const mem = new Memcache()
    await mem.save(u_id, {
      process: {
        name: 'reservation-cancel',
        step: 1,
        reservationId: reservation.id,
      },
    })

    const plan = master.master.bacon.plans.find((p) => p.id === reservation.plan_id)

    const reservationItem = [
      {
        label: '予約日',
        name: 'date',
      },
      {
        label: 'プラン',
        name: 'plan',
      },
      {
        label: '予約人数',
        name: 'num',
      },
      {
        label: 'お名前',
        name: 'linename',
      },
      {
        label: '電話番号',
        name: 'tel',
      },
    ]

    const contents: any = []
    reservationItem.forEach((item) => {
      const obj: {
        label: string
        value: string
      } = {
        label: item.label,
        value: '',
      }
      if (item.name === 'date') {
        obj.value = common.formatTimestamp(reservation.start_time, 'yyyy/MM/dd')
      } else if (item.name === 'plan') {
        const start = common.formatTimestamp(reservation.start_time, 'HH:mm')
        const course = plan.courses.find((c) => c.start === start)
        obj.value = `${plan.label}(${course.label})`
      } else if (item.name === 'num') {
        const withKids = plan.prices.some((p) => p.type === 'kids')
        if (withKids)
          obj.value = `大人：${reservation.num_adult}名\n子供：${reservation.num_kids}名`
        else obj.value = `${reservation.num_adult}名`
      } else {
        obj.value = String(reservation[item.name])
      }
      if (obj.value) contents.push(obj)
    })

    const ct = new CommonTemplate()
    const lists = ct.genList(contents)

    const canBeCanceled: boolean = this.checkCanBeCanceled(reservation.start_time)

    const rsvTemplate = new ReservationTemplate()
    const template = rsvTemplate.reservationDetail(lists, canBeCanceled)

    // メッセージ送信
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
        altText: `予約内容確認：${reservation.id}`,
        contents: template,
      },
    }

    const bot = new Bot()
    const sended = await bot.pushFlexMessage(msgObj)
    return sended
  }

  public async cancelReservation(u_id: string) {
    const mem = new Memcache()
    const memData = await mem.get(u_id)
    if (
      memData &&
      memData.process &&
      memData.process.name === 'reservation-cancel' &&
      memData.process.step === 1 &&
      memData.process.reservationId
    ) {
      const cancelFlag = await this.checkCancelReservation(u_id)
      if (!cancelFlag) return

      // キャンセル可能な場合
      // memcache step update
      memData.process.step = 2
      mem.save(u_id, memData)

      // push message
      const ct = new CommonTemplate()
      const template = ct.confirm({
        title: '予約キャンセル',
        desc: '予約をキャンセルします。よろしいですか？',
      })

      const msgObj: {
        type: 'flex'
        altText: string
        contents: any
      } = {
        type: 'flex',
        altText: '予約キャンセル確認',
        contents: template,
      }

      const bot = new Bot()
      return await bot.pushFlexMessage({
        userId: u_id,
        message: msgObj,
      })
    } else {
      return await common.pushErrorMessage(u_id)
    }
  }

  public async execCancel(u_id: string, memData: any) {
    const mem = new Memcache()
    await mem.del(u_id)
    const axios = new Axios()

    // キャンセル可能か判定
    const cancelFlag = await this.checkCancelReservation(u_id)

    if (!cancelFlag) return

    const deleted = await axios.cancelReservation(memData.process.reservationId)

    // 成功status以外はエラーメッセージ
    if (deleted.status !== 200) return common.pushErrorMessage(u_id)

    // 成功statusの場合は完了メッセージ
    const msgObj: {
      type: 'text'
      text: string
    } = {
      type: 'text',
      text: '予約のキャンセルが完了しました。',
    }
    const bot = new Bot()
    await bot.pushTextMessage({
      userId: u_id,
      message: msgObj,
    })

    return deleted
  }

  public async checkCancelReservation(u_id: string) {
    const axios = new Axios()
    let flag: boolean = true

    // 予約がキャンセル可能な日か確認
    const lineUser = await axios.getLineUser({ u_id, withReservations: 1, isFuture: 1 })
    const rsvdt =
      lineUser.detail && lineUser.detail.reservation.length
        ? lineUser.detail.reservation[0].start_time
        : null

    if (!rsvdt) {
      const msgObj = { message: '予約がありません。' }
      common.pushErrorMessage(u_id, msgObj, false)
      flag = false
    }

    // 予約日が３日以内の場合
    const canBeCanceled = this.checkCanBeCanceled(rsvdt)
    if (!canBeCanceled) {
      const msgObj = { message: '予約日が４日以内のためキャンセルできません。' }
      common.pushErrorMessage(u_id, msgObj, false)
      flag = false
    }
    return flag
  }

  public checkCanBeCanceled(date: string) {
    const today = DateTime.now().toFormat('yyyy-MM-dd')
    const limit = DateTime.fromISO(date).minus({ days: 4 }).toFormat('yyyy-MM-dd')
    return Boolean(today <= limit)
  }
}
