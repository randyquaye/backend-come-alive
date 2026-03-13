---
description: "Analyze the current backend project and launch the pixel factory visualizer at localhost:7777"
argument-hint: "Optional: path to backend project"
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Write", "Agent"]
---

# Backend Factory - Start

Full architecture analysis and visualization launch. Uses specialized agents for deep detection.

## Phase 1: Framework Detection

Launch the **framework-detective** agent to identify the backend framework, entry points, and project structure.

Pass it the project path: If `$ARGUMENTS` is provided, use that as the project path. Otherwise use the current working directory.

Wait for the framework-detective to return its report.

## Phase 2: Deep Analysis (Parallel)

Based on the framework-detective's findings, launch these agents **in parallel**:

1. **dependency-mapper** agent — trace actual import/require relationships between source files
2. **schema-explorer** agent — find all database models, schemas, and relationships
3. **middleware-orderer** agent — determine exact middleware execution order
4. **background-flow-detector** agent — find ALL non-route execution flows in the codebase:
   - **Queue consumers / job processors**: Look for BullMQ workers, SQS consumers, RabbitMQ consumers, Celery tasks, Sidekiq workers, etc. Search for patterns like `new Worker(`, `@task`, `process(`, `consumer.subscribe(`, `Queue.process(`
   - **Cron / scheduled jobs**: Look for node-cron, agenda, crontab expressions, `@Cron(`, `schedule.every(`, setInterval-based pollers, or any file in a `jobs/`, `cron/`, `tasks/`, `workers/` directory
   - **Webhook receivers**: Routes that handle incoming webhooks from external services (Stripe, GitHub, Twilio, etc.). Look for signature verification, event type switching, idempotency checks
   - **Pollers**: Services that periodically call external APIs. Look for polling loops, setInterval + fetch/axios, blockchain RPC calls, exchange API polling
   - **Event listeners / pub-sub handlers**: Look for EventEmitter `.on(`, Redis pub/sub subscribers, Kafka consumers, NATS subscribers, `@OnEvent(`, `@EventPattern(`

Tell each agent:
- The framework type and language detected in Phase 1
- The project root path
- The entry point file(s) discovered

**IMPORTANT**: Instruct every agent to return **rich contextual metadata** for each component they find:
- **File paths** (relative to project root)
- **Function/handler names** that handle the logic
- **Human-readable descriptions** of what each component does (e.g., "Validates Clerk JWT tokens and API keys", not just "auth middleware")
- **Service/module names** as the developers named them
- **Database table names** for DB operations
- **Queue names** for queue operations
- **Rate limit configs** (requests per window)
- **Job/task names** for background workers
- **Cron expressions** for scheduled tasks (e.g., "0 3 * * *" = "Daily at 3 AM")
- **Event names** for event listeners (e.g., "user.created", "order.completed")
- **External service names** for webhook receivers and pollers (e.g., "Stripe", "Ethereum RPC")
- **Polling intervals** for pollers (e.g., "every 15 seconds")

Wait for all four agents to complete.

## Phase 3: Build Architecture Model

Run the analysis script to get the base model:

```bash
TMPFILE=$(mktemp /tmp/factory-arch-XXXXXX.json)
node ~/.claude/skills/backend-factory/analysis/analyze.js "${PROJECT_PATH:-.}" > "$TMPFILE"
```

Then **enrich** the model with agent findings. This is the critical step — the visualization depends on rich metadata in each node and action:

### Node Enrichment

**CRITICAL**: Every single node in the architecture JSON MUST have these metadata fields. No exceptions:
- `metadata.description` — a creative, human-readable description. NOT optional. Agents MUST provide this for every node.
- `metadata.scenario` — the best matching scenario ID from the catalog. Drives animations, speech bubbles, and prop icons.

For every node in the architecture JSON, add/update these metadata fields from agent data:

```json
{
  "id": "route-post--detections",
  "name": "POST /detections",
  "type": "route",
  "metadata": {
    "filePath": "apps/api/src/routes/detections.ts",
    "handler": "createDetection",
    "description": "Creates a new blockchain event detection rule for an organization",
    "service": "Detection Engine",
    "method": "POST",
    "path": "/detections",
    "middlewareChain": ["logger", "cors", "authMiddleware", "rateLimit(120/min)", "validate"],
    "dbTables": ["detections", "rules", "contracts"],
    "queueName": "rule-sync",
    "scenario": "db-insert"
  }
}
```

