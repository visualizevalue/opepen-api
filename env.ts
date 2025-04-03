/*
|--------------------------------------------------------------------------
| Validating Environment Variables
|--------------------------------------------------------------------------
|
| In this file we define the rules for validating environment variables.
| By performing validation we ensure that your application is running in
| a stable environment with correct configuration values.
|
| This file is read automatically by the framework during the boot lifecycle
| and hence do not rename or move this file to a different location.
|
*/

import Env from '@ioc:Adonis/Core/Env'

export default Env.rules({
  HOST: Env.schema.string({ format: 'host' }),
  PORT: Env.schema.number(),
  APP_URL: Env.schema.string(),
  FRONTEND_URL: Env.schema.string(),
  APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string(),
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  SESSION_DRIVER: Env.schema.string(),
  CDN_URL: Env.schema.string(),
  DB_CONNECTION: Env.schema.string(),
  PG_HOST: Env.schema.string({ format: 'host' }),
  PG_PORT: Env.schema.number(),
  PG_USER: Env.schema.string(),
  PG_PASSWORD: Env.schema.string.optional(),
  PG_DB_NAME: Env.schema.string(),
  DRIVE_DISK: Env.schema.enum(['local', 's3'] as const),
  S3_KEY: Env.schema.string(),
  S3_SECRET: Env.schema.string(),
  S3_BUCKET: Env.schema.string(),
  S3_REGION: Env.schema.string(),
  S3_ENDPOINT: Env.schema.string.optional(),
  RPC_PROVIDER: Env.schema.string(),
  RESERVOIR_BASE: Env.schema.string(),
  RESERVOIR_KEY: Env.schema.string(),
  OPEPEN_ADDRESS: Env.schema.string(),
  OPEPEN_START_BLOCK: Env.schema.number(),
  BURNED_OPEPEN_ADDRESS: Env.schema.string(),
  BURNED_OPEPEN_START_BLOCK: Env.schema.number(),
  UPDATE_ENS: Env.schema.boolean(),
  IPFS_GATEWAY: Env.schema.string(),
  SMTP_HOST: Env.schema.string({ format: 'host' }),
  SMTP_PORT: Env.schema.number(),
  SMTP_USERNAME: Env.schema.string(),
  SMTP_PASSWORD: Env.schema.string(),
  CACHE_VIEWS: Env.schema.boolean(),
  OPENSEA_KEY: Env.schema.string(),
  OPENSEA_BASE: Env.schema.string(),
  FARCASTER_HUB: Env.schema.string(),
  FARCASTER_SIGNER: Env.schema.string(),
  SIGNATURE_API_BASE: Env.schema.string(),
  SEND_NOTIFICATIONS: Env.schema.boolean(),
  TWITTER_API_KEY: Env.schema.string(),
  TWITTER_API_SECRET: Env.schema.string(),
  TWITTER_BEARER: Env.schema.string(),
  TWITTER_CLIENT_ID: Env.schema.string(),
  TWITTER_CLIENT_SECRET: Env.schema.string(),
  TWITTER_ACCESS_TOKEN: Env.schema.string(),
  TWITTER_ACCESS_TOKEN_SECRET: Env.schema.string(),
  TWITTER_BOT_ACCOUNT_ADDRESS: Env.schema.string(),
  CHROMIUM_EXECUTABLE: Env.schema.string(),
})
