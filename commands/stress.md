---
description: "Visualize how the factory handles load with simulated traffic patterns"
argument-hint: "Pattern: 'spike 100', 'sustained 50', 'burst 200 10s', 'realistic'"
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Agent"]
---

# Backend Factory - Stress Test Visualizer

Simulate traffic load on the factory and visualize where bottlenecks form, rate limiters activate, and queues back up.

## Step 1: Parse Traffic Pattern

`$ARGUMENTS` should contain a traffic pattern. Supported formats:

| Pattern | Description | Example |
|---------|-------------|---------|
| `spike N` | N simultaneous requests hit all routes at once | `spike 100` |
| `sustained N` | N requests per second, steady continuous stream | `sustained 50` |
| `burst N Ts` | N requests compressed into T seconds | `burst 200 10s` |
| `realistic` | Distribution based on route types: 80% reads, 15% writes, 5% deletes | `realistic` |

If `$ARGUMENTS` is empty, default to `realistic` and inform the user:
```
No pattern specified. Running realistic traffic simulation (80% reads, 15% writes, 5% deletes).
Tip: try 'spike 100' or 'burst 200 10s' for more dramatic results.
```

Parse the pattern into:
- `mode`: one of `spike`, `sustained`, `burst`, `realistic`
- `count`: number of simulated requests (default 50 for realistic)
- `duration`: time window for burst mode (default `1s` for spike)

## Step 2: Get Current Architecture

Fetch the running factory's architecture:

```bash
curl -s http://localhost:7777/api/architecture | jq '.' > /tmp/factory-stress-base.json
```

If the server is not running, instruct the user:
```
Factory server not detected at localhost:7777. Run /start first to launch the visualizer.
```

Extract from the architecture:
- All actions (routes, workers, cron jobs, webhooks, pollers, events)
- All stations and their types (middleware, handler, DB, cache, queue, external API)
- Flow paths for each action

## Step 3: Analyze Bottleneck Candidates

Examine each station and action to identify where stress will hit hardest:

### 3a: DB Write Stations
- Routes that perform INSERT, UPDATE, or DELETE operations
- These are inherently slower than reads and will bottleneck under load
- Flag any routes doing multiple sequential DB writes (transaction chains)
- Check for missing indexes on frequently-queried fields

### 3b: Rate Limiter Stations
- Identify any rate limiting middleware in the flow paths
- Determine rate limit thresholds (requests per window) from the code
- Calculate at what traffic level each rate limiter starts blocking
- Flag routes that share rate limit buckets

### 3c: Queue Stations
- Routes that enqueue background jobs
- Calculate queue backlog: if enqueue rate > worker consumption rate, jobs pile up
- Identify queue concurrency settings (how many workers process simultaneously)
- Flag unbounded queues with no max size or dead letter handling

### 3d: External API Stations
- Routes that make outgoing HTTP calls to third-party services
- These have variable latency and are the most unpredictable under load
- Check for timeout settings, retry logic, and circuit breakers
- Flag routes making multiple sequential external calls

### 3e: Cache Stations
- Routes that hit cache before DB (these handle load well)
- Cache miss thundering herd scenarios (many requests miss cache simultaneously)
- Cache eviction under memory pressure

### 3f: Auth / Middleware Chains
- Long middleware chains add per-request overhead
- Token validation that hits DB on every request (vs. stateless JWT)
- Session lookups under load

## Step 4: Generate Stress Visualization Data

Build the stress simulation payload based on the traffic pattern:

### For each action/route, calculate:
- **Worker count**: how many characters to spawn based on the traffic pattern and route distribution
- **Throughput estimate**: based on identified bottleneck types (DB writes slower than cache reads)
- **Queue depth**: for routes with queue stations, estimated backlog accumulation
- **Block rate**: for routes behind rate limiters, percentage of requests that get blocked

### Visualization elements:
- **Character multiplication**: multiple worker characters per route, proportional to traffic
- **Queue pile-up**: characters stacking/waiting at queue stations when backlog forms
- **Rate limiter barrier**: characters bouncing off or waiting at rate limiter stations
- **DB pressure indicator**: DB station visual state changes (normal -> busy -> overloaded)
- **External API latency**: characters moving slowly through external API stations
- **Cache fast-lane**: characters zipping through cache-hit paths

### Traffic distribution for `realistic` mode:
- 80% of characters go to GET/read routes
- 15% of characters go to POST/PUT/PATCH write routes
- 5% of characters go to DELETE routes
- Weight popular routes higher based on path specificity (list endpoints > detail endpoints)

## Step 5: POST Stress Mode to Server

Send the stress simulation data to the factory server:

```bash
# Build stress payload with:
# - mode: the traffic pattern type
# - count: total simulated requests
# - distribution: per-action character counts
# - bottlenecks: identified bottleneck stations with severity
# - queueDepths: estimated queue backlogs per queue station
# - rateLimitBlocks: estimated block counts per rate-limited route
# - stressStates: per-station stress level (normal/busy/overloaded/critical)

curl -s -X POST http://localhost:7777/api/architecture \
  -H "Content-Type: application/json" \
  -d @/tmp/factory-stress-payload.json
```

The payload should enrich the existing architecture with stress overlay data so the visualizer can render the load simulation.

## Step 6: Report

Present the stress test results in a structured report:

### Bottleneck Ranking
List stations from most to least vulnerable:
1. Station name, type, and why it bottlenecks (with file paths)
2. Estimated failure threshold (at what req/sec does it degrade)
3. Impact: what happens when this station is overwhelmed

### Rate Limiter Analysis
- Which rate limiters activate and at what traffic level
- How many requests get blocked vs. passed through
- Whether rate limits are per-user, per-IP, or global

### Queue Backlog Forecast
- Which queues accumulate backlog under this traffic pattern
- Estimated time to drain backlog after traffic subsides
- Whether dead letter queues or retry limits are configured

### Survival Assessment
Grade the backend's resilience:
- **A**: Handles this traffic pattern gracefully. Good caching, proper rate limiting, queue absorption.
- **B**: Minor bottlenecks but recoverable. Some queue backlog, occasional rate limiting.
- **C**: Significant bottlenecks. DB under pressure, queues growing, noticeable degradation.
- **D**: Critical failures likely. Unprotected write paths, no rate limiting, unbounded queues.
- **F**: Factory meltdown. No caching, no rate limiting, synchronous everything, external API cascading failures.

### Creative Narration

Write a dramatic factory stress report:

> "STRESS TEST INITIATED. 100 workers just poured through the front gate. The auth checkpoint is processing badges as fast as it can — JWT validation is holding up, no DB lookups needed. The GET /users line is moving smoothly thanks to the Redis cache counter, but POST /orders is backed up six deep at the database loading dock. The rate limiter on /api/payments just slammed shut — only 10 per second allowed, and 30 are already in line. Meanwhile, the email queue is stacking up like boxes on a conveyor belt with no one at the other end. The webhook station is fine — Stripe only sends what Stripe sends. Final assessment: this factory can handle a Tuesday morning, but Black Friday? Better hire more DB workers and widen that queue conveyor."

Adapt the narration to the actual architecture, actual bottlenecks, and the specific traffic pattern. Reference real station names, real routes, and real numbers.

Suggest: "Run `/trace` on specific bottleneck routes to see exactly where the slowdown occurs in their flow path."
