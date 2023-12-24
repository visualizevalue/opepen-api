import { Namespace, Server } from 'socket.io'
import AdonisServer from '@ioc:Adonis/Core/Server'

class Ws {
  private booted = false

  public io: Server
  public namespaces: { [key: string]: Namespace } = {}

  public boot() {
    // Ignore multiple calls to the boot method
    if (this.booted) {
      return
    }

    this.booted = true
    this.io = new Server(AdonisServer.instance!, {
      cors: {
        origin: '*',
        credentials: true,
      }
    })

    this.namespaces['sets/026'] = this.io.of('sets/026')
  }
}

export default new Ws()
