import { Wallet } from 'ethers'
import { Socket } from 'socket.io'
import Ws from 'App/Services/Ws'
import Opepen from 'App/Models/Opepen'
import WORDS from 'App/Helpers/bip-39-wordlist'

export const LETTER_COUNTS_PER_EDITION = {
  1: 4,
  4: 9,
  5: 16,
  10: 25,
  20: 36,
  40: 49,
}

const Set26Controller = async (socket: Socket) => {
  const { id } = socket.handshake.query

  const opepen = await Opepen.findOrFail(id)
  const letterCount: number = LETTER_COUNTS_PER_EDITION[opepen.data.edition]

  // Only allow updates on opepen that are part of set 26
  if (opepen.setId !== 26) return

  const roomId = `opepen-${opepen.tokenId}`
  await socket.join(roomId)

  // Get the size of the room
  const getRoomSize = async () => (await Ws.io.of('sets/026').in(roomId).fetchSockets())?.length

  // Getter for the set config
  const getSetConfig = () => {
    if (! opepen.data.setConfig) {
      opepen.data.setConfig = {
        words: [],
        history: [],
        counts: {
          total: 0,
          valid: 0,
          seeds: 0,
          clients: 0,
        },
      }
    }

    return opepen.data.setConfig
  }

  // Get the public set config
  const publicSetConfig = async () => {
    const config = getSetConfig()

    config.counts.clients = await getRoomSize()

    return {
      words: config.words || [],
      counts: config.counts,
    }
  }

  const emitUpdate = async () => {
    const update = await publicSetConfig()

    // To our client
    socket.emit(`opepen:updated:${id}`, update)

    // To all other clients
    socket.broadcast.emit(`opepen:updated:${id}`, update)
  }

  // Initial load
  socket.emit(`opepen:load:${id}`, await publicSetConfig())

  // On clear
  socket.on(`opepen:clear:${id}`, async () => {
    const config = getSetConfig()

    // Clear our words
    config.words = []

    opepen.data.setConfig = config
    await opepen.save()

    // Publish to connected clients
    await emitUpdate()
  })

  // On new word
  socket.on(`opepen:word:${id}`, async (word) => {
    const config = getSetConfig()

    if (! word) return

    // Invalidate word
    if (word.length > letterCount) {
      word += '_'
    }

    // Add to history
    config.history.unshift(word)

    // Increment total words
    config.counts.total ++

    // If valid
    if (WORDS.includes(word)) {
      // Increment valid words
      config.counts.valid ++

      // Add to word list
      config.words.unshift(word)

      // trunk word list
      if (config.words.length >= 24) {
        config.words = config.words.slice(0, 24)
      }
    }

    // Increment valid seeds
    if (config.history?.length >= 12) {
      const mnemonic = config.history.slice(0, 12).join(' ')

      try {
        Wallet.fromMnemonic(mnemonic)

        config.counts.seeds ++
      } catch (e) {
        // Invalid seed
      }
    }

    // Commit changes
    opepen.data.setConfig = config
    await opepen.save()

    // Publish to connected clients
    await emitUpdate()
  })
}

export default Set26Controller
