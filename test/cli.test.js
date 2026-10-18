import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('CLI prints JSON graph to stdout', () => {
  const out = execFileSync('node', ['bin/prompt-crawl.js', 'fixtures/sample-prompt.md'], { encoding: 'utf8' });
  const g = JSON.parse(out);
  assert.ok(g && typeof g === 'object');
});

test('CLI writes --html and --json files', () => {
  const d = mkdtempSync(join(tmpdir(), 'pc-'));
  execFileSync('node', ['bin/prompt-crawl.js', 'fixtures/sample-prompt.md', '--html', join(d, 'r.html'), '--json', join(d, 'g.json')]);
  assert.ok(existsSync(join(d, 'r.html')));
  JSON.parse(readFileSync(join(d, 'g.json'), 'utf8'));
});
