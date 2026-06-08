import mongoose from 'mongoose';
import { ROLES } from '../../constants/roles.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.CANDIDATE },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
