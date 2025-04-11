
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

// Connect Database
connectDB();

const app = express();

// Init Middleware
app.use(express.json({ extended: false }));
app.use(cors({
  origin: ['http://localhost:3000', 'https://ai-bot-eight-kappa.vercel.app/login'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));

app.get('/', (req, res) => res.send('API Running'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));