For database nodes — include `stationLabel`, a creative factory-themed name:
```json
{
  "id": "db-drizzle",
  "name": "PostgreSQL",
  "type": "database",
  "metadata": {
    "orm": "Drizzle",
    "tables": ["users", "organizations", "detections", "rules", "events", "alerts"],
    "tableCount": 20,
    "description": "Main PostgreSQL database via Drizzle ORM — the permanent record warehouse where all detection rules, user accounts, and alert histories are stored",
    "stationLabel": "Detection Warehouse",
    "scenario": "db-select"
  }
}
```

For cache nodes — include `stationLabel`:
```json
{
  "id": "cache-redis",
  "name": "Redis",
  "type": "cache",
  "metadata": {
    "description": "Redis cache layer — the speed depot where hot data like session tokens, rate limit counters, and frequently accessed configs are kept for instant retrieval",
    "stationLabel": "Speed Depot",
    "scenario": "cache-hit"
  }
}
```

For middleware nodes — include `factoryRole`, a creative factory metaphor:
```json
{
  "id": "mw-auth",
  "name": "Auth Middleware",
  "type": "auth",
  "metadata": {
    "filePath": "apps/api/src/middleware/auth.ts",
    "handler": "authMiddleware",
    "description": "Validates Clerk JWT tokens or API key hashes against the database",
    "factoryRole": "Security Checkpoint — the badge scanner at the factory gate that verifies every visitor's identity before letting them onto the production floor",
    "authMethods": ["Clerk JWT", "API Key (SHA-256)"],
    "scenario": "auth-verify-token"
  }
}
```

For queue nodes — include `stationLabel`:
```json
{
  "id": "queue-bullmq",
  "name": "BullMQ",
  "type": "queue",
  "metadata": {
    "description": "BullMQ job queue backed by Redis — the conveyor belt dispatch where tasks are dropped off for background workers to pick up and process",
    "stationLabel": "Task Conveyor Belt",
    "queueNames": ["rule-sync", "email", "alerts"],
    "scenario": "queue-enqueue"
  }
}
```

For worker nodes (background job processors):
```json
{
  "id": "worker-rule-sync",
  "name": "Rule Sync Worker",
  "type": "worker",
  "metadata": {
    "filePath": "apps/worker/src/processors/ruleSync.ts",
    "handler": "processRuleSync",
    "description": "Takes queued detection rules and deploys them to the blockchain monitoring infrastructure",
    "factoryRole": "Assembly Line Worker — picks items off the conveyor belt and assembles them into finished monitoring configs",
    "queueName": "rule-sync",
    "scenario": "queue-process"
  }
}
```

For cron/scheduled task nodes:
```json
{
  "id": "cron-cleanup",
  "name": "Nightly Cleanup",
  "type": "cron",
  "metadata": {
    "filePath": "apps/api/src/jobs/cleanup.ts",
    "handler": "runCleanup",
    "description": "Purges expired sessions and archives stale detection events older than 30 days",
    "factoryRole": "Night Shift Janitor — sweeps the factory floor after hours, removing waste and archiving old inventory",
    "cronExpression": "0 3 * * *",
    "cronHuman": "Daily at 3 AM UTC",
    "scenario": "db-delete"
  }
}
```

### Action Enrichment

Actions are the clickable buttons in the visualization. They are NOT limited to HTTP routes. There are **six action types** that reflect everything the backend actually does:

#### Action Types

| Type | Label Prefix | characterType | Example |
|------|-------------|---------------|---------|
| `route` | HTTP method | `RequestWorker` | `POST /detections` |
| `worker` | `⚡` | `QueueWorker` | `⚡ Process rule-sync job` |
| `cron` | `🕐` | `CronWorker` | `🕐 Nightly cleanup` |
| `webhook` | `📬` | `WebhookWorker` | `📬 Stripe webhook` |
| `poller` | `📡` | `PollerWorker` | `📡 Poll blockchain` |
| `event` | `👂` | `EventWorker` | `👂 On user.created` |

#### Route Action Example

```json
{
  "id": "action-route-post--detections",
  "name": "POST /detections",
  "type": "route",
  "description": "Create Detection Rule — sets up blockchain monitoring for a contract address",
  "context": "A user creates a blockchain event detection. The request is authenticated, rate-limited to 120/min, validated against a Zod schema, then the handler resolves the contract ABI, creates detection + rules rows, and enqueues a rule-sync job.",
  "flowDescriptions": {
    "entrypoint": "HTTP request arrives at port 4000",
    "ratelimit-0": "Redis-backed rate limiter checks org quota (120 req/min)",
    "auth-clerk": "Clerk JWT or API key verified, userId/orgId extracted",
    "mw-validate": "Request body validated against createDetectionSchema",
    "route-post--detections": "Handler resolves contract, creates detection + rules",
    "db-drizzle": "INSERT into detections and rules tables",
    "queue-bullmq": "Enqueues rule-sync job for background workers",
    "exit": "Returns 201 with new detection object"
  },
  "scenario": "db-insert",
  "characterType": "RequestWorker",
  "routeId": "route-post--detections",
  "flow": ["entrypoint", "ratelimit-0", "auth-clerk", "mw-validate", "route-post--detections", "db-drizzle", "queue-bullmq", "exit"]
}
```

