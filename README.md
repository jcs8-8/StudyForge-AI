# 📚StudyForge AI  — Intelligent Study Companion Agent

> **Buildathon Project** | AI-powered adaptive learning companion that keeps students consistent

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (HTML/CSS/JS)            │
│  Onboarding → Dashboard → Plan → Progress → Chat    │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│              BACKEND (Node.js + Express)             │
│  /api/users  /api/plans  /api/progress  /api/chat   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              AI AGENT (Core Intelligence)            │
│                                                     │
│  ┌─────────────────┐    ┌────────────────────────┐  │
│  │  HuggingFace    │    │   Rule-Based Logic     │  │
│  │  LLM (Mixtral)  │    │   Adaptive Scheduler   │  │
│  └────────┬────────┘    └──────────┬─────────────┘  │
│           │                        │                 │
│           └────────────┬───────────┘                 │
│                        │                             │
│  ┌─────────────────────▼──────────────────────────┐ │
│  │  Prompt Templates (4 core prompts)             │ │
│  │  • Study Plan Generator                        │ │
│  │  • Adaptive Rescheduler                        │ │
│  │  • Motivational Messages                       │ │
│  │  • Chat Response                               │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              DATABASE (MongoDB + Mongoose)           │
│  Users → Plans → Progress → ChatHistory             │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
studyforge-ai/
├── frontend/
│   └── index.html          # Complete SPA frontend
├── backend/
│   ├── server.js           # Express entry point
│   ├── models/
│   │   ├── User.js         # User schema (xp, streak, badges)
│   │   └── PlanProgress.js # Plan + Progress schemas
│   ├── routes/
│   │   └── all-routes.js   # All API endpoints
│   ├── agent/
│   │   └── studyAgent.js   # AI agent (HuggingFace + rules)
│   └── utils/              # (extend: email, vector DB)
├── .env.example            # Environment template
├── package.json
└── README.md
```

---

## 🚀 Quick Start (3 steps)

### Option A: Frontend Only (Instant Demo — No Setup Required)
```bash
# Just open index.html in browser!
open index.html

# Or serve it:
npx serve . -p 8080
# Visit http://localhost:8080
```

### Option B: Full Stack with AI
```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env: add HF_API_KEY and MONGODB_URI

# 3. Start MongoDB (if local)
mongod --dbpath ./data

# 4. Start backend
npm run dev
# API runs on http://localhost:5000

# 5. Open frontend
open frontend/index.html
```

---

## 🌐 Free Deployment (Render.com)

You can deploy the full-stack app (backend + frontend) for free using Render.

### 1. Prerequisites

- Code pushed to GitHub (this repo).
- MongoDB Atlas cluster created.
- HuggingFace API key generated.

### 2. Environment Variables

Create a `.env` file locally (not committed to Git) with:

```bash
HF_API_KEY=hf_your_token_here
MONGODB_URI=your_mongodb_uri_here
CLIENT_URL=https://your-service-name.onrender.com
```

On Render, set the same variables in the **Environment** tab of the service:

- `HF_API_KEY`
- `MONGODB_URI`
- `CLIENT_URL`

### 3. Create Render Web Service

1. Go to [Render](https://render.com) and sign up with GitHub.
2. Click **New → Web Service**.
3. Select this GitHub repo.
4. Use these settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **Create Web Service** and wait for the build to finish.

Render sets the `PORT` environment variable automatically. The backend listens on `process.env.PORT`, and the frontend is served from `frontend/index.html`, so no extra configuration is needed.

After deployment, your app will be available at:

```text
https://your-service-name.onrender.com
```

Whenever you push changes to GitHub, Render will automatically redeploy the latest version.

---

## 🔑 Getting a HuggingFace API Key (Free!)

1. Go to https://huggingface.co/join — create free account
2. Go to Settings → Access Tokens → New Token
3. Copy token (starts with `hf_...`)
4. Add to `.env`: `HF_API_KEY=hf_your_token`
5. Or paste in the app's Settings page

**Free tier**: 30,000 tokens/month — plenty for demos!

---

## 🧠 AI Prompts Explained

### 1. Study Plan Generation Prompt
- **Input**: User profile (goal, level, hours, deadline, topics)
- **Output**: Structured JSON with weeks → days → tasks
- **Model**: Mixtral-8x7B-Instruct (HuggingFace)
- **Strategy**: Progressive difficulty, revision days, breaks

### 2. Adaptive Rescheduling Prompt
- **Input**: Missed tasks + current streak + user profile
- **Output**: 3 specific actionable suggestions + action types
- **Logic**: Rule-based first, then LLM enriches
- **Rules**: 
  - ≥5 missed → reduce load 30%
  - >60% hard tasks missed → downgrade difficulty
  - Streak = 0 → motivational path

### 3. Motivational Message Prompt
- **Input**: Name, goal, streak, completion rate, trend
- **Output**: 2-3 sentences, goal-specific, with emoji
- **Personalization**: References actual progress data

### 4. Chat Response Prompt
- **Input**: Full context (profile + history + progress)
- **Output**: Helpful, specific, 2-4 sentence response
- **Memory**: Last 4 messages included as context

---

## 📊 Database Schema

```javascript
// User
{ name, goal, hours, deadline, level, topics,
  xp, streak, bestStreak, badges, chatHistory }

