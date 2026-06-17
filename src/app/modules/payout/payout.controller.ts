import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import pick from '../../helper/pick';
import { payoutService } from './payout.service';

const requestPayout = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const { amount, method, accountDetails } = req.body;
  const result = await payoutService.requestPayout(userId, amount, method, accountDetails);
  sendResponse(res, { success: true, statusCode: 201, message: 'Payout request submitted', data: result });
});

const getMyPayouts = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const options = pick(req.query, ['page', 'limit']);
  const result = await payoutService.getMyPayouts(userId, options);
  sendResponse(res, { success: true, statusCode: 200, message: 'Payout history fetched', meta: result.meta, data: result.data });
});

const getAllPayouts = catchAsync(async (req, res) => {
  const options = pick(req.query, ['page', 'limit']);
  const result = await payoutService.getAllPayouts(options);
  sendResponse(res, { success: true, statusCode: 200, message: 'All payouts fetched', meta: result.meta, data: result.data });
});

const approvePayout = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await payoutService.approvePayout(id, req.body.adminNote);
  sendResponse(res, { success: true, statusCode: 200, message: result.message, data: null });
});

const rejectPayout = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await payoutService.rejectPayout(id, req.body.adminNote);
  sendResponse(res, { success: true, statusCode: 200, message: result.message, data: null });
});

export const payoutController = {
  requestPayout,
  getMyPayouts,
  getAllPayouts,
  approvePayout,
  rejectPayout,
};
