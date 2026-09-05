const prisma = require('../../config/database');

/**
 * Get customer profile by userId
 * Uses userId from JWT — never trusts frontend-provided customerId
 */
const getCustomerProfile = async (userId) => {
  const customer = await prisma.customer.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!customer) {
    return { success: false, message: 'Customer profile not found.' };
  }

  return {
    success: true,
    customer: {
      id: customer.id,
      userId: customer.userId,
      name: customer.user.name,
      email: customer.user.email,
      customerCode: customer.customerCode,
      mobile: customer.mobile,
      address: customer.address,
      status: customer.user.status,
    },
  };
};

module.exports = { getCustomerProfile };
