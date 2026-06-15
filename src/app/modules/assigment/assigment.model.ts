import mongoose from 'mongoose';
import { IAssigment } from './assigment.interface';

const assigmentSchema = new mongoose.Schema<IAssigment>(
  {
    banner: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    budget: {
      type: String,
      required: true,
    },
    priceType: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: 'stripe',
    },
    deadLine: {
      type: Date,
      required: true,
    },
    uploadFile: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['approved', 'rejected', 'pending'],
      default: 'pending',
    },
    workStatus: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed', 'cancelled', 'disputed'],
      default: 'not-started',
    },
    assignedFreelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    workStatusUpdatedAt: {
      type: Date,
    },
    isPublic: {
      type: Boolean,
      default: true,
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

const Assigment = mongoose.model<IAssigment>('Assigment', assigmentSchema);
export default Assigment;
