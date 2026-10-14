import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

const session: any = (await import('express-session')).default;
import env from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { default as authRouter } from './routes/authRoutes.js';
import { default as profileRouter } from './routes/profileRoutes.js';
import { default as careerGoalRouter } from './routes/careerGoalRoutes.js';
import { default as assessmentRouter } from './routes/assessmentRoutes.js';
import { default as roadmapRouter } from './routes/roadmapRoutes.js';
import { default as resumeRouter } from './routes/resumeRoutes.js';
import { default as jobAnalysisRouter } from './routes/jobAnalysisRoutes.js';
import { default as interviewRouter } from './routes/interviewRoutes.js';
import { default as analyticsRouter } from './routes/analyticsRoutes.js';
import { default as adminRouter } from './routes/adminRoutes.js';

export const app = express();

app.disable('x-powered-by');
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: env.MONGODB_URI,
      collectionName: 'sessions',
      ttl: 60 * 60 * 24,
    }),
    cookie: {
      httpOnly: true,
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

app.use('/api/auth', authLimiter);
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/career-goals', careerGoalRouter);
app.use('/api/assessments', assessmentRouter);
app.use('/api/roadmaps', roadmapRouter);
app.use('/api/resumes', resumeRouter);
app.use('/api/job-analysis', jobAnalysisRouter);
app.use('/api/interviews', interviewRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);

app.use(errorHandler);
