import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  // Server
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  // MongoDB
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/api_monitoring',
    dbName: process.env.MONGO_DB_NAME || 'api_monitoring',
  },

  // postgreSQL
  postgres: {
    connectionString: process.env.DATABASE_URL || '',
    ssl:
      process.env.PG_SSL === 'true' ||
      (process.env.NODE_ENV === 'production' && Boolean(process.env.DATABASE_URL)),
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    database: process.env.PG_DATABASE || 'api_monitoring',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
  },

  // RabbitMQ
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    queue: process.env.RABBITMQ_QUEUE || 'api_hits',
    publisherConfirms: process.env.RABBITMQ_PUBLISHER_CONFIRMS === 'true' || false,
    retryAttemps: parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY || '1000', 10),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || (!isProduction ? 'dev-only-change-me' : ''),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Rate Limit
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOWS_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    prefix: process.env.REDIS_PREFIX || 'api_sentinel:',
    defaultTtlSeconds: parseInt(process.env.REDIS_TTL_SECONDS || '3600', 10),
  },
};

export default config;
