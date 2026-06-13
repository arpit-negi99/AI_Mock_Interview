import { isDbConnected } from '../../config/db.js';
import { INTERVIEW_STATUS } from '../../constants/interviewStatus.js';
import { createId, memoryStore } from '../../utils/memoryStore.js';
import { InterviewAnswer } from './interviewAnswer.model.js';
import { InterviewMessage } from './interviewMessage.model.js';
import { InterviewQuestion } from './interviewQuestion.model.js';
import { InterviewSession } from './interviewSession.model.js';

export const interviewRepository = {
  async createSession(data) {
    if (isDbConnected()) return InterviewSession.create(data);
    const session = {
      ...data,
      id: createId('session'),
      status: data.status || INTERVIEW_STATUS.ACTIVE,
      conversationHistory: [],
      askedQuestions: data.askedQuestions || [],
      askedTopics: data.askedTopics || [],
      questionHistory: data.questionHistory || [],
      evaluationNotes: data.evaluationNotes || [],
      interviewMemory: data.interviewMemory || { exchanges: [], summary: {} },
      skillGraph: data.skillGraph || { nodes: [], edges: [] },
      conversationGraph: data.conversationGraph || { nodes: [], edges: [] },
      topicDepth: data.topicDepth || [],
      interviewState: data.interviewState || {},
      currentQuestionIndex: data.currentQuestionIndex || 0,
      followUpCount: data.followUpCount || 0,
      crossQuestionCount: data.crossQuestionCount || 0,
      maxCrossQuestions: data.maxCrossQuestions || 2,
      startedAt: data.startedAt || new Date(),
      createdAt: new Date(),
    };
    memoryStore.sessions.push(session);
    return session;
  },
  async listSessions(candidate, { skip = 0, limit = 10 }) {
    if (isDbConnected()) {
      const filter = candidate ? { candidate } : {};
      const [items, total] = await Promise.all([
        InterviewSession.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        InterviewSession.countDocuments(filter),
      ]);
      return { items, total };
    }
    const items = memoryStore.sessions.filter((item) => !candidate || item.candidate === candidate).slice(skip, skip + limit);
    return { items, total: memoryStore.sessions.length };
  },
  async findSessionById(id) {
    if (isDbConnected()) return InterviewSession.findById(id);
    return memoryStore.sessions.find((item) => item.id === id) || null;
  },
  async updateSession(id, patch) {
    if (isDbConnected()) return InterviewSession.findByIdAndUpdate(id, patch, { returnDocument: 'after' });
    const session = await this.findSessionById(id);
    if (!session) return null;
    Object.assign(session, patch, { updatedAt: new Date() });
    return session;
  },
  async addMessage(data) {
    if (isDbConnected()) return InterviewMessage.create(data);
    const message = { ...data, id: createId('msg'), createdAt: new Date() };
    memoryStore.messages.push(message);
    const session = await this.findSessionById(data.session);
    if (session) session.conversationHistory.push({ sender: data.sender, type: data.type, text: data.text, sequenceNumber: data.sequenceNumber, createdAt: message.createdAt });
    return message;
  },
  async addQuestionRecord(data) {
    if (isDbConnected()) return InterviewQuestion.create(data);
    const question = { ...data, id: createId('interview_question'), askedAt: data.askedAt || new Date(), createdAt: new Date() };
    memoryStore.interviewQuestions.push(question);
    return question;
  },
  async addAnswerRecord(data) {
    if (isDbConnected()) return InterviewAnswer.create(data);
    const answer = { ...data, id: createId('interview_answer'), answeredAt: data.answeredAt || new Date(), createdAt: new Date() };
    memoryStore.interviewAnswers.push(answer);
    return answer;
  },
  async listMessages(session) {
    if (isDbConnected()) return InterviewMessage.find({ session }).sort({ sequenceNumber: 1 });
    return memoryStore.messages.filter((item) => item.session === session).sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  },
};
