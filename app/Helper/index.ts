import MASTER from '../../data/master'
import { DateTime } from 'luxon'
import Env from '@ioc:Adonis/Core/Env'
// logはLoggerでなくpm2のログ出力に変更
// import Logger from '@ioc:Adonis/Core/Logger'

export default class Helper {
  /**
   * フロントへの返却関数
   * @param response レスポンス
   * @param result   返却するオブジェクト
   */
  public frontOutput(response, result) {
    const ENV: string | undefined = process.env.NODE_ENV
    if (!response) {
      return result
    } else {
      if (result.status === 200) {
        if (ENV !== 'production') console.log('[ front output success ]')
        response.send(result)
      } else {
        // それ以外は返却失敗
        if (ENV !== 'production') console.log('[ front output failed ]')
        console.log(`[ ${DateTime.local().toFormat('yyyy-LL-dd TT')} ]`)
        console.log(result)
        // フロント返却
        response.status(result.status).send(result)
      }
    }
    if (ENV !== 'production' || (ENV === 'production' && result.status !== 200)) {
      console.log('--------------------')
    }
  }

  /**
   * 環境変数のDB名から
   * 実行環境を返却
   */
  public getEnvironment() {
    const isLocal: boolean = Env.get('ENV_NAME') === 'localhost'
    const ENVIRONMENT = {
      name: isLocal ? 'local' : Env.get('ENV_NAME'),
      projectname: Env.get('PNAME'),
      // baseURL: isLocal
      //   ? `${request.protocol()}://${request.hostname()}:${process.env.FRONT_PORT}`
      //   : `${request.protocol()}://${request.host()}`,
    }
    return ENVIRONMENT
  }

  /**
   * バックエンド内部で使用するためのマスター返却
   */
  public master() {
    return MASTER
  }
}

module.exports = Helper
