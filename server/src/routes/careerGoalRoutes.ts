import { Router } from 'express';
import { getCareerGoals, setCareerGoal } from '../controllers/careerGoalController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getCareerGoals);
router.post('/set', requireAuth, setCareerGoal);

export default router;
