import mongoose from 'mongoose';

const skillScoreSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', index: true },
  report: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewReport' },
  skill: { type: String, index: true },
  score: Number,
  confidence: Number,
  assessedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const SkillScore = mongoose.models.SkillScore || mongoose.model('SkillScore', skillScoreSchema);
