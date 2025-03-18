const btnColor = '#F1CB00'

export default class CommonTemplate {
  public confirm(data: { title: string; desc: string; contents?: any }) {
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
            text: data.title,
            weight: 'bold',
          },
          {
            type: 'text',
            text: data.desc,
            wrap: true,
            size: 'xs',
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
                    text: 'はい',
                    color: '#ffffff',
                    weight: 'bold',
                    align: 'center',
                    action: {
                      type: 'message',
                      text: 'はい',
                    },
                  },
                ],
                action: {
                  type: 'message',
                  text: 'はい',
                },
                paddingAll: 'lg',
                cornerRadius: 'sm',
                backgroundColor: btnColor,
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'いいえ',
                    color: btnColor,
                    align: 'center',
                    weight: 'bold',
                    action: {
                      type: 'message',
                      text: 'いいえ',
                    },
                  },
                ],
                action: {
                  type: 'message',
                  text: 'いいえ',
                },
                paddingAll: 'lg',
                cornerRadius: 'sm',
                borderColor: btnColor,
                borderWidth: 'normal',
                margin: 'md',
              },
            ],
            margin: 'lg',
          },
        ],
      },
    }
    if (data.contents) template.body.contents.splice(2, 0, data.contents)
    return template
  }

  public submit(data: { title: string; desc: string; contents?: any }) {
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
            text: data.title,
            weight: 'bold',
          },
          {
            type: 'text',
            text: data.desc,
            wrap: true,
            size: 'xs',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'はい',
                    color: '#ffffff',
                    weight: 'bold',
                    align: 'center',
                    action: {
                      type: 'message',
                      text: 'はい',
                    },
                  },
                ],
                action: {
                  type: 'message',
                  text: 'はい',
                },
                paddingAll: 'xl',
                cornerRadius: 'sm',
                backgroundColor: btnColor,
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'いいえ',
                    size: 'xs',
                    align: 'center',
                    decoration: 'underline',
                    action: {
                      type: 'message',
                      text: 'いいえ',
                    },
                  },
                ],
                action: {
                  type: 'message',
                  text: 'いいえ',
                },
                margin: 'md',
              },
            ],
            margin: 'lg',
          },
        ],
      },
    }
    if (data.contents) template.body.contents.splice(2, 0, data.contents)
    return template
  }

  public genList(data: Array<{ label: string; value: string }>) {
    const contents: any = []
    data.forEach((item) => {
      const labelObj: {
        text: string
        type: string
        size: string
        weight: string
        margin?: string
      } = {
        text: item.label,
        type: 'text',
        size: 'xxs',
        weight: 'bold',
      }
      const valueObj: {
        type: string
        text: string
        size: string
        margin: string
        wrap: boolean
      } = {
        text: item.value,
        type: 'text',
        size: 'sm',
        margin: 'sm',
        wrap: true,
      }
      if (contents.length) {
        contents.push({
          type: 'separator',
          color: '#aaaaaa',
          margin: 'lg',
        })
        labelObj.margin = 'lg'
      }
      if (valueObj.text) {
        contents.push(labelObj)
        contents.push(valueObj)
      }
    })

    const obj = {
      type: 'box',
      layout: 'vertical',
      contents,
      backgroundColor: '#eeeeee',
      cornerRadius: 'sm',
      paddingAll: 'lg',
      margin: 'xl',
    }

    return obj
  }
}
