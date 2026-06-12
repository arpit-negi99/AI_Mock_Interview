import { Router } from 'express';
import { protect } from '../../middlewares/authMiddleware.js';
import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { userRepository } from '../auth/auth.repository.js';

const router = Router();

router.get('/profile', protect, (req, res) => successResponse(res, { data: { user: req.user, profile: null } }));
router.put('/profile', protect, (req, res) => successResponse(res, { message: 'Profile update endpoint ready', data: { profile: req.body } }));
router.delete('/account', protect, asyncHandler(async (req, res) => {
  await userRepository.deleteById(req.user.id);
  return successResponse(res, { message: 'Account deleted successfully' });
}));

export default router;
