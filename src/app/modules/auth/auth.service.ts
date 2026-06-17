/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../config';
import AppError from '../../error/appError';
import { IUser } from '../user/user.interface';
import User from '../user/user.model';
import { jwtHelpers } from '../../helper/jwtHelpers';
import sendMailer from '../../helper/sendMailer';
import bcrypt from 'bcryptjs';
import createOtpTemplate from '../../utils/createOtpTemplate';
import { userRole } from '../user/user.constant';

const registerUser = async (
  payload: Partial<IUser> & { ref?: string; tosIp?: string },
) => {
  const exist = await User.findOne({ email: payload.email });
  if (exist) throw new AppError(400, 'User already exists');

  const idx = Math.floor(Math.random() * 100);
  payload.profileImage = `https://avatar.iran.liara.run/public/${idx}.png`;

  if (payload.role === userRole.business || payload.role === userRole.seles) {
    if (payload.role === userRole.business) {
      if (!payload.businessName)
        throw new AppError(400, 'Business name is required');
    }
    if (!payload.industry) throw new AppError(400, 'Industry is required');
    if (!payload.kvkVatNumber)
      throw new AppError(400, 'KVK/VAT number is required');
  }

  if (payload.role === userRole.admin) {
    payload.status = 'approved';
    payload.verified = true;
  }

  // Referral tracking — ?ref=<referralCode>
  if (payload.ref) {
    const referrer = await User.findOne({ referralCode: payload.ref });
    if (referrer) {
      payload.referredBy = referrer._id as any;
    }
  }
  delete (payload as any).ref;

  // ToS acceptance
  if (payload.tosIp) {
    payload.tosAcceptedAt = new Date();
  }

  // Generate unique referral code for new user
  const refCode =
    Math.random().toString(36).substring(2, 8).toUpperCase() +
    Date.now().toString(36).toUpperCase();
  payload.referralCode = refCode;

  // Generate OTP for email verification
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  payload.otp = otp;
  payload.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  payload.verified = payload.verified ?? false;

  const user = await User.create(payload);

  // Send verification OTP (skip for admin)
  if (user.role !== userRole.admin) {
    await sendMailer(
      user.email,
      user.firstName + ' ' + (user.lastName || ''),
      createOtpTemplate(otp, user.email, 'DealClosedPartner'),
    );
  }

  const { password, otp: _otp, ...userWithoutSensitive } = user.toObject();
  return {
    message:
      user.role === userRole.admin
        ? 'Admin account created'
        : 'Registration successful. Please check your email for the OTP to verify your account.',
    user: userWithoutSensitive,
  };
};

const loginUser = async (payload: Partial<IUser>) => {
  const user = await User.findOne({ email: payload.email });
  if (!user) throw new AppError(401, 'User not found');

  if (user.role !== userRole.admin) {
    if (user.status === 'pending') {
      throw new AppError(401, 'Your account is pending');
    } else if (user.status === 'rejected') {
      throw new AppError(401, 'Your account is rejected');
    }
  }

  if (!payload.password) throw new AppError(400, 'Password is required');

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.password,
  );
  if (!isPasswordMatched) throw new AppError(401, 'Password not matched');
  if (!user.verified) throw new AppError(403, 'Please verify your email first');

  const accessToken = jwtHelpers.genaretToken(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.accessTokenSecret as Secret,
    config.jwt.accessTokenExpires,
  );

  const refreshToken = jwtHelpers.genaretToken(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.refreshTokenSecret as Secret,
    config.jwt.refreshTokenExpires,
  );

  const { password, ...userWithoutPassword } = user.toObject();
  return { accessToken, refreshToken, user: userWithoutPassword };
};

const refreshToken = async (token: string) => {
  const varifiedToken = jwtHelpers.verifyToken(
    token,
    config.jwt.refreshTokenSecret as Secret,
  ) as JwtPayload;

  const user = await User.findById(varifiedToken.id);
  if (!user) throw new AppError(401, 'User not found');

  const accessToken = jwtHelpers.genaretToken(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.accessTokenSecret as Secret,
    config.jwt.accessTokenExpires,
  );

  const { password, ...userWithoutPassword } = user.toObject();
  return { accessToken, user: userWithoutPassword };
};

const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError(401, 'User not found');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
  await user.save();

  await sendMailer(
    user.email,
    user.firstName + ' ' + user.lastName,
    createOtpTemplate(otp, user.email, 'Your Company'),
  );

  return { message: 'OTP sent to your email' };
};

const verifyEmail = async (email: string, otp: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError(401, 'User not found');

  if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
    throw new AppError(400, 'Invalid or expired OTP');
  }

  user.verified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  return { message: 'Email verified successfully' };
};

const resetPassword = async (email: string, newPassword: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError(404, 'User not found');

  user.password = newPassword;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  // Auto-login after reset
  const accessToken = jwtHelpers.genaretToken(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.accessTokenSecret as Secret,
    config.jwt.accessTokenExpires,
  );
  const refreshToken = jwtHelpers.genaretToken(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.refreshTokenSecret as Secret,
    config.jwt.refreshTokenExpires,
  );

  const { password, ...userWithoutPassword } = user.toObject();
  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
};

const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordMatched) throw new AppError(400, 'Password not matched');

  user.password = newPassword;
  await user.save();

  return { message: 'Password changed successfully' };
};

export const authService = {
  registerUser,
  loginUser,
  refreshToken,
  forgotPassword,
  verifyEmail,
  resetPassword,
  changePassword,
};
