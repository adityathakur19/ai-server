// server/controllers/chatController.js
const axios = require('axios');
const Conversation = require('../models/Conversation');
require('dotenv').config();

exports.createConversation = async (req, res) => {
  try {
    const newConversation = new Conversation({
      userId: req.user.id,
      title: req.body.title || 'New Conversation',
      messages: []
    });

    const conversation = await newConversation.save();
    res.json(conversation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user.id })
      .sort({ updatedAt: -1 });
    
    // Transform conversations to include the first message content and message count
    const conversationsWithPreview = conversations.map(conversation => {
      const firstUserMessage = conversation.messages.find(msg => msg.role === 'user');
      
      return {
        _id: conversation._id,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
        firstMessage: firstUserMessage ? 
          (firstUserMessage.content.length > 30 ? 
            `${firstUserMessage.content.substring(0, 30)}...` : 
            firstUserMessage.content) : 
          'New Conversation',
        messageCount: conversation.messages.length
      };
    });
    
    res.json(conversationsWithPreview);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get a specific conversation
exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    // Check user owns conversation
    if (conversation.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(conversation);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    res.status(500).send('Server error');
  }
};

// Add message to conversation and get AI response
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    if (conversation.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    conversation.messages.push({
      role: 'user',
      content: message
    });

    const chatHistory = conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const systemMessage = {
      role: "system",
      content: "You are a healthcare assistant AI. Only respond to health-related queries. If a user mentions pain, symptoms, or health concerns, provide general health advice and recommend they consult a doctor. For any non-health related questions, politely redirect the conversation to health topics."
    };

    try {
      const groqResponse = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: "llama3-8b-8192",
          messages: [systemMessage, ...chatHistory],
          temperature: 0.7,
          max_tokens: 1024
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Add AI response to conversation
      conversation.messages.push({
        role: 'assistant',
        content: groqResponse.data.choices[0].message.content
      });

      await conversation.save();
      res.json(conversation);
    } catch (error) {
      console.error('Groq API error:', error.response ? error.response.data : error.message);
      res.status(500).json({ msg: 'Error communicating with AI service' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete a conversation
exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    // Check user owns conversation
    if (conversation.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await conversation.deleteOne();
    res.json({ msg: 'Conversation removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    res.status(500).send('Server error');
  }
};