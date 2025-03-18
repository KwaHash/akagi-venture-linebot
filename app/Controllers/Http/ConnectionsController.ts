// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
// import Database from '@ioc:Adonis/Lucid/Database'

export default class ConnectionsController {
  public async database({ response }) {
    let result: { status: number; apiUsers?: object[] | BigInt; message: string }
    try {
      // const apiUsers = await Database.query().from('apiUsers')
      result = {
        status: 200,
        // apiUsers,
        message: 'database connected',
      }
    } catch (e) {
      result = {
        status: 500,
        message: e.message,
      }
    }
    // helper.frontOutput(response, result)
    return response.send(result)
  }
}
