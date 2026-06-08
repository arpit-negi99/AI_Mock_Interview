import { isDbConnected } from '../../config/db.js';
import { memoryStore } from '../../utils/memoryStore.js';
import { User } from './user.model.js';

export const userRepository = {
  async create(data) {
    if (isDbConnected()) {
      return User.create(data);
    }
    const user = { ...data, id: `user_${Date.now()}`, isVerified: false, isActive: true, createdAt: new Date(), updatedAt: new Date() };
    memoryStore.users.push(user);
    return user;
  },
  async findByEmail(email, includePassword = false) {
    if (isDbConnected()) {
      const query = User.findOne({ email: email.toLowerCase() });
      if (includePassword) query.select('+password');
      return query;
    }
    return memoryStore.users.find((user) => user.email === email.toLowerCase()) || null;
  },
  async findById(id) {
    if (isDbConnected()) return User.findById(id);
    return memoryStore.users.find((user) => user.id === id) || null;
  },
};
