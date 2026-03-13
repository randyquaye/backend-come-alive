---
name: analyze
description: "Re-scan the current project's backend architecture and update the running factory visualization"
argument-hint: "Optional: 'deep' for full agent analysis, or path to project"
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep, Write, Agent
---

# Backend Factory - Re-analyze

Re-scan the codebase and push updated architecture data to the running visualization.

## Step 1: Check Server

```bash
curl -s http://localhost:7777/api/status
```

If the server is not running, tell the user to run `/backend-factory:start` first.

## Step 2: Quick Analysis

For a fast re-analysis, run the analysis script directly:

```bash
TMPFILE=$(mktemp /tmp/factory-arch-XXXXXX.json)
node ${CLAUDE_PLUGIN_ROOT}/analysis/analyze.js "${1:-.}" > "$TMPFILE"
curl -s -X POST http://localhost:7777/api/architecture \
  -H "Content-Type: application/json" \
  -d @"$TMPFILE"
rm -f "$TMPFILE"
```

## Step 3: Enrich (even in quick mode)

After the script runs, **read the JSON and enrich it** with context you can glean quickly. Every node and action MUST be enriched — no bare metadata.

### Mandatory per-node fields

For **EVERY** node, these metadata fields are required (no exceptions):
- `metadata.description` — a creative, human-readable description of what this component does.
- `metadata.scenario` — the best matching scenario ID from the catalog (e.g., `auth-verify-token`, `db-select`, `db-insert`, `cache-hit`, `queue-enqueue`, `validate-pass`, `webhook-receive`).

### Type-specific enrichment

1. For each **route** node, read its source file briefly and add a `description` to its metadata explaining what the route does in plain English.
2. For **database** nodes, list the table names you can identify. Add `metadata.stationLabel` — a creative factory-themed name.
3. For **cache** nodes, add `metadata.stationLabel`.
4. For **middleware** nodes, describe what each middleware does AND add `metadata.factoryRole` — a creative factory metaphor.
5. For **queue** nodes, add `metadata.stationLabel`.

### Background flow detection (even in quick mode)

At minimum, do a quick scan for background workers and cron patterns:
- Search for files in `workers/`, `jobs/`, `cron/`, `tasks/`, `processors/` directories
- Look for BullMQ `new Worker(`, node-cron patterns, `@Cron(` decorators, `setInterval` + fetch calls
- Look for webhook handler routes (signature verification patterns like `stripe.webhooks.constructEvent`)
- Look for EventEmitter `.on(` patterns, Redis pub/sub subscribers

For any background flows found, create additional actions with the appropriate type (`worker`, `cron`, `webhook`, `poller`, `event`). See the enrichment guide in `/backend-factory:start` for the full action type schema.

### Action enrichment

6. For **route actions**, add a `context` field with a rich narrative description.
7. For **worker/cron/webhook/poller/event actions**, add `context` describing the full lifecycle.
8. Add `flowDescriptions` to each action — a mapping of stationId to what happens at that station.
9. Add `characterType` to each action: `RequestWorker` for routes, `QueueWorker` for workers, `CronWorker` for cron, `WebhookWorker` for webhooks, `PollerWorker` for pollers, `EventWorker` for events.

POST the enriched JSON back to the server.

## Step 4: Deep Analysis

If `$ARGUMENTS` contains "deep" or "full", launch the full agent pipeline from `/backend-factory:start` Phase 1-4 for comprehensive analysis with all agents.

## Step 5: Report

Tell the user what was detected and that the visualization has been updated. The factory at http://localhost:7777 will auto-refresh via SSE. Mention that they can:
- Hover over any station to see tooltips with file paths, descriptions, and handler names
- Click any character during simulation to see what it's doing and why
- Use keyboard shortcuts: arrow keys to pan, +/- to zoom, 0/Home to reset view, Space to toggle auto-sim
- Use "EXPORT MERMAID" button to copy a Mermaid diagram to clipboard
