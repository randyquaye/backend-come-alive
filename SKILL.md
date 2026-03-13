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

## Specialized Agents

This plugin uses 6 specialized agents that can be launched in parallel:

| Agent | Role | Model |
|-------|------|-------|
| **framework-detective** | Identifies framework, language, entry points, project structure | sonnet |
| **flow-tracer** | Traces a single route through imports/calls to build accurate flow | sonnet |
| **dependency-mapper** | Maps file-to-file import/require dependencies | sonnet |
| **schema-explorer** | Finds DB models, Prisma schemas, ORM definitions | sonnet |
| **middleware-orderer** | Determines exact middleware execution order | inherit |
| **visualization-builder** | Starts server, sends data, confirms rendering | inherit |

## How It Works

### Architecture Detection
1. **framework-detective** identifies the framework and project layout
2. In parallel: **dependency-mapper**, **schema-explorer**, and **middleware-orderer** analyze the codebase
3. Results are combined into a JSON architecture model (nodes, edges, actions)
4. **visualization-builder** launches the factory at http://localhost:7777

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
├── agents/                       # 6 specialized agents
│   ├── framework-detective.md
│   ├── flow-tracer.md
│   ├── dependency-mapper.md
│   ├── schema-explorer.md
│   ├── middleware-orderer.md
│   └── visualization-builder.md
├── commands/                     # 5 slash commands
│   ├── start.md
│   ├── stop.md
│   ├── analyze.md
│   ├── trace.md
│   └── export.md
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
