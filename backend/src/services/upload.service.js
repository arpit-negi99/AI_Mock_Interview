import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { randomUUID } from 'node:crypto';

const uploadRoot = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadRoot, { recursive: true });
fs.mkdirSync(path.join(uploadRoot, 'audio'), { recursive: true });
fs.mkdirSync(path.join(uploadRoot, 'resumes'), { recursive: true });

function storage(folder) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(uploadRoot, folder)),
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  });
}

export const audioUpload = multer({ storage: storage('audio'), limits: { fileSize: 20 * 1024 * 1024 } });
export const resumeUpload = multer({
  storage: storage('resumes'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if ((extension === '.pdf' && file.mimetype === 'application/pdf') || (extension === '.txt' && file.mimetype === 'text/plain')) return cb(null, true);
    return cb(new AppError('Upload a PDF or plain-text resume.', 400));
  },
});

export function toPublicFileUrl(file) {
  if (!file || env.isProduction) return null;
  return `/uploads/${path.basename(path.dirname(file.path))}/${path.basename(file.path)}`;
}

export function cleanupAudioUpload(req, res, next) {
  if (env.isProduction && req.file) {
    const filePath = req.file.path;
    res.once('finish', () => { fs.promises.unlink(filePath).catch(() => {}); });
  }
  next();
}
