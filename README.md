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

**Backend Come Alive** is a [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin that uses AI agents to deeply analyze your backend source code, then renders it as a **retro pixel-art factory** where animated characters show exactly how requests, webhooks, workers, and cron jobs flow through your architecture.

It's not a static diagram. It's not a generic flowchart. It reads your actual code, traces your actual imports, finds your actual middleware order, and builds an accurate, animated visualization of your backend.

### Key Features

- **13 unique station types** with pixel-art visuals and idle animations (databases look like filing cabinets, caches look like bookshelves, queues look like conveyor belts)
- **6 action types**: HTTP routes, queue workers, cron jobs, webhooks, pollers, event listeners
- **80+ scenario animations** pattern-matched from your code (auth checks, DB queries, cache hits, webhook validation, etc.)
- **Speech bubbles** with context-aware narration at every station
- **AI-powered analysis** using 6 specialized agents that understand your middleware chains, database schemas, background workers, and dependency graphs
- **Zero dependencies** - pure Node.js, no npm install needed
- **Live updates** via SSE - re-analyze and watch the factory update in real time

## Quick Start

```bash
# Install the plugin
cp -r . ~/.claude/skills/backend-factory

# In any backend project, run:
/factory-start
```

That's it. The plugin launches at `http://localhost:7777` with your architecture visualized.

## What It Looks Like

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

### 6 Specialized AI Agents

The plugin uses specialized agents that run in parallel to deeply analyze your codebase:

| Agent | What It Does |
|-------|-------------|
| **framework-detective** | Identifies framework, language, entry points, project personality |
| **flow-tracer** | Traces each route through imports to build accurate execution paths |
| **dependency-mapper** | Maps the import graph, finds background workers and event flows |
| **schema-explorer** | Discovers database tables, relationships, and access patterns |
| **middleware-orderer** | Determines exact middleware execution order with gate/processor classification |
| **visualization-builder** | Launches the factory server and confirms rendering |

### The Pipeline

```
/factory-start
  |
  v
[framework-detective] --> identifies framework + entry points + project theme
  |
  v (parallel)
[dependency-mapper]  --> import graph + background workers + event flows
[schema-explorer]    --> DB tables + relationships + volume hints
[middleware-orderer]  --> exact middleware order + factory roles
  |
  v
[flow-tracer] --> verifies each action's flow against actual code
  |
  v
[visualization-builder] --> launches factory at localhost:7777
```

### Agent Creative Framework

The agents don't just catalog your code - they **tell the story** of your architecture:

- **Project Personality**: "A paranoid security auditor who checks everything twice"
- **Factory Roles**: "Security Checkpoint - the badge scanner at the factory gate"
- **Station Personalities**: "The database is a grumpy librarian who always finds what you need"
- **First-Person Narration**: "Papers, please! I hand over my JWT badge. The guard squints at it..."
- **Worker Voices**: "I sit by the conveyor belt all day. When a package drops, I grab it."

## Commands

| Command | Description |
|---------|-------------|
| `/factory-start` | Full agent-powered analysis + launch visualizer |
| `/factory-stop` | Shut down the visualization server |
| `/factory-analyze` | Re-scan and update the running visualization |
| `/factory-trace` | Deep-trace a specific route or flow |

## Action Types

The factory doesn't just show HTTP routes. It visualizes all the ways your backend processes work:

| Type | Icon | Character | Example |
|------|------|-----------|---------|
| Route | - | Request Worker (blue) | `POST /api/images` |
| Worker | lightning | Queue Worker (purple) | `Process rule-sync job` |
| Cron | clock | Cron Worker | `Nightly cleanup` |
| Webhook | mailbox | Webhook Worker (cyan) | `Docker Hub push alert` |
| Poller | satellite | Poller Worker | `Poll blockchain every 15s` |
| Event | ear | Event Worker | `On user.created` |

## Plugin Structure

```
backend-come-alive/
├── SKILL.md                      # Main skill definition
├── agents/                       # 6 specialized AI agents
│   ├── framework-detective.md
│   ├── flow-tracer.md
│   ├── dependency-mapper.md
│   ├── schema-explorer.md
│   ├── middleware-orderer.md
│   └── visualization-builder.md
├── commands/                     # Slash commands
│   ├── start.md
│   ├── stop.md
│   ├── analyze.md
│   └── trace.md
├── analysis/                     # Static analysis scripts
│   ├── detect.js                 # Framework + pattern detection
│   └── analyze.js                # Architecture model builder
├── visualization/                # Browser app (Canvas + SSE)
│   ├── index.html
│   ├── factory.js                # Factory rendering engine (13 station shapes)
│   ├── characters.js             # Procedural pixel-art characters
│   ├── scenarios.js              # 80+ scenario catalog
│   └── styles.css                # Retro dark theme
└── server/                       # Zero-dependency HTTP + SSE server
    └── server.js                 # localhost:7777
```

## Zero Dependencies

The entire visualization runs on Node.js built-in modules. No `npm install`. No build step. No bundler. Just clone and go.


## Contributing

PRs welcome! Areas that could use love:

- New framework support (NestJS, Django, Spring Boot, Rails)
- New station shapes and idle animations
- More scenario patterns in `scenarios.js`
- Improved flow-tracer accuracy for complex async chains

## License

MIT

---

*Built with [Claude Code](https://docs.anthropic.com/en/docs/claude-code). The agents that analyze your code are powered by Claude.*
