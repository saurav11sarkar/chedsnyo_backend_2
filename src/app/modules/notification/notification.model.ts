import mongoose from 'mongoose';
import { INotification } from './notification.interface';

const notificationSchema = new mongoose.Schema<INotification>(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'message',
        'payment_approved',
        'payment_rejected',
        'assignment_applied',
        'applicant_accepted',
        'applicant_rejected',
        'referral_bonus',
        'payout_approved',
        'payout_rejected',
        'general',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true },
);

const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
