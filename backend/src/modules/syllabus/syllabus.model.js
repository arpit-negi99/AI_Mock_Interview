import mongoose from 'mongoose';
import { DIFFICULTIES, INTERVIEW_TYPES } from '../../constants/interviewTypes.js';

const syllabusSchema = new mongoose.Schema({
  interviewType: { type: String, enum: Object.values(INTERVIEW_TYPES), required: true, index: true },
  subject: { type: String, required: true, trim: true, index: true },
  topics: [{ type: String, required: true, trim: true }],
  difficulty: { type: String, enum: DIFFICULTIES, required: true, index: true },
  description: { type: String, default: '' },
  sampleConcepts: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

syllabusSchema.index({ interviewType: 1, subject: 1, difficulty: 1 });

export const Syllabus = mongoose.models.Syllabus || mongoose.model('Syllabus', syllabusSchema);
