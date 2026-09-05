const prisma = require('../../config/database');
const { hashPassword, comparePassword } = require('./password.service');
const { generateToken } = require('./jwt.service');
const { createAndSendOtp, verifyOtp } = require('./otp.service');

/**
 * Initial One-Time Admin Registration
 * - Allowed ONLY if no ADMIN account currently exists in the database.
 */
const registerAdmin = async ({ name, email, password }) => {
  // Check if an ADMIN already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    if (existingAdmin.status === 'ACTIVE' || existingAdmin.email !== email) {
      return {
        success: false,
        message: 'Admin account already exists. Only one Admin account is allowed. Please login.',
      };
    }
  }

  // Check email uniqueness among non-admin roles
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail && existingEmail.role !== 'ADMIN') {
    return { success: false, message: 'A user with this email already exists.' };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  let user = existingEmail;
  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'ADMIN',
        status: 'PENDING_VERIFICATION',
        createdBy: 'SELF_REGISTRATION',
      },
    });
  } else {
    // Update existing pending user
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        passwordHash,
        status: 'PENDING_VERIFICATION',
      },
    });
  }

  // Send registration OTP
  const plainOtp = await createAndSendOtp(user.id, user.email);

  return {
    success: true,
    requiresOtp: true,
    userId: user.id,
    devOtp: process.env.NODE_ENV === 'development' ? plainOtp : undefined,
    message: 'OTP sent to your email for Admin setup verification.',
  };
};

/**
 * Verify Admin Registration OTP and Activate Admin
 */
const verifyAdminRegistrationOtp = async (userId, otp) => {
  const result = await verifyOtp(userId, otp);

  if (!result.valid) {
    return { success: false, message: result.message };
  }

  // Activate Admin account
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: 'ACTIVE' },
  });

  // Generate JWT token
  const token = generateToken({ userId: user.id, role: user.role });

  return {
    success: true,
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
 * Admin Normal Login — Email + Password (NO OTP)
 */
const loginAdmin = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
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
  const user = await prisma.user.findUnique({
    where: { email },
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
    },
    redirectTo,
  };
};

/**
 * Customer Login — Registered Email + Password (NO OTP)
 */
const loginCustomer = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
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
  registerAdmin,
  verifyAdminRegistrationOtp,
  loginAdmin,
  loginAccountant,
  loginCustomer,
  resendOtp,
  getCurrentUser,
};
