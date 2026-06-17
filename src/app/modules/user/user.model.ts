import mongoose from 'mongoose';
import { IUser } from './user.interface';
import bcrypt from 'bcryptjs';
import config from '../../config';

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'business', 'seles'],
    },
    profileImage: { type: String },
    goal: { type: String },
    referralCode: { type: String },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    balance: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 15 },
    tosAcceptedAt: { type: Date },
    tosIp: { type: String },
    businessName: { type: String },
    achievements: { type: String },
    overviewExperience: { type: String },
    specialties: { type: String },
    portfolio: { type: String },
    location: { type: String },
    phone: { type: String },
    otp: { type: String },
    otpExpiry: { type: Date },
    verified: { type: Boolean, default: false },
    stripeAccountId: { type: String },
    industry: { type: mongoose.Schema.Types.ObjectId, ref: 'Industry' },
    kvkVatNumber: { type: String },
    status: {
      type: String,
      enum: ['approved', 'rejected', 'pending'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(
      this.password,
      Number(config.bcryptSaltRounds),
    );
  }
  next();
});

const User = mongoose.model<IUser>('User', userSchema);
export default User;
