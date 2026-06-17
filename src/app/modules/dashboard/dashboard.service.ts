import Payment from '../payment/payment.model';
import { userRole } from '../user/user.constant';
import User from '../user/user.model';

const dashboardOverview = async () => {
  const revenue = await Payment.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: null, totalRevenue: { $sum: '$adminFree' } } },
  ]);
  const business = await User.countDocuments({ role: userRole.business });
  const sele = await User.countDocuments({ role: userRole.seles });

  return {
    revenue: revenue.length > 0 ? revenue[0].totalRevenue : 0,
    business,
    sele,
  };
};

const getMonthlyEarnings = async (year: number) => {
  const earnings = await Payment.aggregate([
    {
      $match: {
        status: 'approved',
        paymentDate: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$paymentDate' },
        totalEarnings: { $sum: '$adminFree' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // convert month number to name and fill missing months
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const monthlyData = months.map((month, index) => {
    const found = earnings.find((e) => e._id === index + 1);
    return {
      month,
      totalEarnings: found ? found.totalEarnings : 0,
    };
  });

  return monthlyData;
};

// Freelancer (seles) dashboard stats
const freelancerDashboard = async (userId: string) => {
  const Payment = (await import('../payment/payment.model')).default;
  const Assigment = (await import('../assigment/assigment.model')).default;
  const Course = (await import('../course/course.model')).default;
  const User = (await import('../user/user.model')).default;

  const user = await User.findById(userId).select('balance commissionRate referralCode referredBy firstName lastName email profileImage');
  if (!user) throw new Error('User not found');

  // Assignments this freelancer applied to
  const appliedAssignments = await Assigment.countDocuments({ application: userId });

  // Courses created by this freelancer
  const totalCourses = await Course.countDocuments({ createdBy: userId });
  const approvedCourses = await Course.countDocuments({ createdBy: userId, status: 'approved' });

  // Earnings from payments where freelancer owns the assignment/course
  const myAssignments = await Assigment.find({ user: userId }).select('_id');
  const myCourses = await Course.find({ createdBy: userId }).select('_id');

  const earningsAgg = await Payment.aggregate([
    {
      $match: {
        status: 'approved',
        $or: [
          { assigment: { $in: myAssignments.map((a) => a._id) } },
          { course: { $in: myCourses.map((c) => c._id) } },
        ],
      },
    },
    { $group: { _id: null, totalEarned: { $sum: '$userFree' } } },
  ]);

  // Referral count
  const referralCount = await User.countDocuments({ referredBy: userId });

  return {
    user,
    stats: {
      walletBalance: user.balance || 0,
      commissionRate: user.commissionRate || 15,
      appliedAssignments,
      totalCourses,
      approvedCourses,
      totalEarned: earningsAgg[0]?.totalEarned || 0,
      referralCount,
    },
  };
};

// Company (business) dashboard stats
const companyDashboard = async (userId: string) => {
  const Payment = (await import('../payment/payment.model')).default;
  const Assigment = (await import('../assigment/assigment.model')).default;
  const User = (await import('../user/user.model')).default;

  const user = await User.findById(userId).select('firstName lastName email profileImage balance businessName');
  if (!user) throw new Error('User not found');

  const myJobs = await Assigment.find({ user: userId });
  const totalJobs = myJobs.length;
  const approvedJobs = myJobs.filter((j) => j.status === 'approved').length;
  const pendingJobs = myJobs.filter((j) => j.status === 'pending').length;

  const totalApplicants = myJobs.reduce(
    (sum, job) => sum + (job.application?.length || 0),
    0,
  );

  const myAssignmentIds = myJobs.map((j) => j._id);

  const paymentsAgg = await Payment.aggregate([
    { $match: { assigment: { $in: myAssignmentIds } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const paymentSummary: Record<string, any> = {};
  paymentsAgg.forEach((p) => {
    paymentSummary[p._id] = { count: p.count, total: p.total };
  });

  return {
    user,
    stats: {
      totalJobs,
      approvedJobs,
      pendingJobs,
      totalApplicants,
      paymentSummary,
    },
  };
};

export const dashboardService = {
  dashboardOverview,
  getMonthlyEarnings,
  freelancerDashboard,
  companyDashboard,
};
