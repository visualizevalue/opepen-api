/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

// Welcome
Route.get('/', () => ({ hello: 'opepen' }))

// Auth
Route.group(() => {
  Route.get('/nonce',   'AuthController.nonce')

  Route.post('/verify', 'AuthController.verify')
  Route.get('/me',      'AuthController.me')

  Route.get('/clear',   'AuthController.clear')
  Route.post('/clear',  'AuthController.clear')
}).prefix('/v1/auth')

// AI
Route.group(() => {
  // Journeys
  Route.get('/accounts/:id/journeys',   'JourneysController.forAccount')
  Route.get('/journeys/:id',            'JourneysController.show')

  // Steps
  Route.get('/journeys/:id/steps',      'JourneyStepsController.forJourney')

  // AI Images
  Route.get('/ai-images/:id',           'AiImagesController.show')

  Route.group(() => {
    // Journeys
    Route.post('/journeys',               'JourneysController.store')
    Route.put('/journeys/:id',            'JourneysController.update')

    // Steps
    Route.post('/journeys/:id/steps',     'JourneyStepsController.store')
    Route.post('/steps/:id/dream',        'JourneyStepsController.dream')

    // AI Images
    Route.post('/ai-images/:id/reseed',   'AiImagesController.reseed')
    Route.post('/ai-images/:id/upscale',  'AiImagesController.upscale')
    Route.delete('/ai-images/:id',        'AiImagesController.delete')

    // Misc
    Route.post('/dream',                  'DreamController')
    Route.post('/svg-test',               'SVG2PNGController')
  }).middleware(['auth'])
}).prefix('/v1/ai')

// Opepen
Route.group(() => {
  // Images
  Route.get('/images/featured',         'ImagesController.featured')
  Route.post('/images',                 'ImagesController.store')
  Route.get('/images/:id',              'ImagesController.show')

  // Sets
  Route.get('/sets',                    'SetsController.list')
  Route.get('/sets/:id',                'SetsController.show')
  Route.get('/sets/:id/subscribers',    'SetsController.listSubscribers')
  Route.get('/sets/:id/submissions',    'SetsController.cleanedSubmissions')
  Route.post('/sets/:id/subscribe',     'SetsController.subscribe')
  Route.get('/sets/:id/opepen',         'SetsController.opepen')
  Route.get('/sets/:id/stats/listings', 'SetStatsController.listings')

  // Opepen
  Route.get('/',                        'OpepenController.list')
  Route.get('/:id',                     'OpepenController.show')
  Route.post('/:id/image',              'OpepenController.updateImage')
  Route.get('/:id/events',              'EventsController.forToken')
}).prefix('/v1/opepen')

// Set Submissions
Route.group(() => {
  Route.get('/',                    'SetSubmissionsController.list').middleware(['admin'])
  Route.post('/',                   'SetSubmissionsController.create')
  Route.get('/:id',                 'SetSubmissionsController.show')
  Route.post('/:id',                'SetSubmissionsController.update')
  Route.delete('/:id',              'SetSubmissionsController.delete')

  Route.post('/:id/sign',           'SetSubmissionsController.sign')

  Route.post('/:id/star',           'SetSubmissionsController.star').middleware(['admin'])
  Route.post('/:id/publish',        'SetSubmissionsController.publish').middleware(['admin'])
  Route.post('/:id/notify',         'SetSubmissionsController.notifyPublication').middleware(['admin'])
}).prefix('/v1/set-submissions').middleware(['auth'])

// Account Settings
Route.group(() => {
  Route.group(() => {
    Route.get('/',        'AccountSettingsController.show')
    Route.post('/',       'AccountSettingsController.update')
  }).middleware(['auth'])

  Route.get('/:account/verify-email', 'AccountSettingsController.verifyEmail')
    .as('verifyEmail')
  Route.get('/:account/unsubscribe/:type', 'AccountSettingsController.unsubscribeNotification')
    .as('unsubscribeNotification')
}).prefix('/v1/accounts/settings')

// Accounts
Route.group(() => {
  Route.get('/:id',                     'AccountsController.show')
  Route.put('/:id',                     'AccountsController.update')
  Route.get('/:id/opepen',              'OpepenController.forAccount')

  Route.post('/:id/mail/test',          'AccountsController.testMail').middleware(['admin'])
  Route.post('/:id/mail/new-set/:set',  'AccountsController.setNotification').middleware(['admin'])

  Route.get('/:account/sets/:id',       'SetsController.subscriptionForAccount')

  Route.get('/:account/set-submissions', 'SetSubmissionsController.forAccount').middleware(['auth'])
}).prefix('/v1/accounts')

// Reveals
Route.group(() => {
  Route.get('/:reveal/:account',        'RevealsController.forAccount')
}).prefix('/v1/reveals')

// Rich Content Cards
Route.group(() => {
  Route.post('/', 'RichContentLinksController.createOrUpdate').middleware(['auth'])
  Route.delete('/:id', 'RichContentLinksController.destroy').middleware(['auth'])
}).prefix('/v1/rich-links')

// FC Frames
Route.group(() => {
  // Sets
  Route.get('/sets',             'FarcasterFrameSetsController.setsEntry')
  Route.post('/sets',            'FarcasterFrameSetsController.sets')
  Route.post('/sets/:id',        'FarcasterFrameSetsController.set')
  Route.get('/image/sets/:id',   'FarcasterFrameSetsController.image')
  Route.post('/image/sets/:id',   'FarcasterFrameSetsController.image')

  // Opepen Voting Game
  Route.get('/ranks',            'FarcasterFrameOpepenRanksController.entry')
  Route.post('/ranks/vote',      'FarcasterFrameOpepenRanksController.vote')
  Route.get('/image/ranks/vote', 'FarcasterFrameOpepenRanksController.image')

}).prefix('/v1/frames')
