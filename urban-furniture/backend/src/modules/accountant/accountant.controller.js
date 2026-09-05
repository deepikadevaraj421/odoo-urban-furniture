const accountantService = require('./accountant.service');

/**
 * GET /api/accountant/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const result = await accountantService.getAccountantProfile(req.user.userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/accountant/sales/dashboard
 * Placeholder — returns empty dashboard data
 */
const getSalesDashboard = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Sales Accountant Dashboard',
    data: {},
  });
};

/**
 * GET /api/accountant/purchase/dashboard
 * Placeholder — returns empty dashboard data
 */
const getPurchaseDashboard = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Purchase Accountant Dashboard',
    data: {},
  });
};

module.exports = { getProfile, getSalesDashboard, getPurchaseDashboard };
