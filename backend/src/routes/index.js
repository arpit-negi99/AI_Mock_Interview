import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/user/user.routes.js';
import interviewRoutes from '../modules/interview/interview.routes.js';
import voiceRoutes from '../modules/voiceSession/voice.routes.js';
import resumeRoutes from '../modules/resume/resume.routes.js';
import questionRoutes from '../modules/questionBank/question.routes.js';
import auditRoutes from '../modules/audit/audit.routes.js';
import { successResponse } from '../utils/apiResponse.js';

const router = Router();

router.get('/health', (_req, res) => successResponse(res, { data: { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() } }));
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/interviews', interviewRoutes);
router.use('/voice', voiceRoutes);
router.use('/resume', resumeRoutes);
router.use('/questions', questionRoutes);
router.use('/audit', auditRoutes);

export default router;
