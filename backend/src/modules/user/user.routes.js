import { Router } from 'express';
import { protect } from '../../middlewares/authMiddleware.js';
import { successResponse } from '../../utils/apiResponse.js';

const router = Router();

router.get('/profile', protect, (req, res) => successResponse(res, { data: { user: req.user, profile: null } }));
router.put('/profile', protect, (req, res) => successResponse(res, { message: 'Profile update endpoint ready', data: { profile: req.body } }));

export default router;
