import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import User from '../user/user.model';
import Payout from './payout.model';

const MIN_PAYOUT_AMOUNT = 20; // minimum $20 to request payout

const requestPayout = async (
  userId: string,
  amount: number,
  method: 'iban' | 'paypal',
  accountDetails: string,
) => {
  if (amount < MIN_PAYOUT_AMOUNT)
    throw new AppError(400, `Minimum payout amount is $${MIN_PAYOUT_AMOUNT}`);

  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  if ((user.balance || 0) < amount)
    throw new AppError(400, 'Insufficient balance');

  // Deduct from balance immediately (holds the amount)
  user.balance = (user.balance || 0) - amount;
  await user.save();

  const payout = await Payout.create({
    user: userId,
    amount,
    method,
    accountDetails,
    status: 'pending',
  });

  return payout;
};

const getMyPayouts = async (userId: string, options: IOption) => {
  const { page, limit, skip } = pagination(options);
  const data = await Payout.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const total = await Payout.countDocuments({ user: userId });
  return { data, meta: { total, page, limit } };
};

const getAllPayouts = async (options: IOption) => {
  const { page, limit, skip } = pagination(options);
  const data = await Payout.find()
    .populate('user', 'firstName lastName email balance')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const total = await Payout.countDocuments();
  return { data, meta: { total, page, limit } };
};

const approvePayout = async (payoutId: string, adminNote?: string) => {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw new AppError(404, 'Payout request not found');
  if (payout.status !== 'pending')
    throw new AppError(400, 'Payout already processed');

  payout.status = 'approved';
  payout.processedAt = new Date();
  if (adminNote) payout.adminNote = adminNote;
  await payout.save();

  return { message: 'Payout approved successfully' };
};

const rejectPayout = async (payoutId: string, adminNote: string) => {
  const payout = await Payout.findById(payoutId).populate('user');
  if (!payout) throw new AppError(404, 'Payout request not found');
  if (payout.status !== 'pending')
    throw new AppError(400, 'Payout already processed');

  // Refund balance back to user
  const user = await User.findById(payout.user);
  if (user) {
    user.balance = (user.balance || 0) + payout.amount;
    await user.save();
  }

  payout.status = 'rejected';
  payout.processedAt = new Date();
  payout.adminNote = adminNote;
  await payout.save();

  return { message: 'Payout rejected and balance refunded' };
};

export const payoutService = {
  requestPayout,
  getMyPayouts,
  getAllPayouts,
  approvePayout,
  rejectPayout,
};
