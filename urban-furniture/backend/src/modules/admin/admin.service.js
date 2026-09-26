const prisma = require('../../config/database');
const { generateAccountantCode, generateCustomerCode } = require('../../utils/generateCode');
const { createAndSendInvitation } = require('../auth/invitation.service');
const { getDefaultPermissions, ALL_PERMISSIONS } = require('../../constants/permissions');

/**
 * Create a new Accountant account (Admin only)
 * - Sets status = INVITED
 * - NO password parameters accepted or generated
 * - Sends email invitation with token link
 * - Assigns sensible default permissions based on accountantType
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
  const defaultPermissions = getDefaultPermissions(accountantType);

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
        permissions: defaultPermissions,
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
      permissions: result.accountant.permissions,
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
    permissions: a.permissions || [],
    status: a.user.status,
    createdAt: a.createdAt,
  }));

  return {
    success: true,
    accountants: formatted,
  };
};

/**
 * Update Permissions for an Accountant (Admin only)
 * Validates accountant exists, user is not ADMIN, and permission keys are valid.
 */
const updateAccountantPermissions = async (accountantId, permissions) => {
  if (!Array.isArray(permissions)) {
    return { success: false, message: 'Permissions must be an array of permission keys.' };
  }

  // Find accountant by ID or userId
  const accountant = await prisma.accountant.findFirst({
    where: {
      OR: [
        { id: accountantId },
        { userId: accountantId },
      ],
    },
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
    return { success: false, message: 'Accountant not found.' };
  }

  // Prevent modifying an ADMIN or elevating an accountant to ADMIN
  if (accountant.user.role === 'ADMIN') {
    return { success: false, message: 'Cannot modify permissions for an administrator.' };
  }

  // Validate all permission keys
  const invalidKeys = permissions.filter((key) => !ALL_PERMISSIONS.includes(key));
  if (invalidKeys.length > 0) {
    return {
      success: false,
      message: `Invalid permission keys provided: ${invalidKeys.join(', ')}`,
    };
  }

  // Remove duplicates
  const sanitizedPermissions = Array.from(new Set(permissions));

  // Persist directly to PostgreSQL
  const updatedAccountant = await prisma.accountant.update({
    where: { id: accountant.id },
    data: { permissions: sanitizedPermissions },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          status: true,
        },
      },
    },
  });

  return {
    success: true,
    message: 'Permissions updated successfully.',
    accountant: {
      id: updatedAccountant.id,
      userId: updatedAccountant.userId,
      name: updatedAccountant.user.name,
      email: updatedAccountant.user.email,
      accountantCode: updatedAccountant.accountantCode,
      employeeId: updatedAccountant.employeeId,
      department: updatedAccountant.department,
      accountantType: updatedAccountant.accountantType,
      permissions: updatedAccountant.permissions,
      status: updatedAccountant.user.status,
    },
  };
};

const { createCustomer: customerServiceCreateCustomer } = require('../customer/customer.service');

/**
 * Create Customer account (Admin & Accountant)
 */
const createCustomer = async (data, adminId, frontendOrigin) => {
  return customerServiceCreateCustomer(data, adminId, frontendOrigin);
};

module.exports = {
  createAccountant,
  getAccountants,
  updateAccountantPermissions,
  createCustomer,
};
