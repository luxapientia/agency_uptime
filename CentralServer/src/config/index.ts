import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

interface Config {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  logLevel: string; 
  redis: {
    host: string;
    port: number;
    password: string;
  };
  root: {
    url: string;
  };
  telegram?: {
    botToken: string;
  };
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  root: {
    url: process.env.ROOT_URL || '',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  }
}; 