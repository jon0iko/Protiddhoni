/**
 * Draft Routes
 */

import express from 'express';
const router = express.Router();
import * as draftController from '../controllers/draftController';
import { authenticate } from '../middleware/auth';

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

export default router;
