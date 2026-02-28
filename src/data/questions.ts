export interface Question {
  id: string;
  category: string;
  intensity: 'gentle' | 'moderate' | 'deep';
  text: string;
}

export const HIGH_FRICTION_QUESTIONS: Question[] = [
  // ── Manage Conflict ──
  {
    id: 'q1',
    category: 'Manage Conflict',
    intensity: 'deep',
    text: 'When we are stressed, I feel like you pull away. What do you feel like I do?',
  },
  {
    id: 'q2',
    category: 'Manage Conflict',
    intensity: 'moderate',
    text: 'What is a recurring argument we have that you think is really about something deeper?',
  },
  {
    id: 'q3',
    category: 'Manage Conflict',
    intensity: 'deep',
    text: 'When I get defensive, what do you think I\'m actually afraid of?',
  },

  // ── Create Shared Meaning ──
  {
    id: 'q4',
    category: 'Create Shared Meaning',
    intensity: 'moderate',
    text: 'What is a personal dream you feel you\'ve put on hold for the sake of "us"?',
  },
  {
    id: 'q5',
    category: 'Create Shared Meaning',
    intensity: 'deep',
    text: 'What ritual or tradition do you wish we had as a couple that would make our life feel more meaningful?',
  },
  {
    id: 'q6',
    category: 'Create Shared Meaning',
    intensity: 'gentle',
    text: 'What does "home" mean to you, and do you feel it when you\'re with me?',
  },

  // ── Build Love Maps ──
  {
    id: 'q7',
    category: 'Build Love Maps',
    intensity: 'moderate',
    text: 'In what specific area of your life do you feel I intrude too much, and where do you wish I was more involved?',
  },
  {
    id: 'q8',
    category: 'Build Love Maps',
    intensity: 'gentle',
    text: 'What is something about your inner world right now that you think I don\'t know about?',
  },
  {
    id: 'q9',
    category: 'Build Love Maps',
    intensity: 'deep',
    text: 'What worry keeps you up at night that you haven\'t fully shared with me?',
  },

  // ── Share Fondness & Admiration ──
  {
    id: 'q10',
    category: 'Share Fondness & Admiration',
    intensity: 'moderate',
    text: 'Describe a time recently when my need for independence made you feel unloved or rejected.',
  },
  {
    id: 'q11',
    category: 'Share Fondness & Admiration',
    intensity: 'gentle',
    text: 'What quality of mine drew you in at first that you sometimes struggle to appreciate now?',
  },
  {
    id: 'q12',
    category: 'Share Fondness & Admiration',
    intensity: 'moderate',
    text: 'When was the last time you felt genuinely proud of me, and did I know it?',
  },

  // ── Make Life Dreams Come True ──
  {
    id: 'q13',
    category: 'Make Life Dreams Come True',
    intensity: 'deep',
    text: 'If you had a completely free weekend with no obligations to me or anyone else, what would you do, and why don\'t you do it now?',
  },
  {
    id: 'q14',
    category: 'Make Life Dreams Come True',
    intensity: 'moderate',
    text: 'What is one thing you need from me to feel truly supported in pursuing your goals?',
  },
  {
    id: 'q15',
    category: 'Make Life Dreams Come True',
    intensity: 'deep',
    text: 'Is there a version of yourself from before we met that you miss? What happened to them?',
  },

  // ── Turn Towards ──
  {
    id: 'q16',
    category: 'Turn Towards',
    intensity: 'gentle',
    text: 'What is a small daily gesture from me that makes you feel the most loved?',
  },
  {
    id: 'q17',
    category: 'Turn Towards',
    intensity: 'moderate',
    text: 'When you reach out to me and I don\'t respond the way you need, what do you wish I\'d do instead?',
  },
  {
    id: 'q18',
    category: 'Turn Towards',
    intensity: 'gentle',
    text: 'What does a perfect ordinary Tuesday evening together look like in your mind?',
  },

  // ── Trust & Commitment ──
  {
    id: 'q19',
    category: 'Trust & Commitment',
    intensity: 'deep',
    text: 'What is the one thing that, if it changed, would make you feel more emotionally safe with me?',
  },
  {
    id: 'q20',
    category: 'Trust & Commitment',
    intensity: 'deep',
    text: 'What promise have I made — or you wish I\'d make — that would change how secure you feel about us?',
  },
];

/**
 * Get a random question that hasn't been used in recent rounds.
 */
export function getRandomQuestion(usedIds: string[] = []): Question {
  const available = HIGH_FRICTION_QUESTIONS.filter(q => !usedIds.includes(q.id));
  const pool = available.length > 0 ? available : HIGH_FRICTION_QUESTIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}
