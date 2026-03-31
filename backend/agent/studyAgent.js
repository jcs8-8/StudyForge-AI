/**
 * StudyForge AI Agent — Core Intelligence Module
 * 
 * Architecture:
 *   User Input → Agent → HuggingFace LLM → Parse → Store
 *   Progress → Adaptive Rules + LLM → Reschedule
 * 
 * Uses: HuggingFace Inference API (Mixtral-8x7B or Mistral-7B)
 */

const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const HF_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1';
const HF_KEY = process.env.HF_API_KEY;

// ===== PROMPT TEMPLATES =====
const PROMPTS = {

  /**
   * PROMPT 1: Study Plan Generation
   * LangChain-style template with variable injection
   */
  studyPlan: (user) => {
    const weeksNeeded = user.deadline
      ? Math.max(1, Math.ceil((new Date(user.deadline) - new Date()) / (7*24*60*60*1000)))
      : 4;
    return `<s>[INST] You are StudyForge, an expert AI study planner. Generate a highly personalized study plan.

STUDENT PROFILE:
- Name: ${user.name}
- Learning Goal: ${user.goal}  
- Skill Level: ${user.level}
- Daily Study Hours: ${user.hours} hours
- Duration: ${weeksNeeded} weeks
- Focus Topics: ${user.topics?.join(', ') || 'General'}
- Additional Context: ${user.context || 'None'}

RULES:
1. Create a progressive plan (easy → medium → hard)
2. Include one revision day every 6 study days
3. Include one complete rest day per week
4. Daily tasks must fit within ${user.hours} hours total
5. Each task needs specific title, duration, difficulty, topic, resources

OUTPUT FORMAT — Return ONLY this JSON, no markdown, no explanation:
{
  "title": "Goal-specific plan title",
  "goal": "${user.goal}",
  "totalWeeks": ${weeksNeeded},
  "dailyHours": ${user.hours},
  "weeks": [
    {
      "weekNum": 1,
      "theme": "Foundation Week",
      "weeklyGoal": "Specific measurable goal for week 1",
      "days": [
        {
          "day": "Monday",
          "date": "Day 1",
          "type": "study",
          "tasks": [
            {
              "id": "w1d1t1",
              "title": "Specific task name",
              "description": "Exactly what to do",
              "duration": 60,
              "difficulty": "easy",
              "topic": "Arrays",
              "resources": ["LeetCode", "GeeksforGeeks"]
            }
          ]
        }
      ]
    }
  ]
} [/INST]`;
  },

  /**
   * PROMPT 2: Adaptive Rescheduling
   * Analyzes missed tasks and suggests intelligent reschedule
   */
  adaptPlan: (user, missedTasks, currentStreak) => `<s>[INST] You are StudyForge's adaptive planning engine. A student needs their plan adjusted.

STUDENT: ${user.name} | Goal: ${user.goal} | Level: ${user.level}
CURRENT STREAK: ${currentStreak} days
MISSED TASKS (${missedTasks.length}):
${missedTasks.map(t => `- ${t.title} (${t.difficulty}, ${t.duration}min)`).join('\n')}

ANALYSIS NEEDED:
1. Why might the student be missing tasks? (overload, difficulty, motivation)
2. How to reschedule intelligently?
3. Any difficulty adjustments needed?

Return a JSON array of exactly 3 suggestions:
[
  {
    "suggestion": "Specific actionable advice",
    "action": "reschedule|reduce|motivate|split",
    "priority": "high|medium|low",
    "emoji": "🔄"
  }
] [/INST]`,

  /**
   * PROMPT 3: Motivational Message
   * Context-aware encouragement based on progress
   */
  motivate: (user, stats) => `<s>[INST] Generate a short (2-3 sentences), personalized motivational message for a student.

Student: ${user.name}
Goal: ${user.goal}
Streak: ${stats.streak} days
Completion rate: ${stats.rate}%
Recent performance: ${stats.trend}

Make it: specific to their goal, encouraging, with an emoji, NOT generic.
Return ONLY the message, no quotes. [/INST]`,

  /**
   * PROMPT 4: Chat Response
   * Contextual AI assistant conversation
   */
  chat: (user, history, message, progress) => `<s>[INST] You are StudyForge AI, an intelligent study companion.

STUDENT PROFILE:
- Name: ${user.name}, Goal: ${user.goal}, Level: ${user.level}
- Study Hours/Day: ${user.hours}
- Current Streak: ${progress.streak} days  
- XP Earned: ${progress.xp}
- Completion Rate: ${progress.rate}%

RECENT CONVERSATION:
${history.slice(-4).map(m => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content}`).join('\n')}

