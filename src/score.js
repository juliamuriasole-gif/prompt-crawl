/**
 * @typedef {import('./types.js').ClauseType} ClauseType
 * @typedef {import('./types.js').Scores} Scores
 */

const RELEVANCE_PATTERNS = [
  /\b(ignore|disregard|override)\b.{0,30}\b(previous|above|system|safety)\b/i,
  /\b(unrelated|off[- ]topic|side quest)\b/i,
  /\b(jailbreak|prompt injection)\b/i,
];

const UNSOURCED_PATTERNS = [
  /\b(research shows|studies show|experts say|it is known|proven|guaranteed)\b/i,
  /\b(always|never|everyone|nobody|100%)\b/i,
  /\b(fact|assert|claim)\b/i,
];

const AMBIGUITY_PATTERNS = [
  /\b(maybe|perhaps|somehow|approximately|around|roughly|etc\.?|and\/or)\b/i,
  /\b(as appropriate|if needed|when possible|where relevant|as necessary)\b/i,
  /\b(unclear|ambiguous|vague|tbd|todo)\b/i,
  /\b(something like|kind of|sort of|whatever)\b/i,
  /\?\s*$/,
];

const APPROVAL_PATTERNS = [
  /\b(approval|permission|sign[- ]?off|human[- ]in[- ]the[- ]loop|escalate)\b/i,
  /\b(do not|don't|never)\b.{0,30}\b(without|until)\b.{0,30}\b(approval|permission|review)\b/i,
  /\b(push|publish|deploy|merge|spend|purchase|send)\b/i,
  /\b(delete|share|public)\b/i,
];

/**
 * @param {string} text
 * @param {ClauseType} type
 * @returns {Scores}
 */
export function scoreClause(text, type) {
  const relevance_risk = clamp(hitRatio(text, RELEVANCE_PATTERNS) + (type === 'instruction' ? 0.05 : 0));
  const unsourced_risk = clamp(
    hitRatio(text, UNSOURCED_PATTERNS) + (type === 'claim' ? 0.35 : 0) + (/\b(http|doi|cite|source|according to)\b/i.test(text) ? -0.3 : 0.1),
  );
  const ambiguity_risk = clamp(
    hitRatio(text, AMBIGUITY_PATTERNS) + (type === 'ambiguity' ? 0.4 : 0) + (text.length < 20 ? 0.15 : 0),
  );
  const approval_needed = clamp(
    hitRatio(text, APPROVAL_PATTERNS) + (type === 'approval_gate' ? 0.5 : 0) + (/\b(must not|never|forbidden)\b/i.test(text) && /\b(push|public|send|spend)\b/i.test(text) ? 0.25 : 0),
  );

  return {
    relevance_risk: round2(relevance_risk),
    unsourced_risk: round2(unsourced_risk),
    ambiguity_risk: round2(ambiguity_risk),
    approval_needed: round2(approval_needed),
  };
}

/**
 * @param {string} text
 * @param {RegExp[]} patterns
 */
function hitRatio(text, patterns) {
  if (patterns.length === 0) return 0;
  let hits = 0;
  for (const re of patterns) {
    if (re.test(text)) hits += 1;
  }
  return hits / patterns.length;
}

/** @param {number} n */
function clamp(n) {
  return Math.max(0, Math.min(1, n));
}

/** @param {number} n */
function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @param {import('./types.js').Scores} scores
 * @param {ClauseType} type
 * @returns {string[]}
 */
export function deriveFlags(scores, type) {
  /** @type {string[]} */
  const flags = [];
  if (scores.relevance_risk >= 0.4) flags.push('high_relevance_risk');
  if (scores.unsourced_risk >= 0.5) flags.push('unsourced');
  if (scores.ambiguity_risk >= 0.45) flags.push('ambiguous');
  if (scores.approval_needed >= 0.45) flags.push('needs_approval');
  if (type === 'approval_gate') flags.push('approval_gate');
  if (type === 'constraint') flags.push('hard_constraint');
  return flags;
}
