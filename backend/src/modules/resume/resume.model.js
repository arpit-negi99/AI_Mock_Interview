import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl: { type: String, required: true },
  extractedText: String,
  parsedSkills: [{ type: String }],
  parsedProjects: [{ name: String, techStack: [String], description: String, keyAchievements: [String] }],
  parsedExperience: [{ company: String, role: String, duration: String, description: String }],
  parsedEducation: [{ institution: String, degree: String, year: String }],
  parsedCertifications: [{ type: String }],
  parsedSummary: String,
  parsingStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  parsingError: String,
  uploadedAt: { type: Date, default: Date.now },
});

export const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);
