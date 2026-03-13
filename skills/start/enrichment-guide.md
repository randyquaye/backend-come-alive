# Architecture Enrichment Guide

This reference defines the node and action schemas that drive the factory visualization. Every node and action MUST be enriched — no bare metadata.

## Node Enrichment

**CRITICAL**: Every single node in the architecture JSON MUST have these metadata fields:
- `metadata.description` — a creative, human-readable description. NOT optional.
- `metadata.scenario` — the best matching scenario ID from the catalog. Drives animations, speech bubbles, and prop icons.

### Route Node Example

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

### Database Node Example

Include `stationLabel`, a creative factory-themed name:

```json
{
  "id": "db-drizzle",
  "name": "PostgreSQL",
  "type": "database",
  "metadata": {
    "orm": "Drizzle",
    "tables": ["users", "organizations", "detections", "rules", "events", "alerts"],
    "tableCount": 20,
    "description": "Main PostgreSQL database via Drizzle ORM — the permanent record warehouse",
    "stationLabel": "Detection Warehouse",
    "scenario": "db-select"
  }
}
```

### Cache Node Example

```json
{
  "id": "cache-redis",
  "name": "Redis",
  "type": "cache",
  "metadata": {
    "description": "Redis cache layer — the speed depot for hot data",
    "stationLabel": "Speed Depot",
    "scenario": "cache-hit"
  }
}
```

### Middleware Node Example

Include `factoryRole`, a creative factory metaphor:

```json
{
  "id": "mw-auth",
  "name": "Auth Middleware",
  "type": "auth",
  "metadata": {
    "filePath": "apps/api/src/middleware/auth.ts",
    "handler": "authMiddleware",
    "description": "Validates Clerk JWT tokens or API key hashes against the database",
    "factoryRole": "Security Checkpoint — the badge scanner at the factory gate",
    "authMethods": ["Clerk JWT", "API Key (SHA-256)"],
    "scenario": "auth-verify-token"
  }
}
```

### Queue Node Example

```json
{
  "id": "queue-bullmq",
  "name": "BullMQ",
  "type": "queue",
  "metadata": {
    "description": "BullMQ job queue backed by Redis — the conveyor belt dispatch",
    "stationLabel": "Task Conveyor Belt",
    "queueNames": ["rule-sync", "email", "alerts"],
    "scenario": "queue-enqueue"
  }
}
```

### Worker Node Example

```json
{
  "id": "worker-rule-sync",
  "name": "Rule Sync Worker",
  "type": "worker",
  "metadata": {
    "filePath": "apps/worker/src/processors/ruleSync.ts",
    "handler": "processRuleSync",
    "description": "Takes queued detection rules and deploys them to monitoring infrastructure",
    "factoryRole": "Assembly Line Worker — picks items off the conveyor belt",
    "queueName": "rule-sync",
    "scenario": "queue-process"
  }
}
```

### Cron Node Example

```json
{
  "id": "cron-cleanup",
  "name": "Nightly Cleanup",
  "type": "cron",
  "metadata": {
    "filePath": "apps/api/src/jobs/cleanup.ts",
    "handler": "runCleanup",
    "description": "Purges expired sessions and archives stale detection events",
    "factoryRole": "Night Shift Janitor — sweeps the factory floor after hours",
    "cronExpression": "0 3 * * *",
    "cronHuman": "Daily at 3 AM UTC",
    "scenario": "db-delete"
  }
}
```

## Action Types

Actions are clickable buttons in the visualization. There are **six action types**:

| Type | Label Prefix | characterType | Example |
|------|-------------|---------------|---------|
| `route` | HTTP method | `RequestWorker` | `POST /detections` |
| `worker` | `⚡` | `QueueWorker` | `⚡ Process rule-sync job` |
| `cron` | `🕐` | `CronWorker` | `🕐 Nightly cleanup` |
| `webhook` | `📬` | `WebhookWorker` | `📬 Stripe webhook` |
| `poller` | `📡` | `PollerWorker` | `📡 Poll blockchain` |
| `event` | `👂` | `EventWorker` | `👂 On user.created` |

### Route Action Example

```json
{
  "id": "action-route-post--detections",
  "name": "POST /detections",
  "type": "route",
  "description": "Create Detection Rule — sets up blockchain monitoring",
  "context": "A user creates a detection. Request is authenticated, rate-limited, validated, then the handler creates rows and enqueues a sync job.",
  "flowDescriptions": {
    "entrypoint": "HTTP request arrives at port 4000",
    "ratelimit-0": "Redis-backed rate limiter checks org quota (120 req/min)",
    "auth-clerk": "Clerk JWT or API key verified",
    "route-post--detections": "Handler resolves contract, creates detection + rules",
    "db-drizzle": "INSERT into detections and rules tables",
    "queue-bullmq": "Enqueues rule-sync job",
    "exit": "Returns 201 with new detection object"
  },
  "scenario": "db-insert",
  "characterType": "RequestWorker",
  "routeId": "route-post--detections",
  "flow": ["entrypoint", "ratelimit-0", "auth-clerk", "mw-validate", "route-post--detections", "db-drizzle", "queue-bullmq", "exit"]
}
```

### Worker Action Example

```json
{
  "id": "action-worker-rule-sync",
  "name": "⚡ Process rule-sync job",
  "type": "worker",
  "description": "Rule Sync Processor — deploys detection rules to monitoring infrastructure",
  "context": "A BullMQ worker picks up a rule-sync job, reads detection config, compiles rules, pushes to monitoring service.",
  "scenario": "queue-process",
  "characterType": "QueueWorker",
  "workerId": "worker-rule-sync",
  "flow": ["queue-bullmq", "worker-rule-sync", "db-drizzle", "exit"]
}
```

### Cron Action Example

```json
{
  "id": "action-cron-cleanup",
  "name": "🕐 Nightly cleanup",
  "type": "cron",
  "description": "Database Janitor — purges expired sessions and stale events",
  "scenario": "db-delete",
  "characterType": "CronWorker",
  "cronExpression": "0 3 * * *",
  "flow": ["cron-trigger", "db-drizzle", "exit"]
}
```

### Webhook Action Example

```json
{
  "id": "action-webhook-stripe",
  "name": "📬 Stripe webhook",
  "type": "webhook",
  "description": "Payment Event Receiver — processes Stripe subscription events",
  "scenario": "webhook-receive",
  "characterType": "WebhookWorker",
  "externalService": "Stripe",
  "flow": ["entrypoint", "mw-stripe-verify", "webhook-stripe", "db-drizzle", "exit"]
}
```

### Poller Action Example

```json
{
  "id": "action-poller-blockchain",
  "name": "📡 Poll blockchain",
  "type": "poller",
  "description": "Chain Watcher — polls RPC endpoints for new blocks",
  "scenario": "external-poll",
  "characterType": "PollerWorker",
  "pollingInterval": "15s",
  "flow": ["poll-trigger", "poller-blockchain", "db-drizzle", "queue-bullmq", "exit"]
}
```

### Event Listener Action Example

```json
{
  "id": "action-event-user-created",
  "name": "👂 On user.created",
  "type": "event",
  "description": "New User Onboarder — provisions default org, sends welcome email",
  "scenario": "event-handle",
  "characterType": "EventWorker",
  "eventName": "user.created",
  "flow": ["event-trigger", "event-user-created", "db-drizzle", "queue-email", "exit"]
}
```
