---
name: start
description: >
  Analyze the current backend project and launch the pixel factory visualizer at localhost:7777.
  Use when the user says "visualize backend", "show architecture", "factory", "backend factory",
  or wants to see their backend as a visual diagram.
argument-hint: "Optional: path to backend project"
disable-model-invocation: true
context: fork
allowed-tools: Bash, Read, Glob, Grep, Write, Agent
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
node ${CLAUDE_PLUGIN_ROOT}/analysis/analyze.js "${PROJECT_PATH:-.}" > "$TMPFILE"
```

Then **enrich** the model with agent findings. This is the critical step — the visualization depends on rich metadata in each node and action.

For complete enrichment instructions, node schemas, and action type definitions, see [enrichment-guide.md](enrichment-guide.md).

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

Write the final JSON to the temp file.

## Phase 3.5: Verify Action Flows (Critical Accuracy Step)

**IMPORTANT**: The `flow` array in each action drives the animation — it must be an ACCURATE trace of what the code actually does, not a guess.

### Flow Accuracy Rules

For EACH action, verify the `flow` array by checking these against the actual source code:

1. **Middleware chain must match the mount order in the entry file.** Read the app entry point and check which middleware runs BEFORE the route's mount point.
2. **Every DB interaction is a separate visit.** If a handler does 3 SQL queries, the flow should show the DB node appearing 3 times.
3. **Conditional steps must be noted.** If a queue job is only enqueued when rules trigger alerts, say so in the flowDescription.
4. **Cache interactions matter.** If `evaluateRules()` reads from Redis cache, include `cache-redis` in the flow.
5. **Cross-service calls must be traced.** Follow the import chain.

### Verification Process

For each action, launch a **flow-tracer** agent (or trace manually) to:
1. Read the route/handler file
2. Follow every function call through imports
3. List every DB query, cache operation, queue enqueue, and external API call in order
4. Build the `flow` array from the actual call chain
5. Write flowDescriptions that match what each station ACTUALLY does for this specific flow

You may launch flow-tracer agents in parallel (batch of 3-5 at a time) for efficiency.

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
- Available commands: `/backend-factory:stop`, `/backend-factory:analyze`, `/backend-factory:trace`, `/backend-factory:export mermaid`
