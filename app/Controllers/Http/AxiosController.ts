const axios = require('axios')
const baseURL = process.env.API_BASE
const Authorization = process.env.API_TOKEN

export default class Axios {
  private axiosBase() {
    return axios.create({
      headers: {
        Authorization,
      },
      baseURL,
      responseType: 'json',
    })
  }

  /** backendのマスターデータ取得 */
  public async getBackendMaster() {
    let result

    await this.axiosBase()({
      method: 'GET',
      url: '/v1/connection/master',
    })
      .then((response) => {
        result = response.data
      })
      .catch((error) => {
        console.log(error)
        result = {
          status: 500,
          message: 'failed to get backend master data',
          error,
        }
      })
    return result
  }

  /** lineUsersのレコード取得 */
  public async getLineUser(params: {
    u_id: string
    withPoints?: number
    withReservations?: number
    withCustomer?: number
    isFuture?: number
  }) {
    let result

    await this.axiosBase()({
      method: 'GET',
      url: '/v1/lineUser/get/detail',
      params,
    })
      .then((response) => {
        if (response.data.detail) {
          result = {
            status: 200,
            detail: response.data.detail,
          }
        } else {
          // 想定ではないはず
          result = {
            status: 404,
            message:
              'ユーザー登録が正常に完了していません。恐れ入りますが、再度友達登録を実行してください。',
          }
        }
      })
      .catch((error) => {
        console.log(error)
        result = {
          status: 500,
          message: 'failed to get point detail by activatekey',
          error,
        }
      })
    return result
  }

  /** ポイントレコード取得 */
  public async getPointDetail(params: { activatekey: string; flags?: Array<number> }) {
    let result

    await this.axiosBase()({
      method: 'GET',
      url: '/v1/point/get/detail',
      params,
    })
      .then((response) => {
        if (response.data.detail) result = { status: 200, detail: response.data.detail }
        else {
          result = {
            status: 404,
            message: '無効なIDです。恐れ入りますが再度やり直してください。',
          }
        }
        // todo: 期限内か確認
        // 切れている場合404返却
      })
      .catch((error) => {
        console.log(error)
        result = {
          status: 500,
          message: 'failed to get point detail by activatekey',
          error,
        }
      })

    return result
  }

  /** ポイントcreate */
  public async pointCreate(data: { flag: number; type: number; amount: number; shop_id: number }) {
    let result

    await this.axiosBase()({
      method: 'POST',
      url: '/v1/point/create',
      data,
    })
      .then((response) => {
        result = response
      })
      .catch((error) => {
        if (error.response) result = error.response.data
        else result = { status: 500, message: 'failed to create point' }
      })

    return result
  }

  /** ポイントupdate */
  public async pointUpdate(data: {
    id: number
    flag: number
    activatekey: null
    expire: null
    line_user_id: number
  }) {
    let result

    await this.axiosBase()({
      method: 'POST',
      url: '/v1/point/update',
      data,
    })
      .then((response) => {
        result = response.data
      })
      .catch((error) => {
        console.log(error)
        result = {
          status: 500,
          message: 'failed to update point',
          error,
        }
      })

    return result
  }

  /** 店舗一覧を取得 */
  public async getShopList() {
    let result
    await this.axiosBase()({
      method: 'GET',
      url: '/v1/shop/get/list',
    })
      .then((response) => {
        result = {
          status: 200,
          shops: response.data.list.data,
        }
      })
      .catch((error) => {
        console.log(error)
        result = {
          status: 500,
          message: 'failed to get shop list',
          error,
        }
      })
    return result
  }

  /** 予約キャンセル */
  public async cancelReservation(rId: number) {
    let result
    await this.axiosBase()({
      method: 'POST',
      url: '/v1/reservation/delete',
      data: { id: rId },
    })
      .then((response) => {
        result = response.data
      })
      .catch((error) => {
        console.log(error)
        result = {
          status: 500,
          message: 'failed to delete reserve',
          error,
        }
      })
    return result
  }

  public async link2ecUser(data: { email: string; u_id: string }) {
    let result
    await this.axiosBase()({
      method: 'POST',
      url: '/v1/ecUser/link2LineUser',
      data,
    })
      .then((response) => {
        result = response.data
      })
      .catch((error) => {
        result = {
          status: 500,
          message: 'lineUser link failed',
          error: error.data,
        }
      })
    return result
  }
}
