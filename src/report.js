import fs from 'node:fs';
import path from 'node:path';

/**
 * @typedef {import('./types.js').DecisionGraph} DecisionGraph
 */

/**
 * @param {DecisionGraph} graph
 * @returns {string}
 */
export function renderHtml(graph) {
  const rows = graph.clauses
    .map((c) => {
      const flags = c.flags.length
        ? c.flags.map((f) => `<span class="flag">${esc(f)}</span>`).join(' ')
        : '<span class="muted">—</span>';
      return `<tr>
  <td class="id">${esc(c.id)}</td>
  <td class="type type-${esc(c.type)}">${esc(c.type)}</td>
  <td class="text">${esc(c.text)}</td>
  <td class="score">${pct(c.scores.relevance_risk)}</td>
  <td class="score">${pct(c.scores.unsourced_risk)}</td>
  <td class="score">${pct(c.scores.ambiguity_risk)}</td>
  <td class="score">${pct(c.scores.approval_needed)}</td>
  <td class="flags">${flags}</td>
</tr>`;
    })
    .join('\n');

  const conflictRows =
    graph.conflicts.length === 0
      ? '<tr><td colspan="4" class="muted">No conflicts detected</td></tr>'
      : graph.conflicts
          .map(
            (x) => `<tr>
  <td>${esc(x.aId)}</td>
  <td>${esc(x.bId)}</td>
  <td>${esc(x.topic)}</td>
  <td>${esc(x.reason)}</td>
</tr>`,
          )
          .join('\n');

  const typeList = Object.entries(graph.summary.typeCounts || {})
    .map(([k, v]) => `<li><strong>${esc(k)}</strong>: ${v}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>prompt-crawl report</title>
<style>
  :root { --bg:#0f1419; --card:#1a2332; --text:#e7ecf3; --muted:#8b9bb4; --accent:#5b9cff;
    --instruction:#5b9cff; --constraint:#f0a060; --claim:#c090ff; --ambiguity:#e0d060; --approval_gate:#ff6b8a; }
  * { box-sizing: border-box; }
  body { margin:0; font:14px/1.5 ui-sans-serif,system-ui,sans-serif; background:var(--bg); color:var(--text); }
  main { max-width:1100px; margin:0 auto; padding:2rem 1.25rem 4rem; }
  h1 { font-size:1.5rem; margin:0 0 .25rem; }
  h2 { font-size:1.1rem; margin:2rem 0 .75rem; color:var(--accent); }
  .meta { color:var(--muted); margin-bottom:1.5rem; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:.75rem; margin:1rem 0 1.5rem; }
  .card { background:var(--card); border-radius:8px; padding:1rem; }
  .card .n { font-size:1.6rem; font-weight:700; }
  .card .l { color:var(--muted); font-size:.8rem; }
  table { width:100%; border-collapse:collapse; background:var(--card); border-radius:8px; overflow:hidden; }
  th, td { text-align:left; padding:.55rem .7rem; border-bottom:1px solid #243044; vertical-align:top; }
  th { color:var(--muted); font-weight:600; font-size:.75rem; text-transform:uppercase; letter-spacing:.03em; }
  tr:last-child td { border-bottom:none; }
  .id { font-family:ui-monospace,monospace; color:var(--muted); white-space:nowrap; }
  .type { font-family:ui-monospace,monospace; font-size:.8rem; white-space:nowrap; }
  .type-instruction { color:var(--instruction); }
  .type-constraint { color:var(--constraint); }
  .type-claim { color:var(--claim); }
  .type-ambiguity { color:var(--ambiguity); }
  .type-approval_gate { color:var(--approval_gate); }
  .score { font-family:ui-monospace,monospace; white-space:nowrap; }
  .flag { display:inline-block; background:#2a3548; color:#c8d4e8; border-radius:4px; padding:.1rem .4rem; margin:.1rem; font-size:.75rem; }
  .muted { color:var(--muted); }
  ul.types { margin:.25rem 0 0; padding-left:1.2rem; color:var(--muted); }
  footer { margin-top:2rem; color:var(--muted); font-size:.8rem; }
</style>
</head>
<body>
<main>
  <h1>prompt-crawl</h1>
  <p class="meta">Source: <code>${esc(graph.source)}</code> · Generated ${esc(graph.generatedAt)} · Heuristic only (not a model)</p>

  <div class="cards">
    <div class="card"><div class="n">${graph.summary.clauseCount}</div><div class="l">clauses</div></div>
    <div class="card"><div class="n">${graph.summary.flaggedCount}</div><div class="l">flagged</div></div>
    <div class="card"><div class="n">${graph.summary.conflictCount}</div><div class="l">conflicts</div></div>
  </div>

  <h2>Type mix</h2>
  <ul class="types">${typeList}</ul>

  <h2>Clauses</h2>
  <table>
    <thead>
      <tr>
        <th>ID</th><th>Type</th><th>Text</th>
        <th>Rel</th><th>Unsrc</th><th>Ambig</th><th>Appr</th><th>Flags</th>
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>

  <h2>Conflicts</h2>
  <table>
    <thead><tr><th>A</th><th>B</th><th>Topic</th><th>Reason</th></tr></thead>
    <tbody>
${conflictRows}
    </tbody>
  </table>

  <footer>Scores are rule-based heuristics (0–1). Research tool only — not legal, safety, or model advice.</footer>
</main>
</body>
</html>`;
}

/**
 * @param {DecisionGraph} graph
 * @param {string} outPath
 */
export function writeHtmlReport(graph, outPath) {
  const abs = path.resolve(outPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, renderHtml(graph), 'utf8');
  return abs;
}

/** @param {number} n */
function pct(n) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/** @param {string} s */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
