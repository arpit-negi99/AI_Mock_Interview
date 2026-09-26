import { z } from 'zod';

export const answerSchema = z.object({
  params: z.object({ sessionId: z.string().min(3) }),
  body: z.object({
    transcript: z.string().trim().max(12000).optional(),
    fallbackText: z.string().trim().max(12000).optional(),
    expectedQuestionCount: z.coerce.number().int().min(1).optional(),
  }),
  query: z.object({}).optional(),
});

export const sessionParamsSchema = z.object({
  params: z.object({ sessionId: z.string().min(3) }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const speakSchema = z.object({
  params: z.object({ sessionId: z.string().min(3) }),
  body: z.object({
    text: z.string().min(1),
    voice: z.string().optional(),
  }),
  query: z.object({}).optional(),
});
