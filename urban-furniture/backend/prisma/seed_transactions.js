const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * TRANSACTION SEED — Creates realistic Sales Orders, Invoices,
 * Purchase Orders, Vendor Bills, Payments, and Journal Entries.
 * Safe to re-run (skips if transactions already exist).
 */

async function main() {
  console.log('\n💼 Urban Furniture ERP — Transaction Data Seed\n');
  console.log('Transaction demo seed disabled: use real Customer Directory records.');
  return;

  // Check if transactions already exist
  const existingInvoices = await prisma.customerInvoice.count();
  if (existingInvoices > 0) {
    console.log(`  ⚠️  ${existingInvoices} invoices already exist. Skipping transaction seed to avoid duplicates.`);
    console.log('  ℹ️  Delete existing transactions first if you want to re-seed.\n');
    await printCounts();
    return;
  }

  // ── Lookup key contacts ───────────────────────────────────
  const nimesh = await prisma.contact.findFirst({ where: { name: 'Nimesh Pathak' } });
  const azure = await prisma.contact.findFirst({ where: { name: 'Azure Furniture' } });
  const rahul = await prisma.contact.findFirst({ where: { name: 'Rahul Sharma' } });
  const priya = await prisma.contact.findFirst({ where: { name: 'Priya Mehta' } });
  const suresh = await prisma.contact.findFirst({ where: { name: 'Suresh Kumar' } });
  const royal = await prisma.contact.findFirst({ where: { name: 'Royal Home Interiors' } });
  const modern = await prisma.contact.findFirst({ where: { name: 'Modern Living Stores' } });
  const chennaiOS = await prisma.contact.findFirst({ where: { name: 'Chennai Office Solutions' } });
  const metro = await prisma.contact.findFirst({ where: { name: 'Metro Furniture Corporation' } });
  const anita = await prisma.contact.findFirst({ where: { name: 'Anita Reddy' } });

  if (!nimesh || !azure) {
    console.error('❌ Required contacts Nimesh Pathak and Azure Furniture must exist. Run master data seed first.');
    return;
  }

  // ── Lookup key products ───────────────────────────────────
  const officeChair = await prisma.product.findFirst({ where: { name: 'Office Chair' } });
  const woodenChair = await prisma.product.findFirst({ where: { name: 'Wooden Chair' } });
  const execChair = await prisma.product.findFirst({ where: { name: 'Executive Chair' } });
  const diningTable = await prisma.product.findFirst({ where: { name: 'Wooden Dining Table' } });
  const confTable = await prisma.product.findFirst({ where: { name: 'Conference Table' } });
  const sofa3 = await prisma.product.findFirst({ where: { name: '3-Seater Sofa' } });
  const bookshelf = await prisma.product.findFirst({ where: { name: 'Bookshelf' } });
  const wardrobe = await prisma.product.findFirst({ where: { name: 'Wardrobe' } });
  const kingBed = await prisma.product.findFirst({ where: { name: 'King Size Bed' } });
  const tvUnit = await prisma.product.findFirst({ where: { name: 'TV Unit' } });
  const ergoChair = await prisma.product.findFirst({ where: { name: 'Ergonomic Chair' } });
  const studyTable = await prisma.product.findFirst({ where: { name: 'Study Table' } });
  const coffeeTable = await prisma.product.findFirst({ where: { name: 'Coffee Table' } });
  const recliner = await prisma.product.findFirst({ where: { name: 'Recliner Chair' } });

  if (!officeChair || !woodenChair) {
    console.error('❌ Required products Office Chair and Wooden Chair must exist. Run master data seed first.');
    return;
  }

  // ── Lookup key accounts ───────────────────────────────────
  const cashAcc = await prisma.account.findFirst({ where: { code: 'A001' } }); // Cash in Hand
  const bankAcc = await prisma.account.findFirst({ where: { code: 'A002' } }); // Bank HDFC
  const arAcc = await prisma.account.findFirst({ where: { code: 'A004' } });   // Accounts Receivable
  const invAcc = await prisma.account.findFirst({ where: { code: 'A005' } });  // Furniture Inventory
  const apAcc = await prisma.account.findFirst({ where: { code: 'L001' } });   // Accounts Payable
  const salesAcc = await prisma.account.findFirst({ where: { code: 'I001' } }); // Sales Income - Furniture
  const purchAcc = await prisma.account.findFirst({ where: { code: 'E001' } }); // Purchase Expense - Goods
  const rentAcc = await prisma.account.findFirst({ where: { code: 'E003' } });  // Rent Expense
  const salaryAcc = await prisma.account.findFirst({ where: { code: 'E002' } }); // Salary Expense

  // ── Lookup journals ──────────────────────────────────────
  const salesJournal = await prisma.journal.findFirst({ where: { code: 'SAL' } });
  const purchJournal = await prisma.journal.findFirst({ where: { code: 'PUR' } });
  const bankJournal = await prisma.journal.findFirst({ where: { code: 'BNK' } });
  const cashJournal = await prisma.journal.findFirst({ where: { code: 'CSH' } });
  const genJournal = await prisma.journal.findFirst({ where: { code: 'GEN' } });

  console.log('✅ All lookups successful. Creating transactions...\n');

  // ═══════════════════════════════════════════════════════════
  // SALES ORDERS + CUSTOMER INVOICES
  // ═══════════════════════════════════════════════════════════

  const salesDefs = [
    // DEMO ORDER: Nimesh Pathak → 5 Office Chairs
    { num: 'SO-2026-001', customer: nimesh, status: 'INVOICED', items: [
      { product: officeChair, desc: 'Office Chair', qty: 5, price: 8500 },
    ]},
    // Nimesh → big furniture order
    { num: 'SO-2026-002', customer: nimesh, status: 'INVOICED', items: [
      { product: kingBed, desc: 'King Size Bed', qty: 1, price: 55000 },
      { product: wardrobe, desc: 'Wardrobe', qty: 1, price: 45000 },
    ]},
    // Rahul Sharma
    { num: 'SO-2026-003', customer: rahul, status: 'INVOICED', items: [
      { product: execChair, desc: 'Executive Chair', qty: 10, price: 18000 },
      { product: confTable, desc: 'Conference Table', qty: 2, price: 65000 },
    ]},
    // Priya Mehta
    { num: 'SO-2026-004', customer: priya, status: 'INVOICED', items: [
      { product: sofa3, desc: '3-Seater Sofa', qty: 3, price: 38000 },
      { product: coffeeTable, desc: 'Coffee Table', qty: 3, price: 12000 },
    ]},
    // Suresh Kumar
    { num: 'SO-2026-005', customer: suresh, status: 'INVOICED', items: [
      { product: bookshelf, desc: 'Bookshelf', qty: 5, price: 12000 },
      { product: studyTable, desc: 'Study Table', qty: 5, price: 9500 },
    ]},
    // Anita Reddy
    { num: 'SO-2026-006', customer: anita, status: 'CONFIRMED', items: [
      { product: recliner, desc: 'Recliner Chair', qty: 2, price: 25000 },
      { product: tvUnit, desc: 'TV Unit', qty: 1, price: 22000 },
    ]},
    // Metro Furniture Corp
    { num: 'SO-2026-007', customer: metro, status: 'INVOICED', items: [
      { product: ergoChair, desc: 'Ergonomic Chair', qty: 20, price: 15000 },
    ]},
    // Nimesh small order
    { num: 'SO-2026-008', customer: nimesh, status: 'INVOICED', items: [
      { product: woodenChair, desc: 'Wooden Chair', qty: 12, price: 4500 },
    ]},
  ];

  console.log('🛍️  Creating Sales Orders & Invoices...');
  const createdInvoices = [];

  for (const so of salesDefs) {
    if (!so.customer) continue;
    const itemsData = so.items.filter(i => i.product);
    const subtotal = itemsData.reduce((s, i) => s + i.qty * i.price, 0);
    const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
    const total = subtotal + tax;

    const order = await prisma.salesOrder.create({
      data: {
        orderNumber: so.num,
        customerId: so.customer.id,
        date: new Date(`2026-0${Math.floor(Math.random() * 8) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`),
        subtotal,
        tax,
        total,
        status: so.status,
        items: {
          create: itemsData.map(i => ({
            productId: i.product.id,
            description: i.desc,
            quantity: i.qty,
            unitPrice: i.price,
            taxRate: 18,
            total: i.qty * i.price,
          })),
        },
      },
    });

    // Create invoice for INVOICED orders
    if (so.status === 'INVOICED') {
      const invNum = so.num.replace('SO-', 'INV-');
      const invDate = new Date(`2026-0${Math.floor(Math.random() * 8) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`);
      const dueDate = new Date(invDate);
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice = await prisma.customerInvoice.create({
        data: {
          invoiceNumber: invNum,
          salesOrderId: order.id,
          customerId: so.customer.id,
          date: invDate,
          dueDate,
          subtotal,
          tax,
          total,
          paidAmount: 0,
          status: 'UNPAID',
          items: {
            create: itemsData.map(i => ({
              productId: i.product.id,
              description: i.desc,
              quantity: i.qty,
              unitPrice: i.price,
              taxRate: 18,
              total: i.qty * i.price,
            })),
          },
        },
      });
      createdInvoices.push({ invoice, customer: so.customer, total });
    }
  }
  console.log(`  ✅ ${salesDefs.length} Sales Orders created`);
  console.log(`  ✅ ${createdInvoices.length} Customer Invoices created`);

  // ═══════════════════════════════════════════════════════════
  // PURCHASE ORDERS + VENDOR BILLS
  // ═══════════════════════════════════════════════════════════

  const purchDefs = [
    // DEMO ORDER: Azure Furniture → 20 Wooden Chairs
    { num: 'PO-2026-001', vendor: azure, status: 'BILLED', items: [
      { product: woodenChair, desc: 'Wooden Chair', qty: 20, price: 2800 },
    ]},
    // Azure Furniture → Office Chairs
    { num: 'PO-2026-002', vendor: azure, status: 'BILLED', items: [
      { product: officeChair, desc: 'Office Chair', qty: 15, price: 5500 },
    ]},
    // Royal Home Interiors
    { num: 'PO-2026-003', vendor: royal, status: 'BILLED', items: [
      { product: kingBed, desc: 'King Size Bed', qty: 5, price: 36000 },
      { product: wardrobe, desc: 'Wardrobe', qty: 5, price: 30000 },
    ]},
    // Modern Living
    { num: 'PO-2026-004', vendor: modern, status: 'BILLED', items: [
      { product: sofa3, desc: '3-Seater Sofa', qty: 8, price: 25000 },
    ]},
    // Chennai Office Solutions
    { num: 'PO-2026-005', vendor: chennaiOS, status: 'BILLED', items: [
      { product: execChair, desc: 'Executive Chair', qty: 10, price: 12000 },
      { product: confTable, desc: 'Conference Table', qty: 3, price: 42000 },
    ]},
    // Azure → Ergonomic Chairs
    { num: 'PO-2026-006', vendor: azure, status: 'RECEIVED', items: [
      { product: ergoChair, desc: 'Ergonomic Chair', qty: 25, price: 10000 },
    ]},
  ];

  console.log('\n📦 Creating Purchase Orders & Vendor Bills...');
  const createdBills = [];

  for (const po of purchDefs) {
    if (!po.vendor) continue;
    const itemsData = po.items.filter(i => i.product);
    const subtotal = itemsData.reduce((s, i) => s + i.qty * i.price, 0);
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const total = subtotal + tax;

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber: po.num,
        vendorId: po.vendor.id,
        date: new Date(`2026-0${Math.floor(Math.random() * 8) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`),
        subtotal,
        tax,
        total,
        status: po.status,
        items: {
          create: itemsData.map(i => ({
            productId: i.product.id,
            description: i.desc,
            quantity: i.qty,
            unitPrice: i.price,
            taxRate: 18,
            total: i.qty * i.price,
          })),
        },
      },
    });

    // Create bill for BILLED orders
    if (po.status === 'BILLED') {
      const billNum = po.num.replace('PO-', 'BILL-');
      const billDate = new Date(`2026-0${Math.floor(Math.random() * 8) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`);
      const dueDate = new Date(billDate);
      dueDate.setDate(dueDate.getDate() + 45);

      const bill = await prisma.vendorBill.create({
        data: {
          billNumber: billNum,
          purchaseOrderId: order.id,
          vendorId: po.vendor.id,
          date: billDate,
          dueDate,
          subtotal,
          tax,
          total,
          paidAmount: 0,
          status: 'UNPAID',
          items: {
            create: itemsData.map(i => ({
              productId: i.product.id,
              description: i.desc,
              quantity: i.qty,
              unitPrice: i.price,
              taxRate: 18,
              total: i.qty * i.price,
            })),
          },
        },
      });
      createdBills.push({ bill, vendor: po.vendor, total });
    }
  }
  console.log(`  ✅ ${purchDefs.length} Purchase Orders created`);
  console.log(`  ✅ ${createdBills.length} Vendor Bills created`);

  // ═══════════════════════════════════════════════════════════
  // PAYMENTS + UPDATE INVOICE/BILL STATUS
  // ═══════════════════════════════════════════════════════════
  console.log('\n💳 Creating Payments...');
  let paymentCounter = 1;

  // Customer payments (pay some invoices FULLY, some PARTIALLY)
  for (let i = 0; i < createdInvoices.length; i++) {
    const { invoice, customer, total } = createdInvoices[i];
    let payAmount, newStatus;

    if (i < 3) {
      // Pay fully
      payAmount = total;
      newStatus = 'PAID';
    } else if (i < 5) {
      // Pay partially
      payAmount = Math.round(total * 0.5);
      newStatus = 'PARTIALLY_PAID';
    } else {
      // Leave unpaid
      continue;
    }

    await prisma.payment.create({
      data: {
        paymentNumber: `PAY-IN-${String(paymentCounter++).padStart(4, '0')}`,
        paymentType: 'INBOUND',
        method: i % 2 === 0 ? 'CASH' : 'BANK',
        amount: payAmount,
        date: new Date(`2026-0${Math.min(9, Math.floor(Math.random() * 8) + 1)}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`),
        reference: `Payment for ${invoice.invoiceNumber}`,
        contactId: customer.id,
        customerInvoiceId: invoice.id,
      },
    });

    await prisma.customerInvoice.update({
      where: { id: invoice.id },
      data: { paidAmount: payAmount, status: newStatus },
    });
  }

  // Vendor payments (pay some bills FULLY, some PARTIALLY)
  for (let i = 0; i < createdBills.length; i++) {
    const { bill, vendor, total } = createdBills[i];
    let payAmount, newStatus;

    if (i < 2) {
      payAmount = total;
      newStatus = 'PAID';
    } else if (i < 4) {
      payAmount = Math.round(total * 0.6);
      newStatus = 'PARTIALLY_PAID';
    } else {
      continue;
    }

    await prisma.payment.create({
      data: {
        paymentNumber: `PAY-OUT-${String(paymentCounter++).padStart(4, '0')}`,
        paymentType: 'OUTBOUND',
        method: 'BANK',
        amount: payAmount,
        date: new Date(`2026-0${Math.min(9, Math.floor(Math.random() * 8) + 1)}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`),
        reference: `Payment for ${bill.billNumber}`,
        contactId: vendor.id,
        vendorBillId: bill.id,
      },
    });

    await prisma.vendorBill.update({
      where: { id: bill.id },
      data: { paidAmount: payAmount, status: newStatus },
    });
  }

  const totalPayments = paymentCounter - 1;
  console.log(`  ✅ ${totalPayments} Payments created (INBOUND + OUTBOUND)`);

  // ═══════════════════════════════════════════════════════════
  // JOURNAL ENTRIES (balanced double-entry)
  // ═══════════════════════════════════════════════════════════
  console.log('\n📝 Creating Journal Entries...');

  if (salesJournal && arAcc && salesAcc && cashAcc && bankAcc && apAcc && purchAcc) {
    let jeCounter = 1;

    // Sales journal entries (Debit AR, Credit Sales Revenue)
    for (const { invoice, total } of createdInvoices) {
      await prisma.journalEntry.create({
        data: {
          entryNumber: `JE-${String(jeCounter++).padStart(4, '0')}`,
          journalId: salesJournal.id,
          date: invoice.date,
          reference: `Sales - ${invoice.invoiceNumber}`,
          status: 'POSTED',
          totalDebit: total,
          totalCredit: total,
          items: {
            create: [
              { accountId: arAcc.id, label: `Sales to customer - ${invoice.invoiceNumber}`, debit: total, credit: 0 },
              { accountId: salesAcc.id, label: `Revenue - ${invoice.invoiceNumber}`, debit: 0, credit: total },
            ],
          },
        },
      });
    }

    // Purchase journal entries (Debit Purchase Expense, Credit AP)
    for (const { bill, total } of createdBills) {
      await prisma.journalEntry.create({
        data: {
          entryNumber: `JE-${String(jeCounter++).padStart(4, '0')}`,
          journalId: purchJournal.id,
          date: bill.date,
          reference: `Purchase - ${bill.billNumber}`,
          status: 'POSTED',
          totalDebit: total,
          totalCredit: total,
          items: {
            create: [
              { accountId: purchAcc.id, label: `Procurement - ${bill.billNumber}`, debit: total, credit: 0 },
              { accountId: apAcc.id, label: `Payable - ${bill.billNumber}`, debit: 0, credit: total },
            ],
          },
        },
      });
    }

    // Cash/Bank receipt entries for customer payments
    const allInboundPayments = await prisma.payment.findMany({ where: { paymentType: 'INBOUND' } });
    for (const pmt of allInboundPayments) {
      const jrnl = pmt.method === 'CASH' ? cashJournal : bankJournal;
      const accDebit = pmt.method === 'CASH' ? cashAcc : bankAcc;
      await prisma.journalEntry.create({
        data: {
          entryNumber: `JE-${String(jeCounter++).padStart(4, '0')}`,
          journalId: jrnl.id,
          date: pmt.date,
          reference: `Receipt - ${pmt.paymentNumber}`,
          status: 'POSTED',
          totalDebit: pmt.amount,
          totalCredit: pmt.amount,
          items: {
            create: [
              { accountId: accDebit.id, label: `Cash/Bank receipt - ${pmt.paymentNumber}`, debit: pmt.amount, credit: 0 },
              { accountId: arAcc.id, label: `AR settlement - ${pmt.paymentNumber}`, debit: 0, credit: pmt.amount },
            ],
          },
        },
      });
    }

    // Bank payment entries for vendor payments
    const allOutboundPayments = await prisma.payment.findMany({ where: { paymentType: 'OUTBOUND' } });
    for (const pmt of allOutboundPayments) {
      await prisma.journalEntry.create({
        data: {
          entryNumber: `JE-${String(jeCounter++).padStart(4, '0')}`,
          journalId: bankJournal.id,
          date: pmt.date,
          reference: `Vendor payment - ${pmt.paymentNumber}`,
          status: 'POSTED',
          totalDebit: pmt.amount,
          totalCredit: pmt.amount,
          items: {
            create: [
              { accountId: apAcc.id, label: `AP settlement - ${pmt.paymentNumber}`, debit: pmt.amount, credit: 0 },
              { accountId: bankAcc.id, label: `Bank payment - ${pmt.paymentNumber}`, debit: 0, credit: pmt.amount },
            ],
          },
        },
      });
    }

    // Additional operating expense entries (rent, salary) for realistic P&L
    if (genJournal && rentAcc && salaryAcc) {
      // Rent expense
      await prisma.journalEntry.create({
        data: {
          entryNumber: `JE-${String(jeCounter++).padStart(4, '0')}`,
          journalId: genJournal.id,
          date: new Date('2026-08-01'),
          reference: 'Monthly Rent - Aug 2026',
          status: 'POSTED',
          totalDebit: 75000,
          totalCredit: 75000,
          items: {
            create: [
              { accountId: rentAcc.id, label: 'Rent - Showroom & Warehouse', debit: 75000, credit: 0 },
              { accountId: bankAcc.id, label: 'Bank payment for rent', debit: 0, credit: 75000 },
            ],
          },
        },
      });

      // Salary expense
      await prisma.journalEntry.create({
        data: {
          entryNumber: `JE-${String(jeCounter++).padStart(4, '0')}`,
          journalId: genJournal.id,
          date: new Date('2026-08-31'),
          reference: 'Monthly Salaries - Aug 2026',
          status: 'POSTED',
          totalDebit: 350000,
          totalCredit: 350000,
          items: {
            create: [
              { accountId: salaryAcc.id, label: 'Salaries - All departments', debit: 350000, credit: 0 },
              { accountId: bankAcc.id, label: 'Bank payment for salaries', debit: 0, credit: 350000 },
            ],
          },
        },
      });
    }

    console.log(`  ✅ ${jeCounter - 1} Journal Entries created (all balanced: Debit = Credit)`);

    // ── Update Account Balances ──────────────────────────────
    console.log('\n📊 Updating Account Balances from Journal Entries...');

    const allItems = await prisma.journalItem.findMany();
    const balanceMap = {};
    for (const item of allItems) {
      if (!balanceMap[item.accountId]) balanceMap[item.accountId] = 0;
      balanceMap[item.accountId] += item.debit - item.credit;
    }

    for (const [accountId, netDebit] of Object.entries(balanceMap)) {
      const account = await prisma.account.findUnique({ where: { id: accountId } });
      if (!account) continue;

      // For Asset & Expense accounts: balance increases with debit
      // For Liability, Capital, Income: balance increases with credit (negative netDebit)
      let newBalance;
      if (account.type === 'ASSET' || account.type === 'EXPENSE') {
        newBalance = account.balance + netDebit;
      } else {
        newBalance = account.balance + (-netDebit);
      }

      await prisma.account.update({
        where: { id: accountId },
        data: { balance: Math.round(newBalance * 100) / 100 },
      });
    }
    console.log('  ✅ Account balances updated');
  } else {
    console.log('  ⚠️  Skipped journal entries — missing required journals or accounts');
  }

  await printCounts();
}

async function printCounts() {
  console.log('\n═══════════════════════════════════════');
  console.log('  DATABASE TRANSACTION COUNTS');
  console.log('═══════════════════════════════════════');
  const [so, inv, po, bill, pay, je] = await Promise.all([
    prisma.salesOrder.count(),
    prisma.customerInvoice.count(),
    prisma.purchaseOrder.count(),
    prisma.vendorBill.count(),
    prisma.payment.count(),
    prisma.journalEntry.count(),
  ]);
  console.log(`  Sales Orders:       ${so}`);
  console.log(`  Customer Invoices:  ${inv}`);
  console.log(`  Purchase Orders:    ${po}`);
  console.log(`  Vendor Bills:       ${bill}`);
  console.log(`  Payments:           ${pay}`);
  console.log(`  Journal Entries:    ${je}`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error('\n❌ Transaction seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
