const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // OTP
  OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5,
  OTP_MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 3,

  // SMTP
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM: process.env.SMTP_FROM,

  // Admin Bootstrap
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin123@gmail.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin123-',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Admin',
};

// Validate required environment variables
const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const varName of requiredVars) {
  if (!env[varName]) {
    console.error(`ERROR: Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

module.exports = env;
