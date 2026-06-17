import { Types } from 'mongoose';

export interface IAssigment {
  banner: string;
  title: string;
  description?: string;
  budget: string;
  priceType: string;
  paymentMethod: string;
  deadLine?: Date;
  uploadFile?: string;
  user?: Types.ObjectId;
  status?: 'approved' | 'rejected' | 'pending';
  workStatus?: 'not-started' | 'in-progress' | 'completed' | 'cancelled' | 'disputed';
  assignedFreelancer?: Types.ObjectId;
  workStatusUpdatedAt?: Date;
  isPublic?: boolean;
  application?: Types.ObjectId[];
  review?: Types.ObjectId[];
}
