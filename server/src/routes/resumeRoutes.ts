import { Router } from 'express';
import { deleteResume, getResume, listResumes, saveResume, uploadResume } from '../controllers/resumeController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/upload', requireAuth, uploadResume.single('resume'), saveResume);
router.get('/', requireAuth, listResumes);
router.get('/:id', requireAuth, getResume);
router.delete('/:id', requireAuth, deleteResume);

export default router;
