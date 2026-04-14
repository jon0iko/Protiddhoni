const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');
const { authenticate } = require('../middleware/auth');

// Public — frontend needs this before subscription
router.get('/vapid-public-key', pushController.getVapidPublicKey);

// Protected — requires logged-in user
router.post('/subscribe', authenticate, pushController.subscribe);
router.post('/unsubscribe', authenticate, pushController.unsubscribe);

module.exports = router;
