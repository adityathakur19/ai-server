 // server/controllers/authController.js
 const { validationResult } = require('express-validator');
 const jwt = require('jsonwebtoken');
 const { OAuth2Client } = require('google-auth-library');
 const User = require('../models/User');
 require('dotenv').config();
 
 const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
 
 // Generate JWT
 const generateToken = (user) => {
   return jwt.sign(
     { user: { id: user.id } },
     process.env.JWT_SECRET,
     { expiresIn: '24h' }
   );
 };
 
 // Register a new user
 exports.register = async (req, res) => {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
     return res.status(400).json({ errors: errors.array() });
   }
 
   const { name, email, password } = req.body;
 
   try {
     // Check if user exists
     let user = await User.findOne({ email });
     if (user) {
       return res.status(400).json({ msg: 'User already exists' });
     }
 
     // Create new user
     user = new User({
       name,
       email,
       password
     });
 
     await user.save();
 
     // Return JWT
     const token = generateToken(user);
     res.json({ token });
   } catch (err) {
     console.error(err.message);
     res.status(500).send('Server error');
   }
 };
 
 // Login user
 exports.login = async (req, res) => {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
     return res.status(400).json({ errors: errors.array() });
   }
 
   const { email, password } = req.body;
 
   try {
     // Check if user exists
     let user = await User.findOne({ email });
     if (!user) {
       return res.status(400).json({ msg: 'Invalid credentials' });
     }
 
     // Check password
     const isMatch = await user.comparePassword(password);
     if (!isMatch) {
       return res.status(400).json({ msg: 'Invalid credentials' });
     }
 
     // Return JWT
     const token = generateToken(user);
     res.json({ token });
   } catch (err) {
     console.error(err.message);
     res.status(500).send('Server error');
   }
 };
 
 // Google Sign In
 exports.googleLogin = async (req, res) => {
   const { tokenId } = req.body;
 
   try {
     // Verify Google token
     const ticket = await googleClient.verifyIdToken({
       idToken: tokenId,
       audience: process.env.GOOGLE_CLIENT_ID
     });
 
     const { email_verified, name, email, sub: googleId } = ticket.getPayload();
 
     if (!email_verified) {
       return res.status(400).json({ msg: 'Google email not verified' });
     }
 
     // Check if user exists
     let user = await User.findOne({ email });
 
     if (!user) {
       // Create new user if doesn't exist
       user = new User({
         name,
         email,
         googleId
       });
       await user.save();
     } else {
       // Update googleId if user exists but didn't have googleId
       if (!user.googleId) {
         user.googleId = googleId;
         await user.save();
       }
     }
 
     // Return JWT
     const token = generateToken(user);
     res.json({ token });
   } catch (err) {
     console.error('Google login error:', err);
     res.status(500).send('Server error');
   }
 };
 
 // Get current user
 exports.getMe = async (req, res) => {
   try {
     const user = await User.findById(req.user.id).select('-password');
     res.json(user);
   } catch (err) {
     console.error(err.message);
     res.status(500).send('Server error');
   }
 };
 
