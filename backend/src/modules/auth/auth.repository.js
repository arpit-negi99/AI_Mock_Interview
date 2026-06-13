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
  async findByEmail(email, includePassword = false, includeOtp = false) {
    if (isDbConnected()) {
      const query = User.findOne({ email: email.toLowerCase() });
      if (includePassword) query.select('+password');
      if (includeOtp) query.select('+otpHash +otpPurpose +otpExpiresAt');
      return query;
    }
    return memoryStore.users.find((user) => user.email === email.toLowerCase()) || null;
  },
  async findById(id, includeSession = false) {
    if (isDbConnected()) {
      const query = User.findById(id);
      if (includeSession) query.select('+refreshTokenHash +refreshTokenExpiresAt +csrfTokenHash');
      return query;
    }
    return memoryStore.users.find((user) => user.id === id) || null;
  },
  async updateById(id, data) {
    if (isDbConnected()) {
      return User.findByIdAndUpdate(id, data, { returnDocument: 'after' });
    }
    const index = memoryStore.users.findIndex((user) => user.id === id);
    if (index === -1) return null;
    memoryStore.users[index] = { ...memoryStore.users[index], ...data, updatedAt: new Date() };
    return memoryStore.users[index];
  },
  async deleteById(id) {
    if (isDbConnected()) {
      return User.findByIdAndDelete(id);
    }
    const index = memoryStore.users.findIndex((user) => user.id === id);
    if (index === -1) return null;
    const [deleted] = memoryStore.users.splice(index, 1);
    return deleted;
  },
};