STUDENT ASKS: ${message}

Respond helpfully (2-4 sentences), be specific to their goal and progress. Use emojis sparingly. If asked about schedule, reference their actual plan. [/INST]`
};

// ===== LLM CALLER =====
async function callLLM(prompt, maxTokens = 800) {
  if (!HF_KEY) throw new Error('No HF_API_KEY set');

  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true,
        return_full_text: false
      }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HF API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) return data[0].generated_text;
  if (data.generated_text) return data.generated_text;
  throw new Error('Unexpected HF response format');
}

// ===== AGENT METHODS =====

/**
 * Generate study plan using LLM
 */
async function generateStudyPlan(user) {
  const prompt = PROMPTS.studyPlan(user);

  try {
    const raw = await callLLM(prompt, 1000);
    return parsePlanJSON(raw);
  } catch(err) {
    console.warn('LLM plan gen failed, using fallback:', err.message);
    return generateFallbackPlan(user);
  }
}

/**
 * Adapt plan based on missed tasks (rule-based + LLM)
 */
async function adaptStudyPlan(user, missedTasks, currentStreak) {
  // Rule-based pre-analysis
  const rules = applyAdaptationRules(missedTasks, currentStreak);

  let llmSuggestions = [];
  try {
    const prompt = PROMPTS.adaptPlan(user, missedTasks, currentStreak);
    const raw = await callLLM(prompt, 400);
    const match = raw.match(/\[[\s\S]*?\]/);
    if (match) llmSuggestions = JSON.parse(match[0]);
  } catch(e) {
    console.warn('LLM adapt failed:', e.message);
    llmSuggestions = rules;
  }

  return { rules, llmSuggestions, rescheduledTasks: missedTasks.map(t => ({ ...t, status: 'pending', rescheduled: true })) };
}

/**
 * Generate motivational message
 */
async function getMotivationalMessage(user, stats) {
  try {
    const prompt = PROMPTS.motivate(user, stats);
    return await callLLM(prompt, 100);
  } catch(e) {
    return getDefaultMotivation(stats);
  }
}

/**
 * Chat with the agent
 */
async function chatWithAgent(user, history, message, progress) {
  try {
    const prompt = PROMPTS.chat(user, history, message, progress);
    return await callLLM(prompt, 300);
  } catch(e) {
    return generateFallbackChatResponse(message, user, progress);
  }
}

// ===== RULE-BASED LOGIC =====

function applyAdaptationRules(missedTasks, streak) {
  const suggestions = [];
  const missedCount = missedTasks.length;
  const hardMissed = missedTasks.filter(t => t.difficulty === 'hard').length;

  // Rule 1: Many missed tasks → reduce load
  if (missedCount >= 5) {
    suggestions.push({
      suggestion: `You missed ${missedCount} tasks. Temporarily reduce daily tasks by 30% and focus on essentials.`,
      action: 'reduce', priority: 'high', emoji: '⬇️'
    });
  }

  // Rule 2: Hard tasks mostly missed → downgrade difficulty
  if (hardMissed > missedCount * 0.6) {
    suggestions.push({
      suggestion: 'Most missed tasks are "hard". Switching to medium-difficulty tasks for the next 3 days.',
      action: 'reschedule', priority: 'high', emoji: '🔄'
    });
  }

  // Rule 3: Streak broke → motivational nudge
  if (streak === 0) {
    suggestions.push({
      suggestion: 'Your streak broke, but that\'s okay! Start fresh today with just ONE small task.',
      action: 'motivate', priority: 'medium', emoji: '💪'
    });
  }

  // Rule 4: 1-2 missed → simple reschedule
  if (missedCount <= 2) {
    suggestions.push({
      suggestion: `${missedCount} missed task(s) have been moved to tomorrow morning. You've got this!`,
      action: 'reschedule', priority: 'low', emoji: '📅'
    });
  }

  return suggestions.slice(0, 3);
}

