import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { dashboardController } from './dashboard.controller';
const router = express.Router();

router.get(
  '/overview',
  auth(userRole.admin),
  dashboardController.dashboardOverview,
);

router.get(
  '/monthly-earnings',
  auth(userRole.admin),
  dashboardController.getMonthlyEarnings,
);

router.get('/freelancer', auth(userRole.seles), dashboardController.freelancerDashboard);
router.get('/company', auth(userRole.business), dashboardController.companyDashboard);

export const dashboardRouter = router;
