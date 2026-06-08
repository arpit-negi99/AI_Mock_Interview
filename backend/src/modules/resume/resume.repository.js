import { isDbConnected } from '../../config/db.js';
import { createId, memoryStore } from '../../utils/memoryStore.js';
import { Resume } from './resume.model.js';

export const resumeRepository = {
  async create(data) {
    if (isDbConnected()) return Resume.create(data);
    const resume = { ...data, id: createId('resume'), uploadedAt: new Date() };
    memoryStore.resumes.push(resume);
    return resume;
  },
  async findLatestByCandidate(candidate) {
    if (isDbConnected()) return Resume.findOne({ candidate }).sort({ uploadedAt: -1 });
    return memoryStore.resumes.filter((item) => item.candidate === candidate).at(-1) || null;
  },
};
