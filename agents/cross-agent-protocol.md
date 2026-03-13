# Cross-Agent Interaction Protocol

This document defines how Backend Factory agents share data to produce richer, emergent output.

## Data Location Convention

Each agent stores its findings under specific keys in the architecture JSON:

| Agent | JSON Key | What it contains |
|-------|----------|-----------------|
| framework-detective | `projectPersonality`, `factoryTheme` | Project identity |
| dependency-mapper | `dependency_graph`, `backgroundFlows`, `eventFlows` | File relationships |
| schema-explorer | `schema_report` | DB models and relationships |
| middleware-orderer | `middleware_chains` | Middleware execution order |
| security-sentinel | `security_report` | Vulnerabilities, secrets, posture |
| performance-pundit | `performance_report` | Bottlenecks, latency estimates |
| infrastructure-cartographer | `infrastructure_map` | Deployment topology |
| api-integrator | `external_integrations` | Third-party API dependencies |

## Interaction Patterns

### Pattern 1: Security-Enriched Flow Tracing
- **When**: flow-tracer traces a route
- **Reads**: `security_report.vulnerabilities` — filters by `affected_node_id` matching stations in the flow
- **Output change**: Adds `securityWarning` string to flow step narration
- **Example**: At a vulnerable station: "⚠️ SECURITY: The sentinel flagged this station — SQL injection risk. Walking through carefully..."

### Pattern 2: Performance-Adjusted Animations
- **When**: visualization renders characters
- **Reads**: `performance_report.station_speeds`
- **Output change**: Sets `metadata.latencyMultiplier` per node (0.5 = half speed, 2.0 = double)
- **Example**: Characters visibly slow at bottleneck stations, speed up at cached endpoints

### Pattern 3: Infrastructure-Aware Simulation
- **When**: factory-simulate runs high-traffic scenario
- **Reads**: `infrastructure_map.containers` — gets replica counts, resource limits
- **Output change**: Simulation accounts for scaling (5 replicas = 5 parallel processing lanes)

### Pattern 4: API-Risk-Enriched Narratives
- **When**: flow-tracer encounters an external API call
- **Reads**: `external_integrations` — checks failure_handling, timeout config
- **Output change**: Narration reflects risk. Missing retry: "Sending courier with NO backup plan..."

### Pattern 5: Karma-Informed Reporting
- **When**: factory-karma calculates scores
- **Reads**: `security_report` + `performance_report`
- **Output change**: Karma scores incorporate vulnerability and bottleneck penalties

## Graceful Degradation
Agents MUST handle missing data gracefully. If `security_report` doesn't exist (agent wasn't run), skip security enrichment. Never fail because another agent's data is missing.

## Orchestration
The `/factory-start` command orchestrates agent execution order:
1. First: framework-detective (required for all others)
2. Parallel: dependency-mapper, schema-explorer, middleware-orderer, security-sentinel, performance-pundit, infrastructure-cartographer, api-integrator
3. Sequential: flow-tracer (consults all previous agents' data)
4. Final: visualization-builder (sends enriched data to server)
