import { INTERVIEW_TYPES } from '../constants/interviewTypes.js';

const starterQuestions = {
  [INTERVIEW_TYPES.CORE_CSE]: 'Can you explain the selected concept and one practical scenario where it matters?',
  [INTERVIEW_TYPES.DSA]: 'Here is a problem: describe your approach, complexity, edge cases, and possible optimization.',
  [INTERVIEW_TYPES.BEHAVIORAL]: 'Tell me about a situation where you handled a difficult challenge with clear communication.',
  [INTERVIEW_TYPES.RESUME]: 'Walk me through one skill or internship from your resume and explain your contribution.',
  [INTERVIEW_TYPES.PROJECT]: 'Explain the architecture of your selected project and the key technical choices you made.',
};

export const aiQuestionService = {
  async generateNextQuestion(context) {
    const history = context.conversationHistory || [];
    const previousAnswer = context.candidateAnswerTranscript || '';
    const isWeakAnswer = previousAnswer.split(/\s+/).filter(Boolean).length < 18;
    const canFollowUp = Number(context.followUpCount || 0) < 2;
    const shouldEnd = Number(context.currentQuestionIndex || 0) >= Number(context.totalQuestions || 5);

    if (shouldEnd) {
      return {
        nextAction: 'END_INTERVIEW',
        questionType: 'SYSTEM',
        questionText: 'Thank you. This voice interview is complete. Your question and answer history has been saved.',
        reason: 'Question limit reached',
        expectedAnswerConcepts: [],
      };
    }

    if (previousAnswer && isWeakAnswer && canFollowUp) {
      return {
        nextAction: 'ASK_FOLLOW_UP',
        questionType: 'FOLLOW_UP',
        questionText: 'Could you clarify that with a concrete example and explain the reasoning behind your answer?',
        reason: 'Answer was brief or vague',
        expectedAnswerConcepts: ['example', 'reasoning', 'tradeoff'],
      };
    }

    if (previousAnswer && /not sure|maybe|i think/i.test(previousAnswer) && canFollowUp) {
      return {
        nextAction: 'ASK_CLARIFICATION',
        questionType: 'CLARIFICATION',
        questionText: 'What assumption are you making there, and how would you verify it in a real interview scenario?',
        reason: 'Answer expressed uncertainty',
        expectedAnswerConcepts: ['assumption', 'validation'],
      };
    }

    const topic = context.selectedTopics?.[0] || context.selectedSubjects?.[0] || 'the selected topic';
    const base = starterQuestions[context.interviewType] || starterQuestions[INTERVIEW_TYPES.CORE_CSE];
    const questionNumber = history.filter((item) => item.sender === 'ai').length + 1;

    return {
      nextAction: 'ASK_MAIN_QUESTION',
      questionType: 'MAIN',
      questionText: `${base} Focus on ${topic}. Question ${questionNumber}.`,
      reason: 'Proceeding to next main question',
      expectedAnswerConcepts: ['clarity', 'correctness', 'practical reasoning'],
    };
  },
};
