---
name: trace
description: "Trace a specific API route, worker, cron job, webhook, or event flow through the backend and visualize its complete path"
argument-hint: "Flow to trace, e.g. 'POST /api/messages', 'worker rule-sync', 'cron cleanup', 'webhook stripe', 'event user.created'"
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep, Agent
---

# Backend Factory - Trace Flow

Deep-trace a single flow (route, worker, cron job, webhook, poller, or event listener) to show its complete path through the backend.

## Step 1: Parse Arguments

`$ARGUMENTS` should contain a flow to trace. Supported formats:

| Format | Flow Type | Example |
|--------|-----------|---------|
| `METHOD /path` | HTTP route | `POST /api/messages`, `GET /users` |
| `worker <name>` | Queue worker | `worker rule-sync`, `worker email-sender` |
| `cron <name>` | Scheduled job | `cron cleanup`, `cron daily-report` |
| `webhook <service>` | Webhook handler | `webhook stripe`, `webhook github` |
| `poller <name>` | Polling service | `poller blockchain`, `poller exchange-rates` |
| `event <name>` | Event listener | `event user.created`, `event order.completed` |

If `$ARGUMENTS` is empty, list ALL detected flows from the running factory and ask the user to pick one:
```bash
curl -s http://localhost:7777/api/architecture | jq '.actions[] | "\(.type // "route"): \(.name) — \(.description)"'
```

Determine the **flow type** from the arguments:
- If it starts with a known HTTP method (GET, POST, PUT, PATCH, DELETE), it's a `route` trace
- If it starts with `worker`, `cron`, `webhook`, `poller`, or `event`, it's that type of trace
- Otherwise, try to match it against known action names in the running factory

## Step 2: Detect Framework

Quick check — read `package.json` or `requirements.txt` to determine the framework.

## Step 3: Launch Flow Tracer

Launch the **flow-tracer** agent with:
- The flow to trace (from `$ARGUMENTS`)
- **The flow type**: `route`, `worker`, `cron`, `webhook`, `poller`, or `event`
- The framework type
- The project root path

**For route flows** (default):
- The flow-tracer follows imports and function calls from the route handler to build the complete request flow path.

**For worker flows**:
- Find the queue consumer/processor function (e.g., BullMQ `Worker` handler, Celery `@task`)
- Trace from the job dequeue through all processing logic
- The entry point is the queue, not an HTTP entrypoint

**For cron flows**:
- Find the scheduled task function
- Trace from the cron trigger through all operations
- The entry point is a time-based trigger

**For webhook flows**:
- Find the webhook handler route AND its signature verification logic
- Trace the full event processing

**For poller flows**:
- Find the polling loop/interval function
- Trace from the poll trigger through external API call and response processing

**For event flows**:
- Find the event listener/subscriber registration and its handler
- Trace from the event emission through the handler logic

## Step 4: Update Visualization

If the factory server is running, POST an updated action with the traced flow path:

```bash
curl -s http://localhost:7777/api/architecture | jq '.' > /tmp/factory-current.json
# Merge the new traced flow into the actions array
# Ensure the action has the correct type, characterType, and scenario fields
# POST back the enriched data
```

When creating/updating the action, include:
- `type`: the flow type (`route`, `worker`, `cron`, `webhook`, `poller`, `event`)
- `characterType`: the matching character sprite (`RequestWorker`, `QueueWorker`, `CronWorker`, `WebhookWorker`, `PollerWorker`, `EventWorker`)
- `description`: a creative, narrative description
- `context`: a rich paragraph describing the full lifecycle
- `flowDescriptions`: station-by-station narration from the flow-tracer
- `scenario`: best matching scenario ID

## Step 5: Report

Show the user the complete trace:
- Flow type and entry trigger
- For routes: middleware chain (in order)
- Handler function and file
- All data store interactions (DB, cache, queue)
- Any downstream effects (jobs enqueued, events emitted, external API calls)
- The exact flow path through the factory

Suggest: "Click the traced flow button in the factory to watch the character walk through this path."
