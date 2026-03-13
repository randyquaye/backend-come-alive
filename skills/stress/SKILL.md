---
name: stress
description: "Visualize how the factory handles load with simulated traffic patterns"
argument-hint: "Pattern: 'spike 100', 'sustained 50', 'burst 200 10s', 'realistic'"
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep, Agent
---

# Backend Factory - Stress Test Visualizer

Simulate traffic load on the factory and visualize where bottlenecks form.

## Step 1: Parse Traffic Pattern

`$ARGUMENTS` should contain a traffic pattern:

| Pattern | Description |
|---------|-------------|
| `spike N` | N simultaneous requests hit all routes at once |
| `sustained N` | N requests per second, steady stream |
| `burst N Ts` | N requests compressed into T seconds |
| `realistic` | 80% reads, 15% writes, 5% deletes |

Default to `realistic` if empty.

## Step 2: Get Current Architecture

```bash
curl -s http://localhost:7777/api/architecture | jq '.' > /tmp/factory-stress-base.json
```

## Step 3: Analyze Bottleneck Candidates

Examine stations for stress vulnerabilities:
- **DB Write Stations**: sequential writes, missing indexes
- **Rate Limiter Stations**: thresholds, shared buckets
- **Queue Stations**: backlog risk, concurrency settings
- **External API Stations**: variable latency, timeouts, retries
- **Cache Stations**: thundering herd, eviction
- **Auth / Middleware Chains**: per-request overhead

## Step 4: Generate Stress Visualization Data

Calculate per-action: worker count, throughput estimate, queue depth, block rate.

## Step 5: POST Stress Mode

```bash
curl -s -X POST http://localhost:7777/api/architecture \
  -H "Content-Type: application/json" \
  -d @/tmp/factory-stress-payload.json
```

## Step 6: Report

### Bottleneck Ranking
Stations from most to least vulnerable, with file paths and estimated failure thresholds.

### Rate Limiter Analysis
Which activate, at what level, per-user vs global.

### Queue Backlog Forecast
Which queues accumulate backlog, drain time estimates.

### Survival Assessment
Grade A-F based on caching, rate limiting, queue absorption, and external API resilience.

### Creative Narration
A dramatic factory stress report referencing actual station names, routes, and numbers.
