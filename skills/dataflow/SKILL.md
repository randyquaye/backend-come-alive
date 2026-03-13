---
name: dataflow
description: "Trace a data entity's complete lifecycle across the entire backend"
argument-hint: "Data entity: 'User', 'Order', 'Payment', 'Session'"
disable-model-invocation: true
context: fork
allowed-tools: Bash, Read, Glob, Grep, Agent
---

# Backend Factory - Data Entity Lifecycle

Trace a single data entity through every layer of the backend to map its complete lifecycle — from birth to death.

## Step 1: Parse Arguments

`$ARGUMENTS` should contain a data entity name (e.g., User, Order, Payment, Session).

If `$ARGUMENTS` is empty, scan the codebase for model/schema definitions and list discovered entities.

## Step 2: Detect Framework & ORM

Quick check for web framework, ORM/DB layer, cache layer, and queue system.

## Step 3: Search for ALL References

Cast a wide net across all layers:
- **DB Schema / Model Definitions**: model files, migrations, schema definitions
- **Route Handlers (CRUD)**: create, read, update, delete endpoints
- **Services & Business Logic**: transformation, validation, state machines
- **Cache References**: cache keys, invalidation, TTLs
- **Queue Jobs**: background processing, bulk operations
- **Webhook Handlers**: incoming webhooks that create/update the entity
- **Relationships**: foreign keys, join tables, embedded documents

## Step 4: Map Complete Lifecycle

Organize references into lifecycle stages:
- **Birth**: creation triggers, validations, side effects
- **Storage**: primary/secondary stores, file storage
- **Transformation**: mutation paths, state transitions, audit trails
- **Access**: read paths, authorization checks
- **Relationships**: parent, child, peer entities, cascading operations
- **Death**: soft delete, hard delete, GDPR erasure, TTL expiry, archival

## Step 5: Generate Visualization

If the factory server is running, POST lifecycle overlay data.

## Step 6: Report with Narration

Present findings in two formats:

### Technical Summary
Entity details, lifecycle stages with file paths, relationship map, potential issues.

### First-Person Narration (from the entity's perspective)
A creative narration told BY the data entity as a factory worker. Use real file names, routes, and field names.

Suggest: "Run `/backend-factory:trace` on specific routes to see the detailed station-by-station path."
