import mongoose from 'mongoose';

const interviewMessageSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
  sender: { type: String, enum: ['ai', 'candidate'], required: true },
  type: { type: String, enum: ['question', 'answer', 'follow_up', 'clarification', 'system'], required: true },
  text: { type: String, required: true },
  audioUrl: String,
  transcript: String,
  sequenceNumber: { type: Number, required: true },
}, { timestamps: true });

export const InterviewMessage = mongoose.models.InterviewMessage || mongoose.model('InterviewMessage', interviewMessageSchema);
