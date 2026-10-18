import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crawlPrompt, splitClauses, classifyClause } from '../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '../fixtures/sample-prompt.md');
const fixtureText = fs.readFileSync(fixturePath, 'utf8');

describe('splitClauses', () => {
  it('splits fixture into multiple units', () => {
    const units = splitClauses(fixtureText);
    assert.ok(units.length >= 10, `expected >=10 units, got ${units.length}`);
    assert.ok(units.some((u) => /never make network/i.test(u)));
    assert.ok(units.some((u) => /Do not push without approval/i.test(u)));
  });

  it('keeps short headings as units', () => {
    const units = splitClauses('# Title\n\nBody sentence one. Body sentence two.');
    assert.ok(units.includes('Title'));
    assert.ok(units.some((u) => /Body sentence one/.test(u)));
  });
});

describe('classifyClause', () => {
  it('labels approval gates', () => {
    assert.equal(classifyClause('Do not push without approval.'), 'approval_gate');
    assert.equal(classifyClause('Always ask for approval before publishing.'), 'approval_gate');
  });

  it('labels constraints', () => {
    assert.equal(classifyClause('You must never make network calls in the core path.'), 'constraint');
    assert.equal(classifyClause('You must always keep the repository private.'), 'constraint');
  });

  it('labels ambiguities', () => {
    assert.equal(classifyClause('Maybe crawl word-by-word somehow if needed.'), 'ambiguity');
  });

  it('labels claims', () => {
    assert.equal(classifyClause('Research shows this approach is always 100% perfect.'), 'claim');
  });

  it('labels instructions', () => {
    assert.equal(classifyClause('Implement a CLI that splits prompts into clauses.'), 'instruction');
  });
});

describe('crawlPrompt fixture', () => {
  const graph = crawlPrompt(fixtureText, 'fixtures/sample-prompt.md');

  it('produces clauses with scores and ids', () => {
    assert.ok(graph.clauses.length >= 10);
    for (const c of graph.clauses) {
      assert.ok(c.id);
      assert.ok(['instruction', 'constraint', 'claim', 'ambiguity', 'approval_gate'].includes(c.type));
      for (const k of ['relevance_risk', 'unsourced_risk', 'ambiguity_risk', 'approval_needed']) {
        assert.ok(c.scores[k] >= 0 && c.scores[k] <= 1);
      }
      assert.ok(Array.isArray(c.flags));
    }
  });

  it('flags unsourced / ambiguous / approval clauses', () => {
    const texts = Object.fromEntries(graph.clauses.map((c) => [c.text, c]));
    const claimish = graph.clauses.find((c) => /Research shows.*100%/.test(c.text));
    assert.ok(claimish, 'expected research-shows claim clause');
    assert.equal(claimish.type, 'claim');
    assert.ok(claimish.flags.includes('unsourced') || claimish.scores.unsourced_risk >= 0.5);

    const amb = graph.clauses.find((c) => /Maybe crawl/.test(c.text));
    assert.ok(amb);
    assert.equal(amb.type, 'ambiguity');
    assert.ok(amb.flags.includes('ambiguous') || amb.scores.ambiguity_risk >= 0.45);

    const gate = graph.clauses.find((c) => /push without approval/i.test(c.text));
    assert.ok(gate);
    assert.equal(gate.type, 'approval_gate');
    assert.ok(gate.flags.includes('needs_approval') || gate.flags.includes('approval_gate'));
  });

  it('detects network always-vs-never conflict', () => {
    assert.ok(graph.conflicts.length >= 1, `expected conflicts, got ${graph.conflicts.length}`);
    const net = graph.conflicts.find((x) => x.topic === 'network');
    assert.ok(net, `expected network conflict, got ${JSON.stringify(graph.conflicts)}`);
  });

  it('summary counts match', () => {
    assert.equal(graph.summary.clauseCount, graph.clauses.length);
    assert.equal(graph.summary.conflictCount, graph.conflicts.length);
    const flagged = graph.clauses.filter((c) => c.flags.length > 0).length;
    assert.equal(graph.summary.flaggedCount, flagged);
  });
});
