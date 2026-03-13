---
name: simulate
description: "Run 'what-if' failure scenarios to see how the architecture handles failures"
argument-hint: "Scenario: 'db-failure', 'cache-down', 'high-traffic', 'auth-breach', 'cascade-failure', 'slow-dependency'"
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep, Agent
---

# Backend Factory - Simulate Failure

Run a predefined failure scenario against the current architecture to visualize how the system behaves under stress.

## Step 1: Check Server

```bash
curl -s http://localhost:7777/api/status
```

If the server is not running, tell the user to run `/backend-factory:start` first.

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

If `$ARGUMENTS` is empty or not recognized, list all scenarios and ask the user to pick one.

If `$ARGUMENTS` is `stop` or `reset`, POST the original architecture back (without `scenario_mode`) and exit.

## Step 3: GET Current Architecture

```bash
ARCH_JSON=$(curl -s http://localhost:7777/api/architecture)
```

## Step 4: Build Scenario

For complete scenario definitions and modification rules, see [scenarios-reference.md](scenarios-reference.md).

Each scenario modifies the architecture JSON by:
- Setting affected node `metadata.status` fields
- Adding `error_at` and `error_message` to affected actions
- Creating special character types for the simulation
- Identifying healthy vs. failing routes

### Scenario Quick Reference

- **db-failure**: DB nodes go `"down"`, routes hitting DB get error paths, routes without DB stay healthy
- **cache-down**: Cache nodes go `"down"`, requests bypass cache to DB, DB gets `"overloaded"`
- **high-traffic**: Traffic multiplied 10x, rate limiters activate, queues back up
- **auth-breach**: Intruder characters try every route, auth middleware blocks, unprotected routes exposed
- **cascade-failure**: Most-connected node fails, failure propagates through dependency levels
- **slow-dependency**: External API latency spikes to 15s, timeout risks surface

## Step 5: Apply Scenario

Add `scenario_mode` to the architecture JSON and POST:

```bash
TMPFILE_SIM=$(mktemp /tmp/factory-sim-XXXXXX.json)
curl -s -X POST http://localhost:7777/api/architecture \
  -H "Content-Type: application/json" \
  -d @"$TMPFILE_SIM"
rm -f "$TMPFILE_SIM"
```

## Step 6: Report

1. **The story** — narrative introduction for the scenario
2. **What's affected** — impacted nodes and routes
3. **What's healthy** — parts that still work
4. **What to watch for** — scenario-specific observation guide
5. **Vulnerabilities found** — architectural weaknesses exposed

End with:
- The simulation is live at http://localhost:7777
- To stop: `/backend-factory:simulate reset`
- To try another: `/backend-factory:simulate <scenario-name>`
