---
description: "Deep-zoom into a specific component for a detailed 'day in the life' view"
argument-hint: "Component to focus: 'auth', 'database', 'queue', 'POST /api/users', or any node ID"
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Agent"]
---

# Backend Factory - Focus Component

Deep-zoom into a single component (node) in the factory for a detailed station profile, upstream/downstream map, activity log, and first-person narration.

## Step 1: Parse Arguments

`$ARGUMENTS` should contain a component identifier. Supported formats:

| Format | Match Strategy | Example |
|--------|---------------|---------|
| Node ID | Exact match on `id` field | `db-drizzle`, `cache-redis`, `mw-auth` |
| Type keyword | Match nodes by `type` | `auth`, `database`, `queue`, `cache`, `cron`, `worker` |
| Component name | Fuzzy match on `name` field | `Redis`, `BullMQ`, `PostgreSQL`, `Clerk` |
| Route path | Match route nodes by path | `POST /api/users`, `GET /detections`, `/webhooks/stripe` |
| Station label | Match on `metadata.stationLabel` | `Speed Depot`, `Detection Warehouse` |

If `$ARGUMENTS` is empty, list all available nodes from the running factory and ask the user to pick one:
```bash
curl -s http://localhost:7777/api/architecture | jq '.nodes[] | "\(.id) — \(.name) [\(.type)]"'
```

## Step 2: Fetch Architecture & Match Node

Fetch the current architecture:
```bash
curl -s http://localhost:7777/api/architecture > /tmp/factory-focus-arch.json
```

If the server is not running, inform the user to run `/factory-start` first and stop.

Match `$ARGUMENTS` to a node using this priority order:
1. **Exact ID match**: `jq '.nodes[] | select(.id == "<arg>")'`
2. **Type match**: `jq '.nodes[] | select(.type == "<arg>")'` — if multiple nodes match, pick the first or ask the user
3. **Name match** (case-insensitive): `jq '.nodes[] | select(.name | test("<arg>"; "i"))'`
4. **Route path match**: `jq '.nodes[] | select(.metadata.path and (.metadata.method + " " + .metadata.path | test("<arg>"; "i")))'`
5. **Station label match**: `jq '.nodes[] | select(.metadata.stationLabel and (.metadata.stationLabel | test("<arg>"; "i")))'`
6. **Fuzzy fallback**: Search all node fields for the argument string

If no match is found, show the user the list of available nodes and suggest the closest matches.

Store the matched node as `$TARGET_NODE`.

## Step 3: Find All Flows Through This Node

Search all actions in the architecture for flows that pass through the target node:

```bash
TARGET_ID="<matched_node_id>"
curl -s http://localhost:7777/api/architecture | jq --arg id "$TARGET_ID" '.actions[] | select(.flow | index($id)) | {id, name, type, description}'
```

This gives us every action (route, worker, cron, webhook, poller, event) that touches this component. Store these as `$PASSING_FLOWS`.

For each passing flow, note:
- The flow type and name
- WHERE in the flow this node appears (beginning, middle, end)
- What comes before and after this node in the flow

## Step 4: Read Source Code

If the target node has `metadata.filePath`, read the actual source code file:

```bash
# Use the filePath from the node's metadata
cat "<project_root>/<metadata.filePath>"
```

Also read any closely related files:
- If it's a route node, read the route handler AND any service/controller it imports
- If it's a middleware node, read the middleware file AND check where it's mounted in the app entry
- If it's a database node, read the schema/model definitions
- If it's a queue node, read both the enqueue logic AND the consumer/worker
- If it's a worker node, read the processor file AND the queue config
- If it's a cron node, read the job definition AND the scheduler setup

Read up to 5 related files to build a complete picture.

## Step 5: Generate Station Profile

Build a comprehensive profile of this component with the following sections:

### Station Bio

A detailed identity card for this component:

- **Station Name**: The node's name and any station label
- **Station Type**: The node type with a factory metaphor (e.g., "Warehouse", "Checkpoint", "Conveyor Belt")
- **File Path**: Actual source file location
- **Factory Role**: The `metadata.factoryRole` or a generated one
- **Description**: Rich description of what this component does
- **Configuration**: Any relevant config (connection strings, pool sizes, TTLs, retry policies)
- **Dependencies**: What packages/modules this component imports
- **Dependents**: What other components import/use this one

