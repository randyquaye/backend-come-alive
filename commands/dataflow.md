---
description: "Trace a data entity's complete lifecycle across the entire backend"
argument-hint: "Data entity: 'User', 'Order', 'Payment', 'Session'"
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Agent"]
---

# Backend Factory - Data Entity Lifecycle

Trace a single data entity through every layer of the backend to map its complete lifecycle — from birth to death.

## Step 1: Parse Arguments

`$ARGUMENTS` should contain a data entity name. Examples:

| Entity | What to search for |
|--------|--------------------|
| `User` | user models, user routes, user services, user cache keys, user jobs |
| `Order` | order schemas, order handlers, order processing, order queues |
| `Payment` | payment records, payment routes, payment webhooks, payment retries |
| `Session` | session stores, session middleware, session TTL, session cleanup |

If `$ARGUMENTS` is empty, scan the codebase for common entity patterns and list discovered entities:
```bash
# Look for model/schema definitions to discover entities
# Check for: Mongoose models, Sequelize models, Prisma schema, TypeORM entities,
# SQLAlchemy models, Django models, Knex migrations, raw SQL CREATE TABLE
```

Ask the user to pick one from the discovered list.

## Step 2: Detect Framework & ORM

Quick check — read `package.json`, `requirements.txt`, `Gemfile`, or equivalent to determine:
- The web framework (Express, Fastify, Django, Rails, etc.)
- The ORM/DB layer (Prisma, Sequelize, Mongoose, TypeORM, SQLAlchemy, Knex, etc.)
- Cache layer (Redis, Memcached, in-memory)
- Queue system (BullMQ, Celery, Sidekiq, RabbitMQ)

## Step 3: Search for ALL References

Search the entire codebase for every reference to the entity. Cast a wide net across all layers:

### 3a: DB Schema / Model Definitions
- Model files (e.g., `models/user.ts`, `User.model.js`, `user.py`)
- Migration files that create/alter the entity's table
- Schema definitions (Prisma schema, Mongoose schema, SQL CREATE TABLE)
- Indexes, constraints, and relations defined on the entity

### 3b: Route Handlers (CRUD)
- Routes that create the entity (POST endpoints, signup flows, import endpoints)
- Routes that read the entity (GET by ID, list/search, profile endpoints)
- Routes that update the entity (PUT/PATCH endpoints, state changes)
- Routes that delete the entity (DELETE endpoints, deactivation)

### 3c: Services & Business Logic
- Service files that transform or process the entity
- Validation logic specific to the entity
- State machines or status transitions (e.g., `pending` -> `active` -> `suspended`)
- Computed properties or derived data

### 3d: Cache References
- Cache keys containing the entity name (e.g., `user:${id}`, `session:${token}`)
- Cache invalidation logic tied to entity mutations
- TTL settings for cached entity data

### 3e: Queue Jobs
- Background jobs that process the entity (e.g., `sendWelcomeEmail`, `processOrder`)
- Jobs that bulk-operate on the entity (cleanup, sync, migration)
- Event-driven jobs triggered by entity changes

### 3f: Webhook Handlers
- Incoming webhooks that create or update the entity (e.g., Stripe payment webhooks)
- Outgoing webhook dispatches when the entity changes

### 3g: Relationships
- Foreign keys and references to/from other entities
- Join tables and many-to-many relationships
- Embedded/nested documents referencing this entity

## Step 4: Map Complete Lifecycle

Organize all discovered references into a lifecycle map:

### Birth (Creation)
- Where and how the entity is first created
- What triggers creation (user action, API call, import, webhook, seeder)
- What validations run at creation time
- What side effects fire on creation (welcome email, audit log, event emission)

### Storage (Persistence)
- Primary data store (which table/collection, which fields)
- Secondary stores (cache keys, session storage, search index)
- File/blob storage references (avatars, attachments)

### Transformation (Mutations)
- Every code path that updates the entity
- State transitions and their triggers
- Computed fields that derive from the entity
- Audit trail / history tracking

### Access (Reads)
- Every code path that reads the entity
- Authorization checks gating access
- Which services depend on reading this entity
- Background jobs that query the entity

### Relationships (Connections)
- Parent entities (what does this belong to?)
- Child entities (what belongs to this?)
- Peer entities (many-to-many connections)
- How cascading operations work (delete user -> delete orders?)

### Death (Deletion / Archival)
- Soft delete logic (is_deleted, deleted_at flags)
- Hard delete endpoints or processes
- GDPR/data erasure flows
- TTL-based expiry (sessions, tokens)
- Archival to cold storage
- Cascade effects on related entities

## Step 5: Generate Visualization

If the factory server is running, POST the lifecycle data as a special overlay:

```bash
curl -s http://localhost:7777/api/architecture | jq '.' > /tmp/factory-current.json
# Build a lifecycle overlay showing:
# - The entity's "birth station" (the route/service that creates it)
# - Storage locations highlighted (DB tables, cache, sessions)
# - Transformation paths (routes/services that mutate it)
# - Access paths (who reads it)
# - Death station (deletion/archival endpoint)
# POST the enriched architecture with lifecycle overlay data
```

Include in the overlay:
- `entityName`: the traced entity
- `lifecycleStages`: array of birth/storage/transformation/access/relationship/death stages
- `touchpoints`: every file and function that interacts with the entity
- `flowPaths`: the routes the entity data travels through the factory

## Step 6: Report with Narration

Present findings in two formats:

### Technical Summary
- Entity: name, primary table/collection, field count
- Lifecycle stages with file paths and line numbers
- Relationship map (entity graph)
- Potential issues: orphaned references, missing cascade deletes, uncached hot paths

### First-Person Narration (from the entity's perspective)

Write a creative narration told BY the data entity, as if it were a worker in the factory:

> "I'm a User record. I was born at the registration desk when someone filled out the signup form. They took my photo (avatar), stamped my badge (ID), and filed me away in the users cabinet. Every time someone needs to know who I am, they pull my folder from the filing cabinet — or if they checked recently, they grab the copy pinned to the corkboard (that's the cache). Sometimes they update my badge — new email, new name — and the clerk has to update both the cabinet AND the corkboard. If I've been idle too long, the night janitor (cron job) checks my last_active date and might move me to the archive room. And if I ever ask to be forgotten... well, the GDPR shredder doesn't mess around."

Adapt the narration to the actual entity and what was discovered. Reference real file names, real routes, and real field names in the narrative. Make it vivid and factory-themed.

Suggest: "Run `/trace` on specific routes to see the detailed station-by-station path for any of these touchpoints."
