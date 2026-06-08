import mongoose from 'mongoose';

const questionBankSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  questionText: { type: String, required: true },
  expectedConcepts: [{ type: String }],
  questionType: { type: String, default: 'MAIN' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const QuestionBank = mongoose.models.QuestionBank || mongoose.model('QuestionBank', questionBankSchema);
