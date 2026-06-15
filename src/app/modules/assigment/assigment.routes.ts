import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { assigmentController } from './assigment.controller';
import { fileUploader } from '../../helper/fileUploder';
const router = express.Router();

router.post(
  '/',
  auth(userRole.business),
  fileUploader.upload.fields([
    { name: 'banner', maxCount: 1 },
    { name: 'uploadFile', maxCount: 1 },
  ]),
  assigmentController.createAssigment,
);

router.get('/', assigmentController.getAllAssigments);
router.get(
  '/my-assigments',
  auth(userRole.business),
  assigmentController.myAllAssigments,
);
router.get('/:id', assigmentController.getSingleAssigment);

router.put(
  '/:id',
  auth(userRole.business),
  fileUploader.upload.fields([
    { name: 'banner', maxCount: 1 },
    { name: 'uploadFile', maxCount: 1 },
  ]),
  assigmentController.updateAssigment,
);
router.delete(
  '/:id',
  auth(userRole.business),
  assigmentController.deleteAssigment,
);

router.put(
  '/:id/status',
  auth(userRole.admin),
  assigmentController.updateStatus,
);

// Application routes
router.post('/:id/apply', auth(userRole.seles), assigmentController.applyForAssignment);
router.get('/:id/applicants', auth(userRole.business), assigmentController.getApplicants);
router.put('/:id/applicants/:freelancerId/accept', auth(userRole.business), assigmentController.acceptApplicant);
router.put('/:id/applicants/:freelancerId/reject', auth(userRole.business), assigmentController.rejectApplicant);

// Work status tracking route (company + freelancer can update)
router.put('/:id/work-status', auth(userRole.business, userRole.seles), assigmentController.updateWorkStatus);

export const assigmentRouter = router;
