import { Router } from 'express';
import { register, login, adminLogin, logout, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

export default router;
