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

// AI Opepens
Route.group(() => {
  // Journeys
  Route.get('/accounts/:id/journeys',   'JourneysController.forAccount')
  Route.get('/journeys/:id',            'JourneysController.show')
  Route.post('/journeys',               'JourneysController.store')
  Route.put('/journeys/:id',            'JourneysController.update')

  // Steps
  Route.get('/journeys/:id/steps',      'JourneyStepsController.forJourney')
  Route.post('/journeys/:id/steps',     'JourneyStepsController.store')
  Route.post('/steps/:id/dream',        'JourneyStepsController.dream')

  // Images
  Route.get('/ai-images/:id',           'AiImagesController.show')
  Route.post('/ai-images/:id/reseed',   'AiImagesController.reseed')
  Route.post('/ai-images/:id/upscale',  'AiImagesController.upscale')
  Route.delete('/ai-images/:id',        'AiImagesController.delete')

  // Misc
  Route.post('/dream', 'DreamController')
  Route.post('/svg-test', 'SVG2PNGController')
}).prefix('/v1/ai')

// Reveals
Route.group(() => {
  Route.get('/:reveal/:account',           'RevealsController.forAccount')
}).prefix('/v1/reveals')
