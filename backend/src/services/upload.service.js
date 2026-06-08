import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';

const uploadRoot = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadRoot, { recursive: true });
fs.mkdirSync(path.join(uploadRoot, 'audio'), { recursive: true });
fs.mkdirSync(path.join(uploadRoot, 'resumes'), { recursive: true });

function storage(folder) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(uploadRoot, folder)),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-')}`),
  });
}

export const audioUpload = multer({ storage: storage('audio'), limits: { fileSize: 20 * 1024 * 1024 } });
export const resumeUpload = multer({ storage: storage('resumes'), limits: { fileSize: 10 * 1024 * 1024 } });

export function toPublicFileUrl(file) {
  if (!file) return null;
  return `/uploads/${path.basename(path.dirname(file.path))}/${path.basename(file.path)}`;
}
