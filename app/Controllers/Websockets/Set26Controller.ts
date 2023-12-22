import { Socket } from 'socket.io'
import Opepen from 'App/Models/Opepen'
import WORDS from 'App/Helpers/bip-39-wordlist'

const Set26Controller = async (socket: Socket) => {
  const { id } = socket.handshake.query

  const opepen = await Opepen.findOrFail(id)

  // Only allow updates on opepen that are part of set 26
  if (opepen.setId !== 26) return

  socket.emit('opepen:load', { words: opepen.data.setConfig || [] })

  socket.on('opepen:update', async (data) => {
    const words = data.words.filter(word => WORDS.includes(word))

    opepen.data.setConfig = words
    await opepen.save()

    socket.broadcast.emit('opepen:updated', { words })
  })
}

export default Set26Controller
