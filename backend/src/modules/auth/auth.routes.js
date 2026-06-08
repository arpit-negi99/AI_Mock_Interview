import { Router } from 'express';
import { protect } from '../../middlewares/authMiddleware.js';
import { authRateLimiter } from '../../middlewares/rateLimitMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import { authController } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.validation.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.get('/me', protect, authController.me);
router.post('/logout', protect, authController.logout);

export default router;
