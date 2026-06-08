import { ROLES } from '../../constants/roles.js';
import { successResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPagination, paginatedMeta } from '../../utils/pagination.js';
import { questionRepository } from './question.repository.js';

export const questionController = {
  list: asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query);
    const result = await questionRepository.list({ ...pagination, search: req.query.search, difficulty: req.query.difficulty });
    return successResponse(res, { data: result.items, meta: paginatedMeta({ ...pagination, total: result.total }) });
  }),
  create: asyncHandler(async (req, res) => {
    if (req.user.role !== ROLES.ADMIN) throw new AppError('Only admins can create questions', 403);
    const question = await questionRepository.create(req.validated.body);
    return successResponse(res, { statusCode: 201, message: 'Question created', data: { question } });
  }),
  update: asyncHandler(async (req, res) => {
    if (req.user.role !== ROLES.ADMIN) throw new AppError('Only admins can update questions', 403);
    const question = await questionRepository.update(req.params.id, req.validated.body);
    if (!question) throw new AppError('Question not found', 404);
    return successResponse(res, { message: 'Question updated', data: { question } });
  }),
  remove: asyncHandler(async (req, res) => {
    if (req.user.role !== ROLES.ADMIN) throw new AppError('Only admins can delete questions', 403);
    const question = await questionRepository.update(req.params.id, { isActive: false });
    if (!question) throw new AppError('Question not found', 404);
    return successResponse(res, { message: 'Question deleted' });
  }),
};
