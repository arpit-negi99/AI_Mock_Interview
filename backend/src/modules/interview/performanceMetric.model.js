import mongoose from 'mongoose';

const performanceMetricSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', index: true },
  report: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewReport' },
  recordedAt: { type: Date, default: Date.now },
  overallScore: Number,
  communicationScore: Number,
  technicalScore: Number,
  confidenceScore: Number,
  clarityScore: Number,
  problemSolvingScore: Number,
  domainExpertiseScore: Number,
  completionRate: Number,
  durationMinutes: Number,
  interviewType: String,
}, { timestamps: true });

export const PerformanceMetric = mongoose.models.PerformanceMetric || mongoose.model('PerformanceMetric', performanceMetricSchema);
