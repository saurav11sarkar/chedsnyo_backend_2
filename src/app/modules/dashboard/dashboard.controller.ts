import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { dashboardService } from './dashboard.service';

const dashboardOverview = catchAsync(async (req, res) => {
  const result = await dashboardService.dashboardOverview();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard Overview retrieved successfully',
    data: result,
  });
});

const getMonthlyEarnings = catchAsync(async (req, res) => {
  const { year } = req.query;
  const selectedYear = year ? Number(year) : new Date().getFullYear();
  const result = await dashboardService.getMonthlyEarnings(selectedYear);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Monthly earnings retrieved successfully',
    data: result,
  });
});

const freelancerDashboard = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const result = await dashboardService.freelancerDashboard(userId);
  sendResponse(res, { statusCode: 200, success: true, message: 'Freelancer dashboard', data: result });
});

const companyDashboard = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const result = await dashboardService.companyDashboard(userId);
  sendResponse(res, { statusCode: 200, success: true, message: 'Company dashboard', data: result });
});

export const dashboardController = {
  dashboardOverview,
  getMonthlyEarnings,
  freelancerDashboard,
  companyDashboard,
};
