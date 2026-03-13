---
description: "Generate a creative multi-chapter narrative report of the factory's architecture"
argument-hint: "Optional: 'onboarding' for new dev guide, 'executive' for high-level summary, 'incident' for resilience analysis"
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Agent"]
---

# Backend Factory - Narrative Report

Generate a rich, multi-chapter narrative report of the backend architecture, told from the perspective of factory workers at each station.

## Step 1: Parse Arguments

`$ARGUMENTS` determines the narrative mode:

| Argument | Mode | Tone & Focus |
|----------|------|--------------|
| `onboarding` | New Worker Welcome Guide | Friendly, detailed, explains everything for a newcomer |
| `executive` | Factory Inspector's Report | Metrics-focused, efficiency ratings, capacity concerns |
| `incident` | Resilience & Incident Review | What could go wrong, single points of failure, blast radius |
| *(empty)* | Full Creative Narrative | Complete storytelling tour of the entire factory |

If `$ARGUMENTS` is empty or doesn't match a known mode, use the **default** full narrative mode.

## Step 2: Get Architecture from Server

Fetch the current architecture from the running factory:

```bash
curl -s http://localhost:7777/api/architecture > /tmp/factory-narrative-arch.json
```

If the server is not running, inform the user to run `/factory-start` first and stop.

Validate that the architecture has nodes and actions:
```bash
curl -s http://localhost:7777/api/architecture | jq '{nodes: (.nodes | length), actions: (.actions | length)}'
```

## Step 3: Read Key Source Files

Using the architecture JSON, identify and read the most important source files to gather real details for the narrative:

