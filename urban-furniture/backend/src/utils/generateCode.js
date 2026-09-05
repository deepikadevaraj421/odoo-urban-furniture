const prisma = require('../config/database');

/**
 * Generate unique Accountant Code
 * Format: ACC-00001, ACC-00002, ...
 */
const generateAccountantCode = async () => {
  const lastAccountant = await prisma.accountant.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { accountantCode: true },
  });

  let nextNum = 1;

  if (lastAccountant && lastAccountant.accountantCode) {
    const parts = lastAccountant.accountantCode.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `ACC-${String(nextNum).padStart(5, '0')}`;
};

/**
 * Generate unique Customer Code
 * Format: CUS-00001, CUS-00002, ...
 */
const generateCustomerCode = async () => {
  const lastCustomer = await prisma.customer.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { customerCode: true },
  });

  let nextNum = 1;

  if (lastCustomer && lastCustomer.customerCode) {
    const parts = lastCustomer.customerCode.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `CUS-${String(nextNum).padStart(5, '0')}`;
};

module.exports = { generateAccountantCode, generateCustomerCode };
