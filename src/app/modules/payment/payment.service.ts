/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Stripe from 'stripe';
import AppError from '../../error/appError';
import Assigment from '../assigment/assigment.model';
import User from '../user/user.model';
import config from '../../config';
import Payment from './payment.model';
import Course from '../course/course.model';
import pagination, { IOption } from '../../helper/pagenation';
import mongoose from 'mongoose';
import { notificationService } from '../notification/notification.service';

const stripe = new Stripe(config.stripe.secretKey!);

/**
 * ✅ Step 1: Buyer পেমেন্ট শুরু করে
 *
 * কী হবে:
 * - Buyer Stripe Checkout-এ যাবে
 * - পেমেন্ট সফল হলে টাকা আপনার প্ল্যাটফর্মে আসবে (held)
 * - Admin approve না করা পর্যন্ত Seller/Admin কেউ পাবে না
 */
const createAssasmtPay = async (userId: string, assasmtId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const assasmt = await Assigment.findById(assasmtId).populate('user');
  if (!assasmt) throw new AppError(404, 'Assignment not found');

  // নিজের জিনিসের জন্য পেমেন্ট করতে পারবে না
  if (assasmt.user?._id.toString() === user._id.toString()) {
    throw new AppError(400, 'You cannot pay for your own assignment');
  }

  const amount = Math.round(parseFloat(assasmt.budget) * 100);
  const seller = assasmt.user as any;

  if (!seller || !seller.stripeAccountId) {
    throw new AppError(404, 'Seller Stripe account not found');
  }

  // ✅ FIXED: Remove on_behalf_of, keep only transfer_data
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: user.email,

    payment_intent_data: {
      capture_method: 'manual',
      // Transfer করার সময় application_fee কাটবে
      application_fee_amount: Math.round(amount * 0.15),
      // শুধু transfer_data ব্যবহার করি
      transfer_data: {
        destination: seller.stripeAccountId,
      },
      // ❌ on_behalf_of সরিয়ে দিলাম
    },

    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: assasmt.title },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],

    metadata: {
      userId,
      assasmtId,
    },

    success_url: `${config.frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/payment/cancel`,
  });

  await Payment.create({
    user: userId,
    assigment: assasmtId,
    amount: amount / 100,
    stripeSessionId: session.id,
    status: 'pending',
  });

  return { url: session.url };
};

/**
 * ✅ Course Payment শুরু করা
 */
