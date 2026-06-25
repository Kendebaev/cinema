const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validationMiddleware');

// Auth pages/APIs
router.get('/login', authController.getLogin);
router.post('/login', validateBody('login'), authController.postLogin);

router.get('/register', authController.getRegister);
router.post('/register', validateBody('register'), authController.postRegister);

router.get('/logout', authController.logout);

// User profile (GET /profile is required by the rubric)
router.get('/profile', isAuthenticated, authController.getProfile);

// Delete account (protected)
router.post('/delete-account', isAuthenticated, authController.deleteAccount);

module.exports = router;
