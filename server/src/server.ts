import env, { requireServerEnv } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { app } from './app.js';

const startServer = async () => {
  try {
    requireServerEnv();
    await connectDatabase();
    app.listen(env.PORT, () => {
      console.log(`CareerPilot server listening on http://localhost:${env.PORT}`);
      if (!process.env.GEMINI_API_KEY) {
        console.warn('Gemini AI is not configured. AI-powered features will be disabled until GEMINI_API_KEY is set.');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
