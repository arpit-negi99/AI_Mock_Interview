import { resumeRepository } from './resume.repository.js';
import { resumeParserService } from '../../services/resumeParser.service.js';
import { toPublicFileUrl } from '../../services/upload.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';

export const resumeController = {
  upload: asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('Resume file is required', 400);
    const parsedResume = await resumeParserService.parse(req.file);
    const resume = await resumeRepository.create({
      candidate: req.user.id,
      fileUrl: toPublicFileUrl(req.file),
      ...parsedResume,
    });
    return successResponse(res, { statusCode: 201, message: 'Resume uploaded', data: { resume } });
  }),
  me: asyncHandler(async (req, res) => {
    const resume = await resumeRepository.findLatestByCandidate(req.user.id);
    return successResponse(res, { data: { resume } });
  }),
};
