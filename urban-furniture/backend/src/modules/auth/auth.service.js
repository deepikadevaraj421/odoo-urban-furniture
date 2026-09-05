const prisma = require('../../config/database');
const { comparePassword } = require('./password.service');
const { generateToken } = require('./jwt.service');
const { createAndSendOtp, verifyOtp } = require('./otp.service');

/**
 * Admin Login — Email + Password → JWT (no OTP)
 */
const loginAdmin = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Invalid email or password.' };
  }

  if (user.status !== 'ACTIVE') {
    return { success: false, message: 'Account is inactive.' };
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, message: 'Invalid email or password.' };
  }

  // Admin does NOT require OTP — issue token immediately
  const token = generateToken({ userId: user.id, role: user.role });

  return {
    success: true,
    requiresOtp: false,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    redirectTo: '/admin/dashboard',
  };
};

/**
 * Accountant Login — Email/Code + Password → OTP sent
 */
const loginAccountant = async (identifier, password) => {
  // Find by email or accountant code
  let user;
  let accountant;

  // Try as accountant code first
  accountant = await prisma.accountant.findUnique({
    where: { accountantCode: identifier },
    include: { user: true },
  });

  if (accountant) {
    user = accountant.user;
  } else {
    // Try as email
    user = await prisma.user.findUnique({
      where: { email: identifier },
      include: { accountant: true },
    });
    if (user) {
      accountant = user.accountant;
    }
  }

  if (!user || user.role !== 'ACCOUNTANT' || !accountant) {
    return { success: false, message: 'Invalid credentials.' };
  }

  if (user.status !== 'ACTIVE') {
    return { success: false, message: 'Account is inactive. Contact administrator.' };
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, message: 'Invalid credentials.' };
  }

  // Send OTP
  await createAndSendOtp(user.id, user.email);

  return {
    success: true,
    requiresOtp: true,
    userId: user.id,
    message: 'OTP sent to your registered email.',
  };
};

/**
 * Customer Login — Customer Code + Email → OTP sent (no password)
 */
const loginCustomer = async (customerCode, email) => {
  const customer = await prisma.customer.findUnique({
    where: { customerCode },
    include: { user: true },
  });

  if (!customer || customer.user.email !== email) {
    return { success: false, message: 'Invalid customer code or email.' };
  }

  if (customer.user.status !== 'ACTIVE') {
    return { success: false, message: 'Account is inactive. Contact administrator.' };
  }

  // Send OTP
  await createAndSendOtp(customer.user.id, customer.user.email);

  return {
    success: true,
    requiresOtp: true,
    userId: customer.user.id,
    message: 'OTP sent to your registered email.',
  };
};

/**
 * Verify OTP and generate JWT
 */
const verifyOtpAndLogin = async (userId, otp) => {
  const result = await verifyOtp(userId, otp);

  if (!result.valid) {
    return { success: false, message: result.message };
  }

  // Fetch user with relations
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accountant: true,
      customer: true,
    },
  });

  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  // Generate JWT
  const token = generateToken({ userId: user.id, role: user.role });

  // Determine redirect based on role and type
  let redirectTo = '/login';
  let accountantType = null;
  let customerCode = null;

  if (user.role === 'ACCOUNTANT' && user.accountant) {
    accountantType = user.accountant.accountantType;
    redirectTo = accountantType === 'SALES'
      ? '/accountant/sales/dashboard'
      : '/accountant/purchase/dashboard';
  } else if (user.role === 'CUSTOMER' && user.customer) {
    customerCode = user.customer.customerCode;
    redirectTo = '/customer/dashboard';
  }

  return {
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountantType,
      customerCode,
    },
    redirectTo,
  };
};

/**
 * Resend OTP
 */
const resendOtp = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  await createAndSendOtp(user.id, user.email);

  return {
    success: true,
    message: 'New OTP sent to your registered email.',
  };
};

/**
 * Get current user info (from JWT)
 */
const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      accountant: {
        select: {
          accountantCode: true,
          employeeId: true,
          department: true,
          accountantType: true,
        },
      },
      customer: {
        select: {
          customerCode: true,
          mobile: true,
          address: true,
        },
      },
    },
  });

  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  return { success: true, user };
};

module.exports = {
  loginAdmin,
  loginAccountant,
  loginCustomer,
  verifyOtpAndLogin,
  resendOtp,
  getCurrentUser,
};
