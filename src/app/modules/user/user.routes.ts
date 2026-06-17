import express from 'express';
import { userController } from './user.controller';
import auth from '../../middlewares/auth';
import { fileUploader } from '../../helper/fileUploder';
import { userRole } from './user.constant';

const router = express.Router();

// কন্ট্রাক্টর Stripe account তৈরি করবে
router.post(
  '/create-stripe-account',
  auth(userRole.business, userRole.seles),
  userController.createStripeAccount,
);

// কন্ট্রাক্টর Stripe dashboard লিংক নেবে
router.get(
  '/dashboard-link',
  auth(userRole.business, userRole.seles),
  userController.getStripeDashboardLink,
);

router.post('/create-user', userController.createUser);

router.get('/enrollment-history',auth(userRole.seles,userRole.business), userController.enrollmentHistory);

router.get(
  '/profile',
  auth(userRole.admin, userRole.business, userRole.seles),
  userController.profile,
);
router.put(
  '/profile',
  auth(userRole.admin, userRole.business, userRole.seles),
  fileUploader.upload.single('profileImage'),
  userController.updateUserById,
);

router.get('/all-user', userController.getAllUser);
router.get('/:id', userController.getUserById);

router.delete('/:id', auth(userRole.admin), userController.deleteUserById);
router.put('/status/:id', auth(userRole.admin), userController.updateStatus);
router.put('/commission/:id', auth(userRole.admin), userController.setCommissionRate);
router.get('/wallet/balance', auth(userRole.admin, userRole.business, userRole.seles), userController.getUserBalance);

export const userRoutes = router;
