import { Types } from 'mongoose';

export type NotificationType =
  | 'message'
  | 'payment_approved'
  | 'payment_rejected'
  | 'assignment_applied'
  | 'applicant_accepted'
  | 'applicant_rejected'
  | 'referral_bonus'
  | 'payout_approved'
  | 'payout_rejected'
  | 'general';

export interface INotification {
  recipient: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  link?: string;
  relatedId?: Types.ObjectId;
}
