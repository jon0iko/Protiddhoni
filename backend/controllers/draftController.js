/**
 * Draft Controller
 * Handles draft operations
 */

const DraftRepository = require('../repositories/DraftRepository');

exports.getMyDrafts = async (req, res) => {
    try {
        const drafts = await DraftRepository.findByAuthor(req.user.id);
        res.json({ success: true, data: drafts, count: drafts.length });
    } catch (error) {
        console.error('Get drafts error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getDraftById = async (req, res) => {
    try {
        const draft = await DraftRepository.findById(req.params.id);
        
        if (!draft) {
            return res.status(404).json({ success: false, error: 'Draft not found' });
        }

        // Check if user owns this draft
        if (draft.author_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        res.json({ success: true, data: draft });
    } catch (error) {
        console.error('Get draft error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createDraft = async (req, res) => {
    try {
        const { title, body, content_type, series_id, metadata } = req.body;
        
        const draftData = {
            author_id: req.user.id,
            title,
            body,
            content_type,
            series_id: series_id || null,
            metadata: metadata || {}
        };

        const draft = await DraftRepository.create(draftData);
        res.status(201).json({ success: true, data: draft });
    } catch (error) {
        console.error('Create draft error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateDraft = async (req, res) => {
    try {
        const draft = await DraftRepository.findById(req.params.id);
        
        if (!draft) {
            return res.status(404).json({ success: false, error: 'Draft not found' });
        }

        // Check if user owns this draft
        if (draft.author_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const { title, body, content_type, series_id, metadata } = req.body;
        
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (body !== undefined) updates.body = body;
        if (content_type !== undefined) updates.content_type = content_type;
        if (series_id !== undefined) updates.series_id = series_id;
        if (metadata !== undefined) updates.metadata = metadata;

        const updatedDraft = await DraftRepository.update(req.params.id, updates);
        res.json({ success: true, data: updatedDraft });
    } catch (error) {
        console.error('Update draft error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteDraft = async (req, res) => {
    try {
        const draft = await DraftRepository.findById(req.params.id);
        
        if (!draft) {
            return res.status(404).json({ success: false, error: 'Draft not found' });
        }

        // Check if user owns this draft
        if (draft.author_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        await DraftRepository.delete(req.params.id);
        res.json({ success: true, message: 'Draft deleted successfully' });
    } catch (error) {
        console.error('Delete draft error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;
