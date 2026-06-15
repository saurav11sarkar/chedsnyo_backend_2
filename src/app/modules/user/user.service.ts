import Stripe from 'stripe';
import config from '../../config';
import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';

const stripe = new Stripe(config.stripe.secretKey!);

import { IUser } from './user.interface';
import User from './user.model';
import Assigment from '../assigment/assigment.model';
import Course from '../course/course.model';

const createUser = async (payload: IUser) => {
  const result = await User.create(payload);

  return result;
};

const getAllUser = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = [
    'firstName',
    'lastName',
    'email',
    'role',
    'status',
    'businessName'
  ];

  if (searchTerm) {
    andCondition.push({
      $or: userSearchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    });
  }

  if (Object.keys(filterData).length) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await User.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await User.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const getUserById = async (id: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const assigments = await Assigment.find({ user: id })
    .populate('review')
    .populate('application', 'firstName lastName email profileImage')
    .lean();

  const courses = await Course.find({ createdBy: id })
    .populate('review')
    .populate('application', 'firstName lastName email profileImage')
    .lean();

  return {
    user,
    assigments,
    courses,
  };
};

const updateUserById = async (
  id: string,
  payload: IUser,
  file?: Express.Multer.File,
) => {
  if (file) {
    const uploadProfile = await fileUploader.uploadToCloudinary(file);
    if (!uploadProfile?.secure_url) {
      throw new AppError(400, 'Failed to upload profile image');
    }
    payload.profileImage = uploadProfile.secure_url;
  }
  const result = await User.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const deleteUserById = async (id: string) => {
  const result = await User.findByIdAndDelete(id);
  return result;
};

const profile = async (id: string) => {
  const result = await User.findById(id);
  if (!result) {
    throw new AppError(404, 'User not found');
  }
  return result;
};

const updateStatus = async (id: string, status: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    throw new AppError(400, 'Invalid status');
  }
  const result = await User.findByIdAndUpdate(id, { status }, { new: true });
  return result;
};

/**
 * ✅ Contractor Stripe Express Account তৈরি করা
 */
const createStripeAccount = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  // যদি Stripe Account না থাকে, create
  if (!user.stripeAccountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      business_type: 'individual',
      business_profile: { url: 'https://your-default-website.com' },
      metadata: { contractorId: userId },
    });

    user.stripeAccountId = account.id;
    await user.save();
  }

  // Onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: user.stripeAccountId,
    refresh_url: `${config.frontendUrl}/connect/refresh`,
    return_url: `${config.frontendUrl}/stripe-account-success`,
    type: 'account_onboarding',
  });

  return {
    url: accountLink.url,
    message: 'Stripe onboarding link created successfully',
  };
};

/**
 * ✅ Contractor Dashboard Login Link
 */
const getStripeDashboardLink = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || !user.stripeAccountId)
    throw new AppError(404, 'Stripe account not found');

  const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);

  return {
    url: loginLink.url,
    message: 'Stripe dashboard link created successfully',
  };
};

const enrollmentHistory = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const assignmentEnrollments = await Assigment.find({
    application: userId,
  })
    .populate('user', 'name email') 
    .populate('review') 
    .lean();

  const courseEnrollments = await Course.find({
    application: userId,
  })
    .populate('createdBy', 'name email') 
    .populate('review') 
    .lean();

  return {
    assignments: assignmentEnrollments,
    courses: courseEnrollments,
  };
};

const setCommissionRate = async (userId: string, commissionRate: number) => {
  if (commissionRate < 0 || commissionRate > 100)
    throw new AppError(400, 'Commission rate must be between 0 and 100');

  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  user.commissionRate = commissionRate;
  await user.save();

  return { message: `Commission rate updated to ${commissionRate}%`, user };
};

const getUserBalance = async (userId: string) => {
  const user = await User.findById(userId).select('firstName lastName email balance commissionRate');
  if (!user) throw new AppError(404, 'User not found');
  return { balance: user.balance || 0, commissionRate: user.commissionRate || 15 };
};

export const userService = {
  createUser,
  getAllUser,
  getUserById,
  updateUserById,
  deleteUserById,
  profile,
  updateStatus,
  createStripeAccount,
  getStripeDashboardLink,
  enrollmentHistory,
  setCommissionRate,
  getUserBalance,
};
