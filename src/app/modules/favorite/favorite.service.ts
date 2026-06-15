import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import Favorite from './favorite.model';
import { FavoriteTargetType } from './favorite.interface';

const toggleFavorite = async (
  userId: string,
  targetId: string,
  targetType: FavoriteTargetType,
) => {
  const existing = await Favorite.findOne({ user: userId, targetId, targetType });

  if (existing) {
    await Favorite.findByIdAndDelete(existing._id);
    return { message: 'Removed from favorites', isFavorite: false };
  }

  await Favorite.create({ user: userId, targetId, targetType });
  return { message: 'Added to favorites', isFavorite: true };
};

const getMyFavorites = async (userId: string, options: IOption) => {
  const { page, limit, skip } = pagination(options);

  const result = await Favorite.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Favorite.countDocuments({ user: userId });

  return { data: result, meta: { total, page, limit } };
};

const checkIsFavorite = async (
  userId: string,
  targetId: string,
  targetType?: string,
) => {
  const query: any = { user: userId, targetId };
  if (targetType) query.targetType = targetType;

  const existing = await Favorite.findOne(query);
  return { isFavorite: !!existing };
};

export const favoriteService = {
  toggleFavorite,
  getMyFavorites,
  checkIsFavorite,
};
