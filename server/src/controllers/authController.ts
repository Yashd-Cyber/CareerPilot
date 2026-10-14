import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { UserProfile } from '../models/UserProfile.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Registration data is invalid.' });
  }

  const { name, email, password } = parsed.data;
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'STUDENT',
  });

  await UserProfile.create({
    user: user._id,
    preferredCareer: 'Frontend Developer',
  });

  ;(req.session as any).user = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return res.status(201).json({
    message: 'Registration successful.',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Login data is invalid.' });
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  ;(req.session as any).user = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return res.json({
    message: 'Login successful.',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const adminLogin = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Admin login data is invalid.' });
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || user.role !== 'ADMIN' || !user.isActive) {
    return res.status(401).json({ message: 'Invalid admin credentials.' });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: 'Invalid admin credentials.' });
  }

  ;(req.session as any).user = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return res.json({
    message: 'Admin login successful.',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  (req.session as any).destroy(() => {
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully.' });
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById((req.session as any)?.user?.id).select('-passwordHash');
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
});
