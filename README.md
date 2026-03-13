# Backend Come Alive

### Watch your backend architecture come to life as an animated pixel-art factory

[![Claude Code Plugin](https://img.shields.io/badge/Claude_Code-Plugin-blueviolet?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnoiIGZpbGw9IndoaXRlIi8+PC9zdmc+)](https://docs.anthropic.com/en/docs/claude-code)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen?style=flat-square)](package.json)
[![Express.js](https://img.shields.io/badge/Express.js-supported-green?style=flat-square&logo=express)](https://expressjs.com)
[![Flask](https://img.shields.io/badge/Flask-supported-green?style=flat-square&logo=flask)](https://flask.palletsprojects.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-supported-green?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Hono](https://img.shields.io/badge/Hono-supported-green?style=flat-square)](https://hono.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

> **Turn `app.use()` into animation.** Point this Claude Code plugin at any backend codebase and watch pixel-art characters walk through your actual middleware, auth gates, databases, queues, and API calls in real time.

---

## What is this?

**Backend Come Alive** is a [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin that uses 10 specialized AI agents to deeply analyze your backend source code, then renders it as a **retro pixel-art factory** where animated characters show exactly how requests, webhooks, workers, and cron jobs flow through your architecture.

It's not a static diagram. It reads your actual code, traces your actual imports, finds your actual middleware order, and builds an accurate, animated visualization of your backend — complete with an adaptive mood system, service karma scores, failure simulations, and git history time-lapse.

## Quick Start

```bash
# Install via plugin directory
claude --plugin-dir ./backend-factory

# Or install from a marketplace
claude plugin install backend-factory@<marketplace>

# In any backend project, run:
/backend-factory:start
```

That's it. The plugin launches at `http://localhost:7777` with your architecture visualized.

## Skills (Slash Commands)

13 skills give you full control over the visualization. All namespaced under `backend-factory:`:

| Skill | Description |
|-------|-------------|
| `/backend-factory:start` | Full agent-powered analysis + launch visualizer |
| `/backend-factory:stop` | Shut down the visualization server |
| `/backend-factory:analyze` | Re-scan and update the running visualization |
| `/backend-factory:trace` | Deep-trace a specific route or flow |
| `/backend-factory:export` | Export architecture as JSON, HTML snapshot, or Mermaid diagram |
| `/backend-factory:diff` | Compare architecture between two git commits or branches |
| `/backend-factory:simulate` | Run what-if failure scenarios (db-failure, cache-down, auth-outage, etc.) |
| `/backend-factory:narrative` | Generate a multi-chapter narrative report of the architecture |
| `/backend-factory:focus` | Deep-zoom into a specific component for a "day in the life" view |
| `/backend-factory:dataflow` | Trace a data entity's complete lifecycle across the backend |
| `/backend-factory:stress` | Visualize how the factory handles simulated traffic load |
| `/backend-factory:timelapse` | Scrub through git history to see architecture evolution over time |
| `/backend-factory:karma` | Calculate service karma scores and visualize dependency debt |

## 10 Specialized AI Agents

The plugin deploys specialized agents that run in parallel to analyze your codebase from every angle:

| Agent | Role |
|-------|------|
| **framework-detective** | Identifies framework, language, entry points, project personality |
| **flow-tracer** | Traces each route through imports/calls to build accurate execution paths |
| **dependency-mapper** | Maps file-to-file import graph, finds background workers and event flows |
| **schema-explorer** | Discovers DB models, Prisma schemas, ORM definitions, table relationships |
| **middleware-orderer** | Determines exact middleware execution order with gate/processor classification |
| **visualization-builder** | Starts the factory server, sends data, confirms rendering |
| **security-sentinel** | Scans for vulnerabilities, exposed secrets, insecure patterns |
| **performance-pundit** | Identifies bottlenecks, N+1 queries, missing caching, blocking operations |
| **infrastructure-cartographer** | Maps Docker, Kubernetes, Terraform, and CI/CD infrastructure |
| **api-integrator** | Discovers external API calls, third-party SDKs, and webhook subscriptions |

### Cross-Agent Intelligence

Agents don't work in isolation. A [cross-agent protocol](agents/cross-agent-protocol.md) defines how agents enrich each other's output:

- **Security-enriched flow tracing** - flow-tracer reads security-sentinel findings and adds warnings to vulnerable stations
- **Performance-adjusted animations** - bottleneck stations visibly slow characters down; cached endpoints speed them up
- **Infrastructure-aware simulation** - simulate accounts for replica counts, resource limits, and container topology
- **API-risk-enriched narratives** - missing retry logic on external calls produces narration like "Sending courier with NO backup plan..."
- **Karma-informed reporting** - karma scores incorporate vulnerability and bottleneck penalties from other agents

Agents handle missing data gracefully. If an agent wasn't run, others skip its enrichment rather than failing.

## The Factory Visualization

A dark factory floor with glowing conveyor belts connecting stations. Each station represents a real component in your backend:

| Station | Visual | What It Represents |
|---------|--------|-------------------|
| Gate | Archway with pulsing light | HTTP entry/exit points |
| Signpost | Directional sign | Route handlers |
| Conveyor | Belt with sliding dots | Middleware processors |
| Booth | Security booth with flashing light | Auth checkpoints |
| Tollgate | Barrier with traffic lights | Rate limiters |
| Cabinet | Filing cabinet with drawer wiggle | Databases |
| Shelf | Bookshelf with shimmer effect | Cache layers |
| Belt | Conveyor with moving items | Job queues |
| Dish | Satellite dish with signal waves | External APIs |
| Alarm | Rotating alarm light | Error handlers |
| Plugs | Connector with pulse | WebSocket endpoints |
| Workbench | Workstation | Services |

Click any action button in the side panel and watch a pixel character walk through the exact stations your request would hit, with speech bubbles narrating what happens at each stop.

### Interaction

- **Pan and zoom** with mouse (or keyboard: arrows to pan, +/- to zoom, 0/Home to reset)
- **Hover** over stations for tooltips with component details, file paths, and metadata
- **Real-time updates** via SSE with automatic reconnection and visual status indicator
- **Export** architecture as Mermaid diagram (button in UI or `/factory-export mermaid`)

### Factory Mood System

The factory has an adaptive mood reflecting the overall health of the architecture, calculated from combined agent reports:

| Mood | Condition | Visual Effect |
|------|-----------|---------------|
| **THRIVING** | No vulnerabilities, no bottlenecks, good test coverage | Bright lighting, cheerful particles, brisk characters |
| **HEALTHY** | Minor issues only, well-structured codebase | Normal lighting, steady animations |
| **STRESSED** | Multiple bottlenecks or moderate security concerns | Flickering lights, cautious characters, amber glow |
| **STRUGGLING** | Significant debt, missing error handling, N+1 queries | Dim lighting, sluggish characters, stuttering belts |
| **CRITICAL** | Critical vulnerabilities, no auth on sensitive routes | Red emergency lighting, alarm particles, stumbling characters |

The mood updates dynamically as agents report findings and recalculates on `/factory-analyze`.

### Service Karma & Dependency Debt

`/factory-karma` assigns each node a karma score (0-100) and visualizes dependency debt:

- **Karma auras** - nodes glow green (high karma: secure, tested, performant) to red (low karma: vulnerable, slow, untested)
- **Debt tethers** - heavy dependencies rendered as weighted tethers; circular dependencies glow red
- **Karma leaderboard** - sidebar ranks all services, highlighting which components need attention
- Factors: test coverage, security posture, performance profile, error handling, documentation

### Failure Simulation

`/factory-simulate` runs what-if scenarios to test architectural resilience:

| Scenario | What it simulates |
|----------|-------------------|
| `db-failure` | Primary database goes down — shows which routes fail vs. have fallbacks |
| `cache-down` | Cache layer unavailable — reveals degradation vs. breakage |
| `queue-stall` | Message queue stops processing — shows backup and overflow |
| `auth-outage` | Auth provider unreachable — identifies fail-open vs. fail-closed routes |
| `high-traffic` | 10x normal load — uses infrastructure data for scaling simulation |
| `dependency-fail` | External API goes down — shows cascade effects |

Affected stations flash red, characters reroute or pile up, and narration describes the failure cascade.

### Git History Time-Lapse

`/factory-timelapse` scrubs through git history to show how the factory evolved:

- Stations appear, grow, split, merge, or disappear across commits
- New routes fade in with construction animation; removed routes crumble away
- Mood adjusts per commit, showing when architecture improved or degraded
- Scrub bar and floating commit message banners during playback

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

### Action Types

| Type | Character | Example |
|------|-----------|---------|
| Route | Request Worker (blue) | `POST /api/images` |
| Worker | Queue Worker (purple) | `Process rule-sync job` |
| Cron | Cron Worker | `Nightly cleanup` |
| Webhook | Webhook Worker (cyan) | `Docker Hub push alert` |
| Poller | Poller Worker | `Poll blockchain every 15s` |
| Event | Event Worker | `On user.created` |

## Supported Frameworks

| Framework | Language | Detection |
|-----------|----------|-----------|
| **Express.js** | JavaScript/TypeScript | `app.get()`, `app.use()`, `Router()` |
| **Hono** | TypeScript | `new Hono()`, `app.use()`, `basePath()` |
| **Flask** | Python | `@app.route()`, `before_request`, `Blueprint` |
| **FastAPI** | Python | `@app.get()`, `add_middleware()`, `APIRouter` |

### What Gets Detected

Routes, middleware chains, authentication (JWT, Passport, Clerk, bcrypt, OAuth2), rate limiting (express-rate-limit, Redis-backed), databases (PostgreSQL, MongoDB, MySQL, Prisma, Drizzle, Sequelize, Mongoose, TypeORM, raw SQL), caching (Redis, Memcached), job queues (BullMQ, Celery, RabbitMQ), background workers, cron jobs, webhook handlers, pollers, event listeners, external API calls, error handlers, and WebSocket endpoints.

## How It Works

```
/factory-start
  |
  v
[framework-detective] --> identifies framework + entry points + project theme
  |
  v (parallel)
[dependency-mapper]            --> import graph + background workers + event flows
[schema-explorer]              --> DB tables + relationships + volume hints
[middleware-orderer]            --> exact middleware order + factory roles
[security-sentinel]            --> vulnerabilities + insecure patterns
[performance-pundit]           --> bottlenecks + N+1 queries + missing caching
[infrastructure-cartographer]  --> Docker, K8s, Terraform, CI/CD topology
[api-integrator]               --> external APIs + SDKs + webhooks
  |
  v
[flow-tracer] --> verifies each action's flow, enriched by all agent data
  |
  v
[visualization-builder] --> launches factory at localhost:7777
```

## Plugin Structure

```
backend-factory/
├── .claude-plugin/
│   └── plugin.json               # Plugin manifest
├── skills/                        # 13 skills (slash commands)
│   ├── start/
│   │   ├── SKILL.md              # Full analysis + launch
│   │   └── enrichment-guide.md   # Node/action schema reference
│   ├── stop/SKILL.md
│   ├── analyze/SKILL.md
│   ├── trace/SKILL.md
│   ├── export/SKILL.md
│   ├── diff/SKILL.md
│   ├── simulate/SKILL.md
│   ├── narrative/SKILL.md
│   ├── focus/SKILL.md
│   ├── dataflow/SKILL.md
│   ├── stress/SKILL.md
│   ├── timelapse/SKILL.md
│   └── karma/SKILL.md
├── agents/                        # 10 specialized AI agents + protocol
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
│   └── cross-agent-protocol.md   # How agents share data
├── analysis/                      # Node.js analysis scripts
│   ├── detect.js                  # Framework + pattern detection
│   └── analyze.js                 # Architecture model builder
├── visualization/                 # Browser-based factory app (Canvas + SSE)
│   ├── index.html
│   ├── factory.js                 # Factory rendering engine (13 station shapes)
│   ├── characters.js              # Procedural pixel-art characters
│   ├── scenarios.js               # 80+ scenario catalog
│   ├── mood.js                    # Adaptive mood system
│   ├── karma.js                   # Service karma & dependency debt
│   └── styles.css                 # Retro dark theme
└── server/                        # Zero-dependency HTTP + SSE server
    └── server.js                  # localhost:7777
```

## Zero Dependencies

The entire visualization runs on Node.js built-in modules. No `npm install`. No build step. No bundler. Just clone and go.

## Contributing

PRs welcome! Areas that could use love:

- New framework support (NestJS, Django, Spring Boot, Rails)
- New station shapes and idle animations
- More scenario patterns in `scenarios.js`
- Improved flow-tracer accuracy for complex async chains
- Additional failure simulation scenarios
- New agent enrichment patterns

## License

MIT

---

*Built with [Claude Code](https://docs.anthropic.com/en/docs/claude-code). The agents that analyze your code are powered by Claude.*
