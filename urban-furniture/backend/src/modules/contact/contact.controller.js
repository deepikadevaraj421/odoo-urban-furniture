const prisma = require('../../config/database');
const customerService = require('../customer/customer.service');
const { sendVendorWelcomeEmail } = require('../../utils/email');

// GET /api/contacts
const getContacts = async (req, res, next) => {
  try {
    const { type, search } = req.query;
    const where = {};

    if (type && ['CUSTOMER', 'VENDOR', 'BOTH'].includes(type.toUpperCase())) {
      if (type.toUpperCase() === 'CUSTOMER') {
        where.type = { in: ['CUSTOMER', 'BOTH'] };
      } else if (type.toUpperCase() === 'VENDOR') {
        where.type = { in: ['VENDOR', 'BOTH'] };
      } else {
        where.type = 'BOTH';
      }
    }

    // Customer Directory accounts are the only customer source of truth.
    if (type && type.toUpperCase() === 'CUSTOMER') {
      const customerAccounts = await prisma.customer.findMany({
        select: { user: { select: { email: true } } },
      });
      const customerEmails = customerAccounts.map(({ user }) => user.email).filter(Boolean);
      where.email = { in: customerEmails, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Permission check for Accountant
    if (req.user?.role === 'ACCOUNTANT') {
      const perms = req.user.permissions || [];
      const isCust = type && type.toUpperCase() === 'CUSTOMER';
      const isVend = type && type.toUpperCase() === 'VENDOR';

      if (isCust && !perms.includes('VIEW_CUSTOMERS') && !perms.includes('VIEW_CONTACTS')) {
        return res.status(403).json({ success: false, message: 'You do not have permission to view customers.' });
      }
      if (isVend && !perms.includes('VIEW_VENDORS') && !perms.includes('VIEW_CONTACTS')) {
        return res.status(403).json({ success: false, message: 'You do not have permission to view vendors.' });
      }
      if (!isCust && !isVend && !perms.includes('VIEW_CONTACTS') && !perms.includes('VIEW_CUSTOMERS') && !perms.includes('VIEW_VENDORS')) {
        return res.status(403).json({ success: false, message: 'You do not have permission to view contacts.' });
      }
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, count: contacts.length, contacts });
  } catch (error) {
    next(error);
  }
};

// GET /api/contacts/:id
const getContactById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        salesOrders: { take: 5, orderBy: { createdAt: 'desc' } },
        customerInvoices: { take: 5, orderBy: { createdAt: 'desc' } },
        purchaseOrders: { take: 5, orderBy: { createdAt: 'desc' } },
        vendorBills: { take: 5, orderBy: { createdAt: 'desc' } },
        payments: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    res.status(200).json({ success: true, contact });
  } catch (error) {
    next(error);
  }
};

// POST /api/contacts
const createContact = async (req, res, next) => {
  try {
    const { name, type = 'CUSTOMER', email, mobile, city, state, pincode, imageUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Contact name is required.' });
    }

    const contactType = ['CUSTOMER', 'VENDOR', 'BOTH'].includes(type) ? type : 'CUSTOMER';

    // Permission checks for Accountant
    if (req.user?.role === 'ACCOUNTANT') {
      const perms = req.user.permissions || [];
      if (contactType === 'CUSTOMER' && !perms.includes('MANAGE_CUSTOMERS') && !perms.includes('EDIT_CONTACTS')) {
        return res.status(403).json({ success: false, message: 'You do not have permission to manage customers.' });
      }
      if (contactType === 'VENDOR' && !perms.includes('MANAGE_VENDORS') && !perms.includes('EDIT_CONTACTS')) {
        return res.status(403).json({ success: false, message: 'You do not have permission to manage vendors.' });
      }
      if (contactType === 'BOTH' && !perms.includes('EDIT_CONTACTS')) {
        return res.status(403).json({ success: false, message: 'You do not have permission to edit contacts.' });
      }
    }

    const trimmedEmail = email?.trim()?.toLowerCase() || null;

    const contact = await prisma.contact.create({
      data: {
        name: name.trim(),
        type: contactType,
        email: trimmedEmail,
        mobile: mobile?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        imageUrl: imageUrl || null,
        status: 'ACTIVE',
      },
    });

    // 1. If it's a Vendor and email is provided, send Vendor Onboarding Confirmation Email
    if (contactType === 'VENDOR' && trimmedEmail) {
      try {
        await sendVendorWelcomeEmail(trimmedEmail, name.trim());
        return res.status(201).json({
          success: true,
          message: `Vendor created and onboarding confirmation email sent successfully to ${trimmedEmail}.`,
          contact,
        });
      } catch (emailErr) {
        // Rollback contact creation if email delivery fails
        await prisma.contact.delete({ where: { id: contact.id } });
        return res.status(400).json({
          success: false,
          message: `Failed to send vendor onboarding email to ${trimmedEmail}: ${emailErr.message}. Vendor was not created.`,
        });
      }
    }

    // 2. If it's a Customer and email is provided, also create User & Customer invitation if not already present
    if (['CUSTOMER', 'BOTH'].includes(contactType) && trimmedEmail) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: trimmedEmail },
        });

        if (!existingUser) {
          const origin = req.get('origin') || req.headers?.origin;
          const address = [city, state, pincode].filter(Boolean).join(', ') || null;
          await customerService.createCustomer(
            {
              name: name.trim(),
              email: trimmedEmail,
              mobile: mobile?.trim() || 'N/A',
              address,
            },
            req.user?.userId,
            origin
          );
        }
      } catch (custErr) {
        console.warn('Customer invitation notice:', custErr.message);
      }
    }

    res.status(201).json({ success: true, message: 'Contact created successfully.', contact });
  } catch (error) {
    next(error);
  }
};

// PUT /api/contacts/:id
const updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, email, mobile, city, state, pincode, imageUrl, status } = req.body;

    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    // Permission checks for Accountant
    if (req.user?.role === 'ACCOUNTANT') {
      const perms = req.user.permissions || [];
      if (existing.type === 'CUSTOMER' && !perms.includes('MANAGE_CUSTOMERS') && !perms.includes('EDIT_CONTACTS')) {
        return res.status(403).json({ success: false, message: 'You do not have permission to manage customers.' });
      }
      if (existing.type === 'VENDOR' && !perms.includes('MANAGE_VENDORS') && !perms.includes('EDIT_CONTACTS')) {
        return res.status(403).json({ success: false, message: 'You do not have permission to manage vendors.' });
      }
      if (existing.type === 'BOTH' && !perms.includes('EDIT_CONTACTS')) {
        return res.status(403).json({ success: false, message: 'You do not have permission to edit contacts.' });
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(type && { type }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(mobile !== undefined && { mobile: mobile?.trim() || null }),
        ...(city !== undefined && { city: city?.trim() || null }),
        ...(state !== undefined && { state: state?.trim() || null }),
        ...(pincode !== undefined && { pincode: pincode?.trim() || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(status && { status }),
      },
    });

    res.status(200).json({ success: true, message: 'Contact updated successfully.', contact });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/contacts/:id
const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.contact.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Contact deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
};
