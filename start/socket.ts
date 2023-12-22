import Ws from 'App/Services/Ws'
import Set26Controller from 'App/Controllers/Websockets/Set26Controller'

// Boots the service
Ws.boot()

/**
 * Listen for incoming socket connections
 */
Ws.namespaces['sets/026'].on('connection', Set26Controller)
