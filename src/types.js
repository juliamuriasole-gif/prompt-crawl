/**
 * @typedef {'instruction' | 'constraint' | 'claim' | 'ambiguity' | 'approval_gate'} ClauseType
 *
 * @typedef {object} Scores
 * @property {number} relevance_risk  // 0–1
 * @property {number} unsourced_risk  // 0–1
 * @property {number} ambiguity_risk  // 0–1
 * @property {number} approval_needed // 0–1
 *
 * @typedef {object} Clause
 * @property {string} id
 * @property {number} index
 * @property {string} text
 * @property {ClauseType} type
 * @property {Scores} scores
 * @property {string[]} flags
 *
 * @typedef {object} Conflict
 * @property {string} aId
 * @property {string} bId
 * @property {string} topic
 * @property {string} reason
 *
 * @typedef {object} DecisionGraph
 * @property {string} source
 * @property {string} generatedAt
 * @property {Clause[]} clauses
 * @property {Conflict[]} conflicts
 * @property {object} summary
 */

export {};
