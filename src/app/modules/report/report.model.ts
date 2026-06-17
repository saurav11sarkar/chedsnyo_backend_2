import mongoose from 'mongoose';
import { IReport } from './report.interface';

const reportSchema = new mongoose.Schema<IReport>(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetType: { type: String, enum: ['user', 'assignment'], required: true },
    reason: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
    adminAction: { type: String, enum: ['warn', 'block', 'remove'] },
    adminNote: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

const Report = mongoose.model<IReport>('Report', reportSchema);
export default Report;
