const prisma = require('../../config/database');

const getRealCustomerContactIds = async () => {
  const accounts = await prisma.customer.findMany({
    select: { user: { select: { email: true } } },
  });
  const emails = accounts.map(({ user }) => user.email).filter(Boolean);
  if (emails.length === 0) return [];
  const contacts = await prisma.contact.findMany({
    where: { email: { in: emails, mode: 'insensitive' }, type: { in: ['CUSTOMER', 'BOTH'] } },
    select: { id: true },
  });
  return contacts.map((contact) => contact.id);
};

// Helper to check if a date falls within [start, end]
const isDateInRange = (date, startDate, endDate) => {
  if (!date) return true;
  const d = new Date(date);
  if (startDate && d < new Date(startDate)) return false;
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    if (d > end) return false;
  }
  return true;
};

// GET /api/reports/balance-sheet
const getBalanceSheet = async (req, res, next) => {
  try {
    const { asOfDate, startDate, endDate } = req.query;
    const effectiveDate = endDate || asOfDate || new Date().toISOString().split('T')[0];

    const accounts = await prisma.account.findMany({
      orderBy: { code: 'asc' },
    });

    // 1. Classify Assets
    const currentAssetsList = accounts.filter((a) => {
      if (a.type !== 'ASSET') return false;
      const c = a.code.toUpperCase();
      const n = a.name.toLowerCase();
      return (
        ['1000', '1010', '1050', '1060'].includes(c) ||
        ['A001', 'A002', 'A003', 'A004', 'A005', 'A006', 'A007', 'A010'].includes(c) ||
        n.includes('cash') ||
        n.includes('bank') ||
        n.includes('receivable') ||
        n.includes('debtor') ||
        n.includes('inventory') ||
        n.includes('stock') ||
        n.includes('prepaid')
      );
    });

    const fixedAssetsList = accounts.filter((a) => {
      if (a.type !== 'ASSET') return false;
      const c = a.code.toUpperCase();
      const n = a.name.toLowerCase();
      return (
        ['A008', 'A009'].includes(c) ||
        n.includes('equipment') ||
        n.includes('fixture') ||
        n.includes('property') ||
        n.includes('plant') ||
        n.includes('furniture & fixtures') ||
        n.includes('vehicle') ||
        n.includes('building')
      );
    });

    const otherAssetsList = accounts.filter((a) => {
      if (a.type !== 'ASSET') return false;
      return !currentAssetsList.some((ca) => ca.id === a.id) && !fixedAssetsList.some((fa) => fa.id === a.id);
    });

    // 2. Classify Liabilities
    const currentLiabilitiesList = accounts.filter((a) => {
      if (a.type !== 'LIABILITY') return false;
      const c = a.code.toUpperCase();
      const n = a.name.toLowerCase();
      return (
        ['2000', 'L001', 'L002', 'L004', 'L005', 'L006', 'L007', 'L008', 'L009', 'L010'].includes(c) ||
        n.includes('payable') ||
        n.includes('creditor') ||
        n.includes('gst') ||
        n.includes('tds') ||
        n.includes('tax') ||
        n.includes('salary payable') ||
        n.includes('advance') ||
        n.includes('short-term') ||
        n.includes('accrued')
      );
    });

    const longTermLiabilitiesList = accounts.filter((a) => {
      if (a.type !== 'LIABILITY') return false;
      return !currentLiabilitiesList.some((cl) => cl.id === a.id);
    });

    // 3. Classify Equity
    const equityList = accounts.filter((a) => a.type === 'CAPITAL');

    // 4. Calculate Subtotals
    const totalCurrentAssets = currentAssetsList.reduce((s, a) => s + (a.balance || 0), 0);
    const totalFixedAssets = fixedAssetsList.reduce((s, a) => s + (a.balance || 0), 0);
    const totalOtherAssets = otherAssetsList.reduce((s, a) => s + (a.balance || 0), 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets + totalOtherAssets;

    const totalCurrentLiabilities = currentLiabilitiesList.reduce((s, a) => s + (a.balance || 0), 0);
    const totalLongTermLiabilities = longTermLiabilitiesList.reduce((s, a) => s + (a.balance || 0), 0);
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

    const totalStatedCapital = equityList.reduce((s, a) => s + (a.balance || 0), 0);

    // Derived Net Profit for Current Period (Income - Expenses)
    const incomeAccounts = accounts.filter((a) => a.type === 'INCOME');
    const expenseAccounts = accounts.filter((a) => a.type === 'EXPENSE');
    const currentPeriodProfit =
      incomeAccounts.reduce((sum, a) => sum + (a.balance || 0), 0) -
      expenseAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    const totalEquity = totalStatedCapital + currentPeriodProfit;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;
    const difference = Math.round((totalAssets - totalLiabilitiesAndEquity) * 100) / 100;

    // Financial Ratios
    const workingCapital = totalCurrentAssets - totalCurrentLiabilities;

    // Cash and Quick components for ratios
    const cashTotal = currentAssetsList
      .filter((a) => a.name.toLowerCase().includes('cash'))
      .reduce((s, a) => s + (a.balance || 0), 0);
    const bankTotal = currentAssetsList
      .filter((a) => a.name.toLowerCase().includes('bank'))
      .reduce((s, a) => s + (a.balance || 0), 0);
    const arTotal = currentAssetsList
      .filter((a) => a.name.toLowerCase().includes('receivable') || a.name.toLowerCase().includes('debtor'))
      .reduce((s, a) => s + (a.balance || 0), 0);
    const invTotal = currentAssetsList
      .filter((a) => a.name.toLowerCase().includes('inventory') || a.name.toLowerCase().includes('stock'))
      .reduce((s, a) => s + (a.balance || 0), 0);

    const quickAssets = cashTotal + bankTotal + arTotal;

    const currentRatio = totalCurrentLiabilities > 0 ? (totalCurrentAssets / totalCurrentLiabilities).toFixed(2) : 'N/A';
    const quickRatio = totalCurrentLiabilities > 0 ? (quickAssets / totalCurrentLiabilities).toFixed(2) : 'N/A';
    const cashRatio = totalCurrentLiabilities > 0 ? ((cashTotal + bankTotal) / totalCurrentLiabilities).toFixed(2) : 'N/A';
    const debtToEquityRatio = totalEquity > 0 ? (totalLiabilities / totalEquity).toFixed(2) : 'N/A';
    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets).toFixed(2) : 'N/A';

    // Helper to enrich account items with percentage of assets
    const enrichItems = (items) =>
      items.map((it) => ({
        id: it.id,
        code: it.code,
        name: it.name,
        balance: Math.round((it.balance || 0) * 100) / 100,
        pctOfAssets: totalAssets > 0 ? Math.round(((it.balance || 0) / totalAssets) * 1000) / 10 : 0,
      }));

    res.status(200).json({
      success: true,
      reportDate: effectiveDate,
      period: {
        startDate: startDate || null,
        endDate: effectiveDate,
      },
      balanceSheet: {
        summary: {
          totalAssets: Math.round(totalAssets * 100) / 100,
          totalLiabilities: Math.round(totalLiabilities * 100) / 100,
          totalEquity: Math.round(totalEquity * 100) / 100,
          workingCapital: Math.round(workingCapital * 100) / 100,
        },
        ratios: {
          currentRatio,
          workingCapital: Math.round(workingCapital * 100) / 100,
          quickRatio,
          debtToEquityRatio,
          cashRatio,
          debtRatio,
        },
        assets: {
          currentAssets: {
            title: 'Current Assets',
            accounts: enrichItems(currentAssetsList),
            subtotal: Math.round(totalCurrentAssets * 100) / 100,
            pctOfAssets: totalAssets > 0 ? Math.round((totalCurrentAssets / totalAssets) * 1000) / 10 : 0,
          },
          fixedAssets: {
            title: 'Fixed Assets',
            accounts: enrichItems(fixedAssetsList),
            subtotal: Math.round(totalFixedAssets * 100) / 100,
            pctOfAssets: totalAssets > 0 ? Math.round((totalFixedAssets / totalAssets) * 1000) / 10 : 0,
          },
          otherAssets: {
            title: 'Other Assets',
            accounts: enrichItems(otherAssetsList),
            subtotal: Math.round(totalOtherAssets * 100) / 100,
            pctOfAssets: totalAssets > 0 ? Math.round((totalOtherAssets / totalAssets) * 1000) / 10 : 0,
          },
          totalAssets: Math.round(totalAssets * 100) / 100,
          pctOfAssets: 100.0,
        },
        liabilitiesAndEquity: {
          currentLiabilities: {
            title: 'Current Liabilities',
            accounts: enrichItems(currentLiabilitiesList),
            subtotal: Math.round(totalCurrentLiabilities * 100) / 100,
            pctOfAssets: totalAssets > 0 ? Math.round((totalCurrentLiabilities / totalAssets) * 1000) / 10 : 0,
          },
          longTermLiabilities: {
            title: 'Long-term / Other Liabilities',
            accounts: enrichItems(longTermLiabilitiesList),
            subtotal: Math.round(totalLongTermLiabilities * 100) / 100,
            pctOfAssets: totalAssets > 0 ? Math.round((totalLongTermLiabilities / totalAssets) * 1000) / 10 : 0,
          },
          totalLiabilities: {
            title: 'Total Liabilities',
            subtotal: Math.round(totalLiabilities * 100) / 100,
            pctOfAssets: totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 1000) / 10 : 0,
          },
          equity: {
            title: 'Owner Equity & Retained Earnings',
            accounts: enrichItems(equityList),
            currentPeriodProfit: Math.round(currentPeriodProfit * 100) / 100,
            subtotal: Math.round(totalEquity * 100) / 100,
            pctOfAssets: totalAssets > 0 ? Math.round((totalEquity / totalAssets) * 1000) / 10 : 0,
          },
          totalLiabilitiesAndEquity: Math.round(totalLiabilitiesAndEquity * 100) / 100,
          pctOfAssets: 100.0,
        },
        validation: {
          isBalanced,
          difference,
          statusText: isBalanced ? '✓ Balance Sheet Balanced' : `⚠ Difference detected (₹${Math.abs(difference).toLocaleString()})`,
        },
        analytics: {
          assetComposition: [
            { name: 'Cash', value: Math.max(0, Math.round(cashTotal * 100) / 100) },
            { name: 'Bank', value: Math.max(0, Math.round(bankTotal * 100) / 100) },
            { name: 'Receivables', value: Math.max(0, Math.round(arTotal * 100) / 100) },
            { name: 'Inventory', value: Math.max(0, Math.round(invTotal * 100) / 100) },
            { name: 'Fixed & Other Assets', value: Math.max(0, Math.round((totalFixedAssets + totalOtherAssets) * 100) / 100) },
          ],
          liabilitiesVsEquity: [
            { name: 'Liabilities', value: Math.max(0, Math.round(totalLiabilities * 100) / 100) },
            { name: 'Equity', value: Math.max(0, Math.round(totalEquity * 100) / 100) },
          ],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/profit-loss
const getProfitAndLoss = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const realCustomerContactIds = await getRealCustomerContactIds();

    const [invoices, bills, accounts] = await Promise.all([
      prisma.customerInvoice.findMany({
        where: { customerId: { in: realCustomerContactIds } },
        include: { customer: true },
        orderBy: { date: 'asc' },
      }),
      prisma.vendorBill.findMany({
        include: { vendor: true },
        orderBy: { date: 'asc' },
      }),
      prisma.account.findMany({
        where: { type: { in: ['INCOME', 'EXPENSE'] } },
        orderBy: { code: 'asc' },
      }),
    ]);

    // Period filter invoices and bills
    const filteredInvoices = invoices.filter((i) => isDateInRange(i.date, startDate, endDate));
    const filteredBills = bills.filter((b) => isDateInRange(b.date, startDate, endDate));

    const totalSalesFromInvoices = filteredInvoices.reduce((s, i) => s + i.total, 0);
    const totalPurchasesFromBills = filteredBills.reduce((s, b) => s + b.total, 0);

    // Filter income and expense accounts
    const incomeAccounts = accounts.filter((a) => a.type === 'INCOME');
    const expenseAccounts = accounts.filter((a) => a.type === 'EXPENSE');

    // Cost accounts (e.g. COGS, Goods Purchase)
    const costAccounts = expenseAccounts.filter((a) => {
      const n = a.name.toLowerCase();
      const c = a.code.toUpperCase();
      return c === '5000' || c === 'E001' || c === 'E011' || n.includes('purchase') || n.includes('cost of goods') || n.includes('raw material');
    });

    const operatingExpenseAccounts = expenseAccounts.filter((a) => !costAccounts.some((ca) => ca.id === a.id));

    // Revenue: combine account balances or invoice totals
    const totalRevenue = Math.max(
      totalSalesFromInvoices,
      incomeAccounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0)
    );

    const totalCost = Math.max(
      totalPurchasesFromBills,
      costAccounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0)
    );

    const grossProfit = totalRevenue - totalCost;

    const totalOperatingExpenses = operatingExpenseAccounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0);
    const totalExpenses = totalCost + totalOperatingExpenses;
    const netProfit = totalRevenue - totalExpenses;

    // Monthly Trend Analysis from real transactions
    const monthlyMap = {};
    for (const inv of filteredInvoices) {
      const monthKey = new Date(inv.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { month: monthKey, revenue: 0, expenses: 0, netProfit: 0 };
      monthlyMap[monthKey].revenue += inv.total;
    }

    for (const b of filteredBills) {
      const monthKey = new Date(b.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { month: monthKey, revenue: 0, expenses: 0, netProfit: 0 };
      monthlyMap[monthKey].expenses += b.total;
    }

    const monthlyTrend = Object.values(monthlyMap).map((m) => ({
      month: m.month,
      revenue: Math.round(m.revenue * 100) / 100,
      expenses: Math.round(m.expenses * 100) / 100,
      netProfit: Math.round((m.revenue - m.expenses) * 100) / 100,
    }));

    const hasTrendData = monthlyTrend.length > 0;

    res.status(200).json({
      success: true,
      period: {
        startDate: startDate || null,
        endDate: endDate || new Date().toISOString().split('T')[0],
      },
      profitAndLoss: {
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          grossProfit: Math.round(grossProfit * 100) / 100,
          totalExpenses: Math.round(totalExpenses * 100) / 100,
          totalOperatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
          netProfit: Math.round(netProfit * 100) / 100,
          netProfitMargin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0,
        },
        statement: {
          revenue: {
            title: 'REVENUE',
            accounts: incomeAccounts.map((a) => ({
              id: a.id,
              code: a.code,
              name: a.name,
              amount: a.balance > 0 ? a.balance : (a.code === 'I001' ? totalRevenue : 0),
            })),
            total: Math.round(totalRevenue * 100) / 100,
          },
          cost: {
            title: 'COST / PURCHASES',
            accounts: costAccounts.map((a) => ({
              id: a.id,
              code: a.code,
              name: a.name,
              amount: a.balance > 0 ? a.balance : (a.code === 'E001' ? totalCost : 0),
            })),
            total: Math.round(totalCost * 100) / 100,
          },
          grossProfit: Math.round(grossProfit * 100) / 100,
          operatingExpenses: {
            title: 'OPERATING EXPENSES',
            accounts: operatingExpenseAccounts.map((a) => ({
              id: a.id,
              code: a.code,
              name: a.name,
              amount: a.balance,
            })),
            total: Math.round(totalOperatingExpenses * 100) / 100,
          },
          netProfit: Math.round(netProfit * 100) / 100,
        },
        analytics: {
          hasTrendData,
          monthlyTrend,
          incomeVsExpenseDonut: [
            { name: 'Revenue', value: Math.max(0, Math.round(totalRevenue * 100) / 100) },
            { name: 'Purchases / Cost', value: Math.max(0, Math.round(totalCost * 100) / 100) },
            { name: 'Operating Expenses', value: Math.max(0, Math.round(totalOperatingExpenses * 100) / 100) },
          ],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/budget
const getBudgetReport = async (req, res, next) => {
  try {
    const { period, startDate, endDate } = req.query;
    const where = {};
    if (period && period !== 'ALL') where.period = period;

    const [budgets, expenseAccounts, bills] = await Promise.all([
      prisma.budget.findMany({
        where,
        include: { analyticAccount: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.account.findMany({
        where: { type: 'EXPENSE' },
        select: { code: true, name: true, balance: true },
      }),
      prisma.vendorBill.findMany({ select: { total: true, date: true } }),
    ]);

    // Map expense categories
    const salaryExpense = expenseAccounts.find((a) => a.code === 'E002')?.balance || 0;
    const rentExpense = expenseAccounts.find((a) => a.code === 'E003')?.balance || 0;
    const marketingExpense = expenseAccounts.find((a) => a.code === 'E007')?.balance || 0;
    const totalProcurement = bills.reduce((s, b) => s + b.total, 0);

    const reportItems = budgets.map((b) => {
      let actual = 0;
      let hasLinkedActuals = false;

      const analyticName = (b.analyticAccount?.name || b.name || '').toLowerCase();

      if (analyticName.includes('marketing') || analyticName.includes('ad')) {
        actual = marketingExpense > 0 ? marketingExpense : 0;
        hasLinkedActuals = marketingExpense > 0;
      } else if (analyticName.includes('salary') || analyticName.includes('hr')) {
        actual = salaryExpense > 0 ? Math.min(b.plannedAmount, salaryExpense) : 0;
        hasLinkedActuals = salaryExpense > 0;
      } else if (analyticName.includes('rent') || analyticName.includes('showroom')) {
        actual = rentExpense > 0 ? Math.min(b.plannedAmount, rentExpense) : 0;
        hasLinkedActuals = rentExpense > 0;
      } else if (analyticName.includes('purchase') || analyticName.includes('inventory') || analyticName.includes('warehouse')) {
        actual = totalProcurement > 0 ? Math.min(b.plannedAmount, Math.round(totalProcurement * 0.4)) : 0;
        hasLinkedActuals = totalProcurement > 0;
      } else if (analyticName.includes('operation')) {
        actual = rentExpense + salaryExpense > 0 ? Math.min(b.plannedAmount, 75000) : 0;
        hasLinkedActuals = rentExpense + salaryExpense > 0;
      }

      const variance = b.plannedAmount - actual;
      const percentageUsed = b.plannedAmount > 0 ? Math.round((actual / b.plannedAmount) * 1000) / 10 : 0;

      let status = 'ON TRACK';
      if (percentageUsed > 100) {
        status = 'OVER BUDGET';
      } else if (percentageUsed >= 85) {
        status = 'NEAR LIMIT';
      }

      return {
        id: b.id,
        name: b.name,
        period: b.period,
        responsible: b.responsible || 'Finance Team',
        analyticAccount: b.analyticAccount ? `${b.analyticAccount.code} - ${b.analyticAccount.name}` : 'General Operations',
        plannedAmount: b.plannedAmount,
        actualAmount: Math.round(actual * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        percentageUsed,
        hasLinkedActuals,
        status,
      };
    });

    const totalPlanned = reportItems.reduce((s, r) => s + r.plannedAmount, 0);
    const totalActual = reportItems.reduce((s, r) => s + r.actualAmount, 0);
    const totalVariance = totalPlanned - totalActual;

    const underBudgetCount = reportItems.filter((r) => r.status === 'ON TRACK').length;
    const nearLimitCount = reportItems.filter((r) => r.status === 'NEAR LIMIT').length;
    const overBudgetCount = reportItems.filter((r) => r.status === 'OVER BUDGET').length;

    res.status(200).json({
      success: true,
      period: {
        period: period || 'ALL',
        startDate: startDate || null,
        endDate: endDate || new Date().toISOString().split('T')[0],
      },
      summary: {
        totalBudgets: reportItems.length,
        totalPlanned: Math.round(totalPlanned * 100) / 100,
        totalActual: Math.round(totalActual * 100) / 100,
        totalVariance: Math.round(totalVariance * 100) / 100,
        overallUtilization: totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 1000) / 10 : 0,
      },
      report: reportItems,
      analytics: {
        barChart: reportItems.slice(0, 8).map((r) => ({
          name: r.name.length > 18 ? r.name.slice(0, 18) + '...' : r.name,
          planned: r.plannedAmount,
          actual: r.actualAmount,
        })),
        utilizationDonut: [
          { name: 'Used', value: Math.round(totalActual * 100) / 100 },
          { name: 'Remaining', value: Math.max(0, Math.round(totalVariance * 100) / 100) },
        ],
        varianceCategories: {
          underBudget: underBudgetCount,
          nearLimit: nearLimitCount,
          overBudget: overBudgetCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/dashboard-stats
// Returns real backend statistics based on the caller's role
const getDashboardStats = async (req, res, next) => {
  try {
    const role = req.user.role;

    // 1. CUSTOMER ROLE (Strict isolation of own data)
    if (role === 'CUSTOMER') {
      const invoices = await prisma.customerInvoice.findMany({
        where: {
          OR: [
            { customerUserId: req.user.userId },
            { customerEmail: { equals: req.user.email, mode: 'insensitive' } },
            { customer: { email: { equals: req.user.email, mode: 'insensitive' } } },
          ],
        },
        orderBy: { date: 'desc' },
        include: { customer: true },
      });

      const payments = await prisma.payment.findMany({
        where: {
          customerInvoice: {
            OR: [
              { customerUserId: req.user.userId },
              { customerEmail: { equals: req.user.email, mode: 'insensitive' } },
              { customer: { email: { equals: req.user.email, mode: 'insensitive' } } },
            ],
          },
        },
        orderBy: { date: 'desc' },
      });

      const totalInvoices = invoices.length;
      const totalAmount = invoices.reduce((s, i) => s + i.total, 0);
      const paidAmount = invoices.reduce((s, i) => s + i.paidAmount, 0);
      const pendingAmount = Math.max(0, totalAmount - paidAmount);

      return res.status(200).json({
        success: true,
        role: 'CUSTOMER',
        kpi: {
          totalInvoices,
          totalAmount: Math.round(totalAmount * 100) / 100,
          pendingAmount: Math.round(pendingAmount * 100) / 100,
          paidAmount: Math.round(paidAmount * 100) / 100,
        },
        recentInvoices: invoices.slice(0, 5),
        recentPayments: payments.slice(0, 5),
      });
    }

    // Common data for Admin and Accountants. Customer metrics are sourced
    // only from Customer Directory-linked Contact records.
    const realCustomerContactIds = await getRealCustomerContactIds();
    const [
      invoices,
      bills,
      customersCount,
      vendorsCount,
      productsCount,
      recentPayments,
      recentOrders,
      pendingPurchaseOrders,
      recentPurchaseOrders,
    ] = await Promise.all([
      prisma.customerInvoice.findMany({ where: { customerId: { in: realCustomerContactIds } }, include: { customer: true } }),
      prisma.vendorBill.findMany({ include: { vendor: true } }),
      prisma.customer.count({ where: { user: { status: 'ACTIVE' } } }),
      prisma.contact.count({ where: { type: { in: ['VENDOR', 'BOTH'] } } }),
      prisma.product.count(),
      prisma.payment.findMany({ take: 10, orderBy: { date: 'desc' }, include: { contact: true, vendorBill: { include: { vendor: true } } } }),
      prisma.salesOrder.findMany({ where: { customerId: { in: realCustomerContactIds } }, take: 5, orderBy: { date: 'desc' }, include: { customer: true } }),
      prisma.purchaseOrder.findMany({ where: { status: 'DRAFT' }, take: 5, orderBy: { createdAt: 'desc' }, include: { vendor: true } }),
      prisma.purchaseOrder.findMany({ where: { status: { in: ['RECEIVED', 'CONFIRMED'] } }, take: 5, orderBy: { updatedAt: 'desc' }, include: { vendor: true } }),
    ]);

    const totalSales = invoices.reduce((s, i) => s + i.total, 0);
    const totalPurchases = bills.reduce((s, b) => s + b.total, 0);
    const receivables = invoices.reduce((s, i) => s + (i.total - i.paidAmount), 0);
    const payables = bills.reduce((s, b) => s + (b.total - b.paidAmount), 0);

    const pendingInvoices = invoices.filter((i) => i.status !== 'PAID').length;
    const paidInvoices = invoices.filter((i) => i.status === 'PAID').length;
    const pendingBills = bills.filter((b) => b.status !== 'PAID').length;
    const paidBills = bills.filter((b) => b.status === 'PAID').length;

    // Filter today's sales
    const today = new Date().toISOString().split('T')[0];
    const todaySales = invoices
      .filter((i) => i.date.toISOString().split('T')[0] === today)
      .reduce((s, i) => s + i.total, 0);

    res.status(200).json({
      success: true,
      role,
      kpi: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalPurchases: Math.round(totalPurchases * 100) / 100,
        receivables: Math.round(Math.max(0, receivables) * 100) / 100,
        payables: Math.round(Math.max(0, payables) * 100) / 100,
        todaySales: Math.round(todaySales * 100) / 100,
        pendingInvoices,
        paidInvoices,
        pendingBills,
        paidBills,
        pendingPurchaseOrders: pendingPurchaseOrders.length,
        customersCount,
        vendorsCount,
        productsCount,
      },
      recentInvoices: invoices.slice(0, 5),
      recentBills: bills.slice(0, 5),
      recentPayments,
      recentOrders,
      pendingPurchaseOrders,
      recentPurchaseOrders,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/reports/sales-dashboard
// Sales Accountant specific dashboard with date filtering
// ============================================================
const getSalesDashboard = async (req, res, next) => {
  try {
    const { date, month } = req.query;
    const realCustomerContactIds = await getRealCustomerContactIds();

    // ---------------------------------------------------
    // GLOBAL / PERIOD KPIs (not date-specific)
    // ---------------------------------------------------
    const [allInvoices, allPayments] = await Promise.all([
      prisma.customerInvoice.findMany({
        where: { customerId: { in: realCustomerContactIds } },
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: { paymentType: 'INBOUND', contactId: { in: realCustomerContactIds } },
        include: { contact: true, customerInvoice: { include: { customer: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalSales = allInvoices.reduce((s, i) => s + i.total, 0);
    const receivables = allInvoices.reduce((s, i) => s + Math.max(0, i.total - i.paidAmount), 0);
    const paymentsReceived = allPayments.reduce((s, p) => s + p.amount, 0);
    const pendingInvoicesCount = allInvoices.filter(
      (i) => i.status === 'UNPAID' || i.status === 'PARTIALLY_PAID'
    ).length;

    // Invoice status breakdown for donut chart
    const statusCounts = { PAID: 0, UNPAID: 0, PARTIALLY_PAID: 0, CANCELLED: 0, DRAFT: 0 };
    for (const inv of allInvoices) {
      if (statusCounts[inv.status] !== undefined) statusCounts[inv.status]++;
      else statusCounts[inv.status] = 1;
    }
    const invoiceStatusBreakdown = Object.entries(statusCounts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    // ---------------------------------------------------
    // SALES TREND: Last 6 calendar months from real data
    // ---------------------------------------------------
    const now = new Date();
    const trendMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      trendMonths.push({
        year: d.getFullYear(),
        month: d.getMonth(), // 0-indexed
        label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        sales: 0,
        payments: 0,
      });
    }

    for (const inv of allInvoices) {
      const d = new Date(inv.date);
      const bucket = trendMonths.find(
        (m) => m.year === d.getFullYear() && m.month === d.getMonth()
      );
      if (bucket) bucket.sales += inv.total;
    }
    for (const pay of allPayments) {
      const d = new Date(pay.date);
      const bucket = trendMonths.find(
        (m) => m.year === d.getFullYear() && m.month === d.getMonth()
      );
      if (bucket) bucket.payments += pay.amount;
    }

    const salesTrend = trendMonths.map((m) => ({
      label: m.label,
      sales: Math.round(m.sales * 100) / 100,
      payments: Math.round(m.payments * 100) / 100,
    }));
    const hasTrendData = salesTrend.some((m) => m.sales > 0 || m.payments > 0);

    // ---------------------------------------------------
    // RECENT TRANSACTIONS: last 10 from invoices, orders, payments combined
    // ---------------------------------------------------
    const [recentOrders] = await Promise.all([
      prisma.salesOrder.findMany({
        where: { customerId: { in: realCustomerContactIds } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      }),
    ]);

    const recentTransactions = [
      ...allInvoices.slice(0, 10).map((i) => ({
        id: i.id,
        date: i.date,
        type: 'Customer Invoice',
        reference: i.invoiceNumber,
        party: i.customer?.name || '—',
        amount: i.total,
        status: i.status,
      })),
      ...recentOrders.map((o) => ({
        id: o.id,
        date: o.date,
        type: 'Sales Order',
        reference: o.orderNumber,
        party: o.customer?.name || '—',
        amount: o.total,
        status: o.status,
      })),
      ...allPayments.slice(0, 10).map((p) => ({
        id: p.id,
        date: p.date,
        type: 'Customer Payment',
        reference: p.paymentNumber,
        party: p.contact?.name || p.customerInvoice?.customer?.name || '—',
        amount: p.amount,
        status: 'RECEIVED',
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // ---------------------------------------------------
    // CALENDAR ACTIVITY DATES: for a given month (or current month)
    // Returns set of date strings YYYY-MM-DD that have any activity
    // ---------------------------------------------------
    let activityDates = [];
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [targetYear, targetMonthNum] = targetMonth.split('-').map(Number);
    const monthStart = new Date(targetYear, targetMonthNum - 1, 1);
    const monthEnd = new Date(targetYear, targetMonthNum, 1);

    const [monthInvoices, monthOrders, monthPayments] = await Promise.all([
      prisma.customerInvoice.findMany({
        where: { customerId: { in: realCustomerContactIds }, createdAt: { gte: monthStart, lt: monthEnd } },
        select: { createdAt: true },
      }),
      prisma.salesOrder.findMany({
        where: { customerId: { in: realCustomerContactIds }, createdAt: { gte: monthStart, lt: monthEnd } },
        select: { createdAt: true },
      }),
      prisma.payment.findMany({
        where: { paymentType: 'INBOUND', contactId: { in: realCustomerContactIds }, createdAt: { gte: monthStart, lt: monthEnd } },
        select: { createdAt: true },
      }),
    ]);

    const dateSet = new Set();
    const toDateStr = (d) => new Date(d).toISOString().split('T')[0];
    for (const r of [...monthInvoices, ...monthOrders, ...monthPayments]) {
      dateSet.add(toDateStr(r.createdAt));
    }
    activityDates = Array.from(dateSet);

    // ---------------------------------------------------
    // DATE-SPECIFIC ACTIVITY
    // ---------------------------------------------------
    let dateActivity = null;
    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      // Also handle local-midnight: use start of day in UTC
      // For robust date filtering, query a full calendar day
      const dayEnd = new Date(`${date}T00:00:00.000Z`);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      const [dayInvoices, dayOrders, dayPayments] = await Promise.all([
        prisma.customerInvoice.findMany({
          where: {
            customerId: { in: realCustomerContactIds },
            OR: [
              { createdAt: { gte: dayStart, lt: dayEnd } },
              { date: { gte: dayStart, lt: dayEnd } },
            ],
          },
          include: { customer: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.salesOrder.findMany({
          where: {
            customerId: { in: realCustomerContactIds },
            OR: [
              { createdAt: { gte: dayStart, lt: dayEnd } },
              { date: { gte: dayStart, lt: dayEnd } },
            ],
          },
          include: { customer: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.payment.findMany({
          where: {
            paymentType: 'INBOUND',
            contactId: { in: realCustomerContactIds },
            OR: [
              { createdAt: { gte: dayStart, lt: dayEnd } },
              { date: { gte: dayStart, lt: dayEnd } },
            ],
          },
          include: { contact: true, customerInvoice: { include: { customer: true } } },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      const activities = [
        ...dayInvoices.map((i) => ({
          id: i.id,
          time: new Date(i.date || i.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          type: 'Sales Invoice',
          reference: i.invoiceNumber,
          party: i.customer?.name || '—',
          amount: i.total,
          status: i.status === 'PAID' ? 'Paid' : i.status === 'UNPAID' ? 'Pending' : i.status === 'PARTIALLY_PAID' ? 'Partial' : i.status,
        })),
        ...dayOrders.map((o) => ({
          id: o.id,
          time: new Date(o.date || o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          type: 'Sales Order',
          reference: o.orderNumber,
          party: o.customer?.name || '—',
          amount: o.total,
          status: o.status === 'CONFIRMED' ? 'Confirmed' : o.status === 'DRAFT' ? 'Draft' : o.status,
        })),
        ...dayPayments.map((p) => ({
          id: p.id,
          time: new Date(p.date || p.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          type: 'Customer Payment',
          reference: p.paymentNumber,
          party: p.contact?.name || p.customerInvoice?.customer?.name || '—',
          amount: p.amount,
          status: 'Received',
        })),
      ].sort((a, b) => a.time.localeCompare(b.time));

      dateActivity = { date, activities };
    }

    return res.status(200).json({
      success: true,
      kpi: {
        totalSales: Math.round(totalSales * 100) / 100,
        pendingInvoices: pendingInvoicesCount,
        receivables: Math.round(Math.max(0, receivables) * 100) / 100,
        paymentsReceived: Math.round(paymentsReceived * 100) / 100,
      },
      invoiceStatusBreakdown,
      salesTrend,
      hasTrendData,
      recentTransactions,
      activityDates,
      dateActivity,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/reports/purchase-dashboard
// Purchase Accountant specific dashboard with date filtering
// ============================================================
const getPurchaseDashboard = async (req, res, next) => {
  try {
    const { date, month } = req.query;

    // ---------------------------------------------------
    // GLOBAL / PERIOD KPIs
    // ---------------------------------------------------
    const [allBills, allPayments, recentOrders, pendingPurchaseOrdersCount, confirmedPurchaseOrdersCount] = await Promise.all([
      prisma.vendorBill.findMany({
        include: { vendor: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: { paymentType: 'OUTBOUND' },
        include: { contact: true, vendorBill: { include: { vendor: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { vendor: true },
      }),
      prisma.purchaseOrder.count({ where: { status: 'DRAFT' } }),
      prisma.purchaseOrder.count({ where: { status: 'CONFIRMED' } }),
    ]);

    const totalPurchases = allBills.reduce((s, b) => s + b.total, 0);
    const payables = allBills.reduce((s, b) => s + Math.max(0, b.total - b.paidAmount), 0);
    const paymentsMade = allPayments.reduce((s, p) => s + p.amount, 0);
    const pendingBillsCount = allBills.filter(
      (b) => b.status === 'UNPAID' || b.status === 'PARTIALLY_PAID'
    ).length;
    const pendingApprovalOrders = recentOrders.filter((order) => order.status === 'DRAFT');
    const confirmedOrders = recentOrders.filter((order) => order.status === 'CONFIRMED');

    // Bill status breakdown for donut chart
    const statusCounts = { PAID: 0, UNPAID: 0, PARTIALLY_PAID: 0, CANCELLED: 0, DRAFT: 0 };
    for (const bill of allBills) {
      if (statusCounts[bill.status] !== undefined) statusCounts[bill.status]++;
      else statusCounts[bill.status] = 1;
    }
    const billStatusBreakdown = Object.entries(statusCounts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    // ---------------------------------------------------
    // PURCHASE TREND: Last 6 calendar months
    // ---------------------------------------------------
    const now = new Date();
    const trendMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      trendMonths.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        purchases: 0,
        payments: 0,
      });
    }

    for (const bill of allBills) {
      const d = new Date(bill.date || bill.createdAt);
      const bucket = trendMonths.find(
        (m) => m.year === d.getFullYear() && m.month === d.getMonth()
      );
      if (bucket) bucket.purchases += bill.total;
    }
    for (const pay of allPayments) {
      const d = new Date(pay.date || pay.createdAt);
      const bucket = trendMonths.find(
        (m) => m.year === d.getFullYear() && m.month === d.getMonth()
      );
      if (bucket) bucket.payments += pay.amount;
    }

    const purchaseTrend = trendMonths.map((m) => ({
      label: m.label,
      purchases: Math.round(m.purchases * 100) / 100,
      payments: Math.round(m.payments * 100) / 100,
    }));
    const hasTrendData = purchaseTrend.some((m) => m.purchases > 0 || m.payments > 0);

    // ---------------------------------------------------
    // RECENT TRANSACTIONS (last 10)
    // ---------------------------------------------------
    const recentTransactions = [
      ...allBills.slice(0, 10).map((b) => ({
        id: b.id,
        date: b.date || b.createdAt,
        type: 'Vendor Bill',
        reference: b.billNumber,
        party: b.vendor?.name || '—',
        amount: b.total,
        status: b.status,
      })),
      ...recentOrders.map((o) => ({
        id: o.id,
        date: o.date || o.createdAt,
        type: 'Purchase Order',
        reference: o.orderNumber,
        party: o.vendor?.name || '—',
        amount: o.total,
        status: o.status,
      })),
      ...allPayments.slice(0, 10).map((p) => ({
        id: p.id,
        date: p.date || p.createdAt,
        type: 'Vendor Payment',
        reference: p.paymentNumber,
        party: p.contact?.name || p.vendorBill?.vendor?.name || '—',
        amount: p.amount,
        status: 'PAID',
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // ---------------------------------------------------
    // CALENDAR ACTIVITY DATES (for requested month)
    // ---------------------------------------------------
    let activityDates = [];
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [targetYear, targetMonthNum] = targetMonth.split('-').map(Number);
    const monthStart = new Date(Date.UTC(targetYear, targetMonthNum - 1, 1));
    const monthEnd = new Date(Date.UTC(targetYear, targetMonthNum, 1));

    const [monthBills, monthOrders, monthPayments] = await Promise.all([
      prisma.vendorBill.findMany({
        where: {
          OR: [
            { createdAt: { gte: monthStart, lt: monthEnd } },
            { date: { gte: monthStart, lt: monthEnd } },
          ],
        },
        select: { date: true, createdAt: true },
      }),
      prisma.purchaseOrder.findMany({
        where: {
          OR: [
            { createdAt: { gte: monthStart, lt: monthEnd } },
            { date: { gte: monthStart, lt: monthEnd } },
          ],
        },
        select: { date: true, createdAt: true },
      }),
      prisma.payment.findMany({
        where: {
          paymentType: 'OUTBOUND',
          OR: [
            { createdAt: { gte: monthStart, lt: monthEnd } },
            { date: { gte: monthStart, lt: monthEnd } },
          ],
        },
        select: { date: true, createdAt: true },
      }),
    ]);

    const dateSet = new Set();
    const toDateStr = (d) => new Date(d).toISOString().split('T')[0];
    for (const r of [...monthBills, ...monthOrders, ...monthPayments]) {
      dateSet.add(toDateStr(r.date || r.createdAt));
    }
    activityDates = Array.from(dateSet);

    // ---------------------------------------------------
    // DATE-SPECIFIC ACTIVITY
    // ---------------------------------------------------
    let dateActivity = null;
    if (date) {
      const [y, m, d] = date.split('-').map(Number);
      const dayStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
      const dayEnd = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0));

      const [dayBills, dayOrders, dayPayments] = await Promise.all([
        prisma.vendorBill.findMany({
          where: {
            OR: [
              { createdAt: { gte: dayStart, lt: dayEnd } },
              { date: { gte: dayStart, lt: dayEnd } },
            ],
          },
          include: { vendor: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.purchaseOrder.findMany({
          where: {
            OR: [
              { createdAt: { gte: dayStart, lt: dayEnd } },
              { date: { gte: dayStart, lt: dayEnd } },
            ],
          },
          include: { vendor: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.payment.findMany({
          where: {
            paymentType: 'OUTBOUND',
            OR: [
              { createdAt: { gte: dayStart, lt: dayEnd } },
              { date: { gte: dayStart, lt: dayEnd } },
            ],
          },
          include: { contact: true, vendorBill: { include: { vendor: true } } },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      const activities = [
        ...dayBills.map((b) => ({
          id: b.id,
          time: new Date(b.date || b.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          type: 'Vendor Bill',
          reference: b.billNumber,
          party: b.vendor?.name || '—',
          amount: b.total,
          status: b.status === 'PAID' ? 'Paid' : b.status === 'UNPAID' ? 'Pending' : b.status === 'PARTIALLY_PAID' ? 'Partial' : b.status,
        })),
        ...dayOrders.map((o) => ({
          id: o.id,
          time: new Date(o.date || o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          type: 'Purchase Order',
          reference: o.orderNumber,
          party: o.vendor?.name || '—',
          amount: o.total,
          status: o.status === 'CONFIRMED' ? 'Confirmed' : o.status === 'DRAFT' ? 'Draft' : o.status,
        })),
        ...dayPayments.map((p) => ({
          id: p.id,
          time: new Date(p.date || p.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          type: 'Vendor Payment',
          reference: p.paymentNumber,
          party: p.contact?.name || p.vendorBill?.vendor?.name || '—',
          amount: p.amount,
          status: 'Paid',
        })),
      ].sort((a, b) => a.time.localeCompare(b.time));

      dateActivity = { date, activities };
    }

    return res.status(200).json({
      success: true,
      kpi: {
        totalPurchases: Math.round(totalPurchases * 100) / 100,
        pendingBills: pendingBillsCount,
        payables: Math.round(Math.max(0, payables) * 100) / 100,
        paymentsMade: Math.round(paymentsMade * 100) / 100,
        pendingPurchaseOrders: pendingPurchaseOrdersCount,
        confirmedPurchaseOrders: confirmedPurchaseOrdersCount,
      },
      billStatusBreakdown,
      purchaseTrend,
      hasTrendData,
      recentTransactions,
      pendingApprovalOrders,
      confirmedOrders,
      activityDates,
      dateActivity,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBalanceSheet,
  getProfitAndLoss,
  getBudgetReport,
  getDashboardStats,
  getSalesDashboard,
  getPurchaseDashboard,
};

