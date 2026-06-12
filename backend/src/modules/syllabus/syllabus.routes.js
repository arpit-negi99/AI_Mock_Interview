import { Router } from 'express';
import { protect } from '../../middlewares/authMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import { syllabusController } from './syllabus.controller.js';
import {
  createSyllabusSchema,
  syllabusIdSchema,
  syllabusListSchema,
  syllabusTypeSchema,
  updateSyllabusSchema,
} from './syllabus.validation.js';

const router = Router();

router.use(protect);
router.post('/', validate(createSyllabusSchema), syllabusController.create);
router.get('/', validate(syllabusListSchema), syllabusController.list);
router.get('/by-type/:interviewType', validate(syllabusTypeSchema), syllabusController.byType);
router.get('/:id', validate(syllabusIdSchema), syllabusController.getById);
router.patch('/:id', validate(updateSyllabusSchema), syllabusController.update);
router.delete('/:id', validate(syllabusIdSchema), syllabusController.remove);

export default router;
