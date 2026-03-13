---
description: "Run 'what-if' failure scenarios to see how the architecture handles failures"
argument-hint: "Scenario: 'db-failure', 'cache-down', 'high-traffic', 'auth-breach', 'cascade-failure', 'slow-dependency'"
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Agent"]
---

# Backend Factory - Simulate Failure

Run a predefined failure scenario against the current architecture to visualize how the system behaves under stress. Characters react, stations break down, and you see exactly where your architecture is vulnerable.

## Step 1: Check Server

```bash
curl -s http://localhost:7777/api/status
```

If the server is not running, tell the user to run `/factory-start` first.

## Step 2: Parse Scenario

Parse the scenario name from `$ARGUMENTS`. Valid scenarios:

| Scenario | Description |
|----------|-------------|
| `db-failure` | Database goes offline |
| `cache-down` | Cache layer fails |
| `high-traffic` | 10x traffic spike |
| `auth-breach` | Unauthorized intrusion attempt |
| `cascade-failure` | Critical node failure propagates downstream |
| `slow-dependency` | External API becomes slow |

If `$ARGUMENTS` is empty or not a recognized scenario, list all available scenarios with descriptions and ask the user to pick one.

If `$ARGUMENTS` is `stop` or `reset`, POST the original architecture back to the server (without `scenario_mode`) and tell the user the simulation has been cleared. Exit.

## Step 3: GET Current Architecture

```bash
ARCH_JSON=$(curl -s http://localhost:7777/api/architecture)
```

Read the current architecture so we can modify it for the scenario. Parse the nodes, edges, and actions from the response.

## Step 4: Build Scenario

Based on the chosen scenario, modify the architecture JSON to simulate the failure. Each scenario has specific rules:

---

### Scenario: `db-failure`

**Story**: "ALERT! The main database warehouse has suffered a catastrophic power failure. All conveyor belts leading to the warehouse have jammed!"

**Modifications**:
1. Find all database nodes. Set their `metadata.status` to `"down"` and `metadata.statusMessage` to `"DATABASE OFFLINE — Connection refused"`.
2. Find all actions whose `flow` array includes a database node ID. For each:
   - Add `error_at` field set to the database node ID
   - Add `error_message`: `"ECONNREFUSED: Database connection failed"`
   - Set `metadata.scenario` to `"error-db-down"` on the action
3. Find all routes that hit the database. In their `flowDescriptions`, update the DB station description to `"ERROR: Connection refused. The warehouse doors are locked!"`.
4. Identify routes that do NOT hit the database — these should still work. Mark them with `metadata.healthy` = `true`.
5. Check for circuit breaker patterns in the codebase. If found, note which routes have fallbacks.
6. Spawn error characters (`ErrorWorker`) at the database station that bounce back.

**What to tell the user to observe**:
- Characters heading to the database station will hit a wall and turn red
- Routes with error handlers will show the error path activating
- Routes that don't touch the DB continue working normally
- Look for which routes have NO error handling — those are your vulnerabilities

---

### Scenario: `cache-down`

**Story**: "The Speed Depot has gone cold! Redis is unreachable — every cache lookup is now a miss. The database warehouse is about to get FLOODED with direct requests!"

**Modifications**:
1. Find all cache nodes. Set `metadata.status` to `"down"` and `metadata.statusMessage` to `"CACHE OFFLINE — Redis connection lost"`.
2. Find all actions whose `flow` includes a cache node. For each:
   - Remove the cache node from the `flow` array (requests bypass cache)
   - Replace it with the database node (cache misses fall through to DB)
   - Update `flowDescriptions` for the cache station: `"MISS — Cache unreachable, falling through to database"`
3. For the database node, add `metadata.load` = `"critical"` and `metadata.statusMessage` = `"OVERLOADED — Handling 5x normal query volume due to cache failure"`.
4. Identify routes that are cache-only (no DB fallback) — mark them as failing.
5. Check for cache-aside vs. cache-through patterns in the codebase.

