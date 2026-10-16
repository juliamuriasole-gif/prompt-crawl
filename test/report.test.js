import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { crawlPrompt, renderHtml, writeHtmlReport } from '../src/index.js';

describe('HTML report', () => {
  it('renders clause text and types', () => {
    const graph = crawlPrompt('You must never call the API.\n\nMaybe do something if needed.');
    const html = renderHtml(graph);
    assert.match(html, /must never call the API/);
    assert.match(html, /constraint|ambiguity|instruction/);
    assert.match(html, /Heuristic only/);
  });

  it('writes file under report path', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prompt-crawl-'));
    const out = path.join(dir, 'report', 'index.html');
    const graph = crawlPrompt('Do not push without approval.');
    writeHtmlReport(graph, out);
    assert.ok(fs.existsSync(out));
    const body = fs.readFileSync(out, 'utf8');
    assert.match(body, /approval/);
  });
});