### Upstream / Downstream Map

A visual map of what feeds into this component and what it feeds:

```
[Upstream Components] → [THIS COMPONENT] → [Downstream Components]
```

For each upstream component:
- What data/requests it sends to this component
- How frequently (based on flow count)

For each downstream component:
- What this component sends downstream
- The nature of the connection (sync call, async queue, event emission)

### Daily Activity Log

Based on the passing flows, generate an estimated activity log:

- **Total flows passing through**: count of actions that include this node
- **Flow breakdown by type**: how many routes vs workers vs cron jobs use this node
- **Busiest flows**: the actions with the longest flow arrays that pass through here
- **Quiet periods**: for cron nodes, when they're idle; for others, note any time-based patterns
- **Example interactions**:
  - "When `POST /detections` fires, I receive an INSERT for the detections table"
  - "When the `rule-sync` worker runs, I provide a SELECT of active rules"
  - "Every night at 3 AM, the cleanup job DELETEs my expired rows"

### "Day in the Life" Narration

A first-person narrative from the perspective of this station's worker. This should be 3-5 paragraphs, written creatively, and grounded in real code details:

- **Morning arrival**: What the component does on startup/initialization
- **The rush hours**: The busiest interactions, told as stories
- **The routine tasks**: Regular, predictable interactions
- **The unusual visitors**: Edge cases, error scenarios, rare flows
- **End of day**: Cleanup, shutdown behavior, or what happens during quiet periods

Use real function names, table names, queue names, and file paths in the narration.

### Health Assessment

Evaluate the component's health based on what's visible in the code:

**Performance Notes**:
- Connection pooling? (for DB/cache nodes)
- Caching in front of it? (for DB nodes)
- Async processing? (for heavy operations)
- Any visible N+1 query patterns?
- Index usage (if schema is visible)?

**Security Notes**:
- Is input validated before reaching this component?
- Are there SQL injection risks? (raw queries without parameterization)
- Are secrets properly managed? (env vars vs hardcoded)
- For auth components: token expiry, refresh strategy, revocation support

**Resilience Notes**:
- What happens if this component goes down?
- Retry logic present?
- Circuit breaker patterns?
- Graceful degradation?
- Timeout configurations?

Rate overall health as: Healthy / Needs Attention / At Risk

## Step 6: Update Visualization

POST a focus mode update to the server to highlight this component in the visualization:

```bash
curl -s -X POST http://localhost:7777/api/overlay \
  -H "Content-Type: application/json" \
  -d '{
    "type": "focus_mode",
    "targetNodeId": "<TARGET_NODE.id>",
    "targetName": "<TARGET_NODE.name>",
    "stationBio": "<summary of station bio>",
    "upstreamNodes": ["<list of upstream node IDs>"],
    "downstreamNodes": ["<list of downstream node IDs>"],
    "passingFlows": ["<list of action IDs that pass through>"],
    "healthStatus": "<healthy|needs_attention|at_risk>",
    "highlight": true
  }'
```

This should cause the visualization to:
- Dim all nodes except the target and its direct connections
- Highlight the target node with a glow effect
- Show upstream/downstream connections with directional arrows
- List passing flows in a side panel

## Step 7: Show Related Flows

Display the passing flows in a formatted panel, grouped by type:

```
=== Flows Through <Component Name> ===

Routes (3):
  → POST /detections — Create Detection Rule
  → GET /detections/:id — Fetch Detection Details
  → DELETE /detections/:id — Remove Detection Rule

Workers (1):
  ⚡ Process rule-sync — Deploy rules to monitoring infra

Cron (1):
  🕐 Nightly cleanup — Purge expired data

Webhooks (0): None
Pollers (0): None
Events (0): None
```

## Step 8: Report to User

Present the complete focus report:
- Station bio summary
- Upstream/downstream map
- Activity log highlights
- The full "Day in the Life" narration
- Health assessment with rating
- Count of flows passing through

Suggest next actions:
- "Run `/factory-trace <flow_name>` to trace any of the flows listed above."
- "Run `/factory-focus <upstream_component>` to zoom into a connected station."
- "Run `/factory-narrative` to see the full factory story."
