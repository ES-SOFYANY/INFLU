import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),

  AWS_REGION: Joi.string().default('eu-west-3'),
  AWS_ACCESS_KEY_ID: Joi.string().default('local'),
  AWS_SECRET_ACCESS_KEY: Joi.string().default('local'),
  DYNAMODB_ENDPOINT: Joi.string().uri().optional().allow(''),

  DYNAMODB_TABLE_MAIN: Joi.string().default('influ_main'),
  DYNAMODB_TABLE_AUDIT: Joi.string().default('influ_audit'),
  DYNAMODB_TABLE_SESSIONS: Joi.string().default('influ_sessions'),

  JWT_SECRET: Joi.string().min(16).default('dev-secret-change-me-please-32b'),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),

  GOOGLE_OAUTH_CLIENT_ID: Joi.string().optional().allow(''),
  GOOGLE_OAUTH_CLIENT_SECRET: Joi.string().optional().allow(''),
  GOOGLE_OAUTH_REDIRECT_URI: Joi.string().optional().allow(''),

  AI_PROVIDER: Joi.string().valid('mock', 'openai', 'anthropic', 'bedrock').default('mock'),
  AI_API_KEY: Joi.string().optional().allow(''),

  SOCIAL_PROVIDER: Joi.string().valid('mock', 'real').default('mock'),

  S3_ENDPOINT: Joi.string().optional().allow(''),
  S3_BUCKET_DOCUMENTS: Joi.string().default('influ-documents-local'),
  S3_BUCKET_REPORTS: Joi.string().default('influ-reports-local'),

  EMAIL_PROVIDER: Joi.string().valid('mock', 'ses').default('mock'),
  EMAIL_FROM: Joi.string().default('noreply@influ.ai'),

  DEFAULT_LOCALE: Joi.string().valid('fr', 'en', 'ar').default('fr'),
});
