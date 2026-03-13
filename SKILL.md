---
name: backend-factory
description: >
  Visualize any backend architecture as an animated retro pixel-art factory. Scans Express.js, Flask,
  and FastAPI codebases detecting routes, middleware, databases, caches, queues, auth, rate limiting,
  and error handlers. Launches a localhost web app with animated pixel characters showing how requests
  flow through the backend pipeline. Use when the user says "visualize backend", "show architecture",
  "factory", "backend factory", or wants to see their backend as a visual diagram.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent
user-invocable: true
---

# Backend Factory Visualizer

Visualize any backend as a retro pixel-art factory with animated characters showing request flows.

## Available Commands

| Command | Description |
|---------|-------------|
| `/backend-factory:start` | Full analysis + launch visualization server |
| `/backend-factory:stop` | Shut down the server |
| `/backend-factory:analyze` | Re-scan and update the running visualization |
| `/backend-factory:trace` | Deep-trace a specific route's flow |
| `/backend-factory:export` | Export architecture as JSON, HTML, or Mermaid diagram |
| `/backend-factory:diff` | Compare architecture between git commits |
| `/backend-factory:simulate` | Run failure scenarios (db-failure, cache-down, etc.) |
| `/backend-factory:narrative` | Generate multi-chapter factory story |
| `/backend-factory:focus` | Deep-zoom into specific component |
| `/backend-factory:dataflow` | Trace data entity lifecycle |
| `/backend-factory:stress` | Visualize load handling |
| `/backend-factory:timelapse` | Git history time-lapse |
| `/backend-factory:karma` | Service karma & dependency debt |

## Specialized Agents

This plugin uses 10 specialized agents that can be launched in parallel:

| Agent | Role | Model |
|-------|------|-------|
| **framework-detective** | Identifies framework, language, entry points, project structure | sonnet |
| **flow-tracer** | Traces a single route through imports/calls to build accurate flow | sonnet |
| **dependency-mapper** | Maps file-to-file import/require dependencies | sonnet |
| **schema-explorer** | Finds DB models, Prisma schemas, ORM definitions | sonnet |
| **middleware-orderer** | Determines exact middleware execution order | inherit |
| **visualization-builder** | Starts server, sends data, confirms rendering | inherit |
| **security-sentinel** | Scans for vulnerabilities, secrets, insecure patterns | sonnet |
| **performance-pundit** | Identifies bottlenecks, N+1 queries, missing caching | sonnet |
| **infrastructure-cartographer** | Maps Docker, K8s, Terraform, CI/CD infrastructure | sonnet |
| **api-integrator** | Discovers external API calls, SDKs, webhooks | sonnet |

## How It Works

### Architecture Detection
1. **framework-detective** identifies the framework and project layout
2. In parallel: **dependency-mapper**, **schema-explorer**, **middleware-orderer**, **security-sentinel**, **performance-pundit**, **infrastructure-cartographer**, and **api-integrator** analyze the codebase
3. **flow-tracer** consults all previous agents' data to build enriched route flows
4. Results are combined into a JSON architecture model (nodes, edges, actions)
5. **visualization-builder** launches the factory at http://localhost:7777

### Cross-Agent Intelligence

Agents do not work in isolation. The cross-agent interaction protocol (`agents/cross-agent-protocol.md`) defines how agents enrich each other's output to produce emergent intelligence:

- **Security-enriched flow tracing**: When flow-tracer traces a route, it reads `security_report.vulnerabilities` and adds warnings to stations flagged by the security-sentinel. Characters narrate security risks as they walk through vulnerable stations.
- **Performance-adjusted animations**: The visualization reads `performance_report.station_speeds` and adjusts character walking speed per node. Bottleneck stations visibly slow characters down; cached endpoints speed them up.
- **Infrastructure-aware simulation**: The simulate command reads `infrastructure_map.containers` to account for replica counts and resource limits. Five replicas means five parallel processing lanes in the factory.
- **API-risk-enriched narratives**: When flow-tracer encounters an external API call, it checks `external_integrations` for failure handling and timeout config. Missing retry logic produces narration like "Sending courier with NO backup plan..."
- **Karma-informed reporting**: The karma command reads both `security_report` and `performance_report` to incorporate vulnerability and bottleneck penalties into karma scores.

Agents handle missing data gracefully. If security-sentinel was never run, flow-tracer skips security enrichment rather than failing.

### The Factory Visualization
- Dark factory floor with grid lines and glowing conveyor belts
- Each backend component is a "station" (route, middleware, database, cache, queue, etc.)
- Stations are connected by animated conveyor belt paths
- Clicking action buttons spawns pixel-art worker characters
- Characters walk through the factory pipeline showing request flow
- Particle effects when characters interact with stations
- Pan and zoom with mouse (or keyboard: arrows to pan, +/- to zoom, 0/Home to reset)
- Hover over stations for tooltips showing component details, file paths, and metadata
- Real-time updates via SSE with automatic reconnection and visual status indicator
- Export architecture as Mermaid diagram (button in UI or `/factory-export mermaid`)
- Dirty-flag rendering skips redraws when scene is idle for better performance

