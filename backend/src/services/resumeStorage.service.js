import fs from 'node:fs';
import mongoose from 'mongoose';
import { pipeline } from 'node:stream/promises';
import { isDbConnected } from '../config/db.js';

function bucket() {
  if (!isDbConnected()) throw new Error('Resume storage requires MongoDB');
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'resumeFiles' });
}

export const resumeStorage = {
  async save(file, candidate) {
    const stream = bucket().openUploadStream(file.originalname, {
      metadata: { candidate: String(candidate), contentType: file.mimetype },
    });
    try {
      await pipeline(fs.createReadStream(file.path), stream);
      return stream.id;
    } catch (error) {
      await stream.abort().catch(() => {});
      throw error;
    }
  },
  async remove(id) { await bucket().delete(new mongoose.Types.ObjectId(String(id))); },
  download(id) { return bucket().openDownloadStream(new mongoose.Types.ObjectId(String(id))); },
};
