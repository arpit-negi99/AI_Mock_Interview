import {
  buildLocalFirstQuestion,
  buildLocalFollowUp,
  buildLocalMainQuestion,
} from './localQuestionEngine.service.js';
import { env } from '../config/env.js';
import { generateLlmJson, parseLlmJson } from './llm.service.js';

function topicDocumentsFromContext(context = {}) {
  const subjects = context.selectedSubjects?.length ? context.selectedSubjects : ['General'];
  const topics = context.selectedTopics?.length ? context.selectedTopics : subjects;
  return subjects.map((subject, index) => ({
    id: `context-${index}`,
    subject,
    topics: topics.filter(Boolean),
    difficulty: context.difficulty || 'medium',
    sampleConcepts: context.expectedAnswerConcepts || ['clarity', 'correctness', 'examples', 'tradeoffs'],
  }));
}

function toSessionLikeContext(context = {}, history = []) {
  const aiMessages = history.filter((item) => item.sender === 'ai');
  return {
    ...context,
    id: context.sessionId,
    currentQuestionIndex: context.currentQuestionIndex ?? aiMessages.length,
    questionHistory: history.map((item) => ({
      questionText: item.text || item.questionText,
      answerTranscript: item.transcript || item.answerTranscript,
      questionType: item.type || item.questionType,
      topic: item.topic,
    })),
    askedQuestions: aiMessages.map((item) => item.text || item.questionText).filter(Boolean),
    askedTopics: context.askedTopics || [],
  };
}

function extractSimpleSignals(text = '') {
  const technologies = ['React', 'Node.js', 'MongoDB', 'Express', 'Redux', 'JavaScript', 'Python', 'SQL', 'Docker', 'AWS']
    .filter((item) => new RegExp(`\\b${item.replace('.', '\\.')}\\b`, 'i').test(text));
  const keywords = [...new Set(text.toLowerCase().match(/\b[a-z][a-z0-9+#.-]{3,}\b/g) || [])].slice(0, 6);
  return {
    technologies,
    skills: keywords.filter((item) => !technologies.map((tech) => tech.toLowerCase()).includes(item)).slice(0, 3),
    keywords,
    specificity: Math.min(1, keywords.length / 6),
  };
}

export const aiQuestionService = {
  async generateNextQuestion(context) {
    const history = context.conversationHistory || [];
    const previousAnswer = context.candidateAnswerTranscript || '';
    const session = toSessionLikeContext(context, history);
    const syllabusDocuments = topicDocumentsFromContext(context);
    const extraction = extractSimpleSignals(previousAnswer);
    const currentQuestion = [...session.questionHistory].reverse().find((item) => item.questionText) || null;
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

    if (!env.mockAi) {
      const raw = await generateLlmJson([
        'You are conducting a realistic spoken mock interview.',
        'Return only JSON matching this schema:',
        JSON.stringify({
          nextAction: 'ASK_MAIN_QUESTION | ASK_FOLLOW_UP | ASK_CLARIFICATION | END_INTERVIEW',
          questionType: 'MAIN | FOLLOW_UP | CLARIFICATION | SYSTEM',
          questionText: 'natural interview question text',
          reason: 'why this question is appropriate',
          expectedAnswerConcepts: ['concept'],
        }, null, 2),
        'Adapt to candidate level, selected topics, previous answers, and interview progress.',
        'Do not repeat previous questions. Ask like a real interviewer, not like a worksheet.',
        'Context:',
        JSON.stringify({
          ...context,
          conversationHistory: history,
          previousAnswer,
        }, null, 2),
      ].join('\n\n'), {
        systemInstruction: 'You are a strict JSON-only interview question generator.',
        temperature: 0.75,
      });
      const generated = parseLlmJson(raw, null);
      if (!generated?.questionText) throw new Error('LLM did not return a valid question');
      return generated;
    }

    if (previousAnswer && isWeakAnswer && canFollowUp) {
      const followUp = buildLocalFollowUp({ session, currentQuestion, extraction, answerTranscript: previousAnswer });
      return {
        nextAction: 'ASK_FOLLOW_UP',
        questionType: 'FOLLOW_UP',
        questionText: followUp.questionText,
        reason: followUp.reasoning,
        expectedAnswerConcepts: followUp.expectedConcepts,
      };
    }

    if (previousAnswer && /not sure|maybe|i think/i.test(previousAnswer) && canFollowUp) {
      const clarification = buildLocalFollowUp({ session, currentQuestion, extraction, answerTranscript: previousAnswer, clarify: true });
      return {
        nextAction: 'ASK_CLARIFICATION',
        questionType: 'CLARIFICATION',
        questionText: clarification.questionText,
        reason: clarification.reasoning,
        expectedAnswerConcepts: clarification.expectedConcepts,
      };
    }

    const aiMessages = history.filter((item) => item.sender === 'ai');
    const localQuestion = aiMessages.length
      ? buildLocalMainQuestion({ session, syllabusDocuments, extraction, answerTranscript: previousAnswer })
      : buildLocalFirstQuestion(session, syllabusDocuments);

    return {
      nextAction: 'ASK_MAIN_QUESTION',
      questionType: 'MAIN',
      questionText: localQuestion.questionText,
      reason: localQuestion.reasoning,
      expectedAnswerConcepts: localQuestion.expectedConcepts,
    };
  },
};
