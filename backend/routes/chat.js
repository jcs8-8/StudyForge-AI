const express = require('express');
const router = express.Router();
const { chatWithAgent } = require('../agent/studyAgent');

// Chat endpoint
router.post('/', async (req, res) => {
  try {
    const { user, history, message, progress } = req.body;
    const response = await chatWithAgent(user, history, message, progress);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;