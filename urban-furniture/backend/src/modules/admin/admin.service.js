const prisma = require('../../config/database');
const { generateAccountantCode, generateCustomerCode } = require('../../utils/generateCode');
const { createAndSendInvitation } = require('../auth/invitation.service');

/**
 * Create a new Accountant account (Admin only)
 * - Sets status = INVITED
 * - NO password parameters accepted or generated
 * - Sends email invitation with token link
 */
const createAccountant = async (data, adminId) => {
  const { name, email, mobile, employeeId, department, accountantType } = data;

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

  // Create user and accountant profile in transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash: null, // Password created later by accountant
        role: 'ACCOUNTANT',
        status: 'INVITED',
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

  // Generate secure token and send email invitation
  try {
    await createAndSendInvitation({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      accountantCode: result.accountant.accountantCode,
      accountantType: result.accountant.accountantType,
    });
  } catch (emailError) {
    console.error('Failed to send invitation email:', emailError.message);
  }

  return {
    success: true,
    message: 'Accountant created and invitation sent successfully.',
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

/**
 * Create Customer account (Admin only - placeholder)
 */
const createCustomer = async (data, adminId) => {
  const { name, email, mobile, address } = data;

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { success: false, message: 'A user with this email already exists.' };
  }

  const customerCode = await generateCustomerCode();

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

module.exports = { createAccountant, getAccountants, createCustomer };
