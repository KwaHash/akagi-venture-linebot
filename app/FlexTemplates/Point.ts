const btnColor = '#F1CB00'
import { DateTime } from 'luxon'

export default class PointTemplate {
  /**
   * ポイント利用履歴確認テンプレート作成
   * shopsのデータが紐づけが必要
   */
  public genHistoryList(points: Array<any>) {
    const contents: Array<any> = []
    points.forEach((point) => {
      const requireData = {
        shop: point.shop
          ? point.shop.label
          : point.is_ec
          ? 'オンラインショップ'
          : 'LINE連携ポイント',
        point: point.amount,
        type:
          point.is_ec && point.type === 1
            ? '加算'
            : point.is_ec
            ? '減算'
            : point.type === 1
            ? '取得'
            : '利用',
        date: DateTime.fromISO(point.updated_at).toFormat('yyyy/MM/dd'),
      }
      const content = {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${requireData.date}【${requireData.shop}】`,
            size: 'xxs',
            weight: 'bold',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: requireData.type,
                    align: 'center',
                    color: ['取得', '加算'].includes(requireData.type) ? '#ffffff' : btnColor,
                    size: 'xs',
                    weight: 'bold',
                  },
                ],
                backgroundColor: ['取得', '加算'].includes(requireData.type) ? btnColor : '#ffffff',
                width: '50px',
                paddingAll: 'sm',
                cornerRadius: 'sm',
                borderColor: btnColor,
                borderWidth: 'normal',
              },
              {
                type: 'text',
                text: `${requireData.point}ポイント`,
                margin: 'lg',
              },
            ],
            alignItems: 'center',
            margin: 'md',
          },
        ],
        paddingAll: 'sm',
      }
      const separator = {
        type: 'separator',
        margin: 'md',
      }
      contents.push(separator)
      contents.push(content)
    })

    const template = {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'ポイント利用履歴',
                size: 'md',
                weight: 'bold',
              },
            ],
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: contents,
            cornerRadius: 'sm',
            paddingAll: 'none',
            margin: 'lg',
          },
        ],
      },
    }

    return template
  }

  public selectShop(shops: Array<{ name: string }>) {
    // shopsを並び替える

    const arrangedShops: Array<any> = []
    const order = ['tonton', 'hutte', 'bacon', 'zawazawa']
    order.forEach((name) => {
      arrangedShops.push(shops.find((shop) => shop.name === name))
    })
    // ２列にするため行数を算出
    const row = Math.round(arrangedShops.length / 2)

    const formatedShopList: Array<any> = []

    // 行数分forで回して一行ごとのオブジェクト生成→formatedShopListに格納
    for (let i = 0; i < row; i += 1) {
      const targetList: Array<any> = []

      const target = arrangedShops.slice(i * 2, (i + 1) * 2) // 対象の店舗

      const imageNames = {
        tonton: 'logo_tonton.png',
        hutte: 'logo_hutte.png',
        bacon: 'logo_bacon_2.png',
        zawazawa: 'logo_zawazawa.png',
      }

      // targetの店舗をforで回して店舗ごとのオブジェクト生成→targetListに格納
      target.forEach((t, j) => {
        targetList.push({
          type: 'box',
          layout: 'vertical',
          contents: [
            // 画像どこに置くか要検討
            {
              type: 'image',
              url: `https://akagi-venture.s3.ap-northeast-1.amazonaws.com/production/Logos/${imageNames[t.name]}`,
              size: 'full',
            },
          ],
          margin: j === 0 ? 'none' : 'md',
          cornerRadius: 'sm',
          borderWidth: 'light',
          borderColor: '#cecece',
          action: {
            type: 'message',
            label: 'action',
            text: t.label,
          },
        })
      })

      const targetRowObj = {
        type: 'box',
        layout: 'horizontal',
        contents: targetList,
        margin: i === 0 ? 'xl' : 'md',
      }

      formatedShopList.push(targetRowObj)
    }

    const content = {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '利用店舗選択',
            weight: 'bold',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'ポイントを利用する店舗を選択してください。',
                size: 'xs',
                wrap: true,
              },
            ],
            margin: 'md',
          },
          ...formatedShopList,
        ],
      },
    }

    return content
  }

  public complete(params: { name: string; shop: string; time: string; amount: number }) {
    const content = {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: `${params.name}がポイントを利用しました！`,
                size: 'xs',
                align: 'center',
                wrap: true,
              },
            ],
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: params.time,
                align: 'center',
                size: 'sm',
              },
              {
                type: 'text',
                text: String(params.amount),
                size: '3xl',
                weight: 'bold',
                align: 'center',
                margin: 'lg',
              },
              {
                type: 'text',
                text: params.shop,
                align: 'center',
                size: 'sm',
                margin: 'md',
              },
            ],
            margin: 'lg',
            backgroundColor: '#e2e2e2',
            cornerRadius: 'md',
            paddingAll: 'xl',
          },
        ],
      },
    }

    return content
  }
}
