import { isDbConnected } from '../../config/db.js';
import { createId, memoryStore } from '../../utils/memoryStore.js';
import { Syllabus } from './syllabus.model.js';
import { sampleSyllabus } from './syllabus.seed.js';

function matchesFilter(item, filter = {}) {
  return Object.entries(filter).every(([key, value]) => {
    if (value === undefined || value === null || value === '') return true;
    if (key === '_id') return (item.id || item._id?.toString?.()) === value;
    return String(item[key]) === String(value);
  });
}

export const syllabusRepository = {
  async seedSamples() {
    if (isDbConnected()) {
      const count = await Syllabus.countDocuments();
      if (count > 0) return { inserted: 0 };
      const inserted = await Syllabus.insertMany(sampleSyllabus);
      return { inserted: inserted.length };
    }
    if (memoryStore.syllabus.length > 0) return { inserted: 0 };
    memoryStore.syllabus.push(...sampleSyllabus.map((item) => ({
      ...item,
      id: createId('syllabus'),
      isActive: item.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })));
    return { inserted: memoryStore.syllabus.length };
  },

  async create(data) {
    if (isDbConnected()) return Syllabus.create(data);
    const syllabus = { ...data, id: createId('syllabus'), isActive: data.isActive ?? true, createdAt: new Date(), updatedAt: new Date() };
    memoryStore.syllabus.push(syllabus);
    return syllabus;
  },

  async list(query = {}) {
    const filter = {};
    ['interviewType', 'subject', 'difficulty'].forEach((key) => {
      if (query[key]) filter[key] = query[key];
    });
    if (query.isActive !== undefined) filter.isActive = query.isActive === true || query.isActive === 'true';
    if (isDbConnected()) return Syllabus.find(filter).sort({ interviewType: 1, subject: 1, difficulty: 1 });
    return memoryStore.syllabus.filter((item) => matchesFilter(item, filter));
  },

  async findById(id) {
    if (isDbConnected()) return Syllabus.findById(id);
    return memoryStore.syllabus.find((item) => item.id === id) || null;
  },

  async findByIds(ids = []) {
    if (isDbConnected()) return Syllabus.find({ _id: { $in: ids }, isActive: true });
    const wanted = new Set(ids.map(String));
    return memoryStore.syllabus.filter((item) => wanted.has(String(item.id)) && item.isActive !== false);
  },

  async update(id, patch) {
    if (isDbConnected()) return Syllabus.findByIdAndUpdate(id, patch, { returnDocument: 'after', runValidators: true });
    const syllabus = await this.findById(id);
    if (!syllabus) return null;
    Object.assign(syllabus, patch, { updatedAt: new Date() });
    return syllabus;
  },

  async activeByType(interviewType) {
    return this.list({ interviewType, isActive: true });
  },
};
