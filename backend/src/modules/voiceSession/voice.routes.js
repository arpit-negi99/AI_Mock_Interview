import { Router } from 'express';
import { protect } from '../../middlewares/authMiddleware.js';
import { aiRateLimiter } from '../../middlewares/rateLimitMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import { audioUpload } from '../../services/upload.service.js';
import { voiceController } from './voice.controller.js';
import { answerSchema, sessionParamsSchema, speakSchema } from './voice.validation.js';

const router = Router();

router.use(protect);
router.post('/session/:sessionId/answer', aiRateLimiter, audioUpload.single('audio'), validate(answerSchema), voiceController.answer);
router.get('/session/:sessionId/next-question', validate(sessionParamsSchema), voiceController.nextQuestion);
router.post('/session/:sessionId/transcribe', audioUpload.single('audio'), voiceController.transcribe);
router.post('/session/:sessionId/speak', validate(speakSchema), voiceController.speak);

export default router;