#### Worker Action Example

```json
{
  "id": "action-worker-rule-sync",
  "name": "⚡ Process rule-sync job",
  "type": "worker",
  "description": "Rule Sync Processor — takes queued detection rules and deploys them to the blockchain monitoring infrastructure",
  "context": "A BullMQ worker picks up a rule-sync job from the queue. It reads the detection config from the database, compiles the rule into a monitoring filter, then pushes it to the chain-specific poller service via gRPC.",
  "flowDescriptions": {
    "queue-bullmq": "Worker dequeues rule-sync job from BullMQ",
    "db-drizzle": "SELECT detection config and associated rules",
    "worker-rule-sync": "Compiles rules into chain-specific monitoring filters",
    "exit": "Job marked complete, monitoring active"
  },
  "scenario": "queue-process",
  "characterType": "QueueWorker",
  "workerId": "worker-rule-sync",
  "flow": ["queue-bullmq", "worker-rule-sync", "db-drizzle", "exit"]
}
```

#### Cron Action Example

```json
{
  "id": "action-cron-cleanup",
  "name": "🕐 Nightly cleanup",
  "type": "cron",
  "description": "Database Janitor — purges expired sessions and stale detection events older than 30 days",
  "context": "Runs at 3 AM UTC daily. Deletes expired session rows, archives old detection events to cold storage, and vacuums the affected tables.",
  "flowDescriptions": {
    "cron-trigger": "Cron fires at 0 3 * * * (3 AM UTC daily)",
    "db-drizzle": "DELETE expired sessions, archive old events",
    "exit": "Cleanup complete, stats logged"
  },
  "scenario": "db-delete",
  "characterType": "CronWorker",
  "cronExpression": "0 3 * * *",
  "flow": ["cron-trigger", "db-drizzle", "exit"]
}
```

#### Webhook Action Example

```json
{
  "id": "action-webhook-stripe",
  "name": "📬 Stripe webhook",
  "type": "webhook",
  "description": "Payment Event Receiver — processes Stripe subscription and payment events to update org billing status",
  "context": "Stripe sends a signed webhook payload. The handler verifies the signature, parses the event type (checkout.session.completed, invoice.paid, etc.), and updates the organization's subscription tier and billing status.",
  "flowDescriptions": {
    "entrypoint": "Stripe sends POST to /api/webhooks/stripe",
    "mw-stripe-verify": "Signature verified with Stripe webhook secret",
    "webhook-stripe": "Event type parsed, appropriate handler dispatched",
    "db-drizzle": "UPDATE organization billing status and tier",
    "exit": "Returns 200 OK to Stripe"
  },
  "scenario": "webhook-receive",
  "characterType": "WebhookWorker",
  "externalService": "Stripe",
  "flow": ["entrypoint", "mw-stripe-verify", "webhook-stripe", "db-drizzle", "exit"]
}
```

#### Poller Action Example

```json
{
  "id": "action-poller-blockchain",
  "name": "📡 Poll blockchain",
  "type": "poller",
  "description": "Chain Watcher — polls Ethereum/Polygon RPC endpoints for new blocks matching active detection rules",
  "context": "Every 15 seconds, the poller fetches the latest block from each monitored chain, filters logs against active detection rules, and enqueues matched events for alert processing.",
  "flowDescriptions": {
    "poll-trigger": "Polling interval fires (every 15s)",
    "poller-blockchain": "Fetch latest block from chain RPC endpoint",
    "db-drizzle": "SELECT active detection rules for this chain",
    "queue-bullmq": "Enqueue matched events for alert processing",
    "exit": "Poll cycle complete, next in 15s"
  },
  "scenario": "external-poll",
  "characterType": "PollerWorker",
  "pollingInterval": "15s",
  "flow": ["poll-trigger", "poller-blockchain", "db-drizzle", "queue-bullmq", "exit"]
}
```

#### Event Listener Action Example

```json
{
  "id": "action-event-user-created",
  "name": "👂 On user.created",
  "type": "event",
  "description": "New User Onboarder — when a user signs up, provisions default org, sends welcome email, and creates audit log entry",
  "context": "Listens for the user.created event from the auth service. Creates a default organization, sends a welcome email via the email queue, and logs the signup in the audit trail.",
  "flowDescriptions": {
    "event-trigger": "user.created event emitted by auth service",
    "event-user-created": "Handler provisions default org and preferences",
    "db-drizzle": "INSERT organization, user_preferences rows",
    "queue-email": "Enqueue welcome email for async delivery",
    "exit": "User fully onboarded"
  },
  "scenario": "event-handle",
  "characterType": "EventWorker",
  "eventName": "user.created",
  "flow": ["event-trigger", "event-user-created", "db-drizzle", "queue-email", "exit"]
}
```