1. **Entry point file** — the main app/server file (from the entrypoint node or first route's filePath)
2. **Auth middleware** — any node with type `auth` or name containing "auth"
3. **Database config/models** — files referenced by database nodes
4. **Queue/worker files** — files referenced by worker and queue nodes
5. **Cron/scheduler files** — files referenced by cron nodes
6. **Webhook handlers** — files referenced by webhook actions

Read up to 10 key files to ground the narrative in real code details. Use `metadata.filePath` from the architecture nodes to find them.

## Step 4: Generate Narrative

Build a multi-chapter narrative report. Each chapter is narrated in first person by a different factory worker who operates that station. Use real details from the source code — file names, function names, table names, queue names, cron expressions — woven into the storytelling.

### Chapter 1: The Factory Overview
*Narrator: The Factory Manager*

- What this factory produces (the product/API purpose)
- The tech stack (framework, language, major dependencies)
- The factory's personality — is it a lean startup operation or a massive industrial complex?
- How many stations, workers, and conveyor belts it has
- Opening hours (is it always running? does it have quiet periods?)

### Chapter 2: The Front Gate
*Narrator: The Gate Guard*

- Entry points — what ports, what protocols
- Authentication methods — JWT, API keys, OAuth, session cookies
- Rate limiting — who gets throttled and how
- CORS policy — who's allowed in from outside
- The guard's daily routine: "Every request that comes through my gate..."

### Chapter 3: The Production Floor
*Narrator: The Floor Supervisor*

- All routes and handlers, organized by resource/module
- The busiest stations (routes with the most complex flows)
- How requests flow from gate to floor to warehouse
- Which stations work together most often
- Any unusual or interesting route patterns

### Chapter 4: The Warehouse
*Narrator: The Warehouse Keeper*

- Database type and ORM
- All tables/collections, organized by domain
- Key relationships between tables
- The biggest tables (most columns, most referenced)
- Migration history if visible
- "Let me show you where we keep things..."

### Chapter 5: The Speed Depot
*Narrator: The Cache Operator*

- Caching strategy (Redis, in-memory, CDN)
- What gets cached and for how long
- Cache invalidation patterns
- Hit/miss expectations
- "Speed is my department. Here's how I keep things fast..."

If no cache nodes exist, this chapter should note the absence: "We don't have a Speed Depot yet — everything goes straight to the Warehouse."

### Chapter 6: The Conveyor Belt System
*Narrator: The Conveyor Mechanic*

- Queue technology (BullMQ, RabbitMQ, SQS, etc.)
- All queue names and what jobs they carry
- Worker assignments — who processes what
- Job retry policies, dead letter queues
- "I keep the belts moving. Here's how the async work flows..."

If no queue nodes exist, note: "This factory runs synchronous — no conveyor belts yet."

### Chapter 7: The Night Shift
*Narrator: The Night Shift Supervisor*

- All cron jobs and scheduled tasks
- Their schedules in human-readable form
- What each job does and why it runs on a schedule
- Dependencies between scheduled tasks
- "When the day shift goes home, my team takes over..."

If no cron nodes exist, note: "No night shift here — this factory only works when requests come in."

### Chapter 8: The Mail Room
*Narrator: The Mail Room Clerk*

- All webhook receivers — what external services send mail here
- All pollers — what external services this factory checks on
- All event listeners — internal pub/sub communication
- External API integrations
- "I handle everything that comes from outside the factory walls..."

If no webhook/poller/event nodes exist, note: "Our mail room is quiet — no external integrations detected."

### Chapter 9: The Security Checkpoint
*Narrator: The Security Chief*

- Authentication architecture in detail
- Authorization patterns (RBAC, ABAC, org-scoped)
- Input validation strategy
- Known security middleware (helmet, cors, rate limiting)
- Secrets management (env vars, vault, etc.)
- "Nothing gets past my team without proper clearance..."

### Chapter 10: The Emergency Plan
*Narrator: The Safety Officer*

- Error handling patterns (global error handler, try/catch, error middleware)
- Retry logic and circuit breakers
- Health check endpoints
- Logging and monitoring setup
- Graceful shutdown handling
- Single points of failure
- "If something goes wrong, here's what happens..."

## Step 5: Apply Mode-Specific Adjustments

### Onboarding Mode
Wrap the entire narrative as a **Welcome Guide for New Factory Workers**:
- Add a warm introduction: "Welcome to the team! Let me show you around..."
- Each chapter should explain concepts as if the reader has never seen this codebase
- Include "Where to Find Things" callouts with actual file paths
- End with a "Your First Day Checklist" — key files to read, env vars to set, commands to run
- Tone: encouraging, thorough, no jargon without explanation

### Executive Mode
Reframe the narrative as a **Factory Inspector's Efficiency Report**:
- Lead with metrics: node counts, route counts, middleware depth, DB table count
- Each chapter should include an efficiency rating (1-5 gears)
- Flag potential bottlenecks and over-engineered sections
- Include a "Factory Health Score" summary at the end
- Highlight what's missing (no caching? no queues? no health checks?)
- Tone: professional, metrics-driven, actionable recommendations

### Incident Mode
Reframe as a **Resilience & Incident Preparedness Review**:
- Each chapter should answer: "What happens when THIS breaks?"
- Identify single points of failure at each station
- Assess blast radius — if the database goes down, what else fails?
- Check for retry logic, circuit breakers, graceful degradation
- Rate each station's resilience (fragile / adequate / robust)
- End with a "Top 5 Risks" list and recommended mitigations
- Tone: serious, analytical, focused on failure scenarios

### Default Mode
Full creative narrative with all the storytelling flair. No constraints on tone — make it engaging, vivid, and fun to read. The factory should feel alive.

## Step 6: Output as Markdown

Format the complete narrative as a well-structured markdown document with:
- A title banner with the factory name and mode
- Table of contents linking to each chapter
- Clear chapter headings with narrator attribution
- Code references formatted as inline code (`filePath`, `functionName`)
- Key stats in callout blocks
- A closing summary

Print the full narrative to the console for the user to read.

## Step 7: POST Summary Overlay to Server

If the factory server is running, POST a summary overlay so the visualization reflects the narrative mode:

```bash
curl -s -X POST http://localhost:7777/api/overlay \
  -H "Content-Type: application/json" \
  -d '{
    "type": "narrative",
    "mode": "<detected_mode>",
    "title": "Factory Narrative: <Mode Name>",
    "summary": "<2-3 sentence summary of the narrative>",
    "chapterHighlights": [
      {"chapter": 1, "label": "Overview", "nodeIds": ["entrypoint"]},
      {"chapter": 2, "label": "Front Gate", "nodeIds": ["auth-*", "ratelimit-*"]},
      {"chapter": 3, "label": "Production Floor", "nodeIds": ["route-*"]},
      {"chapter": 4, "label": "Warehouse", "nodeIds": ["db-*"]},
      {"chapter": 5, "label": "Speed Depot", "nodeIds": ["cache-*"]},
      {"chapter": 6, "label": "Conveyor Belts", "nodeIds": ["queue-*", "worker-*"]},
      {"chapter": 7, "label": "Night Shift", "nodeIds": ["cron-*"]},
      {"chapter": 8, "label": "Mail Room", "nodeIds": ["webhook-*", "poller-*", "event-*"]},
      {"chapter": 9, "label": "Security", "nodeIds": ["auth-*"]},
      {"chapter": 10, "label": "Emergency Plan", "nodeIds": ["*"]}
    ]
  }'
```

## Step 8: Report to User

Summarize:
- Which narrative mode was used
- How many chapters were generated
- Key highlights from each chapter (one line each)
- Any notable findings (missing components, security concerns, architectural patterns)
- Suggest: "Run `/factory-narrative incident` to see how this factory handles failures."
- Suggest: "Run `/factory-focus <component>` to deep-dive into any station mentioned in the narrative."
