import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import pick from '../../helper/pick';
import { userService } from './user.service';

const createUser = catchAsync(async (req, res) => {
  const result = await userService.createUser(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User created successfully',
    data: result,
  });
});

const getAllUser = catchAsync(async (req, res) => {
  const filters = pick(req.query, [
    'searchTerm',
    'firstName',
    'lastName',
    'email',
    'role',
    'status',
    'businessName'
  ]);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
  const result = await userService.getAllUser(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getUserById = catchAsync(async (req, res) => {
  const result = await userService.getUserById(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User fetched successfully',
    data: result,
  });
});

const updateUserById = catchAsync(async (req, res) => {
  const file = req.file;
  const fromData = req.body.data ? JSON.parse(req.body.data) : req.body;
  const result = await userService.updateUserById(req.user.id, fromData, file);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

const deleteUserById = catchAsync(async (req, res) => {
  const result = await userService.deleteUserById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});

const profile = catchAsync(async (req, res) => {
  const result = await userService.profile(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User profile fetched successfully',
    data: result,
  });
});

const updateStatus = catchAsync(async (req, res) => {
  const result = await userService.updateStatus(req.params.id, req.body.status);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User status updated successfully',
    data: result,
  });
});

const createStripeAccount = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const result = await userService.createStripeAccount(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: { url: result.url },
  });
});

// Dashboard লিংক নেবে
const getStripeDashboardLink = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const result = await userService.getStripeDashboardLink(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: { url: result.url },
  });
});

const enrollmentHistory = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const result = await userService.enrollmentHistory(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Enrollment history',
    data: result,
  });
});

const setCommissionRate = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { commissionRate } = req.body;
  const result = await userService.setCommissionRate(id, commissionRate);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: result.user });
});

const getUserBalance = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const result = await userService.getUserBalance(userId);
  sendResponse(res, { statusCode: 200, success: true, message: 'Balance fetched', data: result });
});

export const userController = {
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
