const prisma = require('../../config/database');
const { generateCustomerCode } = require('../../utils/generateCode');
const { createAndSendInvitation } = require('../auth/invitation.service');

/**
 * Create a new Customer account (Admin or Accountant)
 * - Sets status = INVITED
 * - NO password parameters accepted or generated
 * - Auto-generates unique Customer Code (CUS-00001, CUS-00002...)
 * - Sends email invitation with secure token link
 * - Cleans up database if email delivery fails
 */
const createCustomer = async (data, createdById, frontendOrigin) => {
  const { name, email, mobile, address } = data;

  if (!name || !name.trim()) {
    return { success: false, message: 'Full name is required.' };
  }
  if (!email || !email.trim()) {
    return { success: false, message: 'Valid email is required.' };
  }
  if (!mobile || !mobile.trim()) {
    return { success: false, message: 'Mobile number is required.' };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Check email uniqueness
  const existingUser = await prisma.user.findUnique({
    where: { email: trimmedEmail },
    include: { customer: true },
  });

  if (existingUser) {
    if (existingUser.status === 'ACTIVE') {
      return {
        success: false,
        message: 'A user with this email address already exists and is active.',
      };
    }
    if (existingUser.status === 'INVITED') {
      return {
        success: false,
        message: `An invitation has already been sent to ${trimmedEmail}. You can click "Resend Invitation" in the Customer Directory.`,
      };
    }
    return {
      success: false,
      message: 'A user with this email address already exists in the system.',
    };
  }

  // Generate unique Customer Code (CUS-00001, CUS-00002...)
  const customerCode = await generateCustomerCode();

  // Create User and Customer record in atomic transaction
  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: trimmedEmail,
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
          mobile: mobile.trim(),
          address: address ? address.trim() : null,
        },
      });

      // Synchronize / ensure a Contact record exists for ERP master data consistency
      const existingContact = await tx.contact.findFirst({
        where: { email: trimmedEmail },
      });

      if (!existingContact) {
        await tx.contact.create({
          data: {
            name: name.trim(),
            type: 'CUSTOMER',
            email: trimmedEmail,
            mobile: mobile.trim(),
            status: 'ACTIVE',
          },
        });
      }

      return { user, customer };
    });
  } catch (dbError) {
    return {
      success: false,
      message: `Database error while creating customer: ${dbError.message}`,
    };
  }

  // Generate secure token and send email invitation
  try {
    await createAndSendInvitation({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      customerCode: result.customer.customerCode,
      frontendOrigin,
    });

    console.log(`\n==================================================`);
    console.log(` Customer Created: ${result.customer.customerCode}`);
    console.log(` Name: ${result.user.name}`);
    console.log(` Recipient Email: ${result.user.email}`);
    console.log(` Invitation Email: SUCCESS`);
    console.log(`==================================================\n`);
  } catch (emailError) {
    console.error(`\n==================================================`);
    console.error(` Customer Created: ${result.customer.customerCode}`);
    console.error(` Recipient Email: ${result.user.email}`);
    console.error(` Invitation Email: FAILED (${emailError.message})`);
    console.error(` Rolling back created records...`);
    console.error(`==================================================\n`);

    // Clean up created user to avoid orphaned uninvited record
    try {
      await prisma.user.delete({
        where: { id: result.user.id },
      });
    } catch (cleanupErr) {
      console.error('Rollback error:', cleanupErr.message);
    }

    return {
      success: false,
      message: `Failed to send invitation email to ${trimmedEmail}: ${emailError.message}. Customer was not created.`,
    };
  }

  return {
    success: true,
    emailSent: true,
    message: `Customer created successfully! Customer ID: ${result.customer.customerCode}. Invitation email sent to ${result.user.email}.`,
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
const resendCustomerInvitation = async (customerId, frontendOrigin) => {
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
    customer = await prisma.customer.findFirst({
      where: { customerCode: customerId },
      include: { user: true },
    });
  }

  if (!customer) {
    return { success: false, message: 'Customer record not found.' };
  }

  if (customer.user.status === 'ACTIVE') {
    return { success: false, message: 'Customer account is already active and verified.' };
  }

  try {
    await createAndSendInvitation({
      userId: customer.user.id,
      email: customer.user.email,
      name: customer.user.name,
      customerCode: customer.customerCode,
      frontendOrigin,
    });

    console.log(`\n==================================================`);
    console.log(` Customer Invitation Resent: ${customer.customerCode}`);
    console.log(` Recipient Email: ${customer.user.email}`);
    console.log(` Invitation Email: SUCCESS`);
    console.log(`==================================================\n`);

    return {
      success: true,
      emailSent: true,
      message: `Invitation resent successfully to ${customer.user.email}.`,
    };
  } catch (emailError) {
    console.error(`\n==================================================`);
    console.error(` Customer Invitation Resent: ${customer.customerCode}`);
    console.error(` Recipient Email: ${customer.user.email}`);
    console.error(` Invitation Email: FAILED (${emailError.message})`);
    console.error(`==================================================\n`);

    return {
      success: false,
      emailSent: false,
      message: `Failed to send invitation email to ${customer.user.email}: ${emailError.message}`,
    };
  }
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

  const emails = formatted.map((customer) => customer.email).filter(Boolean);
  const contacts = await prisma.contact.findMany({
    where: { email: { in: emails, mode: 'insensitive' }, type: { in: ['CUSTOMER', 'BOTH'] } },
    select: { id: true, email: true },
  });
  const contactByEmail = new Map(contacts.map((contact) => [contact.email.toLowerCase(), contact.id]));
  const customersWithContact = formatted.map((customer) => ({
    ...customer,
    contactId: customer.email ? contactByEmail.get(customer.email.toLowerCase()) || null : null,
  }));

  return {
    success: true,
    count: customersWithContact.length,
    customers: customersWithContact,
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
 * Uses userId from JWT — strictly isolates data to authenticated customer
 */
const getCustomerInvoices = async (userId) => {
  const customer = await prisma.customer.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!customer) {
    return { success: false, message: 'Customer profile not found.' };
  }

  const contact = await prisma.contact.findFirst({
    where: { email: { equals: customer.user.email, mode: 'insensitive' }, type: { in: ['CUSTOMER', 'BOTH'] } },
  });
  const invoices = await prisma.customerInvoice.findMany({
    where: contact ? { customerId: contact.id } : { customerUserId: userId },
    include: {
      customer: true,
      items: { include: { product: true } },
      payments: true,
    },
    orderBy: { date: 'desc' },
  });

  return {
    success: true,
    customerCode: customer.customerCode,
    invoices,
  };
};

const getCustomerOrders = async (userId) => {
  const customer = await prisma.customer.findUnique({ where: { userId }, include: { user: true } });
  if (!customer) return { success: false, message: 'Customer profile not found.' };

  const contact = await prisma.contact.findFirst({
    where: { email: { equals: customer.user.email, mode: 'insensitive' }, type: { in: ['CUSTOMER', 'BOTH'] } },
  });
  const orders = await prisma.salesOrder.findMany({
    where: contact ? { customerId: contact.id } : { customerId: '__no_customer__' },
    include: { customer: true, items: { include: { product: true } }, invoices: { select: { id: true, invoiceNumber: true, status: true } } },
    orderBy: { date: 'desc' },
  });
  return { success: true, customerCode: customer.customerCode, orders };
};

/**
 * Get payments for the authenticated customer
 * Uses userId from JWT — strictly isolates data to authenticated customer
 */
const getCustomerPayments = async (userId) => {
  const customer = await prisma.customer.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!customer) {
    return { success: false, message: 'Customer profile not found.' };
  }

  const payments = await prisma.payment.findMany({
    where: { customerInvoice: { customerId: (await prisma.contact.findFirst({ where: { email: { equals: customer.user.email, mode: 'insensitive' }, type: { in: ['CUSTOMER', 'BOTH'] } } }))?.id || '__no_customer__' } },
    include: {
      customerInvoice: true,
      contact: true,
    },
    orderBy: { date: 'desc' },
  });

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
  getCustomerOrders,
  getCustomerInvoices,
  getCustomerPayments,
};
