import { z } from 'zod';

const text = z.string().trim().min(1).max(1800);
const list = z.array(text).max(12);
const question = z.object({
  questionText: text.max(900),
  questionType: z.enum(['main', 'followup', 'clarification']),
  topic: text.max(150),
  subject: text.max(150),
  expectedConcepts: list,
  reasoning: text,
});
const evaluation = z.object({
  score: z.number().min(0).max(10), strengths: list, gaps: list, brief: text,
});
export const interviewOutputs = {
  first: question.extend({ questionType: z.literal('main') }),
  answer: question.extend({
    decision: z.enum(['ASK_FOLLOWUP', 'ASK_CLARIFICATION', 'NEXT_QUESTION', 'END_INTERVIEW']),
    questionText: text.max(900).nullable(),
    questionType: z.enum(['main', 'followup', 'clarification', 'closing']),
    answerEvaluation: evaluation,
  }).superRefine((value, ctx) => {
    const types = { ASK_FOLLOWUP: 'followup', ASK_CLARIFICATION: 'clarification', NEXT_QUESTION: 'main', END_INTERVIEW: 'closing' };
    if (value.questionType !== types[value.decision] || (value.decision !== 'END_INTERVIEW' && !value.questionText)) {
      ctx.addIssue({ code: 'custom', message: 'Decision and question must agree' });
    }
  }),
  final: z.object({
    overallPerformance: text, strongestAreas: list, areasNeedingImprovement: list,
    communicationQuality: text, recommendedPracticePlan: list, summary: text,
  }),
};

// The provider accepts a JSON schema subset. Zod validates the full contract locally.
export function outputSchema(kind) {
  const schema = z.toJSONSchema(interviewOutputs[kind], { unrepresentable: 'any' });
  delete schema.$schema;
  return schema;
}
