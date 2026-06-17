import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { payoutController } from './payout.controller';

const router = express.Router();

// Freelancer/Business: request payout & view own history
router.post('/', auth(userRole.seles, userRole.business), payoutController.requestPayout);
router.get('/my', auth(userRole.seles, userRole.business), payoutController.getMyPayouts);

// Admin: list all & approve/reject
router.get('/', auth(userRole.admin), payoutController.getAllPayouts);
router.put('/:id/approve', auth(userRole.admin), payoutController.approvePayout);
router.put('/:id/reject', auth(userRole.admin), payoutController.rejectPayout);

export const payoutRouter = router;
