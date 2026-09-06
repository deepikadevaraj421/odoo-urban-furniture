const express = require('express');
const router = express.Router();
const journalController = require('./journal.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize, requirePermission } = require('../../middleware/authorize');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);
router.use(authorize('ADMIN', 'ACCOUNTANT'));

// Journals
router.get('/journals', requirePermission(PERMISSIONS.VIEW_JOURNALS), journalController.getJournals);
router.post('/journals', journalController.createJournal);

// Journal Entries
router.get('/journal-entries', requirePermission(PERMISSIONS.VIEW_JOURNAL_ENTRIES), journalController.getJournalEntries);
router.get('/journal-entries/:id', requirePermission(PERMISSIONS.VIEW_JOURNAL_ENTRIES), journalController.getJournalEntryById);
router.post('/journal-entries', requirePermission(PERMISSIONS.CREATE_JOURNAL_ENTRIES), journalController.createJournalEntry);
router.put('/journal-entries/:id', requirePermission(PERMISSIONS.CREATE_JOURNAL_ENTRIES), journalController.updateJournalEntry);
router.post('/journal-entries/:id/post', requirePermission(PERMISSIONS.CREATE_JOURNAL_ENTRIES), journalController.postJournalEntry);
router.delete('/journal-entries/:id', requirePermission(PERMISSIONS.CREATE_JOURNAL_ENTRIES), journalController.deleteJournalEntry);

module.exports = router;
