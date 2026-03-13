---
name: karma
description: "Calculate and visualize service karma scores and dependency debt across the factory"
argument-hint: "Optional: 'report' for detailed text report"
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep, Agent
---

# Backend Factory - Karma & Dependency Debt

Calculate karma scores for every node and map dependency debt across all edges.

## Step 1: Get Architecture

```bash
ARCH_JSON=$(curl -s http://localhost:7777/api/architecture)
```

If the server is not running, tell the user to run `/backend-factory:start` first.

## Step 2: Gather Security & Performance Data

Check for cached agent results:
```bash
SECURITY_JSON=$(curl -s http://localhost:7777/api/security 2>/dev/null || echo '{}')
PERFORMANCE_JSON=$(curl -s http://localhost:7777/api/performance 2>/dev/null || echo '{}')
```

## Step 3: Calculate Karma (0-100)

- **Base**: 20 points
- **+10**: Has `metadata.description`
- **+15**: Type is `auth`
- **+10**: Type is `ratelimit`
- **+15**: Type is `error_handler`
- **+10**: Type is `cache`
- **+5**: Has `metadata.scenario`
- **+15**: Has `metadata.testCoverage`
- **-15 each**: Vulnerabilities targeting this node
- **-10 each**: Bottlenecks targeting this node

| Score   | Tier     | Visual                              |
|---------|----------|-------------------------------------|
| 80-100  | Hero     | Gold radiant glow                   |
| 60-79   | Healthy  | Green glow                          |
| 40-59   | Neutral  | No aura                             |
| 20-39   | At Risk  | Amber pulse                         |
| 0-19    | Critical | Red danger pulse                    |

## Step 4: Calculate Debt for All Edges

Source karma < 40: debt += (40 - sourceKarma) * 1.5
Source karma < 20: debt += 20 additional

## Step 5: Generate Report

Identify Top 3 Heroes, Top 3 At-Risk, Average Karma, and Total Debt.

## Step 6: POST to Server

```bash
curl -s -X POST http://localhost:7777/api/karma \
  -H "Content-Type: application/json" \
  -d "$KARMA_JSON"
```

## Step 7: Report with Narration

Present karma scores with factory-themed narration. If `$ARGUMENTS` contains "report", output the full detailed text report.
