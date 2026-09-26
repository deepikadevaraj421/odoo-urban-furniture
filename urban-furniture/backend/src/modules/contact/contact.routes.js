const express = require('express');
const router = express.Router();
const contactController = require('./contact.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

// Accessible to Admin and Accountants
router.use(authenticate);
router.use(authorize('ADMIN', 'ACCOUNTANT'));

router.get('/', contactController.getContacts);
router.get('/:id', contactController.getContactById);
router.post('/', contactController.createContact);
router.put('/:id', contactController.updateContact);
router.delete('/:id', contactController.deleteContact);

module.exports = router;
