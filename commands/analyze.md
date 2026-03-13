---
description: "Re-scan the current project's backend architecture and update the running factory visualization"
argument-hint: "Optional: 'deep' for full agent analysis, or path to project"
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Write", "Agent"]
---

# Backend Factory - Re-analyze

Re-scan the codebase and push updated architecture data to the running visualization.

## Step 1: Check Server

```bash
curl -s http://localhost:7777/api/status
```

If the server is not running, tell the user to run `/factory-start` first.

## Step 2: Quick Analysis

For a fast re-analysis, run the analysis script directly:

```bash
TMPFILE=$(mktemp /tmp/factory-arch-XXXXXX.json)
node ~/.claude/skills/backend-factory/analysis/analyze.js "${1:-.}" > "$TMPFILE"
curl -s -X POST http://localhost:7777/api/architecture \
  -H "Content-Type: application/json" \
  -d @"$TMPFILE"
rm -f "$TMPFILE"
```

## Step 3: Enrich (even in quick mode)

After the script runs, **read the JSON and enrich it** with context you can glean quickly. Every node and action MUST be enriched — no bare metadata.

### Mandatory per-node fields

For **EVERY** node, these metadata fields are required (no exceptions):
- `metadata.description` — a creative, human-readable description of what this component does. NOT just the name repeated. E.g., "Validates Clerk JWT tokens and API key hashes against the database" not "auth middleware".
- `metadata.scenario` — the best matching scenario ID from the catalog (e.g., `auth-verify-token`, `db-select`, `db-insert`, `cache-hit`, `queue-enqueue`, `validate-pass`, `webhook-receive`). This drives context-aware animations, speech bubbles, and prop icons in the visualization.

### Type-specific enrichment

1. For each **route** node, read its source file briefly and add a `description` to its metadata explaining what the route does in plain English. Don't just say "POST /detections" — say "Create Detection Rule — sets up blockchain monitoring for a contract address".
2. For **database** nodes, list the table names you can identify. Add `metadata.stationLabel` — a creative factory-themed name like "Detection Warehouse" or "User Registry" instead of just "PostgreSQL".
3. For **cache** nodes, add `metadata.stationLabel` — e.g., "Speed Depot" or "Hot Data Shelf".
4. For **middleware** nodes, describe what each middleware does AND add `metadata.factoryRole` — a creative factory metaphor. E.g., "Security Checkpoint — the badge scanner at the factory gate that verifies every visitor's identity before letting them onto the production floor".
5. For **queue** nodes, add `metadata.stationLabel` — e.g., "Task Conveyor Belt".

### Background flow detection (even in quick mode)

At minimum, do a quick scan for background workers and cron patterns:
- Search for files in `workers/`, `jobs/`, `cron/`, `tasks/`, `processors/` directories
- Look for BullMQ `new Worker(`, node-cron patterns, `@Cron(` decorators, `setInterval` + fetch calls
- Look for webhook handler routes (signature verification patterns like `stripe.webhooks.constructEvent`)
- Look for EventEmitter `.on(` patterns, Redis pub/sub subscribers

For any background flows found, create additional actions with the appropriate type (`worker`, `cron`, `webhook`, `poller`, `event`) — not just route actions. See `/factory-start` Phase 3 for the full action type schema.

### Action enrichment

6. For **route actions**, add a `context` field with a rich narrative description of the user action (e.g., "A user creates a blockchain event detection. The request is authenticated, rate-limited, validated, then the handler resolves the contract ABI, creates detection + rules rows, and enqueues a rule-sync job.")
7. For **worker/cron/webhook/poller/event actions**, add `context` describing the full lifecycle of the background flow.
8. Add `flowDescriptions` to each action — a mapping of stationId to what happens at that station for this specific flow.
9. Add `characterType` to each action: `RequestWorker` for routes, `QueueWorker` for workers, `CronWorker` for cron, `WebhookWorker` for webhooks, `PollerWorker` for pollers, `EventWorker` for events.

POST the enriched JSON back to the server.

## Step 4: Deep Analysis

If `$ARGUMENTS` contains "deep" or "full", launch the full agent pipeline from `/factory-start` Phase 1-4 for comprehensive analysis with all agents (including the background-flow-detector for workers, cron jobs, pollers, webhooks, and event listeners).

## Step 5: Report

Tell the user what was detected and that the visualization has been updated. The factory at http://localhost:7777 will auto-refresh via SSE (with automatic reconnection if the connection drops). Mention that they can:
- Hover over any station to see tooltips with file paths, descriptions, and handler names
- Click any character during simulation to see what it's doing and why
- The info panel at the bottom shows contextual details
- Use keyboard shortcuts: arrow keys to pan, +/- to zoom, 0/Home to reset view, Space to toggle auto-sim
- Use "EXPORT MERMAID" button to copy a Mermaid diagram to clipboard
