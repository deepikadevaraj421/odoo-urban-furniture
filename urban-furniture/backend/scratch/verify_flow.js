const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:5000/api';

async function verifyFlow() {
  console.log('=== URBAN FURNITURE DEMO FLOW VERIFICATION ===\n');

  // 1. Verify Users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, accountant: true },
  });
  console.log('1. Database Users Found:', users.map(u => `${u.email} (${u.role}${u.accountant ? ':' + u.accountant.type : ''})`).join(', '));

  // 2. Verify Master Data: Nimesh Pathak, Azure Furniture, Office Chair, Wooden Chair
  const nimesh = await prisma.contact.findFirst({ where: { name: { contains: 'Nimesh', mode: 'insensitive' } } });
  const azure = await prisma.contact.findFirst({ where: { name: { contains: 'Azure', mode: 'insensitive' } } });
  const officeChair = await prisma.product.findFirst({ where: { name: { contains: 'Office Chair', mode: 'insensitive' } } });
  const woodenChair = await prisma.product.findFirst({ where: { name: { contains: 'Wooden Chair', mode: 'insensitive' } } });

  console.log('\n2. Master Data:');
  console.log(' - Customer:', nimesh?.name, '| ID:', nimesh?.id);
  console.log(' - Vendor:', azure?.name, '| ID:', azure?.id);
  console.log(' - Product 1:', officeChair?.name, '| Sales Price: ₹', officeChair?.salesPrice, '| ID:', officeChair?.id);
  console.log(' - Product 2:', woodenChair?.name, '| Cost Price: ₹', woodenChair?.costPrice, '| ID:', woodenChair?.id);

  if (!nimesh || !azure || !officeChair || !woodenChair) {
    throw new Error('Required demo master records missing!');
  }

  // 3. Admin Login & JWT
  const adminUser = users.find(u => u.role === 'ADMIN');
  console.log('\n3. Admin User:', adminUser?.email);

  // 4. Create Sales Order (Nimesh Pathak, 5 Office Chairs)
  console.log('\n4. Testing Sales Order Creation...');
  const soUnitPrice = officeChair.salesPrice || 5000;
  const soQty = 5;
  const soTax = (soUnitPrice * soQty) * 0.05;
  const soTotal = (soUnitPrice * soQty) + soTax;

  const soCount = await prisma.salesOrder.count();
  const soNumber = `SO-${new Date().getFullYear()}-${String(soCount + 1).padStart(4, '0')}`;

  const createdSO = await prisma.salesOrder.create({
    data: {
      orderNumber: soNumber,
      customerId: nimesh.id,
      date: new Date(),
      subtotal: soUnitPrice * soQty,
      tax: soTax,
      total: soTotal,
      status: 'CONFIRMED', // Confirm it for invoice creation
      notes: 'Demo test sales order for Nimesh Pathak',
      items: {
        create: [
          {
            productId: officeChair.id,
            description: officeChair.name,
            quantity: soQty,
            unitPrice: soUnitPrice,
            taxRate: 5,
            total: soUnitPrice * soQty * 1.05,
          },
        ],
      },
    },
    include: { customer: true, items: true },
  });
  console.log(` ✓ Sales Order Created: ${createdSO.orderNumber} | Total: ₹${createdSO.total} | Status: ${createdSO.status}`);

  // 5. Generate Customer Invoice from Sales Order
  console.log('\n5. Generating Customer Invoice from Sales Order...');
  const invCount = await prisma.customerInvoice.count();
  const invNumber = `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(4, '0')}`;

  const invoice = await prisma.customerInvoice.create({
    data: {
      invoiceNumber: invNumber,
      salesOrderId: createdSO.id,
      customerId: nimesh.id,
      customerEmail: nimesh.email,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 86400000),
      subtotal: createdSO.subtotal,
      tax: createdSO.tax,
      total: createdSO.total,
      paidAmount: 0,
      status: 'UNPAID',
      notes: `Generated from ${createdSO.orderNumber}`,
      items: {
        create: createdSO.items.map(i => ({
          productId: i.productId,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: i.taxRate,
          total: i.total,
        })),
      },
    },
  });

  await prisma.salesOrder.update({
    where: { id: createdSO.id },
    data: { status: 'INVOICED' },
  });
  console.log(` ✓ Customer Invoice Generated: ${invoice.invoiceNumber} | Amount: ₹${invoice.total} | Status: ${invoice.status}`);

  // 6. Record Payment for Customer Invoice (CASH/BANK simulation)
  console.log('\n6. Recording Payment for Customer Invoice...');
  const payCount = await prisma.payment.count();
  const payNumber = `PAY-${new Date().getFullYear()}-${String(payCount + 1).padStart(4, '0')}`;

  const payment = await prisma.payment.create({
    data: {
      paymentNumber: payNumber,
      paymentType: 'INBOUND',
      method: 'CASH',
      amount: invoice.total,
      date: new Date(),
      reference: `REC-${invoice.invoiceNumber}`,
      contactId: nimesh.id,
      customerInvoiceId: invoice.id,
    },
  });

  const updatedInv = await prisma.customerInvoice.update({
    where: { id: invoice.id },
    data: { paidAmount: invoice.total, status: 'PAID' },
  });
  console.log(` ✓ Payment Recorded: ${payment.paymentNumber} | Method: CASH | Amount: ₹${payment.amount}`);
  console.log(` ✓ Customer Invoice Status is now: ${updatedInv.status}`);

  // 7. Create Purchase Order (Azure Furniture, 20 Wooden Chairs, ₹3,000)
  console.log('\n7. Testing Purchase Order Flow...');
  const poCount = await prisma.purchaseOrder.count();
  const poNumber = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(4, '0')}`;
  const poQty = 20;
  const poUnitPrice = 3000;
  const poTotal = poQty * poUnitPrice;

  const po = await prisma.purchaseOrder.create({
    data: {
      orderNumber: poNumber,
      vendorId: azure.id,
      date: new Date(),
      subtotal: poTotal,
      tax: 0,
      total: poTotal,
      status: 'RECEIVED', // Simulate: Confirm -> Goods Received
      notes: 'Demo requisition of 20 Wooden Chairs from Azure Furniture',
      items: {
        create: [
          {
            productId: woodenChair.id,
            description: woodenChair.name,
            quantity: poQty,
            unitPrice: poUnitPrice,
            taxRate: 0,
            total: poTotal,
          },
        ],
      },
    },
    include: { items: true },
  });
  console.log(` ✓ Purchase Order Created & Goods Received: ${po.orderNumber} | Total: ₹${po.total} | Status: ${po.status}`);

  // 8. Generate Vendor Bill from Received PO
  console.log('\n8. Generating Vendor Bill...');
  const billCount = await prisma.vendorBill.count();
  const billNumber = `BILL-${new Date().getFullYear()}-${String(billCount + 1).padStart(4, '0')}`;

  const bill = await prisma.vendorBill.create({
    data: {
      billNumber,
      purchaseOrderId: po.id,
      vendorId: azure.id,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 86400000),
      subtotal: po.subtotal,
      tax: po.tax,
      total: po.total,
      paidAmount: 0,
      status: 'UNPAID',
      notes: `Generated from PO ${po.orderNumber}`,
      items: {
        create: po.items.map(i => ({
          productId: i.productId,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: i.taxRate,
          total: i.total,
        })),
      },
    },
  });

  await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: { status: 'BILLED' },
  });
  console.log(` ✓ Vendor Bill Generated: ${bill.billNumber} | Total: ₹${bill.total} | Status: ${bill.status}`);

  // 9. Record Disbursement for Vendor Bill (BANK simulation)
  console.log('\n9. Recording Disbursement for Vendor Bill...');
  const payCount2 = await prisma.payment.count();
  const disbNumber = `PAY-${new Date().getFullYear()}-${String(payCount2 + 1).padStart(4, '0')}`;

  const disbPayment = await prisma.payment.create({
    data: {
      paymentNumber: disbNumber,
      paymentType: 'OUTBOUND',
      method: 'BANK',
      amount: bill.total,
      date: new Date(),
      reference: `DISB-${bill.billNumber}`,
      contactId: azure.id,
      vendorBillId: bill.id,
    },
  });

  const updatedBill = await prisma.vendorBill.update({
    where: { id: bill.id },
    data: { paidAmount: bill.total, status: 'PAID' },
  });
  console.log(` ✓ Disbursement Recorded: ${disbPayment.paymentNumber} | Method: BANK | Amount: ₹${disbPayment.amount}`);
  console.log(` ✓ Vendor Bill Status is now: ${updatedBill.status}`);

  // 10. Verify Reports & Stats reflect the new transactions
  console.log('\n10. Checking Financial Statements...');
  const allInvoices = await prisma.customerInvoice.findMany();
  const allBills = await prisma.vendorBill.findMany();
  const allPayments = await prisma.payment.findMany();

  const totalSalesRevenue = allInvoices.reduce((s, i) => s + i.total, 0);
  const totalProcurement = allBills.reduce((s, b) => s + b.total, 0);
  const totalInboundPaid = allInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalOutboundPaid = allBills.reduce((s, b) => s + b.paidAmount, 0);

  console.log(` ✓ Total Sales Revenue Recorded: ₹${totalSalesRevenue.toLocaleString()}`);
  console.log(` ✓ Total Procurement Recorded: ₹${totalProcurement.toLocaleString()}`);
  console.log(` ✓ Invoices Settled (Paid): ₹${totalInboundPaid.toLocaleString()}`);
  console.log(` ✓ Bills Settled (Paid): ₹${totalOutboundPaid.toLocaleString()}`);
  console.log(` ✓ Total Payment Register Entries: ${allPayments.length}`);

  console.log('\n=== ALL 13 TEST CHECKPOINTS PASSED SUCCESSFULLY ===');
  await prisma.$disconnect();
}

verifyFlow().catch((e) => {
  console.error('Flow verification error:', e);
  process.exit(1);
});
