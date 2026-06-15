import mongoose from 'mongoose';
import { IPayout } from './payout.interface';

const payoutSchema = new mongoose.Schema<IPayout>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['iban', 'paypal'], required: true },
    accountDetails: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true },
);

const Payout = mongoose.model<IPayout>('Payout', payoutSchema);
export default Payout;
