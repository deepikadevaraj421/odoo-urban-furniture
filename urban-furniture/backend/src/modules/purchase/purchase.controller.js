const prisma = require('../../config/database');

const getNextSequence = async (model, field, prefix) => {
  const count = await prisma[model].count();
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
};

// ==============================================
// PURCHASE ORDERS
// ==============================================

// GET /api/purchase-orders
const getPurchaseOrders = async (req, res, next) => {
  try {
    const { status, search, vendorId } = req.query;
    const where = {};

    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: true,
        items: { include: { product: true } },
        bills: { select: { id: true, billNumber: true, status: true } },
      },
    });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

// GET /api/purchase-orders/:id
const getPurchaseOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        items: { include: { product: true } },
        bills: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// POST /api/purchase-orders
const createPurchaseOrder = async (req, res, next) => {
  try {
    const { vendorId, date = new Date(), items, notes } = req.body;

    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'Vendor selection is required.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one line item is required.' });
    }

    let subtotal = 0;
    let totalTax = 0;
    const orderItems = [];

    for (const item of items) {
      const quantity = Math.max(1, parseFloat(item.quantity) || 1);
      const unitPrice = Math.max(0, parseFloat(item.unitPrice) || 0);
      const taxRate = Math.max(0, parseFloat(item.taxRate) || 0);

      const lineSubtotal = quantity * unitPrice;
      const lineTax = lineSubtotal * (taxRate / 100);
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      totalTax += lineTax;

      orderItems.push({
        productId: item.productId || null,
        description: item.description || 'Raw materials / furniture supply',
        quantity,
        unitPrice,
        taxRate,
        total: Math.round(lineTotal * 100) / 100,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    totalTax = Math.round(totalTax * 100) / 100;
    const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;

    const orderNumber = await getNextSequence('purchaseOrder', 'orderNumber', 'PO');

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        vendorId,
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
        vendor: true,
        items: { include: { product: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Purchase order created successfully.', order: purchaseOrder });
  } catch (error) {
    next(error);
  }
};

// PUT /api/purchase-orders/:id/confirm
const confirmPurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.purchaseOrder.findUnique({ where: { id } });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }

    if (order.status !== 'DRAFT') {
      return res.status(400).json({ success: false, message: 'Only draft purchase orders can be confirmed.' });
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: { vendor: true, items: true },
    });

    res.status(200).json({ success: true, message: 'Purchase order confirmed.', order: updated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/purchase-orders/:id/receive (EXPLICIT "Mark as Received" REQUIRED BY PROMPT)
const receiveGoods = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.purchaseOrder.findUnique({ where: { id } });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }

    if (order.status !== 'CONFIRMED') {
      return res.status(400).json({ success: false, message: 'Only confirmed purchase orders can receive goods.' });
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'RECEIVED' },
      include: { vendor: true, items: true },
    });

    res.status(200).json({
      success: true,
      message: `Goods received successfully for Purchase Order ${order.orderNumber}. Ready to generate Vendor Bill.`,
      order: updated,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/purchase-orders/:id/create-bill
const createBillFromPurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true, vendor: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }

    if (order.status !== 'RECEIVED') {
      return res.status(400).json({ success: false, message: 'Goods must be received before creating a vendor bill.' });
    }

    const billNumber = await getNextSequence('vendorBill', 'billNumber', 'BILL');
    const billDueDate = new Date();
    billDueDate.setDate(billDueDate.getDate() + 30);

    const bill = await prisma.$transaction(async (tx) => {
      const created = await tx.vendorBill.create({
        data: {
          billNumber,
          purchaseOrderId: order.id,
          vendorId: order.vendorId,
          date: new Date(),
          dueDate: billDueDate,
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
          paidAmount: 0,
          status: 'UNPAID',
          notes: `Generated from Purchase Order ${order.orderNumber}`,
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
          vendor: true,
          items: true,
        },
      });

      // Update Purchase Order status to BILLED
      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { status: 'BILLED' },
      });

      return created;
    });

    res.status(201).json({
      success: true,
      message: `Vendor Bill ${billNumber} generated from Purchase Order ${order.orderNumber}.`,
      bill,
    });
  } catch (error) {
    next(error);
  }
};

// ==============================================
// VENDOR BILLS
// ==============================================

// GET /api/vendor-bills
const getVendorBills = async (req, res, next) => {
  try {
    const { status, search, vendorId } = req.query;
    const where = {};

    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const bills = await prisma.vendorBill.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        vendor: true,
        items: { include: { product: true } },
        payments: true,
      },
    });

    res.status(200).json({ success: true, count: bills.length, bills });
  } catch (error) {
    next(error);
  }
};

// GET /api/vendor-bills/:id
const getVendorBillById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bill = await prisma.vendorBill.findUnique({
      where: { id },
      include: {
        vendor: true,
        items: { include: { product: true } },
        payments: true,
        purchaseOrder: true,
      },
    });

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Vendor bill not found.' });
    }

    res.status(200).json({ success: true, bill });
  } catch (error) {
    next(error);
  }
};

// POST /api/vendor-bills (Direct creation)
const createVendorBill = async (req, res, next) => {
  try {
    const { vendorId, date = new Date(), dueDate, items, notes } = req.body;

    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'Vendor selection is required.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one line item is required.' });
    }

    let subtotal = 0;
    let totalTax = 0;
    const billItems = [];

    for (const item of items) {
      const quantity = Math.max(1, parseFloat(item.quantity) || 1);
      const unitPrice = Math.max(0, parseFloat(item.unitPrice) || 0);
      const taxRate = Math.max(0, parseFloat(item.taxRate) || 0);

      const lineSubtotal = quantity * unitPrice;
      const lineTax = lineSubtotal * (taxRate / 100);
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      totalTax += lineTax;

      billItems.push({
        productId: item.productId || null,
        description: item.description || 'Raw material / furniture supply',
        quantity,
        unitPrice,
        taxRate,
        total: Math.round(lineTotal * 100) / 100,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    totalTax = Math.round(totalTax * 100) / 100;
    const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;

    const billNumber = await getNextSequence('vendorBill', 'billNumber', 'BILL');

    const bill = await prisma.vendorBill.create({
      data: {
        billNumber,
        vendorId,
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal,
        tax: totalTax,
        total: grandTotal,
        paidAmount: 0,
        status: 'UNPAID',
        notes: notes?.trim() || null,
        items: {
          create: billItems,
        },
      },
      include: {
        vendor: true,
        items: { include: { product: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Vendor bill created successfully.', bill });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  confirmPurchaseOrder,
  receiveGoods,
  createBillFromPurchaseOrder,
  getVendorBills,
  getVendorBillById,
  createVendorBill,
};
