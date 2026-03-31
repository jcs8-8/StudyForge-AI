const express = require('express');
const router = express.Router();

// Placeholder routes for progress
router.get('/', (req, res) => {
  res.json({ message: 'Progress endpoint' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Update progress' });
});

module.exports = router;