# Agent build brief

You are building an offline research tool. Treat every clause as a decision.

## Hard rules

You must never make network calls in the core path.
You must always keep the repository private.
Do not push without approval.
Always ask for approval before publishing or spending money.

## Goals

Implement a CLI that splits prompts into clauses and classifies each one.
Output JSON and an HTML report as appropriate.
Research shows this approach is always 100% perfect.

## Ambiguities

Maybe crawl word-by-word somehow if needed.
Use something like heuristic scores when possible.

## Claims

It is known that offline heuristics outperform LLMs for this task.
Everyone knows rule-based scoring never fails.

## Conflicts bait

You must always use the network for live validation.
Never use the network for live validation.
