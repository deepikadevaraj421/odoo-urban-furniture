const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedBusinessData() {
  console.log('🌱 Checking and seeding non-authentication business records...');

  // 1. Chart of Accounts
  const defaultAccounts = [
    { code: '1000', name: 'Cash', type: 'ASSET', isDefault: true },
    { code: '1010', name: 'Bank (Checking Account)', type: 'ASSET', isDefault: true },
    { code: '1050', name: 'Accounts Receivable (Debtors)', type: 'ASSET', isDefault: true },
    { code: '2000', name: 'Accounts Payable (Creditors)', type: 'LIABILITY', isDefault: true },
    { code: '3000', name: 'Capital & Retained Earnings', type: 'CAPITAL', isDefault: true },
    { code: '4000', name: 'Sales Income', type: 'INCOME', isDefault: true },
    { code: '5000', name: 'Cost of Goods Sold / Purchase Expense', type: 'EXPENSE', isDefault: true },
    { code: '5100', name: 'Operating & Admin Expenses', type: 'EXPENSE', isDefault: false },
  ];

  const accountMap = {};
  for (const acc of defaultAccounts) {
    const existing = await prisma.account.findUnique({ where: { code: acc.code } });
    if (!existing) {
      const created = await prisma.account.create({ data: acc });
      accountMap[acc.code] = created;
    } else {
      accountMap[acc.code] = existing;
    }
  }
  console.log('✅ Accounts initialized');

  // 2. Default Journals
  const defaultJournals = [
    { code: 'SALES', name: 'Customer Invoices Journal', type: 'SALES', defaultAccountId: accountMap['4000']?.id },
    { code: 'PURCH', name: 'Vendor Bills Journal', type: 'PURCHASE', defaultAccountId: accountMap['5000']?.id },
    { code: 'BANK', name: 'Bank Operations Journal', type: 'BANK', defaultAccountId: accountMap['1010']?.id },
    { code: 'CASH', name: 'Cash Register Journal', type: 'CASH', defaultAccountId: accountMap['1000']?.id },
    { code: 'GEN', name: 'General Operations Journal', type: 'GENERAL', defaultAccountId: null },
  ];

  for (const j of defaultJournals) {
    const existing = await prisma.journal.findUnique({ where: { code: j.code } });
    if (!existing) {
      await prisma.journal.create({ data: j });
    }
  }
  console.log('✅ Journals initialized');

  // 3. Products
  const products = [
    { name: 'Office Chair', type: 'GOODS', category: 'Office Furniture', salesPrice: 4500, costPrice: 2800 },
    { name: 'Wooden Table', type: 'GOODS', category: 'Study & Work', salesPrice: 12500, costPrice: 8000 },
    { name: 'Sofa', type: 'GOODS', category: 'Living Room', salesPrice: 28000, costPrice: 18000 },
    { name: 'Dining Table', type: 'GOODS', category: 'Dining Room', salesPrice: 19500, costPrice: 13000 },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
    }
  }
  console.log('✅ Products initialized');

  // 4. Contacts (Customer & Vendor)
  const contacts = [
    {
      name: 'Nimesh Pathak',
      type: 'CUSTOMER',
      email: 'nimesh.pathak@example.com',
      mobile: '+91 98765 43210',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      status: 'ACTIVE',
    },
    {
      name: 'Azure Furniture',
      type: 'VENDOR',
      email: 'supplies@azurefurniture.com',
      mobile: '+91 91234 56780',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      status: 'ACTIVE',
    },
  ];

  // Customer identities are created only through the Admin Customer Directory.
  for (const c of contacts.filter((contact) => contact.type !== 'CUSTOMER')) {
    const existing = await prisma.contact.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.contact.create({ data: c });
    }
  }
  console.log('✅ Contacts initialized');

  // 5. Analytic Accounts & Budgets
  const analytic = await prisma.analyticAccount.upsert({
    where: { code: 'ANA-FURN' },
    update: {},
    create: {
      code: 'ANA-FURN',
      name: 'Furniture Manufacturing & Showroom Operations',
      type: 'Income',
    },
  });

  const budgetExists = await prisma.budget.findFirst({ where: { name: 'FY2026 Furniture Operations Budget' } });
  if (!budgetExists) {
    await prisma.budget.create({
      data: {
        name: 'FY2026 Furniture Operations Budget',
        period: '2026',
        plannedAmount: 500000,
        responsible: 'Finance Manager',
        status: 'ACTIVE',
        analyticAccountId: analytic.id,
      },
    });
  }
  console.log('✅ Analytics & Budgets initialized');
  console.log('✨ Business data seeding complete!');
}

seedBusinessData()
  .catch((e) => {
    console.error('Seeding error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
