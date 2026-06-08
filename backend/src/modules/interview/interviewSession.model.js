import mongoose from 'mongoose';
import { INTERVIEW_STATUS } from '../../constants/interviewStatus.js';
import { INTERVIEW_TYPES } from '../../constants/interviewTypes.js';

const interviewSessionSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interviewType: { type: String, enum: Object.values(INTERVIEW_TYPES), required: true },
  selectedSubjects: [{ type: String }],
  selectedTopics: [{ type: String }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  totalQuestions: { type: Number, default: 5 },
  duration: { type: Number, default: 15 },
  status: { type: String, enum: Object.values(INTERVIEW_STATUS), default: INTERVIEW_STATUS.ACTIVE },
  startedAt: Date,
  endedAt: Date,
  currentQuestionIndex: { type: Number, default: 0 },
  followUpCount: { type: Number, default: 0 },
  conversationHistory: [{
    sender: String,
    type: String,
    text: String,
    sequenceNumber: Number,
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export const InterviewSession = mongoose.models.InterviewSession || mongoose.model('InterviewSession', interviewSessionSchema);
