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

Route.get('/v1/stats', 'StatsController.show')

// General metadata
Route.group(() => {
  Route.get('/opepen.json', 'OpepenMetadataController.contractMetadata')
  Route.get('/base.png', 'OpepenMetadataController.baseImage')

  // Token specific metadata
  Route.get('/:id/metadata.json', 'OpepenMetadataController.metadata')
  Route.get('/:id/image-uri', 'OpepenMetadataController.imageURI')
  Route.get('/:id/image', 'OpepenMetadataController.image')
  Route.get('/:id/render', 'OpepenMetadataController.render')
})

// Auth
Route.group(() => {
  Route.get('/nonce',   'AuthController.nonce')

  Route.post('/verify', 'AuthController.verify')
  Route.get('/me',      'AuthController.me')

  Route.get('/clear',   'AuthController.clear')
  Route.post('/clear',  'AuthController.clear')
}).prefix('/v1/auth')

// Social Auth
Route.group(() => {
  Route.get('/connect/twitter',   'TwitterAuthController.getUrl')
  Route.get('/twitter',           'TwitterAuthController.callback')
}).prefix('/oauth').middleware(['auth'])

// Opepen
Route.group(() => {
  // Images
  Route.get('/images/featured',         'ImagesController.featured')
  Route.post('/images',                 'ImagesController.store')
  Route.get('/images/:id',              'ImagesController.show')
  Route.get('/images/:id/render',       'ImagesController.render')

  // Sets
  Route.get('/sets',                    'SetsController.list')
  Route.get('/sets/:id',                'SetsController.show')
  Route.get('/sets/:id/opepen',         'SetsController.opepen')
  Route.get('/sets/:id/stats/listings', 'SetStatsController.listings')

  // Opepen
  Route.get('/',                        'OpepenController.list')
  Route.get('/:id',                     'OpepenController.show')
  Route.post('/:id/image',              'OpepenController.updateImage')
  Route.get('/:id/events',              'EventsController.forToken')
  Route.get('/summary/:date',           'OpepenController.summary')
}).prefix('/v1/opepen')

// Set Submissions
Route.group(() => {
  Route.get('/',                    'SetSubmissionsController.list')
  Route.get('/history',             'SetSubscriptionsController.globalHistory')
  Route.get('/:id',                 'SetSubmissionsController.show')
  Route.get('/:id/curation-stats',  'SetSubmissionsController.curationStats')

  Route.group(() => {
    Route.post('/',                   'SetSubmissionsController.create')
    Route.post('/:id',                'SetSubmissionsController.update')
    Route.post('/:id/dynamic-images', 'SetSubmissionsController.updateDynamicSetImages')
    Route.delete('/:id',              'SetSubmissionsController.delete')

    Route.post('/:id/sign',           'SetSubmissionsController.sign')
    Route.post('/:id/publish',        'SetSubmissionsController.publish')
    Route.post('/:id/unpublish',      'SetSubmissionsController.unpublish')
    Route.post('/:id/approve',        'SetSubmissionsController.approve').middleware(['admin'])
    Route.post('/:id/unapprove',      'SetSubmissionsController.unapprove').middleware(['admin'])
    Route.post('/:id/star',           'SetSubmissionsController.star').middleware(['admin'])

  }).middleware(['auth'])

  Route.post('/:id/subscribe',      'SetSubscriptionsController.subscribe')
  Route.get('/:id/subscribers',     'SetSubscriptionsController.listSubscribers')
  Route.get('/:id/history',         'SetSubscriptionsController.history')
}).prefix('/v1/set-submissions')

// Posts
Route.group(() => {
  Route.get('/',                 'PostsController.list')
  Route.post('/',                'PostsController.create').middleware(['auth'])
  Route.get('/:id',              'PostsController.show')
  Route.post('/:id/approve',     'PostsController.approve').middleware(['admin'])
  Route.post('/:id/unapprove',   'PostsController.unapprove').middleware(['admin'])
  Route.delete('/:id',           'PostsController.destroy').middleware(['auth'])
}).prefix('/v1/posts')

// Casts
Route.group(() => {
  Route.post('/:id/approve',     'CastsController.approve').middleware(['admin'])
  Route.delete('/:id',           'CastsController.destroy').middleware(['auth'])
}).prefix('/v1/casts')

// Timeline
Route.group(() => {
  Route.get('/',                 'TimelineController.list')
}).prefix('/v1/timeline')

// External URLs
Route.group(() => {
  Route.get('/',              'OpenGraphController.show')
}).prefix('/v1/open-graph-data')