**What to tell the user to observe**:
- Characters skip right past the cache station (it's dark/offline)
- The database station gets overwhelmed — characters pile up waiting
- Response times visually slow down (characters move slower through DB)
- Routes with no DB fallback fail entirely

---

### Scenario: `high-traffic`

**Story**: "It's Black Friday at the factory! Traffic has spiked to 10x normal volume. The rate limiters are working overtime, and the queues are backing up!"

**Modifications**:
1. For all actions, set `metadata.traffic_multiplier` to `10`.
2. Find rate limiter middleware nodes. Set `metadata.status` to `"stressed"` and `metadata.statusMessage` to `"Rate limiter active — blocking excess requests (429 Too Many Requests)"`.
3. For actions that pass through rate limiters, create duplicate "blocked" versions:
   - Add `error_at` set to the rate limiter node ID
   - Add `error_message`: `"429 Too Many Requests — Rate limit exceeded"`
   - Set `characterType` to `"BlockedWorker"`
4. Find queue nodes. Set `metadata.load` to `"critical"` and `metadata.statusMessage` to `"Queue depth: 10,847 — Workers can't keep up!"`.
5. For database nodes, set `metadata.load` to `"high"` and `metadata.statusMessage` to `"Connection pool near capacity (48/50)"`.
6. Spawn many characters simultaneously to show the flood.

**What to tell the user to observe**:
- A flood of characters enters from the left
- Rate limiter stations start turning characters away (red flash)
- Queue stations show items piling up (growing visual stack)
- Database station is working at max capacity
- Some characters make it through, others get 429'd at the gate
- Look for routes WITHOUT rate limiting — those are your unprotected endpoints

---

### Scenario: `auth-breach`

**Story**: "SECURITY ALERT! Intruder characters (marked in red) are attempting to bypass the security checkpoint. The auth middleware is under attack!"

**Modifications**:
1. Find all auth middleware nodes. Set `metadata.status` to `"alert"` and `metadata.statusMessage` to `"SECURITY ALERT — Unauthorized access attempts detected"`.
2. Create special "intruder" actions for each route:
   - Set `characterType` to `"IntruderWorker"` (rendered in red)
   - Set `error_at` to the auth middleware node ID
   - Set `error_message`: `"401 Unauthorized — Invalid or missing credentials"`
3. Identify routes that do NOT go through auth middleware — these are **vulnerable**:
   - Mark them with `metadata.vulnerable` = `true`
   - Set `metadata.statusMessage` to `"WARNING: No authentication required — accessible to intruders!"`
   - For these routes, intruder characters should pass through successfully
4. Check for routes with different auth levels (e.g., API key vs. JWT vs. public).
5. Look for admin routes and flag them specially.

**What to tell the user to observe**:
- Red intruder characters try to enter every route
- Auth middleware stations block most intruders (they bounce off with a 401)
- ANY route without auth middleware lets intruders through — watch for red characters reaching the database!
- Public/healthcheck routes are expected to be open, but watch for unintentionally unprotected endpoints
- The auth station shows a count of blocked attempts

---

### Scenario: `cascade-failure`

**Story**: "A critical node has failed, and the damage is spreading! Watch the failure cascade through dependent services like dominoes falling..."

**Modifications**:
1. Identify the most critical node — the one with the most incoming/outgoing edges (highest connectivity). This is the failure origin.
2. Set the origin node `metadata.status` to `"down"` and `metadata.statusMessage` to `"CRITICAL FAILURE — Node offline"`.
3. Trace all downstream dependencies from the failed node:
   - **Level 1**: Direct dependents — nodes that connect TO the failed node. Set `metadata.status` to `"degraded"` and `metadata.cascade_level` to `1`.
   - **Level 2**: Dependents of Level 1 nodes. Set `metadata.cascade_level` to `2`.
   - **Level 3+**: Continue propagation until no more downstream nodes.
4. For each cascade level, add a `metadata.cascade_delay` (e.g., Level 1 fails after 2s, Level 2 after 5s, Level 3 after 10s) so the visualization shows the failure spreading over time.
5. Find actions that pass through ANY failed/degraded node and mark them with error paths.
6. Identify nodes that are NOT in the failure cascade — these are isolated and resilient.

**What to tell the user to observe**:
- The critical node goes dark first
- After a moment, directly dependent stations start flickering and turning orange
- The failure spreads outward like a shockwave — each level turns progressively more degraded
- Characters in-flight get stuck or error out at failed stations
- Isolated nodes (no dependency on the failed node) continue working — these are your resilient components
- The cascade path reveals your architecture's single points of failure

---

### Scenario: `slow-dependency`

**Story**: "The external API portal is responding at a crawl! What used to take 200ms now takes 15 seconds. Characters are stuck waiting at the portal, and timeouts are starting to fire..."

**Modifications**:
1. Find external service / API nodes (type `"external"`, `"api"`, or nodes with `metadata.external` = true). If none exist, create a simulated external dependency node.
2. Set the external node's `metadata.status` to `"slow"` and `metadata.statusMessage` to `"Response time: 15,000ms (normal: 200ms)"` and `metadata.latency` to `15000`.
3. For actions whose flow includes the external node:
   - Add `metadata.timeout_risk` = `true`
   - Update `flowDescriptions` for the external station: `"SLOW — Waiting 15s for response... timeout threshold is 30s"`
4. Find timeout configurations in the codebase (e.g., `timeout: 30000`, `AbortSignal.timeout()`). If the simulated latency exceeds the timeout:
   - Set `error_at` to the external node
   - Set `error_message`: `"ETIMEDOUT: Request timed out after 30s"`
5. Check for retry logic. If retries exist, note that each retry adds another 15s wait.
6. Characters at the external node should visibly wait (slow animation) before proceeding or timing out.

**What to tell the user to observe**:
- Characters reaching the external API station slow to a crawl
- A visible queue of waiting characters builds up at the portal
- After the timeout threshold, characters start failing with timeout errors
- Routes that don't touch the external API continue at normal speed
- Look for retry storms — if retries are configured, the external service gets hit even harder
- Check which routes have timeout handling vs. which will hang indefinitely

---

## Step 5: Apply Scenario

Add the `scenario_mode` field to the top level of the architecture JSON:

```json
{
  "scenario_mode": {
    "name": "db-failure",
    "title": "Database Failure Simulation",
    "story": "ALERT! The main database warehouse has suffered a catastrophic power failure...",
    "started_at": "2026-03-13T12:00:00Z",
    "affected_nodes": ["db-drizzle"],
    "cascade_levels": 0,
    "healthy_routes": ["GET /health", "GET /status"],
    "failing_routes": ["POST /detections", "GET /users", "..."]
  },
  "nodes": [...],
  "edges": [...],
  "actions": [...]
}
```

POST the modified architecture to the server:

```bash
TMPFILE_SIM=$(mktemp /tmp/factory-sim-XXXXXX.json)
# Write the scenario-modified architecture JSON to the file
curl -s -X POST http://localhost:7777/api/architecture \
  -H "Content-Type: application/json" \
  -d @"$TMPFILE_SIM"
rm -f "$TMPFILE_SIM"
```

## Step 6: Report

Tell the user what is happening in the simulation with the creative narration for the chosen scenario. Include:

1. **The story** — the narrative introduction for the scenario
2. **What's affected** — list which nodes and routes are impacted
3. **What's healthy** — list which parts of the system still work
4. **What to watch for** — the scenario-specific observation guide from Step 4
5. **Vulnerabilities found** — any architectural weaknesses exposed by the scenario:
   - Routes without error handling
   - Missing circuit breakers
   - No fallback for cache misses
   - Unprotected endpoints
   - Single points of failure
   - Missing timeout configurations

End with:
- The simulation is live at http://localhost:7777
- To stop the simulation and return to normal view: `/factory-simulate reset`
- To try another scenario: `/factory-simulate <scenario-name>`
- Available scenarios: `db-failure`, `cache-down`, `high-traffic`, `auth-breach`, `cascade-failure`, `slow-dependency`
- Other commands: `/factory-start`, `/factory-analyze`, `/factory-diff`
