// const btnColor = '#F1CB00'

export default class ReservationTemplate {
  public reservationDetail(contents: any, canBeCancel: boolean) {
    const template: {
      type: string
      body: {
        type: string
        layout: string
        contents: Array<any>
      }
    } = {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '予約内容確認',
            weight: 'bold',
          },
          contents,
          {
            type: 'text',
            text: '予約をキャンセル',
            action: {
              type: 'message',
              text: '予約をキャンセルする',
            },
            size: 'xs',
            align: 'center',
            margin: 'lg',
            decoration: 'underline',
          },
          {
            type: 'text',
            text: '※予約のキャンセルは予約日の４日前までとなります。',
            size: 'xxs',
            align: 'center',
            margin: 'lg',
          },
        ],
      },
    }

    if (!canBeCancel) template.body.contents.splice(2, 1)

    return template
  }
}
