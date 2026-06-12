import { ROLES } from '../../constants/roles.js';
import { successResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { syllabusRepository } from './syllabus.repository.js';

function requireAdmin(user) {
  if (user?.role !== ROLES.ADMIN) throw new AppError('Admin access required', 403);
}

export const syllabusController = {
  create: asyncHandler(async (req, res) => {
    requireAdmin(req.user);
    const syllabus = await syllabusRepository.create(req.validated.body);
    return successResponse(res, { statusCode: 201, message: 'Syllabus created', data: { syllabus } });
  }),

  list: asyncHandler(async (req, res) => {
    const syllabus = await syllabusRepository.list(req.validated.query || req.query);
    return successResponse(res, { data: { syllabus } });
  }),

  getById: asyncHandler(async (req, res) => {
    const syllabus = await syllabusRepository.findById(req.params.id);
    if (!syllabus) throw new AppError('Syllabus entry not found', 404);
    return successResponse(res, { data: { syllabus } });
  }),

  update: asyncHandler(async (req, res) => {
    requireAdmin(req.user);
    const syllabus = await syllabusRepository.update(req.params.id, req.validated.body);
    if (!syllabus) throw new AppError('Syllabus entry not found', 404);
    return successResponse(res, { message: 'Syllabus updated', data: { syllabus } });
  }),

  remove: asyncHandler(async (req, res) => {
    requireAdmin(req.user);
    const syllabus = await syllabusRepository.update(req.params.id, { isActive: false });
    if (!syllabus) throw new AppError('Syllabus entry not found', 404);
    return successResponse(res, { message: 'Syllabus deactivated', data: { syllabus } });
  }),

  byType: asyncHandler(async (req, res) => {
    const syllabus = await syllabusRepository.activeByType(req.params.interviewType);
    return successResponse(res, { data: { syllabus } });
  }),
};
