import { z } from 'zod';
import { DIFFICULTIES } from '../../constants/interviewTypes.js';

export const createQuestionSchema = z.object({
  body: z.object({
    subject: z.string().min(2),
    topic: z.string().min(2),
    difficulty: z.enum(DIFFICULTIES),
    questionText: z.string().min(10),
    expectedConcepts: z.array(z.string()).default([]),
    questionType: z.string().default('MAIN'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateQuestionSchema = z.object({
  params: z.object({ id: z.string().min(2) }),
  body: createQuestionSchema.shape.body.partial().extend({ isActive: z.boolean().optional() }),
  query: z.object({}).optional(),
});