// Accounts
Route.group(() => {
  // Account Settings
  Route.group(() => {
    Route.group(() => {
      Route.get('/',        'AccountSettingsController.showMe')
      Route.post('/',       'AccountSettingsController.updateMe')
    }).middleware(['auth'])

    Route.group(() => {
      Route.get('/:account',        'AccountSettingsController.show')
      Route.post('/:account',       'AccountSettingsController.update')

      Route.post('/:account/send-verify-email', 'AccountSettingsController.sendVerifyEmail')
    }).middleware(['admin'])

    Route.get('/:account/verify-email', 'AccountSettingsController.verifyEmail')
      .as('verifyEmail')
    Route.get('/:account/unsubscribe/:type', 'AccountSettingsController.unsubscribeNotification')
      .as('unsubscribeNotification')
  }).prefix('/settings')

  Route.get('/artists',                 'AccountsController.artists')
  Route.get('/curators',                'AccountsController.curators')
  Route.get('/fid/:fid',                  'AccountsController.byFid')
  Route.get('/:id',                     'AccountsController.show')
  Route.put('/:id',                     'AccountsController.update')
  Route.get('/:id/opepen',              'OpepenController.forAccount')
  Route.get('/:id/opepen/grid.png',     'OpepenController.gridForAccount')

  Route.post('/:id/mail/test',          'AccountsController.testMail').middleware(['admin'])

  Route.get('/:account/set-submissions', 'SetSubmissionsController.forAccount').middleware(['auth'])
  Route.get('/:account/set-submissions/:id/subscription', 'SetSubscriptionsController.forAccount')
}).prefix('/v1/accounts')

// Rich Content Cards
Route.group(() => {
  Route.post('/',      'RichContentLinksController.createOrUpdate')
  Route.delete('/:id', 'RichContentLinksController.destroy')
}).prefix('/v1/rich-links').middleware(['auth'])

// Auctions
Route.group(() => {
  Route.get('/',       'AuctionsController.list')
  Route.get('/:id',    'AuctionsController.show')
}).prefix('/v1/auctions')

// Notifications
Route.group(() => {
  Route.post('/general', 'NotificationsController.general').middleware(['admin'])
}).prefix('/v1/notifications')

// FC Frames
Route.group(() => {
  // Account profiles
  Route.route('/accounts/:id',          ['GET', 'POST'], 'FarcasterFrameAccountsController.account')

  // Sets
  Route.get('/sets',             'FarcasterFrameSetsController.setsEntry')
  Route.post('/sets',            'FarcasterFrameSetsController.sets')
  Route.post('/sets/:id',        'FarcasterFrameSetsController.set')

  // Set Detail
  Route.route('/sets/:id/detail',                ['GET', 'POST'], 'FarcasterFrameSetController.set')
  Route.post('/sets/:id/detail/:edition',                         'FarcasterFrameSetController.edition')
  Route.route('/sets/:id/opt-in/image',          ['GET', 'POST'], 'FarcasterFrameSetController.optInImage')

  // Opepen Voting Game
  Route.get('/ranks',            'FarcasterFrameOpepenRanksController.entry')
  Route.post('/ranks/vote',      'FarcasterFrameOpepenRanksController.vote')
  Route.get('/image/ranks/vote', 'FarcasterFrameOpepenRanksController.image')

  // Opepen merch
  Route.get('/merch',                                             'FarcasterFrameMerchController.product')
  Route.route('/merch/confirmation',             ['GET', 'POST'], 'FarcasterFrameMerchController.confirmation')
  Route.route('/merch/confirmation/image',       ['GET', 'POST'], 'FarcasterFrameMerchController.confirmationImage')
  Route.route('/merch/:id',                      ['GET', 'POST'], 'FarcasterFrameMerchController.product')
  Route.route('/merch/:id/variants',             ['GET', 'POST'], 'FarcasterFrameMerchController.variants')
  Route.route('/merch/:id/image',                ['GET', 'POST'], 'FarcasterFrameMerchController.image')
}).prefix('/v1/frames')

// OpenGraph
Route.group(() => {
  Route.get('/accounts/:id/image',                                 'FarcasterFrameAccountsController.image')

  Route.route('/sets/:id/og',                ['GET', 'POST'],      'FarcasterFrameSetsController.image')
  Route.route('/sets/:id/square',            ['GET', 'POST'],      'FarcasterFrameSetController.entryImage')
  Route.route('/sets/:id/:edition/square',   ['GET', 'POST'],      'FarcasterFrameSetController.editionImage')
  Route.route('/sets/:id/opt-in-status',     ['GET', 'POST'],      'FarcasterFrameSetController.optInStatus')

  Route.route('/opepen/:id/og',              ['GET', 'POST'],      'OpepenController.og')
}).prefix('/v1/render')
