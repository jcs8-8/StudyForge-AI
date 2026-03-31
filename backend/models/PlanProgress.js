const mongoose = require('mongoose');

// Plan schema (JSON from LLM)
const planSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  goal: { type: String, required: true },
  totalWeeks: { type: Number, required: true },
  dailyHours: { type: Number, required: true },
  weeks: [{
    weekNum: { type: Number, required: true },
    theme: { type: String, required: true },
    weeklyGoal: { type: String, required: true },
    days: [{
      day: { type: String, required: true },
      date: { type: String },
      type: { type: String, enum: ['study', 'revision', 'break'], required: true },
      tasks: [{
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        duration: { type: Number, required: true },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
        topic: { type: String, required: true },
        resources: [{ type: String }]
      }]
    }]
  }],
  createdAt: { type: Date, default: Date.now }
});

// Progress schema
const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: String, required: true },
  status: { type: String, enum: ['completed', 'missed', 'pending'], required: true },
  xpEarned: { type: Number, default: 0 },
  completedAt: { type: Date },
  rescheduled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  Plan: mongoose.model('Plan', planSchema),
  Progress: mongoose.model('Progress', progressSchema)
};