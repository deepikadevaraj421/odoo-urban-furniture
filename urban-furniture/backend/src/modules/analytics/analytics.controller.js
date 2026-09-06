const prisma = require('../../config/database');

// GET /api/analytic-accounts
const getAnalyticAccounts = async (req, res, next) => {
  try {
    const { search, type, status } = req.query;
    const where = {};

    if (type && type !== 'ALL') {
      const isIncome = type.toUpperCase().includes('INC');
      where.type = { equals: isIncome ? 'Income' : 'Expenses', mode: 'insensitive' };
    }

    if (status && status !== 'ALL') {
      where.status = { equals: status.toUpperCase(), mode: 'insensitive' };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Real database accounts matching filter
    const accounts = await prisma.analyticAccount.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        _count: { select: { budgets: true } },
        budgets: { select: { id: true, name: true, plannedAmount: true, period: true, status: true } },
      },
    });

    // Real database KPIs across ALL analytic accounts
    const allAccounts = await prisma.analyticAccount.findMany({
      include: { _count: { select: { budgets: true } } },
    });

    const totalAnalyticAccounts = allAccounts.length;
    let incomeTypeCount = 0;
    let expenseTypeCount = 0;
    let linkedBudgetsCount = 0;

    for (const acc of allAccounts) {
      if ((acc.type || '').toUpperCase().includes('INC')) {
        incomeTypeCount++;
      } else {
        expenseTypeCount++;
      }
      linkedBudgetsCount += acc._count?.budgets || 0;
    }

    const kpis = {
      total: totalAnalyticAccounts,
      income: incomeTypeCount,
      expenses: expenseTypeCount,
      linkedBudgets: linkedBudgetsCount,
    };

    res.status(200).json({
      success: true,
      count: accounts.length,
      total: accounts.length,
      kpis,
      accounts,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/analytic-accounts
const createAnalyticAccount = async (req, res, next) => {
  try {
    const { code, name, description, type = 'Expenses', status = 'ACTIVE' } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Analytic account code is required.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Analytic account name is required.' });
    }

    const existing = await prisma.analyticAccount.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Analytic account with code ${code.trim()} already exists.` });
    }

    const normalizedType = type.toUpperCase().includes('INC') ? 'Income' : 'Expenses';

    const account = await prisma.analyticAccount.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description?.trim() || null,
        type: normalizedType,
        status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      },
      include: {
        _count: { select: { budgets: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Analytic account created successfully.', account });
  } catch (error) {
    next(error);
  }
};

// PUT /api/analytic-accounts/:id
const updateAnalyticAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, description, type, status } = req.body;

    const existing = await prisma.analyticAccount.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Analytic account not found.' });
    }

    if (code && code.trim().toUpperCase() !== existing.code) {
      const duplicate = await prisma.analyticAccount.findUnique({ where: { code: code.trim().toUpperCase() } });
      if (duplicate) {
        return res.status(400).json({ success: false, message: `Analytic account code ${code} is already taken.` });
      }
    }

    const data = {};
    if (code) data.code = code.trim().toUpperCase();
    if (name) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (type) data.type = type.toUpperCase().includes('INC') ? 'Income' : 'Expenses';
    if (status) data.status = status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const updated = await prisma.analyticAccount.update({
      where: { id },
      data,
      include: {
        _count: { select: { budgets: true } },
        budgets: true,
      },
    });

    res.status(200).json({ success: true, message: 'Analytic account updated successfully.', account: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/analytic-accounts/:id
const deleteAnalyticAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.analyticAccount.findUnique({
      where: { id },
      include: { _count: { select: { budgets: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Analytic account not found.' });
    }

    if (existing._count?.budgets > 0) {
      // Deactivate instead of hard delete to preserve accounting relations
      await prisma.analyticAccount.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      return res.status(200).json({
        success: true,
        message: `Analytic account has ${existing._count.budgets} linked budget(s). It has been deactivated instead of permanently deleted.`,
        deactivated: true,
      });
    }

    await prisma.analyticAccount.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Analytic account deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/budgets
const getBudgets = async (req, res, next) => {
  try {
    const budgets = await prisma.budget.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        analyticAccount: true,
      },
    });

    const accounts = await prisma.account.findMany({
      where: { type: 'EXPENSE' },
      select: { balance: true },
    });
    const totalActualExpenses = accounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0);

    const enrichedBudgets = budgets.map((b) => {
      const actual = Math.min(b.plannedAmount, totalActualExpenses);
      const variance = b.plannedAmount - actual;
      return {
        ...b,
        actualAmount: Math.round(actual * 100) / 100,
        variance: Math.round(variance * 100) / 100,
      };
    });

    res.status(200).json({ success: true, count: enrichedBudgets.length, budgets: enrichedBudgets });
  } catch (error) {
    next(error);
  }
};

// POST /api/budgets
const createBudget = async (req, res, next) => {
  try {
    const { name, period, plannedAmount, responsible, analyticAccountId, status = 'ACTIVE' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Budget name is required.' });
    }
    if (!period || !period.trim()) {
      return res.status(400).json({ success: false, message: 'Budget period is required (e.g. Q1 2026).' });
    }

    const parsedPlanned = parseFloat(plannedAmount);
    if (isNaN(parsedPlanned) || parsedPlanned < 0) {
      return res.status(400).json({ success: false, message: 'Planned amount must be a positive number.' });
    }

    const budget = await prisma.budget.create({
      data: {
        name: name.trim(),
        period: period.trim(),
        plannedAmount: parsedPlanned,
        responsible: responsible?.trim() || null,
        status,
        analyticAccountId: analyticAccountId || null,
      },
      include: {
        analyticAccount: true,
      },
    });

    res.status(201).json({ success: true, message: 'Budget created successfully.', budget });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalyticAccounts,
  createAnalyticAccount,
  updateAnalyticAccount,
  deleteAnalyticAccount,
  getBudgets,
  createBudget,
};
