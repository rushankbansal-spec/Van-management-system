import dotenv from 'dotenv';
import path from 'path';

// Set up .env path relative to project root
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const getEnv = (key: string, defaultVal: string = ''): string => {
  return process.env[key] || defaultVal;
};

export const config = {
  port: parseInt(getEnv('PORT', '5000'), 10),
  nodeEnv: getEnv('NODE_ENV', 'development'),

  db: {
    uri: getEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/portfolio'),
  },

  jwt: {
    secret: getEnv('JWT_SECRET', 'change-me-in-production'),
    expiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
  },

  admin: {
    email: getEnv('ADMIN_EMAIL', ''),
    password: getEnv('ADMIN_PASSWORD', ''),
  },

  frontendUrl: getEnv('FRONTEND_URL', 'http://localhost:5173'),

  github: {
    token: getEnv('GITHUB_TOKEN', ''),
    cacheMinutes: parseInt(getEnv('GITHUB_CACHE_MINUTES', '30'), 10),
  },

  upload: {
    provider: getEnv('UPLOAD_PROVIDER', 'local'),
    local: {
      uploadsDir: path.resolve(__dirname, '..', '..', 'uploads'),
    },
    cloudinary: {
      cloudName: getEnv('CLOUDINARY_CLOUD_NAME', ''),
      apiKey: getEnv('CLOUDINARY_API_KEY', ''),
      apiSecret: getEnv('CLOUDINARY_API_SECRET', ''),
    },
  },

  email: {
    provider: getEnv('EMAIL_PROVIDER', 'none'),
    smtp: {
      host: getEnv('SMTP_HOST', 'smtp.ethereal.email'),
      port: parseInt(getEnv('SMTP_PORT', '587'), 10),
      secure: getEnv('SMTP_SECURE', 'false') === 'true',
      user: getEnv('SMTP_USER', ''),
      pass: getEnv('SMTP_PASS', ''),
    },
    from: getEnv('EMAIL_FROM', 'Portfolio <noreply@example.com>'),
    notifyTo: getEnv('EMAIL_NOTIFY_TO', ''),
  },
};

export default config;
