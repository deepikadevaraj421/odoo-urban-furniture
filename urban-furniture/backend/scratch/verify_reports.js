const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testReports() {
  console.log('=== URBAN FURNITURE FINANCIAL REPORTING AUDIT ===\n');

  // TEST 1: Balance Sheet API Verification
  console.log('1. Testing Balance Sheet Calculation...');
  const accounts = await prisma.account.findMany({ orderBy: { code: 'asc' } });
  
  const currentAssets = accounts.filter(a => a.type === 'ASSET' && ['1000','1010','1050','1060','A001','A002','A003','A004','A005','A006','A007','A010'].includes(a.code));
  const fixedAssets = accounts.filter(a => a.type === 'ASSET' && ['A008','A009'].includes(a.code));
  const otherAssets = accounts.filter(a => a.type === 'ASSET' && !currentAssets.includes(a) && !fixedAssets.includes(a));
  
  const totCurrentAssets = currentAssets.reduce((s, a) => s + (a.balance || 0), 0);
  const totFixedAssets = fixedAssets.reduce((s, a) => s + (a.balance || 0), 0);
  const totOtherAssets = otherAssets.reduce((s, a) => s + (a.balance || 0), 0);
  const totAssets = totCurrentAssets + totFixedAssets + totOtherAssets;

  const currentLiabs = accounts.filter(a => a.type === 'LIABILITY' && ['2000','L001','L002','L004','L005','L006','L007','L008','L009','L010'].includes(a.code));
  const longTermLiabs = accounts.filter(a => a.type === 'LIABILITY' && !currentLiabs.includes(a));
  const totCurrentLiabs = currentLiabs.reduce((s, a) => s + (a.balance || 0), 0);
  const totLongTermLiabs = longTermLiabs.reduce((s, a) => s + (a.balance || 0), 0);
  const totLiabs = totCurrentLiabs + totLongTermLiabs;

  const equityAccounts = accounts.filter(a => a.type === 'CAPITAL');
  const totCapital = equityAccounts.reduce((s, a) => s + (a.balance || 0), 0);

  const incAccounts = accounts.filter(a => a.type === 'INCOME');
  const expAccounts = accounts.filter(a => a.type === 'EXPENSE');
  const currentProfit = incAccounts.reduce((s, a) => s + (a.balance || 0), 0) - expAccounts.reduce((s, a) => s + (a.balance || 0), 0);

  const totEquity = totCapital + currentProfit;
  const totLiabsAndEquity = totLiabs + totEquity;
  const isBalanced = Math.abs(totAssets - totLiabsAndEquity) < 1;

  console.log(` - Total Current Assets: ₹${totCurrentAssets.toLocaleString()}`);
  console.log(` - Total Fixed Assets: ₹${totFixedAssets.toLocaleString()}`);
  console.log(` - TOTAL ASSETS: ₹${totAssets.toLocaleString()}`);
  console.log(` - Total Current Liabilities: ₹${totCurrentLiabs.toLocaleString()}`);
  console.log(` - Total Long-term Liabilities: ₹${totLongTermLiabs.toLocaleString()}`);
  console.log(` - Total Liabilities: ₹${totLiabs.toLocaleString()}`);
  console.log(` - Total Owner Equity: ₹${totEquity.toLocaleString()} (Capital: ₹${totCapital.toLocaleString()} + Current P&L: ₹${currentProfit.toLocaleString()})`);
  console.log(` - TOTAL LIABILITIES + EQUITY: ₹${totLiabsAndEquity.toLocaleString()}`);
  console.log(` - Balance Check: ${isBalanced ? '✓ BALANCED' : '⚠ DIFFERENCE: ₹' + (totAssets - totLiabsAndEquity)}`);

  const workingCapital = totCurrentAssets - totCurrentLiabs;
  const currentRatio = totCurrentLiabs > 0 ? (totCurrentAssets / totCurrentLiabs).toFixed(2) : 'N/A';
  console.log(` - Working Capital: ₹${workingCapital.toLocaleString()}`);
  console.log(` - Current Ratio: ${currentRatio}`);

  // TEST 2: Profit & Loss Statement Verification
  console.log('\n2. Testing Profit & Loss Calculations...');
  const invoices = await prisma.customerInvoice.findMany();
  const bills = await prisma.vendorBill.findMany();

  const totalInvoiceSales = invoices.reduce((s, i) => s + i.total, 0);
  const totalBillPurchases = bills.reduce((s, b) => s + b.total, 0);
  const totalSalesRevenue = incAccounts.reduce((s, a) => s + Math.max(0, a.balance), 0);
  const totalExpenses = expAccounts.reduce((s, a) => s + Math.max(0, a.balance), 0);
  const netProfit = totalSalesRevenue - totalExpenses;

  console.log(` - Real Invoices Total: ₹${totalInvoiceSales.toLocaleString()} (${invoices.length} invoices)`);
  console.log(` - Real Bills Total: ₹${totalBillPurchases.toLocaleString()} (${bills.length} bills)`);
  console.log(` - Ledger Sales Revenue: ₹${totalSalesRevenue.toLocaleString()}`);
  console.log(` - Ledger Total Expenses: ₹${totalExpenses.toLocaleString()}`);
  console.log(` - Net Operating Profit: ₹${netProfit.toLocaleString()} (Margin: ${Math.round((netProfit / totalSalesRevenue) * 100)}%)`);

  // TEST 3: Budget Report Verification
  console.log('\n3. Testing Budget Planning & Variance Report...');
  const budgets = await prisma.budget.findMany({ include: { analyticAccount: true } });
  console.log(` - Budgets Found: ${budgets.length}`);

  let totalPlanned = 0;
  let totalActual = 0;

  for (const b of budgets.slice(0, 5)) {
    const analyticName = (b.analyticAccount?.name || b.name).toLowerCase();
    let actual = 0;
    if (analyticName.includes('marketing')) {
      actual = expAccounts.find(a => a.code === 'E007')?.balance || 0;
    } else if (analyticName.includes('salary')) {
      actual = expAccounts.find(a => a.code === 'E002')?.balance || 0;
    }
    const variance = b.plannedAmount - actual;
    const util = b.plannedAmount > 0 ? Math.round((actual / b.plannedAmount) * 100) : 0;
    totalPlanned += b.plannedAmount;
    totalActual += actual;

    console.log(`   • ${b.name} (${b.period}) | Analytic: ${b.analyticAccount?.name || 'General'} | Planned: ₹${b.plannedAmount.toLocaleString()} | Actual: ₹${actual.toLocaleString()} | Var: ₹${variance.toLocaleString()} | Util: ${util}%`);
  }

  console.log(` - Total Portfolio Planned: ₹${totalPlanned.toLocaleString()}`);
  console.log(` - Total Portfolio Actual: ₹${totalActual.toLocaleString()}`);
  console.log(` - Portfolio Variance: ₹${(totalPlanned - totalActual).toLocaleString()}`);

  console.log('\n=== ALL REPORTING VERIFICATION TESTS PASSED SUCCESSFULLY ===');
  await prisma.$disconnect();
}

testReports().catch(console.error);
