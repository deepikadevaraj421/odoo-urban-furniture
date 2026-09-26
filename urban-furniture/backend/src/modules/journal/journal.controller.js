const prisma = require('../../config/database');

// GET /api/journals
const getJournals = async (req, res, next) => {
  try {
    const journals = await prisma.journal.findMany({
      orderBy: { code: 'asc' },
      include: {
        defaultAccount: true,
        _count: { select: { journalEntries: true } },
      },
    });

    res.status(200).json({ success: true, count: journals.length, journals });
  } catch (error) {
    next(error);
  }
};

// POST /api/journals
const createJournal = async (req, res, next) => {
  try {
    const { code, name, type, defaultAccountId } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Journal code is required.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Journal name is required.' });
    }
    if (!type || !['SALES', 'PURCHASE', 'BANK', 'CASH', 'GENERAL'].includes(type.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Valid journal type is required.' });
    }

    const existing = await prisma.journal.findUnique({ where: { code: code.trim() } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Journal with code ${code.trim()} already exists.` });
    }

    const journal = await prisma.journal.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type: type.toUpperCase(),
        defaultAccountId: defaultAccountId || null,
      },
      include: { defaultAccount: true },
    });

    res.status(201).json({ success: true, message: 'Journal created successfully.', journal });
  } catch (error) {
    next(error);
  }
};

// Helper to calculate delta on account balance
const getAccountBalanceDelta = (accountType, debit, credit) => {
  if (['ASSET', 'EXPENSE'].includes(accountType)) {
    return debit - credit;
  }
  return credit - debit;
};

// GET /api/journal-entries
const getJournalEntries = async (req, res, next) => {
  try {
    const {
      journalId,
      type,
      search,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const where = {};

    if (journalId) where.journalId = journalId;

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (type && type !== 'ALL') {
      if (['SALES', 'PURCHASE', 'BANK', 'CASH', 'GENERAL'].includes(type.toUpperCase())) {
        where.journal = { type: type.toUpperCase() };
      } else {
        where.journalId = type;
      }
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        where.date.gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        where.date.lte = e;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { entryNumber: { contains: q, mode: 'insensitive' } },
        { reference: { contains: q, mode: 'insensitive' } },
        {
          items: {
            some: {
              OR: [
                { label: { contains: q, mode: 'insensitive' } },
                { account: { name: { contains: q, mode: 'insensitive' } } },
                { account: { code: { contains: q, mode: 'insensitive' } } },
              ],
            },
          },
        },
        { journal: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Calculate real database KPIs across all journal entries
    const allEntries = await prisma.journalEntry.findMany({
      select: {
        totalDebit: true,
        totalCredit: true,
        date: true,
        status: true,
      },
    });

    const totalEntriesCount = allEntries.length;
    const totalDebitSum = allEntries.reduce((sum, e) => sum + (e.totalDebit || 0), 0);
    const totalCreditSum = allEntries.reduce((sum, e) => sum + (e.totalCredit || 0), 0);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const thisMonthEntries = allEntries.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const prevMonthEntries = allEntries.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });

    const thisMonthCount = thisMonthEntries.length;
    const prevMonthCount = prevMonthEntries.length;

    const thisMonthDebit = thisMonthEntries.reduce((s, e) => s + (e.totalDebit || 0), 0);
    const prevMonthDebit = prevMonthEntries.reduce((s, e) => s + (e.totalDebit || 0), 0);

    const calcPercent = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const entriesChangePercent = calcPercent(thisMonthCount, prevMonthCount);
    const debitChangePercent = calcPercent(thisMonthDebit, prevMonthDebit);

    const kpis = {
      totalEntries: totalEntriesCount,
      totalDebit: totalDebitSum,
      totalCredit: totalCreditSum,
      thisMonthCount,
      prevMonthCount,
      entriesChangeText: entriesChangePercent >= 0 ? `+${entriesChangePercent}%` : `${entriesChangePercent}%`,
      debitChangeText: debitChangePercent >= 0 ? `+${debitChangePercent}%` : `${debitChangePercent}%`,
      creditChangeText: debitChangePercent >= 0 ? `+${debitChangePercent}%` : `${debitChangePercent}%`,
      thisMonthChangeText: entriesChangePercent >= 0 ? `+${entriesChangePercent}%` : `${entriesChangePercent}%`,
    };

    // Filtered count and pagination
    const totalFiltered = await prisma.journalEntry.count({ where });
    const take = limit === 'all' ? undefined : Math.max(1, parseInt(limit, 10) || 10);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const skip = limit === 'all' ? 0 : (pageNum - 1) * take;

    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take,
      include: {
        journal: true,
        items: {
          include: { account: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: entries.length,
      total: totalFiltered,
      page: pageNum,
      totalPages: take ? Math.ceil(totalFiltered / take) : 1,
      limit: take || totalFiltered,
      entries,
      kpis,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/journal-entries/:id
const getJournalEntryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        journal: true,
        items: {
          include: { account: true },
        },
      },
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found.' });
    }

    res.status(200).json({ success: true, entry });
  } catch (error) {
    next(error);
  }
};

// POST /api/journal-entries
// Strictly enforces TOTAL DEBIT = TOTAL CREDIT when posting
const createJournalEntry = async (req, res, next) => {
  try {
    const {
      journalId,
      date = new Date(),
      reference,
      description,
      items,
      status = 'POSTED',
    } = req.body;

    if (!journalId) {
      return res.status(400).json({ success: false, message: 'Journal selection is required.' });
    }

    if (!items || !Array.isArray(items) || items.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A double-entry journal entry must have at least two line items.',
      });
    }

    let totalDebit = 0;
    let totalCredit = 0;
    const validatedItems = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.accountId) {
        return res.status(400).json({
          success: false,
          message: `Line ${i + 1}: Account is required.`,
        });
      }

      const debit = parseFloat(item.debit) || 0;
      const credit = parseFloat(item.credit) || 0;

      if (debit < 0 || credit < 0) {
        return res.status(400).json({
          success: false,
          message: `Line ${i + 1}: Debit and Credit amounts must be non-negative.`,
        });
      }

      if (debit === 0 && credit === 0 && status === 'POSTED') {
        return res.status(400).json({
          success: false,
          message: `Line ${i + 1}: Either Debit or Credit must have an amount greater than 0.`,
        });
      }

      totalDebit += debit;
      totalCredit += credit;

      validatedItems.push({
        accountId: item.accountId,
        label: item.label?.trim() || description?.trim() || reference?.trim() || null,
        debit,
        credit,
      });
    }

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    // Strict Double-Entry Validation for POSTED entries
    if (status === 'POSTED') {
      if (Math.abs(totalDebit - totalCredit) > 0.01 || totalDebit <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Journal entry is not balanced. Total debit must equal total credit.',
        });
      }
    }

    // Determine entryNumber: if user provided a custom code like JV-00028, check if unused
    let entryNumber = null;
    if (reference && /^JV-\d+$/i.test(reference.trim())) {
      const exists = await prisma.journalEntry.findUnique({ where: { entryNumber: reference.trim().toUpperCase() } });
      if (!exists) {
        entryNumber = reference.trim().toUpperCase();
      }
    }

    if (!entryNumber) {
      const count = await prisma.journalEntry.count();
      entryNumber = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    }

    // If description is provided, use it for reference field
    const storedReference = description?.trim() || reference?.trim() || null;

    const entry = await prisma.$transaction(async (tx) => {
      const createdEntry = await tx.journalEntry.create({
        data: {
          entryNumber,
          journalId,
          date: new Date(date),
          reference: storedReference,
          status,
          totalDebit,
          totalCredit,
          items: {
            create: validatedItems,
          },
        },
        include: {
          journal: true,
          items: { include: { account: true } },
        },
      });

      // Update account balances only if POSTED
      if (status === 'POSTED') {
        for (const item of validatedItems) {
          const acc = await tx.account.findUnique({ where: { id: item.accountId } });
          if (acc) {
            const delta = getAccountBalanceDelta(acc.type, item.debit, item.credit);
            await tx.account.update({
              where: { id: item.accountId },
              data: { balance: acc.balance + delta },
            });
          }
        }
      }

      return createdEntry;
    });

    res.status(201).json({
      success: true,
      message: status === 'POSTED' ? 'Journal entry posted successfully.' : 'Journal entry draft saved.',
      entry,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/journal-entries/:id
const updateJournalEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { journalId, date, reference, description, items, status } = req.body;

    const existing = await prisma.journalEntry.findUnique({
      where: { id },
      include: { items: { include: { account: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Journal entry not found.' });
    }

    const newStatus = status || existing.status;
    let totalDebit = 0;
    let totalCredit = 0;
    let validatedItems = [];

    if (items && Array.isArray(items)) {
      if (items.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'A double-entry journal entry must have at least two line items.',
        });
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.accountId) {
          return res.status(400).json({ success: false, message: `Line ${i + 1}: Account is required.` });
        }
        const debit = parseFloat(item.debit) || 0;
        const credit = parseFloat(item.credit) || 0;
        totalDebit += debit;
        totalCredit += credit;
        validatedItems.push({
          accountId: item.accountId,
          label: item.label?.trim() || description?.trim() || reference?.trim() || null,
          debit,
          credit,
        });
      }

      totalDebit = Math.round(totalDebit * 100) / 100;
      totalCredit = Math.round(totalCredit * 100) / 100;
    } else {
      totalDebit = existing.totalDebit;
      totalCredit = existing.totalCredit;
    }

    // If new status is POSTED, validate balance
    if (newStatus === 'POSTED') {
      if (Math.abs(totalDebit - totalCredit) > 0.01 || totalDebit <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Journal entry is not balanced. Total debit must equal total credit.',
        });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. If existing was POSTED, reverse its impact on account balances
      if (existing.status === 'POSTED') {
        for (const item of existing.items) {
          const acc = await tx.account.findUnique({ where: { id: item.accountId } });
          if (acc) {
            const delta = getAccountBalanceDelta(acc.type, item.debit, item.credit);
            await tx.account.update({
              where: { id: item.accountId },
              data: { balance: acc.balance - delta },
            });
          }
        }
      }

      // 2. Delete old items if items array is being updated
      if (items && Array.isArray(items)) {
        await tx.journalItem.deleteMany({ where: { entryId: id } });
      }

      // 3. Update entry
      const updateData = {
        status: newStatus,
        totalDebit,
        totalCredit,
      };
      if (journalId) updateData.journalId = journalId;
      if (date) updateData.date = new Date(date);
      if (description || reference) {
        updateData.reference = description?.trim() || reference?.trim();
      }

      if (items && Array.isArray(items)) {
        updateData.items = { create: validatedItems };
      }

      const resEntry = await tx.journalEntry.update({
        where: { id },
        data: updateData,
        include: {
          journal: true,
          items: { include: { account: true } },
        },
      });

      // 4. If new status is POSTED, apply new impact to account balances
      if (newStatus === 'POSTED') {
        const itemsToApply = items && Array.isArray(items) ? validatedItems : existing.items;
        for (const item of itemsToApply) {
          const acc = await tx.account.findUnique({ where: { id: item.accountId } });
          if (acc) {
            const delta = getAccountBalanceDelta(acc.type, item.debit, item.credit);
            await tx.account.update({
              where: { id: item.accountId },
              data: { balance: acc.balance + delta },
            });
          }
        }
      }

      return resEntry;
    });

    res.status(200).json({ success: true, message: 'Journal entry updated successfully.', entry: updated });
  } catch (error) {
    next(error);
  }
};

// POST /api/journal-entries/:id/post
const postJournalEntry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: { items: { include: { account: true } } },
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found.' });
    }

    if (entry.status === 'POSTED') {
      return res.status(400).json({ success: false, message: 'Journal entry is already posted.' });
    }

    // Check balance
    if (Math.abs(entry.totalDebit - entry.totalCredit) > 0.01 || entry.totalDebit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Journal entry is not balanced. Total debit must equal total credit.',
      });
    }

    const posted = await prisma.$transaction(async (tx) => {
      const updated = await tx.journalEntry.update({
        where: { id },
        data: { status: 'POSTED' },
        include: {
          journal: true,
          items: { include: { account: true } },
        },
      });

      // Apply balances
      for (const item of entry.items) {
        const acc = await tx.account.findUnique({ where: { id: item.accountId } });
        if (acc) {
          const delta = getAccountBalanceDelta(acc.type, item.debit, item.credit);
          await tx.account.update({
            where: { id: item.accountId },
            data: { balance: acc.balance + delta },
          });
        }
      }

      return updated;
    });

    res.status(200).json({ success: true, message: 'Journal entry posted successfully.', entry: posted });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/journal-entries/:id
const deleteJournalEntry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: { items: { include: { account: true } } },
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found.' });
    }

    await prisma.$transaction(async (tx) => {
      // If posted, reverse balances
      if (entry.status === 'POSTED') {
        for (const item of entry.items) {
          const acc = await tx.account.findUnique({ where: { id: item.accountId } });
          if (acc) {
            const delta = getAccountBalanceDelta(acc.type, item.debit, item.credit);
            await tx.account.update({
              where: { id: item.accountId },
              data: { balance: acc.balance - delta },
            });
          }
        }
      }

      await tx.journalItem.deleteMany({ where: { entryId: id } });
      await tx.journalEntry.delete({ where: { id } });
    });

    res.status(200).json({ success: true, message: 'Journal entry deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJournals,
  createJournal,
  getJournalEntries,
  getJournalEntryById,
  createJournalEntry,
  updateJournalEntry,
  postJournalEntry,
  deleteJournalEntry,
};
