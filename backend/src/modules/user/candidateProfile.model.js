import mongoose from 'mongoose';

const candidateProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  college: String,
  branch: String,
  year: String,
  skills: [{ type: String }],
  targetRole: String,
  resumeUrl: String,
  projects: [{ name: String, description: String, techStack: [String], url: String }],
}, { timestamps: true });

export const CandidateProfile = mongoose.models.CandidateProfile || mongoose.model('CandidateProfile', candidateProfileSchema);
