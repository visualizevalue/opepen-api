import { Socket } from 'socket.io'
import Opepen from 'App/Models/Opepen'
import WORDS from 'App/Helpers/bip-39-wordlist'

const Set26Controller = async (socket: Socket) => {
  const { id } = socket.handshake.query
  console.log('New connection', socket.handshake.query)

  const opepen = await Opepen.findOrFail(id)

  // Only allow updates on opepen that are part of set 26
  if (opepen.setId !== 26) return

  socket.emit(`opepen:load:${id}`, { words: opepen.data.setConfig || [] })

  socket.on(`opepen:update:${id}`, async (data) => {
    const words = data.words.filter(word => WORDS.includes(word))

    opepen.data.setConfig = words
    await opepen.save()

    console.log(`Opepen #${opepen.tokenId} updated`, words)

    const cast = socket.broadcast.emit(`opepen:updated:${id}`, { words })
    const cast2 = socket.emit(`opepen:updated:${id}`, { words })

    console.log(`Update broadcast`, cast, cast2)
  })
}

export default Set26Controller
