import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { favoriteController } from './favorite.controller';

const router = express.Router();

router.post('/toggle', auth(userRole.admin, userRole.business, userRole.seles), favoriteController.toggleFavorite);
router.get('/my', auth(userRole.admin, userRole.business, userRole.seles), favoriteController.getMyFavorites);
router.get('/check/:id', auth(userRole.admin, userRole.business, userRole.seles), favoriteController.checkIsFavorite);

export const favoriteRouter = router;
