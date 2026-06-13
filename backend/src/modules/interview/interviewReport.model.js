import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  label: String,
  score: Number,
  evidence: [String],
}, { _id: false });

const interviewReportSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  candidateInfo: { type: mongoose.Schema.Types.Mixed },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', index: true },
  interviewType: String,
  startedAt: Date,
  endedAt: Date,
  durationMinutes: Number,
  totalQuestions: Number,
  answeredQuestions: Number,
  skillsAssessed: [String],
  performanceAnalysis: {
    technicalKnowledge: Number,
    communication: Number,
    problemSolving: Number,
    confidence: Number,
    clarity: Number,
    domainExpertise: Number,
  },
  skillBreakdown: [scoreSchema],
  strengths: [String],
  areasForImprovement: [String],
  aiFeedback: {
    detailedFeedback: String,
    suggestedLearningResources: [String],
    interviewReadinessScore: Number,
  },
  finalScore: Number,
  exports: {
    jsonReady: { type: Boolean, default: true },
    csvReady: { type: Boolean, default: true },
    pdfReady: { type: Boolean, default: true },
  },
}, { timestamps: true });

export const InterviewReport = mongoose.models.InterviewReport || mongoose.model('InterviewReport', interviewReportSchema);
