const prisma = require('../../config/database');

// Helper to generate next sequential number
const getNextSequence = async (model, field, prefix) => {
  const count = await prisma[model].count();
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
};

const getCustomerContactId = async (userId, email) => {
  const contact = await prisma.contact.findFirst({
    where: { email: { equals: email, mode: 'insensitive' }, type: { in: ['CUSTOMER', 'BOTH'] } },
    select: { id: true },
  });
  return contact?.id || '__no_customer__';
};

// ==============================================
// SALES ORDERS
// ==============================================

// GET /api/sales-orders
const getSalesOrders = async (req, res, next) => {
  try {
    const { status, search, customerId } = req.query;
    const where = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: { include: { product: true } },
        invoices: { select: { id: true, invoiceNumber: true, status: true } },
      },
    });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

// GET /api/sales-orders/:id
const getSalesOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
        invoices: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales order not found.' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// POST /api/sales-orders
const createSalesOrder = async (req, res, next) => {
  try {
    const { customerId, date = new Date(), items, notes } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer selection is required.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one product line item is required.' });
    }

    const customer = await prisma.contact.findUnique({ where: { id: customerId } });
    if (!customer || !['CUSTOMER', 'BOTH'].includes(customer.type) || customer.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Customer is not available.' });
    }

    let subtotal = 0;
    let totalTax = 0;
    const orderItems = [];

    for (const item of items) {
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unitPrice);
      const taxRate = parseFloat(item.taxRate || 0);

      if (!item.productId) {
        return res.status(400).json({ success: false, message: 'Product is unavailable.' });
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Enter a valid quantity.' });
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(taxRate) || taxRate < 0) {
        return res.status(400).json({ success: false, message: 'Enter valid product pricing.' });
      }

      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.status !== 'ACTIVE') {
        return res.status(400).json({ success: false, message: 'Product is unavailable.' });
      }

      const lineSubtotal = quantity * unitPrice;
      const lineTax = lineSubtotal * (taxRate / 100);
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      totalTax += lineTax;

      orderItems.push({
        productId: item.productId || null,
        description: item.description || 'Furniture item',
        quantity,
        unitPrice,
        taxRate,
        total: Math.round(lineTotal * 100) / 100,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    totalTax = Math.round(totalTax * 100) / 100;
    const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;

    const orderNumber = await getNextSequence('salesOrder', 'orderNumber', 'SO');

    const salesOrder = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId,
        date: new Date(date),
        subtotal,
        tax: totalTax,
        total: grandTotal,
        status: 'DRAFT',
        notes: notes?.trim() || null,
        items: {
          create: orderItems,
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Sales order created successfully.', order: salesOrder });
  } catch (error) {
    next(error);
  }
};

// PUT /api/sales-orders/:id/confirm
const confirmSalesOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.salesOrder.findUnique({ where: { id } });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales order not found.' });
    }

    const updated = await prisma.salesOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: { customer: true, items: true },
    });

    res.status(200).json({ success: true, message: 'Sales order confirmed.', order: updated });
  } catch (error) {
    next(error);
  }
};

// POST /api/sales-orders/:id/create-invoice
const createInvoiceFromSalesOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true, customer: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales order not found.' });
    }

    if (order.status !== 'CONFIRMED') {
      return res.status(400).json({ success: false, message: 'Only confirmed sales orders can be invoiced.' });
    }

    const invoiceNumber = await getNextSequence('customerInvoice', 'invoiceNumber', 'INV');
    const invoiceDueDate = new Date();
    invoiceDueDate.setDate(invoiceDueDate.getDate() + 30); // Net 30 days

    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.customerInvoice.create({
        data: {
          invoiceNumber,
          salesOrderId: order.id,
          customerId: order.customerId,
          customerEmail: order.customer?.email || null,
          date: new Date(),
          dueDate: invoiceDueDate,
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
          paidAmount: 0,
          status: 'UNPAID',
          notes: `Generated from Sales Order ${order.orderNumber}`,
          items: {
            create: order.items.map((i) => ({
              productId: i.productId,
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              taxRate: i.taxRate,
              total: i.total,
            })),
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      // Update Sales Order status to INVOICED
      await tx.salesOrder.update({
        where: { id: order.id },
        data: { status: 'INVOICED' },
      });

      return created;
    });

    res.status(201).json({
      success: true,
      message: `Invoice ${invoiceNumber} created from Sales Order ${order.orderNumber}.`,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// ==============================================
// CUSTOMER INVOICES
// ==============================================

// GET /api/customer-invoices
const getCustomerInvoices = async (req, res, next) => {
  try {
    const { status, search, customerId } = req.query;
    const where = {};

    // Strict role enforcement for Customer role!
    if (req.user.role === 'CUSTOMER') {
      where.customerId = await getCustomerContactId(req.user.userId, req.user.email);
    } else {
      if (customerId) where.customerId = customerId;
    }

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const invoices = await prisma.customerInvoice.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        customer: true,
        items: { include: { product: true } },
        payments: true,
      },
    });

    res.status(200).json({ success: true, count: invoices.length, invoices });
  } catch (error) {
    next(error);
  }
};

// GET /api/customer-invoices/:id
const getCustomerInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
        payments: true,
        salesOrder: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // Role check: Customer can only see their own invoice
    if (req.user.role === 'CUSTOMER') {
      const customerContactId = await getCustomerContactId(req.user.userId, req.user.email);
      const isOwner = invoice.customerId === customerContactId;

      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied to this invoice.' });
      }
    }

    res.status(200).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

// POST /api/customer-invoices (Direct creation)
const createCustomerInvoice = async (req, res, next) => {
  try {
    const { customerId, date = new Date(), dueDate, items, notes } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer selection is required.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one line item is required.' });
    }

    const customer = await prisma.contact.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer contact not found.' });
    }

    let subtotal = 0;
    let totalTax = 0;
    const invoiceItems = [];

    for (const item of items) {
      const quantity = Math.max(1, parseFloat(item.quantity) || 1);
      const unitPrice = Math.max(0, parseFloat(item.unitPrice) || 0);
      const taxRate = Math.max(0, parseFloat(item.taxRate) || 0);

      const lineSubtotal = quantity * unitPrice;
      const lineTax = lineSubtotal * (taxRate / 100);
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      totalTax += lineTax;

      invoiceItems.push({
        productId: item.productId || null,
        description: item.description || 'Furniture item',
        quantity,
        unitPrice,
        taxRate,
        total: Math.round(lineTotal * 100) / 100,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    totalTax = Math.round(totalTax * 100) / 100;
    const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;

    const invoiceNumber = await getNextSequence('customerInvoice', 'invoiceNumber', 'INV');

    const invoice = await prisma.customerInvoice.create({
      data: {
        invoiceNumber,
        customerId,
        customerEmail: customer.email || null,
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal,
        tax: totalTax,
        total: grandTotal,
        paidAmount: 0,
        status: 'UNPAID',
        notes: notes?.trim() || null,
        items: {
          create: invoiceItems,
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Customer invoice created successfully.', invoice });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  confirmSalesOrder,
  createInvoiceFromSalesOrder,
  getCustomerInvoices,
  getCustomerInvoiceById,
  createCustomerInvoice,
};
