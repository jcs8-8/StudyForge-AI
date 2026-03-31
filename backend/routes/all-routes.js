const express = require('express');
const router = express.Router();
const { generateStudyPlan, adaptStudyPlan, chatWithAgent, getMotivationalMessage } = require('../agent/studyAgent');
const User = require('../models/User');
const { Plan, Progress } = require('../models/PlanProgress');
const { auth, generateToken } = require('../utils/auth');

// ===== AUTHENTICATION ROUTES =====
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== USERS ROUTES =====
router.post('/users', auth, async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/profile/me', auth, async (req, res) => {
  res.json(req.user);
});

// ===== PLANS ROUTES =====
router.post('/plans/generate', auth, async (req, res) => {
  try {
    const plan = await generateStudyPlan(req.body);
    const planDoc = new Plan({ ...plan, userId: req.user._id });
    await planDoc.save();
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/plans/:userId/active', auth, async (req, res) => {
  try {
    const plan = await Plan.findOne({ userId: req.params.userId }).sort({ createdAt: -1 });
    if (!plan) return res.status(404).json({ error: 'No plan found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== PROGRESS ROUTES =====
router.post('/progress/task', auth, async (req, res) => {
  try {
    const { taskId, status, xpEarned } = req.body;
    const progress = new Progress({ userId: req.user._id, taskId, status, xpEarned });
    await progress.save();

    // Update user XP and streak
    if (status === 'completed') {
      await User.findByIdAndUpdate(req.user._id, { $inc: { xp: xpEarned || 10 } });
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/progress/:userId', auth, async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.params.userId });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CHAT ROUTES =====
router.post('/chat', auth, async (req, res) => {
  try {
    const { history, message, progress } = req.body;
    const response = await chatWithAgent(req.user, history, message, progress);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ADAPT ROUTES =====
router.post('/adapt', auth, async (req, res) => {
  try {
    const { missedTasks, currentStreak } = req.body;
    const result = await adaptStudyPlan(req.user, missedTasks, currentStreak);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/adapt/motivate/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const stats = {
      streak: user.streak,
      rate: 85, // Placeholder - would calculate from progress
      trend: 'improving'
    };

    const message = await getMotivationalMessage(user, stats);
    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== REMINDERS ROUTES =====
router.post('/reminders/simulate', auth, (req, res) => {
  // Placeholder for reminder simulation
  res.json({ message: 'Reminder simulated', type: req.body.type });
});

module.exports = router;