// ===== FALLBACK PLAN =====
function generateFallbackPlan(user) {
  const topics = user.topics?.length > 0 ? user.topics : ['Fundamentals', 'Practice', 'Advanced'];
  const weeks = [];

  for (let w = 0; w < 4; w++) {
    const days = [];
    const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

    for (let d = 0; d < 7; d++) {
      const isBreak = d === 6;
      const isRevision = d === 5;
      const topic = topics[(w + d) % topics.length];
      const difficulty = w === 0 ? 'easy' : w === 1 ? 'easy' : w === 2 ? 'medium' : 'hard';
      const halfH = Math.round(user.hours * 0.5 * 60);

      days.push({
        day: dayNames[d], date: `Day ${w*7+d+1}`,
        type: isBreak ? 'break' : isRevision ? 'revision' : 'study',
        tasks: isBreak ? [] : isRevision ? [
          { id: `w${w+1}d${d+1}r1`, title: `Week ${w+1} Revision`, description: 'Review all covered topics', duration: user.hours*60, difficulty: 'easy', topic: 'Revision', resources: ['Your notes', 'LeetCode'] }
        ] : [
          { id: `w${w+1}d${d+1}t1`, title: `${topic} — Theory`, description: `Study ${topic} concepts and patterns`, duration: halfH, difficulty, topic, resources: ['GeeksforGeeks', 'YouTube'] },
          { id: `w${w+1}d${d+1}t2`, title: `${topic} — Problems`, description: `Solve ${2+w} practice problems`, duration: user.hours*60 - halfH, difficulty, topic, resources: ['LeetCode', 'HackerRank'] }
        ]
      });
    }

    weeks.push({ weekNum: w+1, theme: `Week ${w+1}: ${topics[w%topics.length]}`, weeklyGoal: `Master ${topics[w%topics.length]}`, days });
  }

  return { title: `${user.goal} Study Plan`, goal: user.goal, totalWeeks: 4, dailyHours: user.hours, weeks };
}

// ===== HELPERS =====
function parsePlanJSON(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');
  const plan = JSON.parse(match[0]);
  if (!plan.weeks || !Array.isArray(plan.weeks)) throw new Error('Invalid plan structure');
  return plan;
}

function getDefaultMotivation(stats) {
  const msgs = [
    "Every line of code you write is a step closer to mastery. Keep pushing! 💪",
    `${stats.streak > 0 ? `${stats.streak}-day streak!` : 'Fresh start!'} Consistency is your superpower. 🔥`,
    "The best time to start was yesterday. The second best time is NOW. 🚀"
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function generateFallbackChatResponse(msg, user, progress) {
  const lower = msg.toLowerCase();
  if (lower.includes('motivat')) return `You're doing amazing, ${user.name}! 🌟 Remember: ${progress.streak} days of consistency — that's ${progress.streak * user.hours} hours of focused learning. Keep going!`;
  if (lower.includes('reschedule') || lower.includes('modify')) return `To modify your schedule, I can reschedule missed tasks or adjust difficulty. Use the "Adapt" button on the dashboard for instant AI-powered rescheduling!`;
  return `Great question about ${user.goal}! At ${user.level} level, focus on building strong fundamentals before tackling complex problems. Would you like specific resources or a topic explanation?`;
}

module.exports = { generateStudyPlan, adaptStudyPlan, chatWithAgent, getMotivationalMessage, PROMPTS };
