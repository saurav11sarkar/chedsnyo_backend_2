import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { assigmentService } from './assigment.service';

const createAssigment = catchAsync(async (req, res) => {
  const userId = req.user?.id;

  // `req.files` will be an object because we used `.fields()`
  const files = req.files as {
    banner?: Express.Multer.File[];
    uploadFile?: Express.Multer.File[];
  };

  // Handle JSON data inside form-data (data field)
  const formData = req.body.data ? JSON.parse(req.body.data) : req.body;

  const result = await assigmentService.createAssigment(
    userId,
    formData,
    files,
  );

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: 'Assignment created successfully',
    data: result,
  });
});

const getAllAssigments = catchAsync(async (req, res) => {
  const filters = pick(req.query, [
    'searchTerm',
    'title',
    'description',
    'budget',
    'priceType',
    'paymentMethod',
    'status',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await assigmentService.getAllAssigments(filters, options);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: 'Assignment fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const myAllAssigments = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const filters = pick(req.query, [
    'searchTerm',
    'title',
    'description',
    'budget',
    'priceType',
    'paymentMethod',
    'status',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await assigmentService.myAllAssigments(
    userId,
    filters,
    options,
  );

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: 'Assignment fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleAssigment = catchAsync(async (req, res) => {
  // const userId = req.user?.id;
  const { id } = req.params;
  const result = await assigmentService.getSingleAssigment(id);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: 'Assignment fetched successfully',
    data: result,
  });
});

const updateAssigment = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  const files = req.files as {
    banner?: Express.Multer.File[];
    uploadFile?: Express.Multer.File[];
  };

  const formData = req.body.data ? JSON.parse(req.body.data) : req.body;

  const result = await assigmentService.updateAssigment(
    userId,
    id,
    formData,
    files,
  );

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: 'Assignment updated successfully',
    data: result,
  });
});

const deleteAssigment = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  const result = await assigmentService.deleteAssigment(userId, id);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: 'Assignment deleted successfully',
    data: result,
  });
});

const updateStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await assigmentService.updateStatus(id, req.body.status);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: 'Assignment status updated successfully',
    data: result,
  });
});

const applyForAssignment = catchAsync(async (req, res) => {
  const freelancerId = req.user?.id;
  const { id } = req.params;
  const result = await assigmentService.applyForAssignment(id, freelancerId);
  sendResponse(res, { success: true, statusCode: 200, message: result.message, data: null });
});

const getApplicants = catchAsync(async (req, res) => {
  const ownerId = req.user?.id;
  const { id } = req.params;
  const result = await assigmentService.getApplicants(id, ownerId);
  sendResponse(res, { success: true, statusCode: 200, message: 'Applicants fetched', data: result });
});

const acceptApplicant = catchAsync(async (req, res) => {
  const ownerId = req.user?.id;
  const { id, freelancerId } = req.params;
  const result = await assigmentService.acceptApplicant(id, freelancerId, ownerId);
  sendResponse(res, { success: true, statusCode: 200, message: result.message, data: null });
});

const rejectApplicant = catchAsync(async (req, res) => {
  const ownerId = req.user?.id;
  const { id, freelancerId } = req.params;
  const result = await assigmentService.rejectApplicant(id, freelancerId, ownerId);
  sendResponse(res, { success: true, statusCode: 200, message: result.message, data: null });
});

const updateWorkStatus = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { workStatus } = req.body;
  const result = await assigmentService.updateWorkStatus(id, userId, workStatus);
  sendResponse(res, { success: true, statusCode: 200, message: 'Work status updated', data: result });
});

export const assigmentController = {
  createAssigment,
  updateAssigment,
  deleteAssigment,
  updateStatus,
  getAllAssigments,
  getSingleAssigment,
  myAllAssigments,
  applyForAssignment,
  getApplicants,
  acceptApplicant,
  rejectApplicant,
  updateWorkStatus,
};
