const prisma = require('../../config/database');

const getNextSequence = async (model, field, prefix) => {
  const count = await prisma[model].count();
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
};

// GET /api/payments
const getPayments = async (req, res, next) => {
  try {
    const { paymentType, method, status, customerId, search, dateFrom, dateTo } = req.query;
    const where = {};

    if (req.user.role === 'ACCOUNTANT') {
      const permissions = req.user.permissions || [];
      const canViewCustomer = permissions.includes('VIEW_CUSTOMER_PAYMENTS') || permissions.includes('RECORD_CUSTOMER_PAYMENTS');
      const canViewVendor = permissions.includes('VIEW_VENDOR_PAYMENTS') || permissions.includes('RECORD_VENDOR_PAYMENTS');
      if (paymentType === 'INBOUND' && !canViewCustomer) {
        return res.status(403).json({ success: false, message: 'You do not have permission to view customer payments.' });
      }
      if (paymentType === 'OUTBOUND' && !canViewVendor) {
        return res.status(403).json({ success: false, message: 'You do not have permission to view vendor payments.' });
      }
      if (!paymentType && !canViewCustomer && !canViewVendor) {
        return res.status(403).json({ success: false, message: 'You do not have permission to view payments.' });
      }
    }

    // Customer role restriction
    if (req.user.role === 'CUSTOMER') {
      const contact = await prisma.contact.findFirst({
        where: { email: { equals: req.user.email, mode: 'insensitive' }, type: { in: ['CUSTOMER', 'BOTH'] } },
        select: { id: true },
      });
      where.customerInvoice = { customerId: contact?.id || '__no_customer__' };
    }

    if (paymentType) where.paymentType = paymentType.toUpperCase();
    if (method) where.method = method;
    if (customerId) where.contactId = customerId;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo) where.date.lte = new Date(`${dateTo}T23:59:59.999Z`);
    }
    // Payment status is derived from the linked document in this schema.
    if (status === 'RECEIVED' && paymentType !== 'OUTBOUND') where.customerInvoice = { isNot: null };
    if (status === 'PENDING' && paymentType !== 'OUTBOUND') where.customerInvoice = { is: { status: { not: 'PAID' } } };
    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { contact: { name: { contains: search, mode: 'insensitive' } } },
        { contact: { id: { contains: search, mode: 'insensitive' } } },
        { customerInvoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } },
        { vendorBill: { billNumber: { contains: search, mode: 'insensitive' } } },
        { vendorBill: { vendor: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        contact: true,
        customerInvoice: true,
        vendorBill: true,
      },
    });

    res.status(200).json({ success: true, count: payments.length, payments });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments
