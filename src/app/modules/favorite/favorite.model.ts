import mongoose from 'mongoose';
import { IFavorite } from './favorite.interface';

const favoriteSchema = new mongoose.Schema<IFavorite>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetType: {
      type: String,
      enum: ['user', 'assignment', 'course'],
      required: true,
    },
  },
  { timestamps: true },
);

// Unique constraint: one user cannot favorite the same item twice
favoriteSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true });

const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema);
export default Favorite;
