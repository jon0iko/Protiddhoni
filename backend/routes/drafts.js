/**
 * Draft Routes
 */

const express = require('express');
const router = express.Router();
const draftController = require('../controllers/draftController');
const { authenticate } = require('../middleware/auth');

// All draft routes require authentication
router.use(authenticate);

// Get current user's drafts
router.get('/my', draftController.getMyDrafts);

// Get specific draft
router.get('/:id', draftController.getDraftById);

// Create new draft
router.post('/', draftController.createDraft);

// Update draft
router.put('/:id', draftController.updateDraft);

// Delete draft
router.delete('/:id', draftController.deleteDraft);

module.exports = router;
