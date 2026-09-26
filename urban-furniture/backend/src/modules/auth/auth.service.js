const prisma = require('../../config/database');
const { hashPassword, comparePassword } = require('./password.service');
const { generateToken } = require('./jwt.service');
const { createAndSendOtp, verifyOtp } = require('./otp.service');

const normalizeLoginEmail = (email) => email.trim().toLowerCase();

/**
 * Initial One-Time Admin Registration
 * Admin Self-Registration is permanently disabled.
 * The official Admin account is created during setup and managed by the system.
 */
const registerAdmin = async () => {
  return {
    success: false,
    message: 'Admin self-registration is disabled. The official Admin account is already configured. Please log in with your credentials.',
  };
};

/**
 * Admin OTP verification is disabled.
 */
const verifyAdminRegistrationOtp = async () => {
  return {
    success: false,
    message: 'Admin self-registration OTP verification is disabled.',
  };
};

/**
 * Admin Normal Login — Email + Password (NO OTP)
 */
const loginAdmin = async (email, password) => {
  const normalizedEmail = normalizeLoginEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Invalid email or password.' };
  }

  if (user.status !== 'ACTIVE') {
    return { success: false, message: 'Admin account is not active.' };
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, message: 'Invalid email or password.' };
  }

  // Generate JWT immediately — NO OTP
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
 * Accountant Login — Registered Email + Password (NO OTP)
 */
const loginAccountant = async (email, password) => {
  const normalizedEmail = normalizeLoginEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { accountant: true },
  });

  if (!user || user.role !== 'ACCOUNTANT' || !user.accountant) {
    return { success: false, message: 'Invalid email or password.' };
  }

  if (user.status === 'INVITED') {
    return {
      success: false,
      message: 'Your account is pending activation. Please check your email and accept your invitation.',
    };
  }

  if (user.status !== 'ACTIVE') {
    return { success: false, message: 'Account is inactive. Contact administrator.' };
  }

  if (!user.passwordHash) {
    return {
      success: false,
      message: 'Password not set. Please accept your invitation email first.',
    };
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, message: 'Invalid email or password.' };
  }

  // Generate JWT immediately — NO OTP
  const token = generateToken({ userId: user.id, role: user.role });

  const accountantType = user.accountant.accountantType;
  const redirectTo = accountantType === 'SALES'
    ? '/accountant/sales/dashboard'
    : '/accountant/purchase/dashboard';

  return {
    success: true,
    requiresOtp: false,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountantType,
      accountantCode: user.accountant.accountantCode,
      permissions: user.accountant.permissions || [],
    },
    redirectTo,
  };
};

/**
 * Customer Login — Registered Email + Password (NO OTP)
 */
const loginCustomer = async (email, password) => {
  const normalizedEmail = normalizeLoginEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { customer: true },
  });

  if (!user || user.role !== 'CUSTOMER' || !user.customer) {
    return { success: false, message: 'Invalid email or password.' };
  }

  if (user.status === 'INVITED') {
    return {
      success: false,
      message: 'Your account is pending activation. Please check your email and accept your invitation.',
    };
  }

  if (user.status !== 'ACTIVE') {
    return { success: false, message: 'Account is inactive or disabled. Contact administrator.' };
  }

  if (!user.passwordHash) {
    return {
      success: false,
      message: 'Password not set. Please accept your invitation email first.',
    };
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, message: 'Invalid email or password.' };
  }

  // Generate JWT immediately — NO OTP
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
      customerCode: user.customer.customerCode,
      mobile: user.customer.mobile,
      address: user.customer.address,
    },
    redirectTo: '/customer/dashboard',
  };
};

/**
 * Resend OTP for Admin registration
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
          id: true,
          accountantCode: true,
          employeeId: true,
          department: true,
          accountantType: true,
          permissions: true,
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
  registerAdmin,
  verifyAdminRegistrationOtp,
  loginAdmin,
  loginAccountant,
  loginCustomer,
  resendOtp,
  getCurrentUser,
};
