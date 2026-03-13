---
description: "Calculate and visualize service karma scores and dependency debt across the factory"
argument-hint: "Optional: 'report' for detailed text report"
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Agent"]
---

# Backend Factory - Karma & Dependency Debt

Calculate karma scores for every node in the architecture and map dependency debt across all edges. Karma reflects how well each service is documented, secured, tested, and maintained. Debt flows from low-karma sources to their consumers.

## Step 1: Get Architecture

Fetch the current architecture from the running server:

```bash
ARCH_JSON=$(curl -s http://localhost:7777/api/architecture)
```

If the server is not running, tell the user to run `/factory-start` first.

Parse the nodes and edges from the response.

## Step 2: Gather Security & Performance Data

Check if security-sentinel and performance-pundit agents have already produced data. Look for cached results:

```bash
SECURITY_JSON=$(curl -s http://localhost:7777/api/security 2>/dev/null || echo '{}')
PERFORMANCE_JSON=$(curl -s http://localhost:7777/api/performance 2>/dev/null || echo '{}')
```

If these endpoints return empty or error, proceed without them — karma will be calculated from node metadata alone (no security/performance penalties applied).

## Step 3: Calculate Karma for All Nodes

For each node in the architecture, compute karma score (0-100):

- **Base**: 20 points
- **+10**: Has `metadata.description` (documented)
- **+15**: Type is `auth` (authentication protection)
- **+10**: Type is `ratelimit` (rate limiting)
- **+15**: Type is `error_handler` (handles errors)
- **+10**: Type is `cache` (caching present)
- **+5**: Has `metadata.scenario` (scenario mapping)
- **+15**: Has `metadata.testCoverage` (tested)
- **-15 each**: Vulnerabilities targeting this node (from security data)
- **-10 each**: Bottlenecks targeting this node (from performance data)

Karma tiers:
| Score   | Tier     | Visual                                  |
|---------|----------|-----------------------------------------|
| 80-100  | Hero     | Gold radiant glow, upward sparkles      |
| 60-79   | Healthy  | Green healthy glow                      |
| 40-59   | Neutral  | No visible aura                         |
| 20-39   | At Risk  | Amber warning pulse                     |
| 0-19    | Critical | Red danger pulse, falling particles     |

## Step 4: Calculate Debt for All Edges

For each edge, calculate dependency debt based on the source node's karma:

- If source karma < 40: debt += (40 - sourceKarma) * 1.5
- If source karma < 20: debt += 20 (critical source = heavy debt)
- Debt is clamped to 0-100

Debt is visualized as dashed tethers between nodes:
- **0-25**: Green (healthy)
- **26-50**: Yellow (moderate)
- **51-75**: Orange (high)
- **76-100**: Red, pulsing (critical)

## Step 5: Generate Karma Report

Identify:
- **Top 3 Heroes**: Highest karma nodes
- **Top 3 At-Risk**: Lowest karma nodes
- **Average Karma**: Mean score across all nodes
- **Total Debt**: Sum of all edge debt scores

## Step 6: POST Karma Data to Server

Push the karma results so the visualization can render auras and tethers:

```bash
curl -s -X POST http://localhost:7777/api/karma \
  -H "Content-Type: application/json" \
  -d "$KARMA_JSON"
```

## Step 7: Report with Creative Narration

Present the karma report using factory-themed narration. Example:

```
KARMA REPORT
═══════════════════════════════════════════

The factory hums with righteous energy. Average karma: 72/100.

--- HEROES ---
The auth checkpoint shines with golden aura (score: 92, tier: Hero)
The rate limiter stands tall with radiant glow (score: 85, tier: Hero)
The error handler catches all with grace (score: 80, tier: Hero)

--- AT RISK ---
The /users route flickers with amber warning (score: 35, tier: At Risk)
The external API caller pulses with dangerous red (score: 15, tier: Critical)
The raw SQL query sits in neutral shadows (score: 42, tier: Neutral)

--- DEPENDENCY DEBT ---
Total accumulated debt: 127 units.
Some debt tethers glow orange between stations. Worth addressing soon.
The external API caller spreads debt to 4 downstream consumers.
```

If `$ARGUMENTS` contains "report", output the full detailed text report. Otherwise, output a concise summary and remind the user to check the visualization at http://localhost:7777 where karma auras and debt tethers are now visible.
