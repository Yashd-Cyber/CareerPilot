import dotenv from 'dotenv';

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 5000),
  MONGODB_URI: process.env.MONGODB_URI ?? '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  SESSION_SECRET: process.env.SESSION_SECRET ?? 'development-session-secret',
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:5173',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? 'admin@careerpilot.local',
  ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD ?? 'ChangeMe123!',
};

export const isGeminiConfigured = Boolean(env.GEMINI_API_KEY && env.GEMINI_MODEL);
export const requireServerEnv = () => {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required. Set it in server/.env or your environment.');
  }

  if (!env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is required.');
  }

  if (!env.CLIENT_URL) {
    throw new Error('CLIENT_URL is required.');
  }
};

export default env;