### How to Build This

Use the agent outputs directly. The agents already found:
- **dependency-mapper**: which routes import which middleware, DB, and lib modules
- **schema-explorer**: all DB table names, fields, relationships
- **middleware-orderer**: exact middleware chain per route with configs
- **background-flow-detector**: all workers, cron jobs, pollers, webhook handlers, and event listeners

Combine these into the enriched JSON. For every node, ensure `metadata.description` and `metadata.scenario` are populated. For middleware nodes, add `metadata.factoryRole`. For database/cache/queue nodes, add `metadata.stationLabel`.

For actions, don't just create one per HTTP route — create actions for ALL detected flows:
- One action per route (type: "route")
- One action per background worker/queue consumer (type: "worker")
- One action per cron job/scheduled task (type: "cron")
- One action per webhook receiver (type: "webhook")
- One action per poller service (type: "poller")
- One action per event listener (type: "event")

For route action names, don't just say "POST /detections" — give them creative, descriptive names like "Create Detection Rule — sets up blockchain monitoring for a contract address". The HTTP method+path should still be visible but the description should tell the STORY of what happens.

Write the final JSON to the temp file.

## Phase 3.5: Verify Action Flows (Critical Accuracy Step)

**IMPORTANT**: The `flow` array in each action drives the animation — it must be an ACCURATE trace of what the code actually does, not a guess.

### Flow Accuracy Rules

For EACH action, verify the `flow` array by checking these against the actual source code:

1. **Middleware chain must match the mount order in the entry file.** Read the app entry point and check which middleware runs BEFORE the route's mount point. A webhook route mounted at line 92 goes through ALL global middleware registered at lines 41-76, even if none of them will block it. The character must walk through every station it would actually touch.

2. **Every DB interaction is a separate visit.** If a handler does 3 SQL queries, the flow should show `db-postgresql` appearing 3 times (or at minimum, the flowDescription for the DB station must enumerate all queries). Don't compress 5 queries into "queries the DB".

3. **Conditional steps must be noted.** If the GitHub API is only called when a CI notification match exists, say so in the flowDescription. If queue jobs are only enqueued when rules trigger alerts, say so. The flow array should include conditional stations but the flowDescription should say "If rules trigger: enqueue notify jobs".

4. **Cache interactions matter.** If `evaluateRules()` reads from Redis cache, include `cache-redis` in the flow. If a route invalidates cache after mutation, include it.

5. **Cross-service calls must be traced.** If the route handler calls `serviceA()` which calls `serviceB()` which calls the DB, ALL of those are part of the flow. Follow the import chain.

### Verification Process

For each action, launch a **flow-tracer** agent (or trace manually) to:
1. Read the route/handler file
2. Follow every function call through imports
3. List every DB query, cache operation, queue enqueue, and external API call in order
4. Build the `flow` array from the actual call chain
5. Write flowDescriptions that match what each station ACTUALLY does for this specific flow

You may launch flow-tracer agents in parallel (batch of 3-5 at a time) for efficiency.

If time is limited, at minimum verify the TOP 5 most complex actions (webhooks, workers, and multi-service routes) rather than skipping verification entirely.

## Phase 4: Launch Visualization

Launch the **visualization-builder** agent to:
1. Start the server on port 7777
2. POST the enriched architecture JSON
3. Open the browser
4. Confirm the factory is running

## Phase 5: Report to User

Summarize what was detected:
- Framework and language
- Number of routes, middleware, databases, caches, queues found
- Number of background workers, cron jobs, pollers, webhook handlers, and event listeners found
- Key architectural observations from the agents
- The factory is running at http://localhost:7777
- Mention that hovering over stations shows tooltips with file paths, descriptions, factory roles, and station labels
- Mention that clicking characters during simulation shows flow context
- Mention the different action types: route actions show HTTP flows, worker actions (⚡) show queue processing, cron actions (🕐) show scheduled tasks, webhook actions (📬) show incoming webhook handling, poller actions (📡) show external API polling, and event actions (👂) show pub/sub event handling
- Mention keyboard shortcuts: arrow keys to pan, +/- to zoom, 0/Home to reset view, Space to toggle auto-sim
- Mention the "EXPORT MERMAID" button to copy a Mermaid diagram to clipboard
- Available commands: `/factory-stop`, `/factory-analyze`, `/factory-trace`, `/factory-export mermaid`
