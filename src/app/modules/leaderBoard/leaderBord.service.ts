import pagination, { IOption } from '../../helper/pagenation';
import Course from '../course/course.model';
import Review from '../reviews/reviews.model';
import User from '../user/user.model';

const getLeaderboard = async (
  filter: 'weekly' | 'monthly' | 'yearly' = 'yearly',
  options: IOption,
) => {
  const { page, limit, skip } = pagination(options);

  const now = new Date();
  let startDate: Date;

  switch (filter) {
    case 'weekly':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
    default:
      startDate = new Date(now.getFullYear(), 0, 1);
  }

  const salesData = await Course.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: now },
        status: 'approved',
      },
    },
    {
      $project: {
        createdBy: 1,
        applicationCount: { $size: { $ifNull: ['$application', []] } },
      },
    },
    {
      $group: {
        _id: '$createdBy',
        totalSales: { $sum: '$applicationCount' },
      },
    },
  ]);

  const ratingsData = await Review.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: now },
        status: 'visible',
      },
    },
    {
      $group: {
        _id: '$course',
        avgRating: { $avg: '$rating' },
      },
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'course',
      },
    },
    { $unwind: '$course' },
    {
      $group: {
        _id: '$course.createdBy',
        avgRating: { $avg: '$avgRating' },
      },
    },
  ]);

  const combined = salesData.map((sale) => {
    const ratingObj = ratingsData.find(
      (r) => r._id?.toString() === sale._id?.toString(),
    );
    return {
      userId: sale._id,
      totalSales: sale.totalSales,
      avgRating: ratingObj ? ratingObj.avgRating : 0,
    };
  });

  const populatedLeaderboard = await Promise.all(
    combined.map(async (item) => {
      const user = await User.findById(item.userId).select(
        'firstName lastName email profileImage industry',
      );
      return {
        ...item,
        user,
      };
    }),
  );

  populatedLeaderboard.sort((a, b) => {
    if (b.totalSales === a.totalSales) return b.avgRating - a.avgRating;
    return b.totalSales - a.totalSales;
  });

  // Assign badges based on rank
  const withBadges = populatedLeaderboard.map((item, index) => {
    let badge = '';
    if (index === 0) badge = 'gold';
    else if (index <= 2) badge = 'silver';
    else if (index <= 9) badge = 'bronze';
    else badge = 'rising';

    return { ...item, rank: index + 1, badge };
  });

  const total = withBadges.length;
  const paginated = withBadges.slice(skip, skip + limit);

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: paginated,
  };
};

export const leaderboardService = {
  getLeaderboard,
};
