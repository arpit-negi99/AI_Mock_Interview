import { z } from 'zod';
import { DIFFICULTIES, INTERVIEW_TYPES } from '../../constants/interviewTypes.js';

const syllabusBody = z.object({
  interviewType: z.enum(Object.values(INTERVIEW_TYPES)),
  subject: z.string().trim().min(1),
  topics: z.array(z.string().trim().min(1)).min(1),
  difficulty: z.enum(DIFFICULTIES),
  description: z.string().optional().default(''),
  sampleConcepts: z.array(z.string().trim().min(1)).optional().default([]),
  isActive: z.boolean().optional(),
});

export const createSyllabusSchema = z.object({
  body: syllabusBody,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateSyllabusSchema = z.object({
  body: syllabusBody.partial(),
  params: z.object({ id: z.string().min(3) }),
  query: z.object({}).optional(),
});

export const syllabusIdSchema = z.object({
  params: z.object({ id: z.string().min(3) }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const syllabusListSchema = z.object({
  params: z.object({}).optional(),
  body: z.object({}).optional(),
  query: z.object({
    interviewType: z.enum(Object.values(INTERVIEW_TYPES)).optional(),
    subject: z.string().optional(),
    difficulty: z.enum(DIFFICULTIES).optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }).optional(),
});

export const syllabusTypeSchema = z.object({
  params: z.object({ interviewType: z.enum(Object.values(INTERVIEW_TYPES)) }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});
