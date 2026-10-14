import { Router } from 'express';
import { startInterview, getInterviews, answerInterviewQuestion, finalizeInterview } from '../controllers/interviewController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/start', requireAuth, startInterview);
router.get('/', requireAuth, getInterviews);
router.post('/:id/answer', requireAuth, answerInterviewQuestion);
router.post('/:id/finalize', requireAuth, finalizeInterview);

export default router;
