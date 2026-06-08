import { Router } from 'express';
import { protect } from '../../middlewares/authMiddleware.js';
import { allowRoles } from '../../middlewares/roleMiddleware.js';
import { ROLES } from '../../constants/roles.js';
import { successResponse } from '../../utils/apiResponse.js';
import { memoryStore } from '../../utils/memoryStore.js';

const router = Router();

router.get('/', protect, allowRoles(ROLES.ADMIN), (_req, res) => {
  successResponse(res, { data: memoryStore.auditLogs });
});

export default router;
