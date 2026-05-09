const express = require('express');
const router = express.Router();
const { register, login, getMe, getPublicUser, bootstrapAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users/:id', protect, getPublicUser);
router.post('/bootstrap-admin', bootstrapAdmin);

module.exports = router;
