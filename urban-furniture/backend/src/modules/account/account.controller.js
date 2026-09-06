const prisma = require('../../config/database');

const VALID_TYPES = ['ASSET', 'LIABILITY', 'CAPITAL', 'INCOME', 'EXPENSE'];

// GET /api/accounts
const getAccounts = async (req, res, next) => {
  try {
    const { type, status, search } = req.query;
    const where = {};

    if (type && type !== 'ALL' && VALID_TYPES.includes(type.toUpperCase())) {
      where.type = type.toUpperCase();
    }

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const accounts = await prisma.account.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: {
            journalItems: true,
            defaultJournals: true,
          },
        },
      },
    });

    res.status(200).json({ success: true, count: accounts.length, accounts });
  } catch (error) {
    next(error);
  }
};

// GET /api/accounts/:id
const getAccountById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        journalItems: {
          take: 20,
          orderBy: { entry: { date: 'desc' } },
          include: { entry: true },
        },
        _count: {
          select: {
            journalItems: true,
            defaultJournals: true,
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    res.status(200).json({ success: true, account });
  } catch (error) {
    next(error);
  }
};

// POST /api/accounts
const createAccount = async (req, res, next) => {
  try {
    const { code, name, type, description, status = 'ACTIVE', balance = 0 } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Account code is required.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Account name is required.' });
    }
    if (!type || !VALID_TYPES.includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Valid account type (ASSET, LIABILITY, CAPITAL, INCOME, EXPENSE) is required.',
      });
    }

    const trimmedCode = code.trim();
    const existing = await prisma.account.findUnique({ where: { code: trimmedCode } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Account with code ${trimmedCode} already exists.` });
    }

    const account = await prisma.account.create({
      data: {
        code: trimmedCode,
        name: name.trim(),
        type: type.toUpperCase(),
        description: description?.trim() || null,
        status: status?.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        balance: parseFloat(balance) || 0,
      },
    });

    res.status(201).json({ success: true, message: 'Account created successfully.', account });
  } catch (error) {
    next(error);
  }
};

// PUT /api/accounts/:id
const updateAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, type, description, status, balance } = req.body;

    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (code && code.trim() !== existing.code) {
      const codeCheck = await prisma.account.findUnique({ where: { code: code.trim() } });
      if (codeCheck) {
        return res.status(400).json({ success: false, message: `Account with code ${code.trim()} already exists.` });
      }
    }

    const updateData = {};
    if (code) updateData.code = code.trim();
    if (name) updateData.name = name.trim();
    if (type && VALID_TYPES.includes(type.toUpperCase())) updateData.type = type.toUpperCase();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (status) updateData.status = status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (balance !== undefined) updateData.balance = parseFloat(balance) || 0;

    const account = await prisma.account.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ success: true, message: 'Account updated successfully.', account });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/accounts/:id
const deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.account.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            journalItems: true,
            defaultJournals: true,
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    // Accounting safety: Check if account has journal entries or is default for a journal
    const journalItemsCount = existing._count?.journalItems || 0;
    const defaultJournalsCount = existing._count?.defaultJournals || 0;

    if (journalItemsCount > 0 || defaultJournalsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Account "${existing.name}" (${existing.code}) cannot be deleted because it is referenced in ${journalItemsCount} journal entry line(s). To preserve historical accounting integrity, please set its status to INACTIVE instead.`,
      });
    }

    await prisma.account.delete({ where: { id } });

    res.status(200).json({ success: true, message: `Account "${existing.name}" deleted successfully.` });
  } catch (error) {
    next(error);
  }
};

// POST /api/accounts/import
const importAccounts = async (req, res, next) => {
  try {
    const { accounts } = req.body;

    if (!Array.isArray(accounts) || accounts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body must contain an "accounts" array with at least one record.',
      });
    }

    const created = [];
    const updated = [];
    const errors = [];

    for (let i = 0; i < accounts.length; i++) {
      const row = accounts[i];
      const rowNum = i + 1;

      const name = (row.name || row['Account Name'] || '').toString().trim();
      const rawType = (row.type || row['Type'] || '').toString().trim().toUpperCase();
      const code = (row.code || row['Code'] || '').toString().trim();
      const description = (row.description || row['Description'] || '').toString().trim() || null;
      const rawStatus = (row.status || row['Status'] || 'ACTIVE').toString().trim().toUpperCase();
      const status = rawStatus === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

      // Validation
      if (!name) {
        errors.push({ row: rowNum, code: code || 'N/A', message: 'Missing Account Name.' });
        continue;
      }
      if (!code) {
        errors.push({ row: rowNum, name, message: 'Missing Account Code.' });
        continue;
      }
      if (!VALID_TYPES.includes(rawType)) {
        errors.push({
          row: rowNum,
          code,
          name,
          message: `Invalid Account Type "${rawType}". Must be one of: ${VALID_TYPES.join(', ')}.`,
        });
        continue;
      }

      try {
        const existing = await prisma.account.findUnique({ where: { code } });

        if (existing) {
          const updatedAcc = await prisma.account.update({
            where: { id: existing.id },
            data: {
              name,
              type: rawType,
              description: description !== null ? description : existing.description,
              status,
            },
          });
          updated.push(updatedAcc);
        } else {
          const newAcc = await prisma.account.create({
            data: {
              code,
              name,
              type: rawType,
              description,
              status,
              balance: 0,
            },
          });
          created.push(newAcc);
        }
      } catch (err) {
        errors.push({ row: rowNum, code, name, message: err.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Import complete: ${created.length} created, ${updated.length} updated, ${errors.length} skipped.`,
      summary: {
        total: accounts.length,
        created: created.length,
        updated: updated.length,
        failed: errors.length,
      },
      errors,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  importAccounts,
};
