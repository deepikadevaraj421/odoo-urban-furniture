const prisma = require('../../config/database');
const { generateCustomerCode } = require('../../utils/generateCode');
const { createAndSendInvitation } = require('../auth/invitation.service');

/**
 * Create a new Customer account (Admin or Accountant)
 * - Sets status = INVITED
 * - NO password parameters accepted or generated
 * - Auto-generates unique Customer Code (CUS-00001, CUS-00002...)
 * - Sends email invitation with token link
 */
const createCustomer = async (data, createdById) => {
  const { name, email, mobile, address } = data;

  // Check email uniqueness
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { success: false, message: 'A user with this email address already exists.' };
  }

  // Generate unique Customer Code
  const customerCode = await generateCustomerCode();

  // Create user and customer profile in transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash: null,
        role: 'CUSTOMER',
        status: 'INVITED',
        createdBy: createdById || 'SYSTEM',
      },
    });

    const customer = await tx.customer.create({
      data: {
        userId: user.id,
        customerCode,
        mobile,
        address: address || null,
      },
    });

    return { user, customer };
  });

  // Generate secure token and send email invitation
  let emailSent = false;
  let emailErrorMsg = null;
  try {
    await createAndSendInvitation({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      customerCode: result.customer.customerCode,
    });
    emailSent = true;
    console.log(`\n==================================================`);
    console.log(` Customer Created: ${result.customer.customerCode}`);
    console.log(` Name: ${result.user.name}`);
    console.log(` Recipient Email: ${result.user.email}`);
    console.log(` Invitation Email: SUCCESS`);
    console.log(`==================================================\n`);
  } catch (emailError) {
    emailErrorMsg = emailError.message;
    console.error(`\n==================================================`);
    console.error(` Customer Created: ${result.customer.customerCode}`);
    console.error(` Name: ${result.user.name}`);
    console.error(` Recipient Email: ${result.user.email}`);
    console.error(` Invitation Email: FAILED (${emailError.message})`);
    console.error(`==================================================\n`);
  }

  return {
    success: true,
    emailSent,
    message: emailSent
      ? 'Customer created and invitation email sent successfully.'
      : `Customer created (status: INVITED), but invitation email delivery failed: ${emailErrorMsg}`,
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
 * Resend Customer Invitation Email
 * - Allowed ONLY for customers with status = INVITED
 * - Invalidates previous invitation tokens
 * - Generates new secure token and sends fresh invitation email
 */
const resendCustomerInvitation = async (customerId) => {
  let customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { user: true },
  });

  if (!customer) {
    customer = await prisma.customer.findUnique({
      where: { userId: customerId },
      include: { user: true },
    });
  }

  if (!customer) {
    return { success: false, message: 'Customer record not found.' };
  }

  if (customer.user.status === 'ACTIVE') {
    return { success: false, message: 'Customer account is already active.' };
  }

  let emailSent = false;
  let emailErrorMsg = null;

  try {
    await createAndSendInvitation({
      userId: customer.user.id,
      email: customer.user.email,
      name: customer.user.name,
      customerCode: customer.customerCode,
    });
    emailSent = true;
    console.log(`\n==================================================`);
    console.log(` Customer Invitation Resent: ${customer.customerCode}`);
    console.log(` Recipient Email: ${customer.user.email}`);
    console.log(` Invitation Email: SUCCESS`);
    console.log(`==================================================\n`);
  } catch (emailError) {
    emailErrorMsg = emailError.message;
    console.error(`\n==================================================`);
    console.error(` Customer Invitation Resent: ${customer.customerCode}`);
    console.error(` Recipient Email: ${customer.user.email}`);
    console.error(` Invitation Email: FAILED (${emailError.message})`);
    console.error(`==================================================\n`);
  }

  if (!emailSent) {
    return {
      success: false,
      emailSent: false,
      message: `Failed to send invitation email to ${customer.user.email}: ${emailErrorMsg}`,
    };
  }

  return {
    success: true,
    emailSent: true,
    message: `Invitation resent successfully to ${customer.user.email}.`,
  };
};

/**
 * Get list of all Customers or search by query
 * Supports searching by Customer ID, Email, Mobile, Name
 */
const getCustomers = async (searchQuery) => {
  let whereClause = {};

  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.trim();
    whereClause = {
      OR: [
        { customerCode: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ],
    };
  }

  const customers = await prisma.customer.findMany({
    where: whereClause,
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

  const formatted = customers.map((c) => ({
    id: c.id,
    userId: c.userId,
    name: c.user.name,
    email: c.user.email,
    customerCode: c.customerCode,
    mobile: c.mobile,
    address: c.address,
    status: c.user.status,
    createdAt: c.createdAt,
  }));

  return {
    success: true,
    count: formatted.length,
    customers: formatted,
  };
};

/**
 * Get customer profile by userId
 * Uses userId from JWT — strictly enforces ownership
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
          createdAt: true,
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
      createdAt: customer.user.createdAt,
    },
  };
};

/**
 * Get invoices for the authenticated customer
 * Uses userId from JWT — strictly isolates data by Customer ID
 */
const getCustomerInvoices = async (userId) => {
  const customer = await prisma.customer.findUnique({
    where: { userId },
  });

  if (!customer) {
    return { success: false, message: 'Customer profile not found.' };
  }

  // Placeholder structured invoice list linked strictly to this customer's code
  const invoices = [
    {
      id: `INV-${customer.customerCode}-001`,
      invoiceNumber: `INV/2026/${customer.customerCode}/001`,
      customerCode: customer.customerCode,
      date: new Date().toISOString().split('T')[0],
      amount: 45000.0,
      status: 'PAID',
      description: 'Urban Furniture Showroom Order',
    },
  ];

  return {
    success: true,
    customerCode: customer.customerCode,
    invoices,
  };
};

/**
 * Get payments for the authenticated customer
 * Uses userId from JWT — strictly isolates data by Customer ID
 */
const getCustomerPayments = async (userId) => {
  const customer = await prisma.customer.findUnique({
    where: { userId },
  });

  if (!customer) {
    return { success: false, message: 'Customer profile not found.' };
  }

  // Placeholder structured payment list linked strictly to this customer's code
  const payments = [
    {
      id: `PAY-${customer.customerCode}-001`,
      paymentNumber: `PAY/2026/${customer.customerCode}/001`,
      invoiceNumber: `INV/2026/${customer.customerCode}/001`,
      customerCode: customer.customerCode,
      date: new Date().toISOString().split('T')[0],
      amount: 45000.0,
      paymentMethod: 'ONLINE_TRANSFER',
      status: 'COMPLETED',
    },
  ];

  return {
    success: true,
    customerCode: customer.customerCode,
    payments,
  };
};

module.exports = {
  createCustomer,
  resendCustomerInvitation,
  getCustomers,
  getCustomerProfile,
  getCustomerInvoices,
  getCustomerPayments,
};
