const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const accounts = await prisma.account.findMany({
    select: { code: true, name: true, type: true, balance: true },
    orderBy: { code: 'asc' },
  });
  console.log('Total accounts:', accounts.length);
  for (const a of accounts) {
    console.log(`${a.code} - ${a.name} (${a.type}): ₹${a.balance}`);
  }

  const invoices = await prisma.customerInvoice.findMany({ select: { date: true, total: true, status: true } });
  const bills = await prisma.vendorBill.findMany({ select: { date: true, total: true, status: true } });
  const payments = await prisma.payment.findMany({ select: { date: true, amount: true, paymentType: true, method: true } });
  const budgets = await prisma.budget.findMany({ include: { analyticAccount: true } });

  console.log('\nInvoices:', invoices.length, 'Bills:', bills.length, 'Payments:', payments.length, 'Budgets:', budgets.length);
  await prisma.$disconnect();
}

inspect().catch(console.error);
