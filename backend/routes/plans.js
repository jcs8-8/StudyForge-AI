const express = require('express');
const router = express.Router();

// Placeholder routes for plans
router.get('/', (req, res) => {
  res.json({ message: 'Plans endpoint' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create plan' });
});

module.exports = router;