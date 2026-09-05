const prisma = require('../../config/database');
const { hashPassword } = require('../auth/password.service');
const { generateAccountantCode, generateCustomerCode } = require('../../utils/generateCode');
const { sendAccountActivationEmail } = require('../../utils/email');

/**
 * Create a new Accountant account (Admin only)
 */
const createAccountant = async (data, adminId) => {
  const { name, email, mobile, employeeId, department, accountantType, password } = data;

  // Check email uniqueness
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { success: false, message: 'A user with this email already exists.' };
  }

  // Check employee ID uniqueness
  const existingEmpId = await prisma.accountant.findUnique({ where: { employeeId } });
  if (existingEmpId) {
    return { success: false, message: 'An accountant with this Employee ID already exists.' };
  }

  // Generate accountant code
  const accountantCode = await generateAccountantCode();

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user and accountant profile in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'ACCOUNTANT',
        status: 'ACTIVE',
        createdBy: adminId,
      },
    });

    const accountant = await tx.accountant.create({
      data: {
        userId: user.id,
        accountantCode,
        employeeId,
        mobile,
        department,
        accountantType,
      },
    });

    return { user, accountant };
  });

  // Send activation email
  try {
    await sendAccountActivationEmail(email, name, result.accountant.accountantCode, password);
  } catch (emailError) {
    console.error('Failed to send activation email:', emailError.message);
    // Don't fail the creation if email fails
  }

  return {
    success: true,
    message: 'Accountant created successfully.',
    accountant: {
      id: result.accountant.id,
      userId: result.user.id,
      name: result.user.name,
      email: result.user.email,
      accountantCode: result.accountant.accountantCode,
      employeeId: result.accountant.employeeId,
      department: result.accountant.department,
      accountantType: result.accountant.accountantType,
      status: result.user.status,
    },
  };
};

/**
 * Create a new Customer account (Admin only)
 */
const createCustomer = async (data, adminId) => {
  const { name, email, mobile, address } = data;

  // Check email uniqueness
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { success: false, message: 'A user with this email already exists.' };
  }

  // Generate customer code
  const customerCode = await generateCustomerCode();

  // Create user and customer profile in a transaction
  // Customers authenticate via OTP only — no password needed
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        createdBy: adminId,
      },
    });

    const customer = await tx.customer.create({
      data: {
        userId: user.id,
        customerCode,
        mobile,
        address,
      },
    });

    return { user, customer };
  });

  return {
    success: true,
    message: 'Customer created successfully.',
    customer: {
      id: result.customer.id,
      userId: result.user.id,
      name: result.user.name,
      email: result.user.email,
      customerCode: result.customer.customerCode,
      mobile: result.customer.mobile,
      address: result.customer.address,
      status: result.user.status,
    },
  };
};

/**
 * Get list of all Accountants (Admin only)
 */
const getAccountants = async () => {
  const accountants = await prisma.accountant.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = accountants.map((a) => ({
    id: a.id,
    userId: a.userId,
    name: a.user.name,
    email: a.user.email,
    accountantCode: a.accountantCode,
    employeeId: a.employeeId,
    mobile: a.mobile,
    department: a.department,
    accountantType: a.accountantType,
    status: a.user.status,
    createdAt: a.createdAt,
  }));

  return {
    success: true,
    accountants: formatted,
  };
};

module.exports = { createAccountant, createCustomer, getAccountants };
