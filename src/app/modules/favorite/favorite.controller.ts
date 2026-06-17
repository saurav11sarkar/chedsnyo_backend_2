import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { favoriteService } from './favorite.service';

const toggleFavorite = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const { targetId, targetType } = req.body;
  const result = await favoriteService.toggleFavorite(userId, targetId, targetType);
  sendResponse(res, { success: true, statusCode: 200, message: result.message, data: { isFavorite: result.isFavorite } });
});

const getMyFavorites = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const options = pick(req.query, ['limit', 'page']);
  const result = await favoriteService.getMyFavorites(userId, options);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Favorites fetched',
    meta: result.meta,
    data: result.data,
  });
});

const checkIsFavorite = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { targetType } = req.query;
  const result = await favoriteService.checkIsFavorite(userId, id, targetType as string);
  sendResponse(res, { success: true, statusCode: 200, message: 'Check complete', data: result });
});

export const favoriteController = {
  toggleFavorite,
  getMyFavorites,
  checkIsFavorite,
};
