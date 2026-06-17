import { Types } from 'mongoose';

export type FavoriteTargetType = 'user' | 'assignment' | 'course';

export interface IFavorite {
  user: Types.ObjectId;
  targetId: Types.ObjectId;
  targetType: FavoriteTargetType;
}