const recordPayment = async (req, res, next) => {
  try {
    const {
      paymentType = 'INBOUND', // INBOUND (Customer) or OUTBOUND (Vendor)
      method = 'BANK',        // CASH or BANK
      amount,
      date = new Date(),
      reference,
      notes,
      customerInvoiceId,
      vendorBillId,
      contactId,
    } = req.body;

    const normalizedPaymentType = String(paymentType).toUpperCase();
    const normalizedMethod = String(method).toUpperCase();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    if (!['INBOUND', 'OUTBOUND'].includes(normalizedPaymentType)) {
      return res.status(400).json({ success: false, message: 'Invalid payment type.' });
    }

    if (!['CASH', 'BANK'].includes(normalizedMethod)) {
      return res.status(400).json({ success: false, message: 'Payment method must be CASH or BANK.' });
    }

    if (reference?.trim()) {
      const duplicateReference = await prisma.payment.findFirst({ where: { reference: reference.trim() } });
      if (duplicateReference) {
        return res.status(400).json({ success: false, message: 'Payment reference already exists.' });
      }
    }

    // Granular permission check for Accountant. Customers are authorized
    // below by ownership of the selected invoice.
    if (req.user.role === 'ACCOUNTANT') {
      const isCustomerPayment = normalizedPaymentType === 'INBOUND' || Boolean(customerInvoiceId);
      const isVendorPayment = normalizedPaymentType === 'OUTBOUND' || Boolean(vendorBillId);

      if (isCustomerPayment && !req.user.permissions?.includes('RECORD_CUSTOMER_PAYMENTS')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to record customer payments.',
        });
      }

      if (isVendorPayment && !req.user.permissions?.includes('RECORD_VENDOR_PAYMENTS')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to record vendor payments.',
        });
      }
    }

    const paymentNumber = await getNextSequence('payment', 'paymentNumber', 'PAY');

    const result = await prisma.$transaction(async (tx) => {
      let linkedContactId = contactId;
      let invoice = null;
      let bill = null;

      // 1. If Customer Invoice Payment
      if (customerInvoiceId) {
        invoice = await tx.customerInvoice.findUnique({
          where: { id: customerInvoiceId },
          include: { customer: true },
        });

        if (!invoice) {
          throw new Error('Customer invoice not found.');
        }

        // Customer authorization: verify customer owns the invoice
        if (req.user.role === 'CUSTOMER') {
          const contact = await tx.contact.findFirst({
            where: { email: { equals: req.user.email, mode: 'insensitive' }, type: { in: ['CUSTOMER', 'BOTH'] } },
            select: { id: true },
          });
          const isOwner = invoice.customerId === contact?.id;
          if (!isOwner) {
            throw new Error('Access denied to pay this invoice.');
          }
        }

        const remaining = invoice.total - invoice.paidAmount;
        if (parsedAmount > remaining + 0.01) {
          throw new Error(`Payment amount (₹${parsedAmount}) cannot exceed remaining invoice balance (₹${remaining.toFixed(2)}).`);
        }

        linkedContactId = invoice.customerId;
        const newPaidAmount = Math.round((invoice.paidAmount + parsedAmount) * 100) / 100;
        const newStatus = newPaidAmount >= invoice.total - 0.01 ? 'PAID' : 'PARTIALLY_PAID';

        await tx.customerInvoice.update({
          where: { id: customerInvoiceId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });
      }

      // 2. If Vendor Bill Payment
      if (vendorBillId) {
        if (req.user.role === 'CUSTOMER') {
          throw new Error('Customers cannot pay vendor bills.');
        }

        bill = await tx.vendorBill.findUnique({
          where: { id: vendorBillId },
          include: { vendor: true },
        });

        if (!bill) {
          throw new Error('Vendor bill not found.');
        }

        if (!bill.vendorId || (contactId && contactId !== bill.vendorId)) {
          throw new Error('Vendor bill does not belong to the selected vendor.');
        }

        const remaining = bill.total - bill.paidAmount;
        if (parsedAmount > remaining + 0.01) {
          throw new Error(`Payment amount (₹${parsedAmount}) cannot exceed remaining bill balance (₹${remaining.toFixed(2)}).`);
        }

        linkedContactId = bill.vendorId;
        const newPaidAmount = Math.round((bill.paidAmount + parsedAmount) * 100) / 100;
        const newStatus = newPaidAmount >= bill.total - 0.01 ? 'PAID' : 'PARTIALLY_PAID';

        await tx.vendorBill.update({
          where: { id: vendorBillId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });
      }

      if (normalizedPaymentType === 'OUTBOUND' && !vendorBillId) {
        throw new Error('Vendor bill selection is required.');
      }

      // 3. Create Double-Entry Accounting Journal Entry
      // Find default accounts:
      // Cash: 1000, Bank: 1010, Debtors (AR): 1050, Creditors (AP): 2000
      const cashAcc = await tx.account.findUnique({ where: { code: '1000' } });
      const bankAcc = await tx.account.findUnique({ where: { code: '1010' } });
      const arAcc = await tx.account.findUnique({ where: { code: '1050' } });
      const apAcc = await tx.account.findUnique({ where: { code: '2000' } });

      const targetCashOrBank = normalizedMethod === 'CASH' ? cashAcc : bankAcc;
      let journalEntryId = null;

      if (targetCashOrBank) {
        // Inbound (Customer): Debit Bank/Cash, Credit Debtors (AR)
        // Outbound (Vendor): Debit Creditors (AP), Credit Bank/Cash
        const journalCode = normalizedMethod === 'CASH' ? 'CASH' : 'BANK';
        const journal = await tx.journal.findUnique({ where: { code: journalCode } });

        if (journal) {
          const jeCount = await tx.journalEntry.count();
          const entryNumber = `JE-${new Date().getFullYear()}-${String(jeCount + 1).padStart(4, '0')}`;

          const itemsData = [];
          if (normalizedPaymentType === 'INBOUND' && arAcc) {
            itemsData.push({ accountId: targetCashOrBank.id, label: `Payment received: ${paymentNumber}`, debit: parsedAmount, credit: 0 });
            itemsData.push({ accountId: arAcc.id, label: `Debtor clearance: ${invoice?.invoiceNumber || paymentNumber}`, debit: 0, credit: parsedAmount });
          } else if (normalizedPaymentType === 'OUTBOUND' && apAcc) {
            itemsData.push({ accountId: apAcc.id, label: `Creditor payment: ${bill?.billNumber || paymentNumber}`, debit: parsedAmount, credit: 0 });
            itemsData.push({ accountId: targetCashOrBank.id, label: `Disbursement: ${paymentNumber}`, debit: 0, credit: parsedAmount });
          }

          if (itemsData.length === 2) {
            const je = await tx.journalEntry.create({
              data: {
                entryNumber,
                journalId: journal.id,
                date: new Date(date),
                reference: reference || paymentNumber,
                status: 'POSTED',
                totalDebit: parsedAmount,
                totalCredit: parsedAmount,
                items: { create: itemsData },
              },
            });
            journalEntryId = je.id;
          }
        }
      }

      // 4. Create Payment Record
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          paymentType: normalizedPaymentType,
          method: normalizedMethod,
          amount: parsedAmount,
          date: new Date(date),
          reference: reference?.trim() || null,
          notes: notes?.trim() || null,
          contactId: linkedContactId || null,
          customerInvoiceId: customerInvoiceId || null,
          vendorBillId: vendorBillId || null,
          journalEntryId,
        },
        include: {
          contact: true,
          customerInvoice: true,
          vendorBill: true,
        },
      });

      return payment;
    });

    res.status(201).json({
      success: true,
      message: `Payment ${paymentNumber} recorded successfully.`,
      payment: result,
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('cannot exceed') || error.message.includes('Access denied') || error.message.includes('does not belong') || error.message.includes('selection is required')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// GET /api/payments/notifications
// Returns recent customer payments as notification items for Admin/Accountant topbar
const getRecentNotifications = async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { paymentType: 'INBOUND' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        contact: { select: { id: true, name: true } },
        customerInvoice: { select: { id: true, invoiceNumber: true, status: true, total: true, paidAmount: true } },
      },
    });

    const notifications = payments.map((p) => {
      const timeDiff = Date.now() - new Date(p.createdAt).getTime();
      const minutes = Math.floor(timeDiff / 60000);
      const hours = Math.floor(timeDiff / 3600000);
      const days = Math.floor(timeDiff / 86400000);
      let timeAgo = 'just now';
      if (days > 0) timeAgo = `${days}d ago`;
      else if (hours > 0) timeAgo = `${hours}h ago`;
      else if (minutes > 0) timeAgo = `${minutes}m ago`;

      const invoiceStatus = p.customerInvoice?.status || '';
      const statusLabel = invoiceStatus === 'PAID' ? 'Fully Paid' : invoiceStatus === 'PARTIALLY_PAID' ? 'Partial Payment' : 'Payment Recorded';

      return {
        id: p.id,
        title: `${statusLabel} — ${p.customerInvoice?.invoiceNumber || p.paymentNumber}`,
        desc: `₹${Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} received from ${p.contact?.name || 'Customer'} via ${p.method}`,
        time: timeAgo,
        unread: minutes < 60, // Treat payments in the last hour as "unread"
        paymentNumber: p.paymentNumber,
        amount: p.amount,
        method: p.method,
        createdAt: p.createdAt,
      };
    });

    const unreadCount = notifications.filter((n) => n.unread).length;

    res.status(200).json({ success: true, count: notifications.length, unreadCount, notifications });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  recordPayment,
  getRecentNotifications,
};
