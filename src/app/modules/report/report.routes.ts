import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { reportController } from './report.controller';

const router = express.Router();

router.post('/', auth(userRole.admin, userRole.business, userRole.seles), reportController.createReport);
router.get('/', auth(userRole.admin), reportController.getAllReports);
router.put('/:id/action', auth(userRole.admin), reportController.takeAction);

export const reportRouter = router;
