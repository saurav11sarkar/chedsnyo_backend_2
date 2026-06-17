import { Types } from 'mongoose';

export interface IPayout {
  user: Types.ObjectId;
  amount: number;
  method: 'iban' | 'paypal';
  accountDetails: string; // IBAN number or PayPal email
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  processedAt?: Date;
}
