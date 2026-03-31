const express = require('express');
const router = express.Router();
const { adaptStudyPlan } = require('../agent/studyAgent');

// Adapt plan endpoint
router.post('/', async (req, res) => {
  try {
    const { user, missedTasks, currentStreak } = req.body;
    const result = await adaptStudyPlan(user, missedTasks, currentStreak);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;