# prompt-crawl

Offline Node.js CLI that points a crawler at **your own agent prompt**: splits it into clauses, types each as a decision, scores heuristic risks, and flags simple conflicts.

Inspired by treating prompt text as a decision graph (typed questions + probabilities) rather than opaque prose.

**Research / heuristic only.** No LLM calls. Not a model, not safety advice, not legal advice.

## Why

Agent prompts hide constraints, approval gates, and contradictions in plain language. prompt-crawl surfaces them as:

| Type | Meaning |
|------|---------|
| `instruction` | Do X |
| `constraint` | Must / must-not / limits |
| `claim` | Asserted fact (often unsourced) |
| `ambiguity` | Vague / optional / TBD |
| `approval_gate` | Needs human sign-off |

Scores (0–1, rule-based): `relevance_risk`, `unsourced_risk`, `ambiguity_risk`, `approval_needed`.

## Requirements

- Node.js 20+

## Install / run

```bash
npm test
npm run demo
```

Demo crawls `fixtures/sample-prompt.md` and writes:

- `report/index.html`
- `report/graph.json`

CLI:

```bash
node bin/prompt-crawl.js path/to/prompt.md --html report/index.html --json out.json
node bin/prompt-crawl.js path/to/prompt.md   # JSON on stdout
```

## Library

```js
import { crawlPrompt } from './src/index.js';
const graph = crawlPrompt(markdownText, 'my-prompt.md');
```

## Caveats

- Classification and scores are keyword/pattern heuristics. Expect false positives/negatives.
- Conflict detection is shallow (always/never on shared topics).
- No network in the core path; keep it that way.

## License

MIT
