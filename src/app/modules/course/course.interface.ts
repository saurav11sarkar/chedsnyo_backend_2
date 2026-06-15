import { Types } from 'mongoose';

export interface ICourse {
  title: string;
  level: string;
  description: string;
  thumbnail?: string;
  introductionVideo?: string;
  courseVideo?: string;
  duration?: string;
  targetAudience?: string;
  language?: string;
  modules: number;
  extraFile?: string;
  price?: number;
  discount?: number;
  status: 'approved' | 'rejected' | 'pending';
  isPublic?: boolean;
  createdBy?: Types.ObjectId;
  application?: Types.ObjectId[];
  review?: Types.ObjectId[];
}
