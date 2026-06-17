import mongoose from 'mongoose';
import { ICourse } from './course.interface';

const courseSchema = new mongoose.Schema<ICourse>(
  {
    title: { type: String, required: true },
    level: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: { type: String },
    introductionVideo: { type: String, required: true },
    courseVideo: { type: String, required: true },
    duration: { type: String, required: true },
    targetAudience: { type: String, required: true },
    language: { type: String, required: true },
    modules: { type: Number, required: true },
    extraFile: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['approved', 'rejected', 'pending'],
      default: 'pending',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    application: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    review: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
  },
  { timestamps: true },
);

const Course = mongoose.model<ICourse>('Course', courseSchema);
export default Course;
