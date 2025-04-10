  // server/routes/chat.js
  const express = require('express');
  const router = express.Router();
  const chatController = require('../controllers/chatController');
  const auth = require('../middleware/auth');
  
  // Create a new conversation
  router.post('/', auth, chatController.createConversation);
  
  // Get all conversations
  router.get('/', auth, chatController.getConversations);
  
  // Get a specific conversation
  router.get('/:id', auth, chatController.getConversation);
  
  // Add message to conversation
  router.post('/:id/message', auth, chatController.sendMessage);
  
  // Delete a conversation
  router.delete('/:id', auth, chatController.deleteConversation);
  
  module.exports = router;
  