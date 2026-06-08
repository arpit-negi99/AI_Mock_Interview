import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl: { type: String, required: true },
  extractedText: String,
  parsedSkills: [{ type: String }],
  parsedProjects: [{ name: String, description: String }],
  uploadedAt: { type: Date, default: Date.now },
});

export const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);
