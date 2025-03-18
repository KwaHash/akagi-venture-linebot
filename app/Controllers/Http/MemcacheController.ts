import Memcached, { Metadata } from 'memcached-client'

const client = new Memcached(`${process.env.MEMCACHED_HOST}`, Number(process.env.MEMCACHED_PORT))

export default class Mem {
  /**
   * memcachedからuidに該当するデータを取得
   */
  public async get(uid: string) {
    const connection = await client.connect()
    try {
      const data: { [key: string]: Metadata } = await connection.get(uid)
      // 登録時にstring変換しているため返却時にvalueをパース
      const result: any = JSON.parse(data[uid].value)
      await connection.close()
      return result
    } catch (e) {
      return null
    }
  }

  /**
   * memcachedへuidをキーにデータを格納
   */
  public async save(uid: string, data: any) {
    const connection = await client.connect()
    try {
      // dataはstring型で登録
      const res = await connection.set(uid, JSON.stringify(data), false, 0)
      await connection.close()
      return res
    } catch (error) {
      await connection.close()
      return {
        status: 500,
        message: 'memcache set failed',
      }
    }
  }

  /**
   * 特定uidのデータをmemcachedから削除
   */
  public async del(uid: string) {
    const connection = await client.connect()
    try {
      const res = await connection.delete(uid)
      await connection.close()
      return res
    } catch (error) {
      await connection.close()
      return {
        status: 500,
        message: 'memcache delete failed',
      }
    }
  }
}
