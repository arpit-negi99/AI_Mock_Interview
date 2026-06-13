import mongoose from 'mongoose';

const interviewQuestionSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', index: true },
  questionText: { type: String, required: true },
  questionType: String,
  topic: String,
  subject: String,
  expectedConcepts: [String],
  sequenceNumber: Number,
  askedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const InterviewQuestion = mongoose.models.InterviewQuestion || mongoose.model('InterviewQuestion', interviewQuestionSchema);
