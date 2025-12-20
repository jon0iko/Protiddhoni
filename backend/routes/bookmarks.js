/**
 * Bookmark Routes
 */

const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const { authenticate } = require('../middleware/auth');

// All bookmark routes require authentication
router.use(authenticate);

router.get('/', bookmarkController.getMyBookmarks);
router.post('/', bookmarkController.addBookmark);
router.delete('/:contentId', bookmarkController.removeBookmark);
router.get('/check/:contentId', bookmarkController.checkBookmark);

module.exports = router;