### Factory Mood System

The factory has an adaptive mood that reflects the overall health of the architecture. The mood is calculated from combined agent reports and drives the visual atmosphere of the entire scene:

| Mood | Condition | Visual Effect |
|------|-----------|---------------|
| **THRIVING** | No vulnerabilities, no bottlenecks, good test coverage | Bright lighting, cheerful particle effects, characters walk briskly |
| **HEALTHY** | Minor issues only, well-structured codebase | Normal lighting, steady animations |
| **STRESSED** | Multiple performance bottlenecks or moderate security concerns | Flickering lights, characters move cautiously, amber warning glow |
| **STRUGGLING** | Significant debt, missing error handling, N+1 queries | Dim lighting, sluggish characters, conveyor belts stutter |
| **CRITICAL** | Critical vulnerabilities, no auth on sensitive routes, major bottlenecks | Red emergency lighting, alarm particles, characters stumble |

The mood updates dynamically as agents report their findings and recalculates when `/backend-factory:analyze` is run.

### Service Karma & Dependency Debt

The `/backend-factory:karma` command assigns each service node a karma score and visualizes dependency debt:

- **Karma auras**: Each node glows with a colored aura reflecting its health. Green aura = high karma (well-tested, secure, performant). Red aura = low karma (vulnerable, slow, untested).
- **Karma calculation**: Scores factor in test coverage, security posture (from security-sentinel), performance profile (from performance-pundit), error handling completeness, and documentation presence.
- **Debt tethers**: Heavy dependencies are visualized as weighted tethers between nodes. The thicker and darker the tether, the higher the coupling debt. Circular dependencies show as glowing red loops.
- **Karma leaderboard**: A sidebar ranks all services from highest to lowest karma, highlighting which components need the most attention.

### Time-Lapse History

The `/backend-factory:timelapse` command scrubs through git history to show how the factory evolved over time:

- Walks git commits (configurable range) and reconstructs the architecture at each point
- The factory animates through time: stations appear, grow, split, merge, or disappear
- New routes fade in with a construction animation; removed routes crumble away
- The mood system adjusts per commit, showing when the architecture improved or degraded
- Scrub bar at the bottom lets users jump to any point in history
- Commit messages display as floating banners during playback

### Failure Simulation

The `/backend-factory:simulate` command runs what-if scenarios to test architectural resilience:

| Scenario | What it simulates |
|----------|-------------------|
| `db-failure` | Primary database goes down — shows which routes fail, which have fallbacks |
| `cache-down` | Cache layer unavailable — reveals routes that degrade vs. routes that break |
| `queue-stall` | Message queue stops processing — shows backup and overflow behavior |
| `auth-outage` | Auth provider unreachable — identifies routes that fail-open vs. fail-closed |
| `high-traffic` | 10x normal load — uses infrastructure-cartographer data for scaling simulation |
| `dependency-fail` | External API goes down — uses api-integrator data to show cascade effects |

During simulation, affected stations flash red, characters reroute or pile up at blocked stations, and a narration describes the failure cascade. The simulation produces a resilience report scoring each route's ability to handle the failure.

### Character Roster

| Character | Color | Role |
|-----------|-------|------|
| Request Worker | Blue | General request processing |
| Error Handler | Red | Error/exception paths |
| Cache Manager | Green | Cache operations |
| DB Operator | Gold | Database queries |
| Queue Worker | Purple | Queue processing |
| Rate Limiter | Orange | Rate limit gates |
| Auth Guard | Grey | Authentication checkpoints |
| Response Carrier | Cyan | Response returning to client |

## Supported Frameworks (V1)

- **Express.js** (Node.js / TypeScript)
- **Flask** (Python)
- **FastAPI** (Python)

## Plugin Structure

```
backend-factory/
├── .claude-plugin/plugin.json    # Plugin manifest
├── SKILL.md                      # This file
├── agents/                       # 10 specialized agents + protocol
│   ├── framework-detective.md
│   ├── flow-tracer.md
│   ├── dependency-mapper.md
│   ├── schema-explorer.md
│   ├── middleware-orderer.md
│   ├── visualization-builder.md
│   ├── security-sentinel.md
│   ├── performance-pundit.md
│   ├── infrastructure-cartographer.md
│   ├── api-integrator.md
│   └── cross-agent-protocol.md  # How agents share data
├── commands/                     # 13 slash commands
│   ├── start.md
│   ├── stop.md
│   ├── analyze.md
│   ├── trace.md
│   ├── export.md
│   ├── diff.md
│   ├── simulate.md
│   ├── narrative.md
│   ├── focus.md
│   ├── dataflow.md
│   ├── stress.md
│   ├── timelapse.md
│   └── karma.md
├── analysis/                     # Node.js analysis scripts
│   ├── detect.js
│   └── analyze.js
├── visualization/                # Browser-based factory app
│   ├── index.html
│   ├── factory.js
│   ├── characters.js
│   ├── scenarios.js
│   └── styles.css
└── server/                       # Zero-dependency localhost server
    ├── server.js
    └── package.json
```
