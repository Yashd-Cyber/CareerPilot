import mongoose from 'mongoose';
import env from './env.js';

export const connectDatabase = async () => {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  mongoose.set('strictQuery', true);
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI);
};

export const closeDatabase = async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
};
