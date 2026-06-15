import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { reportService } from './report.service';

const createReport = catchAsync(async (req, res) => {
  const reporterId = req.user?.id;
  const { targetId, targetType, reason, description } = req.body;
  const result = await reportService.createReport(reporterId, targetId, targetType, reason, description);
  sendResponse(res, { success: true, statusCode: 201, message: 'Report submitted', data: result });
});

const getAllReports = catchAsync(async (req, res) => {
  const filters = pick(req.query, ['status', 'targetType']);
  const options = pick(req.query, ['limit', 'page']);
  const result = await reportService.getAllReports(filters, options);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Reports fetched',
    meta: result.meta,
    data: result.data,
  });
});

const takeAction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { action, note } = req.body;
  const result = await reportService.takeAction(id, action, note);
  sendResponse(res, { success: true, statusCode: 200, message: result.message, data: result.report });
});

export const reportController = {
  createReport,
  getAllReports,
  takeAction,
};
