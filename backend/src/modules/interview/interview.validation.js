import { z } from 'zod';
import { DIFFICULTIES, INTERVIEW_TYPES } from '../../constants/interviewTypes.js';

export const startInterviewSchema = z.object({
  body: z.object({
    interviewType: z.enum(Object.values(INTERVIEW_TYPES)),
    selectedSubjects: z.array(z.string()).default([]),
    selectedTopics: z.array(z.string()).default([]),
    difficulty: z.enum(DIFFICULTIES),
    totalQuestions: z.number().int().min(1).max(30).default(5),
    duration: z.number().int().min(1).max(180).default(15),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const sessionIdSchema = z.object({
  params: z.object({ sessionId: z.string().min(3) }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});
