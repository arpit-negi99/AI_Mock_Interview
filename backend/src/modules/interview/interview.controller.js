import { INTERVIEW_STATUS } from '../../constants/interviewStatus.js';
import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPagination, paginatedMeta } from '../../utils/pagination.js';
import { interviewRepository } from './interview.repository.js';
import { interviewSessionService } from '../../services/interviewSession.service.js';

export const interviewController = {
  start: asyncHandler(async (req, res) => {
    const data = await interviewSessionService.startSession(req.user.id, req.validated.body);
    return successResponse(res, { statusCode: 201, message: 'Voice interview started', data });
  }),
  list: asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query);
    const result = await interviewRepository.listSessions(req.user.role === 'admin' ? null : req.user.id, pagination);
    return successResponse(res, { data: result.items, meta: paginatedMeta({ ...pagination, total: result.total }) });
  }),
  getById: asyncHandler(async (req, res) => {
    const session = await interviewSessionService.ensureOwnSession(req.params.sessionId, req.user);
    const messages = await interviewRepository.listMessages(req.params.sessionId);
    return successResponse(res, { data: { session, messages } });
  }),
  end: asyncHandler(async (req, res) => {
    await interviewSessionService.ensureOwnSession(req.params.sessionId, req.user);
    const session = await interviewRepository.updateSession(req.params.sessionId, { status: INTERVIEW_STATUS.ENDED, endedAt: new Date() });
    return successResponse(res, { message: 'Interview ended', data: { session } });
  }),
};
