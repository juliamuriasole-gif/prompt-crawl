import { splitClauses } from './split.js';
import { classifyClause } from './classify.js';
import { scoreClause, deriveFlags } from './score.js';
import { detectConflicts } from './conflicts.js';

/**
 * @typedef {import('./types.js').Clause} Clause
 * @typedef {import('./types.js').DecisionGraph} DecisionGraph
 */

/**
 * Crawl a prompt text into a decision graph.
 * @param {string} text
 * @param {string} [source='stdin']
 * @returns {DecisionGraph}
 */
export function crawlPrompt(text, source = 'stdin') {
  const units = splitClauses(text);

  /** @type {Clause[]} */
  const clauses = units.map((unit, index) => {
    const type = classifyClause(unit);
    const scores = scoreClause(unit, type);
    const flags = deriveFlags(scores, type);
    return {
      id: `c${index + 1}`,
      index,
      text: unit,
      type,
      scores,
      flags,
    };
  });

  const conflicts = detectConflicts(clauses);

  const typeCounts = /** @type {Record<string, number>} */ ({});
  for (const c of clauses) {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  }

  const flagged = clauses.filter((c) => c.flags.length > 0).length;

  return {
    source,
    generatedAt: new Date().toISOString(),
    clauses,
    conflicts,
    summary: {
      clauseCount: clauses.length,
      conflictCount: conflicts.length,
      flaggedCount: flagged,
      typeCounts,
    },
  };
}