const createCoursePay = async (userId: string, courseId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const course = await Course.findById(courseId).populate('createdBy');
  if (!course) throw new AppError(404, 'Course not found');

  // নিজের কোর্সের জন্য পেমেন্ট করতে পারবে না
  if (course.createdBy?._id.toString() === user._id.toString()) {
    throw new AppError(400, 'You cannot pay for your own course');
  }

  // Validate price exists
  if (!course.price || course.price <= 0) {
    throw new AppError(400, 'Course price is not set or invalid');
  }

  // Calculate final price after discount
  const discount = course.discount || 0;
  const finalPrice = course.price - (course.price * discount) / 100;
  const amount = Math.round(finalPrice * 100); // cents-এ convert
  const seller = course.createdBy as any;

  if (!seller || !seller.stripeAccountId) {
    throw new AppError(404, 'Course creator Stripe account not found');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: user.email,

    payment_intent_data: {
      capture_method: 'manual',
      application_fee_amount: Math.round(amount * 0.15),
      transfer_data: {
        destination: seller.stripeAccountId,
      },
    },

    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: course.title,
            description: `${course.level} - ${course.duration}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],

    metadata: {
      userId,
      courseId,
      type: 'course', // To identify in webhook
    },

    success_url: `${config.frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/payment/cancel`,
  });

  await Payment.create({
    user: userId,
    course: courseId,
    amount: amount / 100,
    stripeSessionId: session.id,
    status: 'pending',
  });

  return { url: session.url };
};

/**
 * ✅ Step 2: Admin/Business Owner Approve করলে টাকা ভাগ হবে
 */
const approveAssasmentPayment = async (
  paymentId: string,
  businessId: string,
) => {
  const payment = await Payment.findById(paymentId).populate({
    path: 'assigment',
    populate: { path: 'user' },
  });

  if (!payment || payment.status !== 'pending') {
    throw new AppError(400, 'Payment cannot be processed');
  }

  const assasmt = payment.assigment as any;

  // ✅ CHECK: শুধুমাত্র assignment owner approve করতে পারবে
  if (assasmt.user._id.toString() !== businessId) {
    throw new AppError(403, 'You are not authorized to approve this payment');
  }

  if (!payment.stripePaymentIntentId) {
    throw new AppError(400, 'Payment Intent ID not found');
  }

  const seller = assasmt.user;

  if (!seller || !seller.stripeAccountId) {
    throw new AppError(404, 'Seller Stripe account not found');
  }

  const captured = await stripe.paymentIntents.capture(
    payment.stripePaymentIntentId,
  );

  const totalCents = captured.amount_received;
  const sellerCents = Math.round(totalCents * 0.85);
  const adminCents = Math.round(totalCents * 0.15);

  payment.status = 'approved';
  payment.userFree = sellerCents / 100;
  payment.adminFree = adminCents / 100;
  payment.paymentDate = new Date();
  await payment.save();

  // Referral: 20% of platform fee goes to referrer
  const buyerUser = await User.findById(payment.user).populate('referredBy');
  if (buyerUser?.referredBy) {
    const referralBonus = Math.round(adminCents * 0.2) / 100;
    const referrerId = (buyerUser.referredBy as any)._id || buyerUser.referredBy;
    await User.findByIdAndUpdate(referrerId, {
      $inc: { balance: referralBonus },
    });
    await notificationService.createNotification({
      recipient: referrerId,
      type: 'referral_bonus',
      title: 'Referral Bonus Received!',
      body: `You earned €${referralBonus.toFixed(2)} referral bonus from a payment.`,
    });
  }

  // Notify buyer
  await notificationService.createNotification({
    recipient: payment.user,
    type: 'payment_approved',
    title: 'Payment Approved',
    body: `Your payment for "${assasmt.title}" has been approved.`,
    relatedId: payment._id as any,
  });

  return {
    message:
      'Payment approved: 85% transferred to seller, 15% kept as admin fee',
    sellerAmount: sellerCents / 100,
    adminAmount: adminCents / 100,
  };
};

/**
 * ✅ Step 3: Assignment Owner Reject করলে Buyer-কে Refund
 */
const rejectAssasmentPayment = async (
  paymentId: string,
  businessId: string,
) => {
  const payment = await Payment.findById(paymentId).populate({
    path: 'assigment',
    populate: { path: 'user' },
  });

  if (!payment || payment.status !== 'pending') {
    throw new AppError(400, 'Payment cannot be processed');
  }

  const assasmt = payment.assigment as any;

  // ✅ CHECK: শুধুমাত্র assignment owner reject করতে পারবে
  if (assasmt.user._id.toString() !== businessId) {
    throw new AppError(403, 'You are not authorized to reject this payment');
  }

  if (payment.stripePaymentIntentId) {
    try {
      await stripe.paymentIntents.cancel(payment.stripePaymentIntentId);
    } catch (error) {
      await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
      });
    }
  }

  payment.status = 'refunded';
  await payment.save();

  const assasmtDoc = await Assigment.findById(payment.assigment);
  if (assasmtDoc && assasmtDoc.application) {
    assasmtDoc.application = assasmtDoc.application.filter(
      (uid) => uid.toString() !== payment.user.toString(),
    );
    await assasmtDoc.save();
  }

  // Notify buyer
  await notificationService.createNotification({
    recipient: payment.user,
    type: 'payment_rejected',
    title: 'Payment Rejected',
    body: `Your payment has been rejected and refunded.`,
    relatedId: payment._id as any,
  });

  return { message: 'Payment rejected and refunded to buyer' };
};

/**
 * ✅ Course Payment Approve - শুধুমাত্র course creator
 */
const approveCoursePayment = async (paymentId: string, businessId: string) => {
  const payment = await Payment.findById(paymentId).populate({
    path: 'course',
    populate: { path: 'createdBy' },
  });

  if (!payment || payment.status !== 'pending') {
    throw new AppError(400, 'Payment cannot be processed');
  }

  const course = payment.course as any;

  // ✅ CHECK: শুধুমাত্র course creator approve করতে পারবে
  if (course.createdBy._id.toString() !== businessId) {
    throw new AppError(403, 'You are not authorized to approve this payment');
  }

  if (!payment.stripePaymentIntentId) {
    throw new AppError(400, 'Payment Intent ID not found');
  }

  const seller = course.createdBy;

  if (!seller || !seller.stripeAccountId) {
    throw new AppError(404, 'Course creator Stripe account not found');
  }

  const captured = await stripe.paymentIntents.capture(
    payment.stripePaymentIntentId,
  );

  const totalCents = captured.amount_received;
  const sellerCents = Math.round(totalCents * 0.85);
  const adminCents = Math.round(totalCents * 0.15);

  payment.status = 'approved';
  payment.userFree = sellerCents / 100;
  payment.adminFree = adminCents / 100;
  payment.paymentDate = new Date();
  await payment.save();

  // Add user to course applications
  if (!course.application) course.application = [];
  if (!course.application.includes(payment.user)) {
    course.application.push(payment.user);
    await course.save();
  }

  // Referral: 20% of platform fee goes to referrer
  const buyerUser = await User.findById(payment.user).populate('referredBy');
  if (buyerUser?.referredBy) {
    const referralBonus = Math.round(adminCents * 0.2) / 100;
    await User.findByIdAndUpdate(buyerUser.referredBy, {
      $inc: { balance: referralBonus },
    });
  }

  return {
    message:
      'Course payment approved: 85% transferred to creator, 15% kept as admin fee',
    sellerAmount: sellerCents / 100,
    adminAmount: adminCents / 100,
  };
};

/**
 * ✅ Course Payment Reject - শুধুমাত্র course creator
 */
const rejectCoursePayment = async (paymentId: string, businessId: string) => {
  const payment = await Payment.findById(paymentId).populate({
    path: 'course',
    populate: { path: 'createdBy' },
  });

  if (!payment || payment.status !== 'pending') {
    throw new AppError(400, 'Payment cannot be processed');
  }

  const course = payment.course as any;

  // ✅ CHECK: শুধুমাত্র course creator reject করতে পারবে
  if (course.createdBy._id.toString() !== businessId) {
    throw new AppError(403, 'You are not authorized to reject this payment');
  }

  if (payment.stripePaymentIntentId) {
    try {
      await stripe.paymentIntents.cancel(payment.stripePaymentIntentId);
    } catch (error) {
      await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
      });
    }
  }

  payment.status = 'refunded';
  await payment.save();

  const courseDoc = await Course.findById(payment.course);
  if (courseDoc && courseDoc.application) {
    courseDoc.application = courseDoc.application.filter(
      (uid) => uid.toString() !== payment.user.toString(),
    );
    await courseDoc.save();
  }

  return { message: 'Course payment rejected and refunded to buyer' };
};

/**
 * ✅ Get All Payments with Search, Filter, Pagination
 */
const allPayments = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];

  // Search করার জন্য আমরা user এর email/name দিয়ে search করতে পারি
  // কিন্তু সেটার জন্য আগে populate করতে হবে বা aggregation use করতে হবে

  // Direct payment fields যেগুলো search করা যায়
  if (searchTerm) {
    andCondition.push({
      $or: [
        { status: { $regex: searchTerm, $options: 'i' } },
        { paymentMethod: { $regex: searchTerm, $options: 'i' } },
        { transactionId: { $regex: searchTerm, $options: 'i' } },
      ],
    });
  }

  // Filter by status, amount range, etc
  if (Object.keys(filterData).length) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => {
        // যদি amount range filter করতে চান
        if (field === 'minAmount') {
          return { amount: { $gte: Number(value) } };
        }
        if (field === 'maxAmount') {
          return { amount: { $lte: Number(value) } };
        }
        return { [field]: value };
      }),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await Payment.find(whereCondition)
    .populate({
      path: 'user',
      select: 'firstName lastName email profileImage role',
    })
    .populate({
      path: 'assigment',
      select: 'title budget status user',
      populate: {
        path: 'user',
        select: 'firstName lastName email',
      },
    })
    .populate({
      path: 'course',
      select: 'title price discount status createdBy',
      populate: {
        path: 'createdBy',
        select: 'firstName lastName email',
      },
    })
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Payment.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const getMyAllPayments = async (userId: string, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);

  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  // 🔹 fetch all with relations
  const payments = await Payment.find()
    .populate({
      path: 'user',
      select: 'firstName lastName email profileImage',
    })
    .populate({
      path: 'assigment',
      select: 'title budget status user',
      populate: {
        path: 'user',
        select: 'firstName lastName email',
      },
    })
    .populate({
      path: 'course',
      select: 'title price discount status createdBy',
      populate: {
        path: 'createdBy',
        select: 'firstName lastName email',
      },
    })
    .sort({ [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit);

  // 🔹 now filter only payments where this user owns the assignment or course
  const filteredPayments = payments.filter(
    (p: any) =>
      p?.assigment?.user?._id?.toString() === userId ||
      p?.course?.createdBy?._id?.toString() === userId,
  );

  return {
    success: true,
    message: 'Payments retrieved successfully',
    meta: {
      total: filteredPayments.length,
      page,
      limit,
    },
    data: filteredPayments,
  };
};

/**
 * ✅ Get Single Payment by ID
 */
const getPaymentById = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId)
    .populate({
      path: 'user',
      select: 'firstName lastName email profileImage phone',
    })
    .populate({
      path: 'assigment',
      select: 'title description budget priceType deadLine status user',
      populate: {
        path: 'user',
        select: 'firstName lastName email stripeAccountId',
      },
    })
    .populate({
      path: 'course',
      select:
        'title description price discount level duration status createdBy',
      populate: {
        path: 'createdBy',
        select: 'firstName lastName email stripeAccountId',
      },
    });

  if (!payment) {
    throw new AppError(404, 'Payment not found');
  }

  return payment;
};

/**
 * ✅ Get Payments by User (Buyer's payment history)
 */
const getPaymentsByUser = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm } = params;

  const query: any = { user: userId };

  if (searchTerm) {
    query.status = searchTerm;
  }

  const result = await Payment.find(query)
    .populate({
      path: 'assigment',
      populate:{path:'user', select:'firstName'},
      select: 'title budget status uploadFile',
    })
    .populate({
      path: 'course',
      select: 'title price discount status courseVideo',
    })
    // .select('createdAt course assigment') //should be removed
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Payment.countDocuments(query);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

/**
 * ✅ Get Payments for Seller (যারা assignment/course create করেছে তাদের payment)
 */
const getPaymentsForSeller = async (
  sellerId: string,
  params: any,
  options: IOption,
) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, type } = params; // type = 'assignment' or 'course'

  // First get all assignments and courses created by this seller
  const assignments = await Assigment.find({ user: sellerId }).select('_id');
  const courses = await Course.find({ createdBy: sellerId }).select('_id');

  const assignmentIds = assignments.map((a) => a._id);
  const courseIds = courses.map((c) => c._id);

  const query: any = {
    $or: [
      { assigment: { $in: assignmentIds } },
      { course: { $in: courseIds } },
    ],
  };

  if (searchTerm) {
    query.status = searchTerm;
  }

  if (type === 'assignment') {
    query.assigment = { $exists: true };
  } else if (type === 'course') {
    query.course = { $exists: true };
  }

  const result = await Payment.find(query)
    .populate({
      path: 'user',
      select: 'firstName lastName email profileImage',
    })
    .populate({
      path: 'assigment',
      select: 'title budget status',
    })
    .populate({
      path: 'course',
      select: 'title price discount status',
    })
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Payment.countDocuments(query);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

/**
 * ✅ Get Payment Statistics (Admin/Seller dashboard)
 */
const getPaymentStats = async (userId?: string, role?: string) => {
  let matchQuery: any = {};

  // If seller, get only their payments
  if (role === 'business' || role === 'seles') {
    const assignments = await Assigment.find({ user: userId }).select('_id');
    const courses = await Course.find({ createdBy: userId }).select('_id');

    matchQuery = {
      $or: [
        { assigment: { $in: assignments.map((a) => a._id) } },
        { course: { $in: courses.map((c) => c._id) } },
      ],
    };
  }

  const stats = await Payment.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalUserFee: { $sum: '$userFree' },
        totalAdminFee: { $sum: '$adminFree' },
      },
    },
  ]);

  const totalStats = await Payment.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalRevenue: { $sum: '$amount' },
        totalUserEarnings: { $sum: '$userFree' },
        totalAdminEarnings: { $sum: '$adminFree' },
      },
    },
  ]);

  return {
    byStatus: stats,
    overall: totalStats[0] || {
      totalPayments: 0,
      totalRevenue: 0,
      totalUserEarnings: 0,
      totalAdminEarnings: 0,
    },
  };
};

export const paymentService = {
  createAssasmtPay,
  approveAssasmentPayment,
  rejectAssasmentPayment,
  createCoursePay,
  approveCoursePayment,
  rejectCoursePayment,

  getPaymentById,
  getPaymentsByUser,
  getPaymentsForSeller,
  allPayments,
  getPaymentStats,
  getMyAllPayments,
};
