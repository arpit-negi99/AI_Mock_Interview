import { Router } from 'express';
import { protect } from '../../middlewares/authMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import { createQuestionSchema, updateQuestionSchema } from './question.validation.js';
import { questionController } from './question.controller.js';

const router = Router();

router.get('/', protect, questionController.list);
router.post('/', protect, validate(createQuestionSchema), questionController.create);
router.patch('/:id', protect, validate(updateQuestionSchema), questionController.update);
router.delete('/:id', protect, questionController.remove);

export default router;
