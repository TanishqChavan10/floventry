import * as Joi from 'joi';

/**
 * Environment Variables Validation Schema using Joi
 * This schema validates all required and optional environment variables
 */
export const envValidationSchema = Joi.object({
  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database Configuration
  DATABASE_URL: Joi.string()
    .required()
    .description('PostgreSQL database connection URL'),

  // JWT Configuration
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT secret key (minimum 32 characters)'),

  // Clerk Configuration
  CLERK_SECRET_KEY: Joi.string()
    .required()
    .description('Clerk secret key for backend verification'),

  CLERK_PUBLISHABLE_KEY: Joi.string()
    .required()
    .description('Clerk publishable key'),

  // GraphQL Configuration
  GRAPHQL_PLAYGROUND: Joi.boolean()
    .default(false)
    .description('Enable GraphQL playground'),

  // Database Synchronization (should be false in production)
  DB_SYNCHRONIZE: Joi.boolean()
    .default(false)
    .description('Synchronize database schema (dangerous in production)'),

  // Port Configuration
  PORT: Joi.number().default(3000).description('Application port'),

  // CORS Configuration
  CORS_ORIGIN: Joi.string()
    .default('http://localhost:3000')
    .description('CORS allowed origin'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info')
    .description('Application log level'),

  // Redis Configuration
  REDIS_HOST: Joi.string()
    .default('localhost')
    .description('Redis server host'),

  REDIS_PORT: Joi.number()
    .default(6379)
    .description('Redis server port'),

  REDIS_PASSWORD: Joi.string()
    .optional()
    .description('Redis server password'),

  REDIS_DB: Joi.number()
    .default(0)
    .description('Redis database number'),

  REDIS_URL: Joi.string()
    .optional()
    .description('Complete Redis connection URL'),

  // AWS S3 Configuration
  AWS_ACCESS_KEY_ID: Joi.string()
    .required()
    .description('AWS access key ID'),

  AWS_SECRET_ACCESS_KEY: Joi.string()
    .required()
    .description('AWS secret access key'),

  AWS_REGION: Joi.string()
    .default('us-east-1')
    .description('AWS region'),

  S3_BUCKET_NAME: Joi.string()
    .required()
    .description('S3 bucket name'),
});

/**
 * Validate environment variables against the schema
 * @param env - The environment variables object
 * @returns Validation result
 */
export function validateEnvironment(env: Record<string, any>) {
  return envValidationSchema.validate(env, {
    allowUnknown: true, // Allow extra environment variables
    stripUnknown: false, // Don't remove unknown keys
  });
}
