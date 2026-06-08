import { Router } from 'express';
import { protect } from '../../middlewares/authMiddleware.js';
import { aiRateLimiter } from '../../middlewares/rateLimitMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import { interviewController } from './interview.controller.js';
import { sessionIdSchema, startInterviewSchema } from './interview.validation.js';

const router = Router();

router.use(protect);
router.post('/start', aiRateLimiter, validate(startInterviewSchema), interviewController.start);
router.get('/', interviewController.list);
router.get('/:sessionId', validate(sessionIdSchema), interviewController.getById);
router.post('/:sessionId/end', validate(sessionIdSchema), interviewController.end);

export default router;
