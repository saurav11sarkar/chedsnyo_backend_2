import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';
import User from '../user/user.model';
import { ICourse } from './course.interface';
import Course from './course.model';

const createCourse = async (
  userId: string,
  payload: ICourse,
  files?: {
    thumbnail?: Express.Multer.File[];
    introductionVideo?: Express.Multer.File[];
    courseVideo?: Express.Multer.File[];
    extraFile?: Express.Multer.File[];
  },
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  // Check thumbnail
  if (!files?.thumbnail || files.thumbnail.length === 0) {
    throw new AppError(400, 'Thumbnail file is required');
  }

  // Upload thumbnail
  const thumbnailImage = await fileUploader.uploadToCloudinary(
    files.thumbnail[0],
  );
  payload.thumbnail = thumbnailImage.secure_url;

  // Upload introduction video (if exists)
  if (files.introductionVideo && files.introductionVideo.length > 0) {
    const introductionVideoRes = await fileUploader.uploadToCloudinary(
      files.introductionVideo[0],
    );
    payload.introductionVideo = introductionVideoRes.secure_url;
  }

  // Upload course video (if exists)
  if (files.courseVideo && files.courseVideo.length > 0) {
    const courseVideoRes = await fileUploader.uploadToCloudinary(
      files.courseVideo[0],
    );
    payload.courseVideo = courseVideoRes.secure_url;
  }

  // Upload extra file (if exists)
  if (files.extraFile && files.extraFile.length > 0) {
    const extraFileRes = await fileUploader.uploadToCloudinary(
      files.extraFile[0],
    );
    payload.extraFile = extraFileRes.secure_url;
  }

  // Create course in database
  const result = await Course.create({ ...payload, createdBy: user._id });
  if (!result) throw new AppError(400, 'Course creation failed');

  return result;
};

const getAllCourse = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = [
    'title',
    'level',
    'description',
    'targetAudience',
    'language',
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

  const result = await Course.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any)
    .populate('createdBy', 'firstName lastName email role profileImage');

  const total = await Course.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const getMyAllCourse = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = [
    'title',
    'level',
    'description',
    'targetAudience',
    'language',
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

  const result = await Course.find({ ...whereCondition, createdBy: userId })
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any)
    .populate('createdBy', 'firstName lastName email role profileImage');

  const total = await Course.countDocuments({
    ...whereCondition,
    createdBy: userId,
  });

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const getSingleCourse = async (id: string) => {
  console.log(id);
  const result = await Course.findById(id).populate(
    'createdBy',
    'firstName lastName email role profileImage',
  ).populate({
      path: 'review', // populate the review array
      select: 'rating comment createdAt', // fields from review
      populate: {
        path: 'user', // nested populate to get user info for each review
        select: 'firstName lastName profileImage',
      },
    });
  if (!result) throw new AppError(400, 'course is not found');
  return result;
};

const updateCourse = async (
  userId: string,
  id: string,
  payload: Partial<ICourse>,
  files?: {
    thumbnail?: Express.Multer.File[];
    introductionVideo?: Express.Multer.File[];
    courseVideo?: Express.Multer.File[];
    extraFile?: Express.Multer.File[];
  },
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  const course = await Course.findById(id);
  if (!course) throw new AppError(404, 'Course not found');

  if (course.createdBy!.toString() !== user._id.toString()) {
    throw new AppError(403, 'You are not authorized to update this course');
  }

  // Check thumbnail
  if (files?.thumbnail && files.thumbnail.length > 0) {
    const thumbnailImage = await fileUploader.uploadToCloudinary(
      files.thumbnail[0],
    );
    payload.thumbnail = thumbnailImage.secure_url;
  }

  // Upload introduction video (if exists)
  if (files?.introductionVideo && files.introductionVideo.length > 0) {
    const introductionVideoRes = await fileUploader.uploadToCloudinary(
      files.introductionVideo[0],
    );
    payload.introductionVideo = introductionVideoRes.secure_url;
  }

  // Upload course video (if exists)
  if (files?.courseVideo && files.courseVideo.length > 0) {
    const courseVideoRes = await fileUploader.uploadToCloudinary(
      files.courseVideo[0],
    );
    payload.courseVideo = courseVideoRes.secure_url;
  }

  // Upload extra file (if exists)
  if (files?.extraFile && files.extraFile.length > 0) {
    const extraFileRes = await fileUploader.uploadToCloudinary(
      files.extraFile[0],
    );
    payload.extraFile = extraFileRes.secure_url;
  }

  const result = await Course.findByIdAndUpdate(id, payload, { new: true });
  if (!result) throw new AppError(400, 'Course update failed');
  return result;
};

const deleteCourse = async (userId: string, id: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  const course = await Course.findById(id);
  if (!course) throw new AppError(404, 'Course not found');

  if (course.createdBy!.toString() !== user._id.toString()) {
    throw new AppError(403, 'You are not authorized to update this course');
  }

  const result = await Course.findByIdAndDelete(id);
  if (!result) throw new AppError(400, 'Course delete failed');
  return result;
};

const updateCourseStatus = async (id: string, status: string) => {
  const result = await Course.findByIdAndUpdate(id, { status }, { new: true });
  if (!result) throw new AppError(400, 'Course status update failed');
  return result;
};

export const courseService = {
  createCourse,
  getAllCourse,
  getMyAllCourse,
  getSingleCourse,
  updateCourse,
  deleteCourse,
  updateCourseStatus,
};
