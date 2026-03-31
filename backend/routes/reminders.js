const express = require('express');
const router = express.Router();

// Placeholder routes for reminders
router.get('/', (req, res) => {
  res.json({ message: 'Reminders endpoint' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create reminder' });
});

module.exports = router;