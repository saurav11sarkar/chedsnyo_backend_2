import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { notificationController } from './notification.controller';

const router = express.Router();

router.get('/', auth(userRole.admin, userRole.business, userRole.seles), notificationController.getMyNotifications);
router.put('/read-all', auth(userRole.admin, userRole.business, userRole.seles), notificationController.markAllAsRead);
router.put('/:id/read', auth(userRole.admin, userRole.business, userRole.seles), notificationController.markAsRead);
router.delete('/:id', auth(userRole.admin, userRole.business, userRole.seles), notificationController.deleteNotification);

export const notificationRouter = router;
