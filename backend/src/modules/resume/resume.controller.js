import { resumeRepository } from './resume.repository.js';
import { resumeParserService } from '../../services/resumeParser.service.js';
import { toPublicFileUrl } from '../../services/upload.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import { pipeline } from 'node:stream/promises';
import { env } from '../../config/env.js';
import { isDbConnected } from '../../config/db.js';
import { resumeStorage } from '../../services/resumeStorage.service.js';

export const resumeController = {
  upload: asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('Resume file is required', 400);
    let fileStorageId;
    try {
      const parsedResume = await resumeParserService.parse(req.file);
      if (isDbConnected()) fileStorageId = await resumeStorage.save(req.file, req.user.id);
      const resume = await resumeRepository.create({
        ...parsedResume,
        candidate: req.user.id,
        fileStorageId,
        originalFilename: req.file.originalname,
        contentType: req.file.mimetype,
        fileUrl: fileStorageId ? `${env.apiPrefix}/resume/files/${fileStorageId}` : toPublicFileUrl(req.file),
      });
      return successResponse(res, { statusCode: 201, message: 'Resume uploaded', data: { resume } });
    } catch (error) {
      if (fileStorageId) await resumeStorage.remove(fileStorageId).catch(() => {});
      throw error;
    } finally {
      if (fileStorageId || env.isProduction) await fs.unlink(req.file.path).catch(() => {});
    }
  }),
  download: asyncHandler(async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.fileId)) throw new AppError('Resume file not found', 404);
    const resume = await resumeRepository.findByFileId(req.params.fileId, req.user.id);
    if (!resume) throw new AppError('Resume file not found', 404);
    res.setHeader('Cache-Control', 'private, no-store');
    res.type(resume.contentType || 'application/octet-stream');
    res.attachment(resume.originalFilename || 'resume');
    await pipeline(resumeStorage.download(resume.fileStorageId), res);
  }),
  me: asyncHandler(async (req, res) => {
    const resume = await resumeRepository.findLatestByCandidate(req.user.id);
    return successResponse(res, { data: { resume } });
  }),
};
