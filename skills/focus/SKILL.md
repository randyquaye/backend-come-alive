---
name: focus
description: "Deep-zoom into a specific component for a detailed 'day in the life' view"
argument-hint: "Component to focus: 'auth', 'database', 'queue', 'POST /api/users', or any node ID"
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep, Agent
---

# Backend Factory - Focus Component

Deep-zoom into a single component (node) in the factory for a detailed station profile, upstream/downstream map, activity log, and first-person narration.

## Step 1: Parse Arguments

`$ARGUMENTS` should contain a component identifier. Match strategy priority:

1. **Exact ID match** on `id` field
2. **Type keyword** match on `type` (auth, database, queue, cache, cron, worker)
3. **Name match** (case-insensitive) on `name`
4. **Route path** match
5. **Station label** match on `metadata.stationLabel`

If `$ARGUMENTS` is empty, list all available nodes and ask the user to pick one.

## Step 2: Fetch Architecture & Match Node

```bash
curl -s http://localhost:7777/api/architecture > /tmp/factory-focus-arch.json
```

If the server is not running, inform the user to run `/backend-factory:start` first.

## Step 3: Find All Flows Through This Node

Search all actions for flows that pass through the target node.

## Step 4: Read Source Code

If the target node has `metadata.filePath`, read the source file and up to 5 related files.

## Step 5: Generate Station Profile

### Station Bio
- Name, type, file path, factory role, description, config, dependencies, dependents

### Upstream / Downstream Map
```
[Upstream Components] → [THIS COMPONENT] → [Downstream Components]
```

### Daily Activity Log
- Total flows passing through, breakdown by type, busiest flows

### "Day in the Life" Narration
A first-person narrative (3-5 paragraphs) from this station's worker, grounded in real code details.

### Health Assessment
- **Performance**: Connection pooling, caching, async patterns, N+1 risks
- **Security**: Input validation, injection risks, secrets management
- **Resilience**: Retry logic, circuit breakers, timeout configs
- Rating: Healthy / Needs Attention / At Risk

## Step 6: Update Visualization

POST a focus mode overlay to highlight this component.

## Step 7: Report

Present the complete focus report and suggest:
- `/backend-factory:trace <flow_name>` to trace any passing flow
- `/backend-factory:focus <upstream_component>` to zoom into a connected station
