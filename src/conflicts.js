/**
 * @typedef {import('./types.js').Clause} Clause
 * @typedef {import('./types.js').Conflict} Conflict
 */

/** @type {{ topic: string; always: RegExp; never: RegExp }[]} */
const TOPIC_PAIRS = [
  {
    topic: 'network',
    always: /\b(always|must|shall)\b.{0,40}\b(network|online|fetch|api call|http)\b/i,
    never: /\b(never|must not|do not|don't|no)\b.{0,40}\b(network|online|fetch|api|http|paid api)\b/i,
  },
  {
    topic: 'llm',
    always: /\b(always|must|shall)\b.{0,40}\b(llm|openai|anthropic|model call)\b/i,
    never: /\b(never|must not|do not|don't|no)\b.{0,40}\b(llm|openai|anthropic|model call|paid)\b/i,
  },
  {
    topic: 'push',
    always: /\b(always|must|shall)\b.{0,40}\b(push|publish|deploy|merge)\b/i,
    never: /\b(never|must not|do not|don't)\b.{0,40}\b(push|publish|deploy|merge)\b/i,
  },
  {
    topic: 'public',
    always: /\b(always|must|shall)\b.{0,40}\b(public|open[- ]source)\b/i,
    never: /\b(never|must not|do not|don't)\b.{0,40}\b(make (it )?public|open[- ]source)\b/i,
  },
];

/**
 * Detect simple always-vs-never conflicts on shared topics.
 * @param {Clause[]} clauses
 * @returns {Conflict[]}
 */
export function detectConflicts(clauses) {
  /** @type {Conflict[]} */
  const conflicts = [];
  const seen = new Set();

  for (const topic of TOPIC_PAIRS) {
    /** @type {Clause[]} */
    const alwaysHits = [];
    /** @type {Clause[]} */
    const neverHits = [];

    for (const c of clauses) {
      if (topic.always.test(c.text)) alwaysHits.push(c);
      if (topic.never.test(c.text)) neverHits.push(c);
    }

    for (const a of alwaysHits) {
      for (const b of neverHits) {
        if (a.id === b.id) continue;
        const key = [a.id, b.id, topic.topic].sort().join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        conflicts.push({
          aId: a.id,
          bId: b.id,
          topic: topic.topic,
          reason: `Conflicting stance on "${topic.topic}" (always/must vs never/must-not)`,
        });
      }
    }
  }

  // Content-keyword polarity (skip meta / modality words)
  const polarity = extractPolarity(clauses);
  for (const [keyword, groups] of polarity) {
    for (const a of groups.positive) {
      for (const b of groups.negative) {
        if (a.id === b.id) continue;
        // Both approval gates about the same gate word are not conflicts
        if (a.type === 'approval_gate' && b.type === 'approval_gate') continue;
        const key = [a.id, b.id, keyword].sort().join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        conflicts.push({
          aId: a.id,
          bId: b.id,
          topic: keyword,
          reason: `Opposite polarity on keyword "${keyword}"`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * @param {Clause[]} clauses
 * @returns {Map<string, { positive: Clause[]; negative: Clause[] }>}
 */
function extractPolarity(clauses) {
  /** @type {Map<string, { positive: Clause[]; negative: Clause[] }>} */
  const map = new Map();
  const stop = new Set([
    'a', 'an', 'the', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'with', 'be', 'is', 'are',
    'this', 'that', 'it', 'as', 'by', 'from', 'at', 'not', 'do', 'does', 'must', 'shall',
    'always', 'never', 'only', 'you', 'your', 'should', 'will', 'can', 'may', 'without',
    'until', 'before', 'after', 'ask', 'approval', 'permission', 'review', 'sign', 'off',
    'human', 'loop', 'gate', 'money', 'spending', 'publishing',
  ]);

  for (const c of clauses) {
    const lower = c.text.toLowerCase();
    const positive = /\b(always|must|shall)\b/.test(lower) && !/\b(must not|shall not)\b/.test(lower);
    const negative = /\b(never|must not|shall not|do not|don't)\b/.test(lower);
    if (!positive && !negative) continue;

    const words = lower.match(/\b[a-z][a-z-]{2,}\b/g) || [];
    for (const w of words) {
      if (stop.has(w)) continue;
      if (!map.has(w)) map.set(w, { positive: [], negative: [] });
      const g = map.get(w);
      if (positive) g.positive.push(c);
      if (negative) g.negative.push(c);
    }
  }

  for (const [k, g] of map) {
    if (g.positive.length === 0 || g.negative.length === 0) map.delete(k);
  }
  return map;
}
