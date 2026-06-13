import mongoose from 'mongoose';

const interviewAnswerSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', index: true },
  questionText: String,
  topic: String,
  answerTranscript: { type: String, required: true },
  extractedContext: { type: mongoose.Schema.Types.Mixed },
  score: Number,
  sequenceNumber: Number,
  answeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const InterviewAnswer = mongoose.models.InterviewAnswer || mongoose.model('InterviewAnswer', interviewAnswerSchema);
