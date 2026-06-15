import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { notificationService } from './notification.service';

const getMyNotifications = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const options = pick(req.query, ['limit', 'page']);
  const result = await notificationService.getMyNotifications(userId, options);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Notifications fetched',
    meta: result.meta,
    data: result.data,
  });
});

const markAsRead = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const result = await notificationService.markAsRead(id, userId);
  sendResponse(res, { success: true, statusCode: 200, message: 'Marked as read', data: result });
});

const markAllAsRead = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const result = await notificationService.markAllAsRead(userId);
  sendResponse(res, { success: true, statusCode: 200, message: result.message, data: null });
});

const deleteNotification = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const result = await notificationService.deleteNotification(id, userId);
  sendResponse(res, { success: true, statusCode: 200, message: result.message, data: null });
});

export const notificationController = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
