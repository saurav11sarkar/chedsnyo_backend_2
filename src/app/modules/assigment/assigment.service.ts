import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';
import User from '../user/user.model';
import { IAssigment } from './assigment.interface';
import Assigment from './assigment.model';

const createAssigment = async (
  userId: string,
  payload: IAssigment,
  files?: {
    banner?: Express.Multer.File[];
    uploadFile?: Express.Multer.File[];
  },
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  if (!files?.banner || files.banner.length === 0) {
    throw new AppError(400, 'Banner file is required');
  }

  const bannerUpload = await fileUploader.uploadToCloudinary(files.banner[0]);
  payload.banner = bannerUpload.secure_url;

  if (files.uploadFile && files.uploadFile.length > 0) {
    const uploadFileRes = await fileUploader.uploadToCloudinary(
      files.uploadFile[0],
    );
    payload.uploadFile = uploadFileRes.secure_url;
  }

  const result = await Assigment.create({
    ...payload,
    user: user._id,
  });

  return result;
};

const getAllAssigments = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = [
    'title',
    'description',
    'budget',
    'priceType',
    'paymentMethod',
    'status',
  ];

  if (searchTerm) {
    andCondition.push({
      $or: userSearchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    });
  }

  if (Object.keys(filterData).length) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await Assigment.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any)
    .populate('user', 'firstName lastName email role profileImage');

  const total = await Assigment.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const getSingleAssigment = async (id: string) => {
  const result = await Assigment.findById(id).populate(
    'user',
    'firstName lastName email role profileImage',
  ).populate({
      path: 'review', // populate the review array
      select: 'rating comment createdAt', // fields from review
      populate: {
        path: 'user', // nested populate to get user info for each review
        select: 'firstName lastName profileImage',
      },
    });
  if (!result) throw new AppError(404, 'Assignment not found');
  return result;
};

const myAllAssigments = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = [
    'title',
    'description',
    'budget',
    'priceType',
    'paymentMethod',
    'status',
  ];

  if (searchTerm) {
    andCondition.push({
      $or: userSearchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    });
  }

  if (Object.keys(filterData).length) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await Assigment.find({ ...whereCondition, user: userId })
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any)
    .populate('user', 'firstName lastName email role profileImage');

  const total = await Assigment.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const updateAssigment = async (
  userId: string,
  id: string,
  payload: Partial<IAssigment>,
  files?: {
    banner?: Express.Multer.File[];
    uploadFile?: Express.Multer.File[];
  },
) => {
  const assigment = await Assigment.findById(id);
  if (!assigment) {
    throw new AppError(404, 'Assignment not found');
  }

  // Only owner or admin can update
  if (assigment.user?.toString() !== userId.toString()) {
    throw new AppError(403, 'You are not authorized to update this assignment');
  }

  // Handle banner file upload if provided
  if (files?.banner && files.banner.length > 0) {
    const bannerUpload = await fileUploader.uploadToCloudinary(files.banner[0]);
    payload.banner = bannerUpload.secure_url;
  }

  // Handle other uploadFile if provided
  if (files?.uploadFile && files.uploadFile.length > 0) {
    const uploadFileRes = await fileUploader.uploadToCloudinary(
      files.uploadFile[0],
    );
    payload.uploadFile = uploadFileRes.secure_url;
  }

  const updated = await Assigment.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updated;
};

const deleteAssigment = async (userId: string, id: string) => {
  const assigment = await Assigment.findById(id);
  if (!assigment) {
    throw new AppError(404, 'Assignment not found');
  }
  if (assigment.user?.toString() !== userId.toString()) {
    throw new AppError(403, 'You are not authorized to delete this assignment');
  }
  const deleted = await Assigment.findByIdAndDelete(id);
  return deleted;
};

const updateStatus = async (id: string, status: string) => {
  const assigment = await Assigment.findById(id);
  if (!assigment) {
    throw new AppError(404, 'Assignment not found');
  }
  const updated = await Assigment.findByIdAndUpdate(
    id,
    { status },
    {
      new: true,
      runValidators: true,
    },
  );

  return updated;
};

export const assigmentService = {
  createAssigment,
  updateAssigment,
  deleteAssigment,
  updateStatus,
  getAllAssigments,
  getSingleAssigment,
  myAllAssigments,
};
