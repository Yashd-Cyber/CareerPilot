import { z } from 'zod';
import { User } from '../models/User.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['STUDENT', 'ADMIN']).optional(),
});

export const listUsers = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(5, Number(req.query.limit ?? 10)));
  const skip = (page - 1) * limit;
  const filters: Record<string, unknown> = {};

  if (req.query.search) {
    filters.$or = [
      { name: { $regex: String(req.query.search), $options: 'i' } },
      { email: { $regex: String(req.query.search), $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-passwordHash').lean(),
    User.countDocuments(filters),
  ]);

  res.json({ users, page, total, totalPages: Math.ceil(total / limit) });
});

export const updateUser = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid user update payload.' });
  }

  const targetId = req.params.id;
  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (parsed.data.role && targetUser.email === req.user?.email) {
    return res.status(403).json({ message: 'You cannot change your own role.' });
  }

  if (parsed.data.isActive !== undefined) targetUser.isActive = parsed.data.isActive;
  if (parsed.data.role) targetUser.role = parsed.data.role;
  await targetUser.save();

  await AdminAuditLog.create({
    actor: req.user?.id,
    action: 'UPDATE_USER',
    targetUser: targetUser._id,
    details: `Updated user ${targetUser.email}`,
  });

  res.json({ updatedUser: { id: targetUser._id, name: targetUser.name, email: targetUser.email, role: targetUser.role, isActive: targetUser.isActive } });
});

export const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (targetUser.email === req.user?.email) {
    return res.status(403).json({ message: 'You cannot delete your own account.' });
  }

  await targetUser.deleteOne();
  await AdminAuditLog.create({
    actor: req.user?.id,
    action: 'DELETE_USER',
    targetUser: targetUser._id,
    details: `Deleted user ${targetUser.email}`,
  });

  res.json({ message: 'User deleted.' });
});

export const stats = asyncHandler(async (_req, res) => {
  const [totalUsers, activeUsers, students, admins, auditLogs] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'STUDENT' }),
    User.countDocuments({ role: 'ADMIN' }),
    AdminAuditLog.countDocuments(),
  ]);

  res.json({ totalUsers, activeUsers, students, admins, auditLogs });
});
