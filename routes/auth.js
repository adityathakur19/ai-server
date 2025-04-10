
  // server/routes/auth.js
  const express = require('express');
  const router = express.Router();
  const { check } = require('express-validator');
  const authController = require('../controllers/authController');
  const auth = require('../middleware/auth');
  
  // Register user
  router.post(
    '/register',
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
    ],
    authController.register
  );
  
  // Login user
  router.post(
    '/login',
    [
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Password is required').exists()
    ],
    authController.login
  );
  
  // Google login
  router.post('/google', authController.googleLogin);
  
  // Get current user
  router.get('/me', auth, authController.getMe);
  
  module.exports = router;
  
