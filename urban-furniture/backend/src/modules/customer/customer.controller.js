const customerService = require('./customer.service');

/**
 * GET /api/customer/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const result = await customerService.getCustomerProfile(req.user.userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customer/dashboard
 * Placeholder — returns empty dashboard data
 */
const getDashboard = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Customer Dashboard',
    data: {},
  });
};

module.exports = { getProfile, getDashboard };
