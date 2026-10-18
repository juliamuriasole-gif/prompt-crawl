#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { crawlPrompt } from '../src/crawl.js';
import { writeHtmlReport } from '../src/report.js';

function usage() {
  console.error(`Usage: prompt-crawl <file.md> [--json out.json] [--html report/index.html]

Crawl a prompt/spec file into a typed decision graph (offline heuristics).

Options:
  --json <path>   Write decision graph JSON (default: stdout if no --html-only intent)
  --html <path>   Write HTML report
  --help          Show this help
`);
}

function parseArgs(argv) {
  const args = { file: null, json: null, html: null };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--help' || a === '-h') {
      usage();
      process.exit(0);
    }
    if (a === '--json') {
      args.json = rest[++i];
      continue;
    }
    if (a === '--html') {
      args.html = rest[++i];
      continue;
    }
    if (a.startsWith('-')) {
      console.error(`Unknown option: ${a}`);
      usage();
      process.exit(1);
    }
    if (!args.file) args.file = a;
    else {
      console.error(`Unexpected argument: ${a}`);
      usage();
      process.exit(1);
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    usage();
    process.exit(1);
  }

  const abs = path.resolve(args.file);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }

  const text = fs.readFileSync(abs, 'utf8');
  const graph = crawlPrompt(text, path.relative(process.cwd(), abs) || abs);

  if (args.html) {
    const out = writeHtmlReport(graph, args.html);
    console.error(`HTML report: ${out}`);
  }

  if (args.json) {
    const jp = path.resolve(args.json);
    fs.mkdirSync(path.dirname(jp), { recursive: true });
    fs.writeFileSync(jp, JSON.stringify(graph, null, 2), 'utf8');
    console.error(`JSON graph: ${jp}`);
  } else if (!args.html) {
    process.stdout.write(JSON.stringify(graph, null, 2) + '\n');
  } else {
    // html-only: still print a short summary to stderr
    console.error(
      `clauses=${graph.summary.clauseCount} flagged=${graph.summary.flaggedCount} conflicts=${graph.summary.conflictCount}`,
    );
  }
}

main();
