import { isDbConnected } from '../../config/db.js';
import { createId, memoryStore } from '../../utils/memoryStore.js';
import { QuestionBank } from './questionBank.model.js';

export const questionRepository = {
  async list({ skip = 0, limit = 10, search, difficulty }) {
    if (isDbConnected()) {
      const filter = { isActive: true };
      if (difficulty) filter.difficulty = difficulty;
      if (search) filter.$or = [{ subject: new RegExp(search, 'i') }, { topic: new RegExp(search, 'i') }];
      const [items, total] = await Promise.all([QuestionBank.find(filter).skip(skip).limit(limit), QuestionBank.countDocuments(filter)]);
      return { items, total };
    }
    let items = memoryStore.questions.filter((item) => item.isActive);
    if (difficulty) items = items.filter((item) => item.difficulty === difficulty);
    if (search) items = items.filter((item) => `${item.subject} ${item.topic}`.toLowerCase().includes(search.toLowerCase()));
    return { items: items.slice(skip, skip + limit), total: items.length };
  },
  async create(data) {
    if (isDbConnected()) return QuestionBank.create(data);
    const question = { ...data, id: createId('question'), isActive: true, createdAt: new Date() };
    memoryStore.questions.push(question);
    return question;
  },
  async update(id, data) {
    if (isDbConnected()) return QuestionBank.findByIdAndUpdate(id, data, { new: true });
    const question = memoryStore.questions.find((item) => item.id === id);
    if (!question) return null;
    Object.assign(question, data);
    return question;
  },
};
