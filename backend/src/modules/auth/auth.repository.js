import bcrypt from "bcryptjs";
import { isDbConnected } from "../../config/db.js";
import { memoryStore } from "../../utils/memoryStore.js";
import { ROLES } from "../../constants/roles.js";
import { User } from "./user.model.js";

export const userRepository = {
  async create(data) {
    if (isDbConnected()) {
      return User.create(data);
    }
    const user = {
      ...data,
      id: `user_${Date.now()}`,
      isVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.users.push(user);
    return user;
  },
  async findByEmail(email, includePassword = false, includeOtp = false) {
    if (isDbConnected()) {
      const query = User.findOne({ email: email.toLowerCase() });
      if (includePassword) query.select("+password");
      if (includeOtp) query.select("+otpHash +otpPurpose +otpExpiresAt");
      return query;
    }
    return (
      memoryStore.users.find((user) => user.email === email.toLowerCase()) ||
      null
    );
  },
  async findById(id) {
    if (isDbConnected()) return User.findById(id);
    return memoryStore.users.find((user) => user.id === id) || null;
  },
  async updateById(id, data) {
    if (isDbConnected()) {
      return User.findByIdAndUpdate(id, data, { returnDocument: "after" });
    }
    const index = memoryStore.users.findIndex((user) => user.id === id);
    if (index === -1) return null;
    memoryStore.users[index] = {
      ...memoryStore.users[index],
      ...data,
      updatedAt: new Date(),
    };
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

  async seedDemoUsers() {
    const demoUsers = [
      {
        name: "Demo Candidate",
        email: "candidate@example.com",
        password: "password123",
        role: ROLES.CANDIDATE,
      },
      {
        name: "Demo Admin",
        email: "admin@example.com",
        password: "password123",
        role: ROLES.ADMIN,
      },
    ];

    for (const demo of demoUsers) {
      const existing = await this.findByEmail(demo.email);
      if (existing) continue;

      const hashedPassword = await bcrypt.hash(demo.password, 12);
      const userData = {
        name: demo.name,
        email: demo.email.toLowerCase(),
        password: hashedPassword,
        role: demo.role,
        isVerified: true,
        isActive: true,
      };
      await this.create(userData);
    }
  },
};
