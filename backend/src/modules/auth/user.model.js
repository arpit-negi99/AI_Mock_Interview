import mongoose from 'mongoose';
import { ROLES } from '../../constants/roles.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.CANDIDATE },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  refreshTokenHash: { type: String, select: false },
  refreshTokenExpiresAt: { type: Date, select: false },
  csrfTokenHash: { type: String, select: false },
  otpHash: { type: String, select: false },
  otpPurpose: { type: String, enum: ['register', 'reset-password', null], default: null, select: false },
  otpExpiresAt: { type: Date, select: false },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