// Plan (JSON from LLM)
{ userId, title, goal, totalWeeks, dailyHours,
  weeks: [{ weekNum, theme, weeklyGoal,
    days: [{ day, type, tasks: [{ id, title,
      description, duration, difficulty, topic }] }] }] }

// Progress
{ userId, taskId, status, xpEarned, completedAt, rescheduled }
```

---

## ⚡ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create/update user profile |
| GET | `/api/users/:id` | Get user + stats |
| POST | `/api/plans/generate` | Generate AI study plan |
| GET | `/api/plans/:userId/active` | Get current plan |
| POST | `/api/progress/task` | Mark task complete/missed |
| GET | `/api/progress/:userId` | Get progress stats |
| POST | `/api/chat` | Chat with AI agent |
| POST | `/api/adapt` | Adapt plan to missed tasks |
| GET | `/api/adapt/motivate/:userId` | Get motivational message |
| POST | `/api/reminders/simulate` | Test reminder system |

---

## 🎮 Features Demo Guide

1. **Onboarding**: Fill form → "Generate My Study Plan" 
2. **Dashboard**: See streak, stats, today's tasks, AI insights
3. **Tasks**: Click tasks to toggle ✅/❌/pending → earn XP
4. **Adapt**: Click "Adapt" with missed tasks → AI reschedules
5. **Chat**: Ask "what should I study today?" or "reschedule my plan"
6. **Reminders**: Click test buttons to see notification system
7. **Progress**: Full history with consistency metrics
8. **Gamification**: Watch XP bar fill, earn badges, build streak

---

## 🏆 Bonus Features

- **Gamification**: XP system, level progression (Apprentice → Legend), 6 achievement badges
- **Smart Insights**: AI-generated contextual feedback ("You're falling behind", "Great consistency!")
- **7-Day Activity Chart**: Visual progress tracking
- **Export**: Download plan as JSON
- **Offline Mode**: Works without API key using intelligent fallbacks
- **Persistent Storage**: localStorage keeps data between sessions

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| AI Model | Mixtral-8x7B via HuggingFace API |
| Agent Logic | Custom rule-engine + LLM prompts |
| State | localStorage (frontend) + MongoDB (backend) |

---

## 📝 Sample Input/Output

### Input:
```json
{
  "name": "Arjun Sharma",
  "goal": "Crack Google SWE Interview",
  "hours": 4,
  "level": "Intermediate",
  "deadline": "2025-12-01",
  "topics": ["Arrays", "Trees", "DP", "Graphs"]
}
```

### Output Plan (excerpt):
```json
{
  "title": "Google SWE Interview Prep — Intermediate",
  "totalWeeks": 8,
  "weeks": [{
    "weekNum": 1,
    "theme": "Arrays & Strings Mastery",
    "weeklyGoal": "Solve 20 array problems, understand sliding window",
    "days": [{
      "day": "Monday",
      "type": "study",
      "tasks": [{
        "title": "Sliding Window Technique",
        "description": "Learn pattern with 5 examples",
        "duration": 120,
        "difficulty": "medium",
        "topic": "Arrays",
        "resources": ["LeetCode #76, #3", "NeetCode YouTube"]
      }]
    }]
  }]
}
```

---

*Built for the AI Buildathon — StudyForge AI © 2025*
