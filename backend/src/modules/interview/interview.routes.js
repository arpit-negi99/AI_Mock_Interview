import { Router } from 'express';
import { protect } from '../../middlewares/authMiddleware.js';
import { aiRateLimiter } from '../../middlewares/rateLimitMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import { interviewController } from './interview.controller.js';
import { reportSessionSchema, sessionIdSchema, startInterviewSchema } from './interview.validation.js';

const router = Router();

router.use(protect);
router.post('/start', aiRateLimiter, validate(startInterviewSchema), interviewController.start);
router.get('/', interviewController.list);
router.get('/analytics', interviewController.analytics);
router.get('/:sessionId', validate(sessionIdSchema), interviewController.getById);
router.post('/:sessionId/end', validate(sessionIdSchema), interviewController.end);
router.get('/:sessionId/report', validate(reportSessionSchema), interviewController.report);
router.get('/:sessionId/report/export', validate(reportSessionSchema), interviewController.exportReport);

export default router;
