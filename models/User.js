
  // server/models/User.js
  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');
  
  const UserSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String
    },
    googleId: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  // Hash password before saving
  UserSchema.pre('save', async function(next) {
    if (this.password && this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  });
  
  // Compare password method
  UserSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };
  
  module.exports = mongoose.model('User', UserSchema);
  

  