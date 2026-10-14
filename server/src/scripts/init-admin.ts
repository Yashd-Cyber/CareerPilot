import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import env from '../config/env.js';
import { connectDatabase, closeDatabase } from '../config/db.js';

const run = async () => {
  await connectDatabase();
  const email = env.ADMIN_EMAIL.trim().toLowerCase();
  const password = env.ADMIN_INITIAL_PASSWORD;

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin account already exists for ${email}.`);
    await closeDatabase();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    name: 'System Admin',
    email,
    passwordHash,
    role: 'ADMIN',
    isActive: true,
  });

  console.log('Admin account created successfully.');
  await closeDatabase();
};

run().catch((error) => {
  console.error('Failed to initialize admin:', error);
  process.exit(1);
});
