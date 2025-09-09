/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  SMTP_HOST: Env.schema.string(),
  SMTP_PORT: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  DRIVE_DISK: Env.schema.string(),
  AWS_ACCESS_KEY_ID: Env.schema.string.optional(),
  AWS_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  AWS_REGION: Env.schema.string.optional(),
  S3_BUCKET: Env.schema.string.optional(),
  SPACES_KEY: Env.schema.string.optional(),
  SPACES_SECRET: Env.schema.string.optional(),
  SPACES_REGION: Env.schema.string.optional(),
  SPACES_BUCKET: Env.schema.string.optional(),
  SPACES_ENDPOINT: Env.schema.string.optional(),
  R2_KEY: Env.schema.string.optional(),
  R2_SECRET: Env.schema.string.optional(),
  R2_BUCKET: Env.schema.string.optional(),
  R2_ENDPOINT: Env.schema.string.optional(),
  GCS_KEY: Env.schema.string.optional(),
  GCS_BUCKET: Env.schema.string.optional(),

  FIRECRAWL_URL: Env.schema.string(),
  FIRECRAWL_API_KEY: Env.schema.string(),

  REDIS_HOST: Env.schema.string(),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for Foursquare
  |----------------------------------------------------------
  */
  FOURSQUARE_PLACES_API: Env.schema.string(),
  FOURSQUARE_API_VERSION: Env.schema.string(),
  FOURSQUARE_SERVICE_KEY: Env.schema.string(),
  FOURSQUARE_CLIENT_ID: Env.schema.string.optional(),
  FOURSQUARE_CLIENT_SECRET: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for OpenAI
  |----------------------------------------------------------
  */
  OPENAI_API_KEY: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for Descope Authentication
  |----------------------------------------------------------
  */
  DESCOPE_PROJECT_ID: Env.schema.string(),
  DESCOPE_BASE_URL: Env.schema.string.optional(),
})
