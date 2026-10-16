/**
 * @typedef {import('./types.js').ClauseType} ClauseType
 */

/** @type {{ type: ClauseType, patterns: RegExp[], weight: number }[]} */
const RULES = [
  {
    type: 'approval_gate',
    weight: 5,
    patterns: [
      /\b(ask|seek|require|await|get|need)\b.{0,40}\b(approval|permission|sign[- ]?off|review|confirm)\b/i,
      /\b(do not|don't|never)\b.{0,30}\b(without|until)\b.{0,30}\b(approval|permission|review)\b/i,
      /\bhuman[- ]in[- ]the[- ]loop\b/i,
      /\b(escalate|gate|checkpoint)\b/i,
      /\bmust be (approved|reviewed|confirmed)\b/i,
    ],
  },
  {
    type: 'claim',
    weight: 4.5,
    patterns: [
      /\b(research shows|studies show|it is known|everyone knows|experts say)\b/i,
      /\b(is|are|was|were)\b.{0,40}\b(always|never)\b.{0,20}\b(100%|perfect|guaranteed|true|false)\b/i,
      /\b(always works|never fails|100%|perfect)\b/i,
      /\b(proven|guaranteed|obviously|clearly)\b/i,
      /\b(fact|assert|claim|believe|assume)\b/i,
    ],
  },
  {
    type: 'constraint',
    weight: 4,
    patterns: [
      /\b(must not|shall not|never|forbidden|prohibited|mandatory)\b/i,
      /\b(must|shall|always|only|required)\b/i,
      /\b(do not|don't|cannot|can't|no longer)\b/i,
      /\b(limit|maximum|minimum|at most|at least|within)\b/i,
      /\boffline\b|\bno (network|api|llm|paid)\b/i,
      /\bkeep (private|secret)\b/i,
    ],
  },
  {
    type: 'ambiguity',
    weight: 3,
    patterns: [
      /\b(maybe|perhaps|somehow|approximately|around|roughly|etc\.?|and\/or)\b/i,
      /\b(as appropriate|if needed|when possible|where relevant|as necessary)\b/i,
      /\b(unclear|ambiguous|vague|tbd|todo|to be determined)\b/i,
      /\b(something like|kind of|sort of|whatever)\b/i,
      /\?\s*$/,
    ],
  },
  {
    type: 'instruction',
    weight: 1,
    patterns: [
      /\b(you (should|must|will|shall)|please|ensure|make sure|implement|create|write|run|use|treat|split|classify|detect|output)\b/i,
      /^(do|run|build|add|set|generate|produce|crawl)\b/i,
    ],
  },
];

/**
 * @param {string} text
 * @returns {ClauseType}
 */
export function classifyClause(text) {
  let best = /** @type {ClauseType} */ ('instruction');
  let bestScore = 0;

  for (const rule of RULES) {
    let hits = 0;
    for (const re of rule.patterns) {
      if (re.test(text)) hits += 1;
    }
    const score = hits * rule.weight;
    if (score > bestScore) {
      bestScore = score;
      best = rule.type;
    }
  }

  // Prefer claim over constraint when epistemic / absolute-quality markers dominate.
  if (
    best === 'constraint' &&
    /\b(research shows|studies show|it is known|everyone knows|100%|perfect|never fails)\b/i.test(text)
  ) {
    return 'claim';
  }

  return best;
}
