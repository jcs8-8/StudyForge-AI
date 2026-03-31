/**
 * StudyForge AI — Backend Server
 * Node.js + Express + MongoDB (Mongoose)
 * 
 * Run: npm install && node server.js
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// ===== DATABASE CONNECTION =====
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studyforge', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ===== ROUTES =====
app.use('/api', require('./routes/all-routes'));

// ===== SERVE FRONTEND =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`🚀 StudyForge API running on http://localhost:${PORT}`);
  console.log(`📚 AI powered by: ${process.env.HF_API_KEY ? 'HuggingFace' : 'Fallback mode'}`);
});

module.exports = app;
