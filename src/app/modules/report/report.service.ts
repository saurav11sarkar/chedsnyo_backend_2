import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import Report from './report.model';
import { ReportTargetType, ReportAction } from './report.interface';
import User from '../user/user.model';
import Assigment from '../assigment/assigment.model';

const createReport = async (
  reporterId: string,
  targetId: string,
  targetType: ReportTargetType,
  reason: string,
  description?: string,
) => {
  // Prevent duplicate reports from same user for same target
  const existing = await Report.findOne({ reporter: reporterId, targetId, targetType });
  if (existing) throw new AppError(400, 'You have already reported this');

  const report = await Report.create({
    reporter: reporterId,
    targetId,
    targetType,
    reason,
    description,
  });

  return report;
};

const getAllReports = async (params: any, options: IOption) => {
  const { page, limit, skip } = pagination(options);
  const { status, targetType } = params;

  const query: any = {};
  if (status) query.status = status;
  if (targetType) query.targetType = targetType;

  const result = await Report.find(query)
    .populate('reporter', 'firstName lastName email profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Report.countDocuments(query);
  return { data: result, meta: { total, page, limit } };
};

const takeAction = async (
  reportId: string,
  action: ReportAction,
  note?: string,
) => {
  const report = await Report.findById(reportId);
  if (!report) throw new AppError(404, 'Report not found');

  report.adminAction = action;
  report.adminNote = note;
  report.status = 'resolved';
  report.reviewedAt = new Date();
  await report.save();

  // Apply action on target
  if (report.targetType === 'user') {
    if (action === 'block') {
      await User.findByIdAndUpdate(report.targetId, { status: 'rejected' });
    } else if (action === 'remove') {
      await User.findByIdAndDelete(report.targetId);
    }
    // 'warn' — admin note is enough
  } else if (report.targetType === 'assignment') {
    if (action === 'remove') {
      await Assigment.findByIdAndDelete(report.targetId);
    } else if (action === 'block') {
      await Assigment.findByIdAndUpdate(report.targetId, { status: 'rejected' });
    }
  }

  return { message: `Action "${action}" applied successfully`, report };
};

export const reportService = {
  createReport,
  getAllReports,
  takeAction,
};
