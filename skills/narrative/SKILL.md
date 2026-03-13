---
name: narrative
description: "Generate a creative multi-chapter narrative report of the factory's architecture"
argument-hint: "Optional: 'onboarding' for new dev guide, 'executive' for high-level summary, 'incident' for resilience analysis"
disable-model-invocation: true
context: fork
allowed-tools: Bash, Read, Glob, Grep, Agent
---

# Backend Factory - Narrative Report

Generate a rich, multi-chapter narrative report of the backend architecture, told from the perspective of factory workers at each station.

## Step 1: Parse Arguments

`$ARGUMENTS` determines the narrative mode:

| Argument | Mode | Tone & Focus |
|----------|------|--------------|
| `onboarding` | New Worker Welcome Guide | Friendly, detailed, explains everything for a newcomer |
| `executive` | Factory Inspector's Report | Metrics-focused, efficiency ratings, capacity concerns |
| `incident` | Resilience & Incident Review | What could go wrong, single points of failure, blast radius |
| *(empty)* | Full Creative Narrative | Complete storytelling tour of the entire factory |

## Step 2: Get Architecture from Server

```bash
curl -s http://localhost:7777/api/architecture > /tmp/factory-narrative-arch.json
```

If the server is not running, inform the user to run `/backend-factory:start` first.

## Step 3: Read Key Source Files

Using the architecture JSON, identify and read the most important source files (up to 10) to gather real details for the narrative.

## Step 4: Generate Narrative

Build a multi-chapter narrative report. Each chapter is narrated in first person by a different factory worker:

1. **The Factory Overview** (Factory Manager)
2. **The Front Gate** (Gate Guard) — auth, rate limiting, CORS
3. **The Production Floor** (Floor Supervisor) — routes and handlers
4. **The Warehouse** (Warehouse Keeper) — database
5. **The Speed Depot** (Cache Operator) — caching
6. **The Conveyor Belt System** (Conveyor Mechanic) — queues
7. **The Night Shift** (Night Shift Supervisor) — cron jobs
8. **The Mail Room** (Mail Room Clerk) — webhooks, pollers, events
9. **The Security Checkpoint** (Security Chief) — auth architecture
10. **The Emergency Plan** (Safety Officer) — error handling, resilience

### Mode-Specific Adjustments

- **Onboarding**: Warm intro, concepts explained, "Where to Find Things" callouts, "First Day Checklist"
- **Executive**: Lead with metrics, efficiency ratings (1-5 gears), "Factory Health Score"
- **Incident**: "What happens when THIS breaks?", resilience ratings, "Top 5 Risks"
- **Default**: Full creative storytelling

## Step 5: Output as Markdown

Format as a well-structured markdown document with table of contents and chapter headings.

## Step 6: Report

Summarize which mode was used, key highlights, and notable findings.

Suggest: "Run `/backend-factory:narrative incident` to see failure analysis." or "Run `/backend-factory:focus <component>` to deep-dive into any station."
