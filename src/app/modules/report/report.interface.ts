import { Types } from 'mongoose';

export type ReportTargetType = 'user' | 'assignment';
export type ReportAction = 'warn' | 'block' | 'remove';

export interface IReport {
  reporter: Types.ObjectId;
  targetId: Types.ObjectId;
  targetType: ReportTargetType;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  adminAction?: ReportAction;
  adminNote?: string;
  reviewedAt?: Date;
}
