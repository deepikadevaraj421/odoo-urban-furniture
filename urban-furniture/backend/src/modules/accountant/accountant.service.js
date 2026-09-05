const prisma = require('../../config/database');

/**
 * Get accountant profile by userId
 */
const getAccountantProfile = async (userId) => {
  const accountant = await prisma.accountant.findUnique({
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

  if (!accountant) {
    return { success: false, message: 'Accountant profile not found.' };
  }

  return {
    success: true,
    accountant: {
      id: accountant.id,
      userId: accountant.userId,
      name: accountant.user.name,
      email: accountant.user.email,
      accountantCode: accountant.accountantCode,
      employeeId: accountant.employeeId,
      mobile: accountant.mobile,
      department: accountant.department,
      accountantType: accountant.accountantType,
      status: accountant.user.status,
    },
  };
};

module.exports = { getAccountantProfile };
