import { Router } from 'express';
import { protect } from '../../middlewares/authMiddleware.js';
import { resumeUpload } from '../../services/upload.service.js';
import { resumeController } from './resume.controller.js';

const router = Router();

router.use(protect);
router.post('/upload', resumeUpload.single('resume'), resumeController.upload);
router.get('/me', resumeController.me);

export default router;
