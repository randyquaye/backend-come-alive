#!/usr/bin/env node
/**
 * Backend Factory Visualizer - Architecture Analyzer
 * Usage: node analyze.js <project-path>
 * Outputs JSON architecture model to stdout.
 */

const path = require('path');
const { detectFramework, detectComponents, CATEGORY_TO_TYPE } = require('./detect');

const projectPath = path.resolve(process.argv[2] || '.');

// ── Detect ──
const frameworkInfo = detectFramework(projectPath);
const components = frameworkInfo.framework !== 'unknown'
  ? detectComponents(projectPath, frameworkInfo.framework)
  : {};

// ── Build Architecture Model ──
const nodes = [];
const edges = [];
const actions = [];
const nodeIds = new Set();

function addNode(id, name, type, subType, metadata) {
  if (nodeIds.has(id)) return;
  nodeIds.add(id);
  nodes.push({ id, name, type, subType: subType || type, metadata: metadata || {} });
}

function addEdge(source, target, type) {
  if (!nodeIds.has(source) || !nodeIds.has(target)) return;
  const id = `e-${source}-${target}`;
  edges.push({ id, source, target, type: type || 'request_flow', metadata: {} });
}

// ── Always create entrypoint and exit ──
const port = frameworkInfo.framework === 'hono' ? 4000 : 3000;
addNode('entrypoint', 'HTTP Entry', 'entrypoint', 'http', { port });
addNode('exit', 'Response', 'exit', 'http', {});

// ── Deduplicate: group by unique identity ──
function deduplicateMatches(matches, keyFn) {
  const seen = new Map();
  for (const m of matches) {
    const key = keyFn(m);
    if (!seen.has(key)) seen.set(key, m);
  }
  return Array.from(seen.values());
}

// ── Process Routes ──
const routeMatches = deduplicateMatches(
  components.routes || [],
  m => `${m.method || 'ANY'}-${m.path || m.content}`
);

routeMatches.forEach((m, i) => {
  const method = m.method || 'GET';
  const routePath = m.path || `/route-${i}`;
  const id = `route-${method.toLowerCase()}-${routePath.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const name = `${method} ${routePath}`;
  // Extract a clean file label from the path
  const fileLabel = m.filePath ? m.filePath.replace(/^\.\//, '').replace(/.*\//, '') : '';
  addNode(id, name, 'route', `${frameworkInfo.framework}-route`, {
    method, path: routePath, handler: m.handler,
    filePath: m.filePath, lineNumber: m.lineNumber,
    fileLabel: fileLabel,
    description: `${method} ${routePath} handler` + (fileLabel ? ` in ${fileLabel}` : ''),
  });
});

// ── Process Middleware ──
const mwMatches = deduplicateMatches(
  components.middleware || [],
  m => m.handler || m.content
);

mwMatches.forEach((m, i) => {
  const name = m.handler || `middleware-${i}`;
  const id = `mw-${name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const fileLabel = m.filePath ? m.filePath.replace(/^\.\//, '').replace(/.*\//, '') : '';
  addNode(id, name, 'middleware', 'middleware', {
    handler: m.handler, filePath: m.filePath, lineNumber: m.lineNumber,
    description: `${name} middleware` + (fileLabel ? ` (${fileLabel})` : ''),
  });
});

// ── Process Auth ──
const authMatches = deduplicateMatches(components.auth || [], m => m.subType || m.content);
authMatches.forEach((m, i) => {
  const id = `auth-${m.subType || i}`;
  const authName = m.subType ? m.subType.toUpperCase() + ' Auth' : `Auth ${i}`;
  const fileLabel = m.filePath ? m.filePath.replace(/^\.\//, '').replace(/.*\//, '') : '';
  addNode(id, authName, 'auth', m.subType || 'auth', {
    filePath: m.filePath, lineNumber: m.lineNumber,
    handler: m.handler,
    description: `${authName} verification` + (fileLabel ? ` in ${fileLabel}` : ''),
  });
});

// ── Process Rate Limiting ──
const rlMatches = deduplicateMatches(components.rateLimit || [], m => m.content);
rlMatches.forEach((m, i) => {
  const id = `ratelimit-${i}`;
  addNode(id, 'Rate Limiter', 'ratelimit', 'ratelimit', {
    filePath: m.filePath, lineNumber: m.lineNumber,
  });
});

// ── Process Database ──
const dbMatches = deduplicateMatches(components.database || [], m => m.subType || m.content);
dbMatches.forEach((m, i) => {
  const id = `db-${m.subType || i}`;
  const name = m.subType ? m.subType.charAt(0).toUpperCase() + m.subType.slice(1) : `Database ${i}`;
  addNode(id, name, 'database', m.subType || 'database', {
    filePath: m.filePath, lineNumber: m.lineNumber,
  });
});

// ── Process Cache ──
const cacheMatches = deduplicateMatches(components.cache || [], m => m.subType || m.content);
cacheMatches.forEach((m, i) => {
  const id = `cache-${m.subType || i}`;
  const name = m.subType ? m.subType.charAt(0).toUpperCase() + m.subType.slice(1) + ' Cache' : `Cache ${i}`;
  addNode(id, name, 'cache', m.subType || 'cache', {
    filePath: m.filePath, lineNumber: m.lineNumber,
  });
});

// ── Process Queues ──
const queueMatches = deduplicateMatches(components.queues || [], m => m.subType || m.content);
queueMatches.forEach((m, i) => {
  const id = `queue-${m.subType || i}`;
  const name = m.subType ? m.subType.charAt(0).toUpperCase() + m.subType.slice(1) + ' Queue' : `Queue ${i}`;
  addNode(id, name, 'queue', m.subType || 'queue', {
    filePath: m.filePath, lineNumber: m.lineNumber,
  });
});

// ── Process Error Handlers ──
const errMatches = deduplicateMatches(components.errorHandlers || [], m => m.filePath);
errMatches.forEach((m, i) => {
  const id = `error-handler-${i}`;
  addNode(id, 'Error Handler', 'error_handler', 'error_handler', {
    filePath: m.filePath, lineNumber: m.lineNumber,
  });
});

// ── Process WebSocket ──
const wsMatches = deduplicateMatches(components.websocket || [], m => m.content);
wsMatches.forEach((m, i) => {
  const id = `ws-${i}`;
  addNode(id, 'WebSocket', 'websocket', 'websocket', {
    filePath: m.filePath, lineNumber: m.lineNumber,
  });
});

// ── Process Workers (queue consumers) ──
const workerMatches = deduplicateMatches(components.workers || [], m => m.filePath);
workerMatches.forEach((m, i) => {
  const fileLabel = m.filePath ? m.filePath.replace(/^\.\//, '').replace(/.*\//, '') : '';
  const id = `worker-${i}`;
  addNode(id, `Worker ${fileLabel || i}`, 'service', 'worker', {
    filePath: m.filePath, lineNumber: m.lineNumber,
    description: `Background worker in ${fileLabel}`,
    isBackground: true,
  });
});

// ── Process Cron/Scheduled Jobs ──
const cronMatches = deduplicateMatches(components.cron || [], m => m.filePath);
cronMatches.forEach((m, i) => {
  const fileLabel = m.filePath ? m.filePath.replace(/^\.\//, '').replace(/.*\//, '') : '';
  const id = `cron-${i}`;
  addNode(id, `Cron ${fileLabel || i}`, 'service', 'cron', {
    filePath: m.filePath, lineNumber: m.lineNumber,
    description: `Scheduled task in ${fileLabel}`,
    isBackground: true,
    scenario: 'cron-tick',
  });
});

// ── Process Webhooks ──
const webhookMatches = deduplicateMatches(components.webhooks || [], m => m.filePath);
webhookMatches.forEach((m, i) => {
  const fileLabel = m.filePath ? m.filePath.replace(/^\.\//, '').replace(/.*\//, '') : '';
  const id = `webhook-${i}`;
  addNode(id, `Webhook ${fileLabel || i}`, 'route', 'webhook', {
    filePath: m.filePath, lineNumber: m.lineNumber,
    description: `Webhook handler in ${fileLabel}`,
    scenario: 'webhook-receive',
  });
});

// ══════════════════════════════════════════════
// EDGE GENERATION - Build the factory pipeline
// ══════════════════════════════════════════════

// Collect node IDs by type for easy reference
const nodesByType = {};
nodes.forEach(n => {
  if (!nodesByType[n.type]) nodesByType[n.type] = [];
  nodesByType[n.type].push(n.id);
});

const rlNodes = nodesByType.ratelimit || [];
const authNodes = nodesByType.auth || [];
const mwNodes = nodesByType.middleware || [];
const routeNodes = nodesByType.route || [];
const dbNodes = nodesByType.database || [];
const cacheNodes = nodesByType.cache || [];
const queueNodes = nodesByType.queue || [];
const errNodes = nodesByType.error_handler || [];

// Build chain: entrypoint → ratelimit → auth → middleware → routes → services → db/cache/queue → exit
// Step 1: Entrypoint connects to first layer
const firstLayer = rlNodes.length > 0 ? rlNodes : authNodes.length > 0 ? authNodes : mwNodes.length > 0 ? mwNodes : routeNodes;
firstLayer.forEach(id => addEdge('entrypoint', id, 'request_flow'));

// Step 2: Rate limit → Auth
if (rlNodes.length > 0) {
  const nextLayer = authNodes.length > 0 ? authNodes : mwNodes.length > 0 ? mwNodes : routeNodes;
  rlNodes.forEach(rl => nextLayer.forEach(next => addEdge(rl, next, 'request_flow')));
}

// Step 3: Auth → Middleware
if (authNodes.length > 0) {
  const nextLayer = mwNodes.length > 0 ? mwNodes : routeNodes;
  authNodes.forEach(a => nextLayer.forEach(next => addEdge(a, next, 'middleware_chain')));
}

// Step 4: Middleware → Routes
if (mwNodes.length > 0) {
  mwNodes.forEach(mw => routeNodes.forEach(r => addEdge(mw, r, 'middleware_chain')));
}

// Step 5: Routes → DB/Cache/Queue (all routes connect to all data stores)
routeNodes.forEach(r => {
  dbNodes.forEach(db => addEdge(r, db, 'data_access'));
  cacheNodes.forEach(c => addEdge(r, c, 'data_access'));
  queueNodes.forEach(q => addEdge(r, q, 'message_publish'));
});

// Step 6: Terminal nodes → Exit
const terminalTypes = ['database', 'cache', 'queue', 'websocket'];
const terminalNodes = nodes.filter(n => terminalTypes.includes(n.type));
if (terminalNodes.length > 0) {
  terminalNodes.forEach(n => addEdge(n.id, 'exit', 'request_flow'));
} else {
  // If no data stores, routes connect directly to exit
  routeNodes.forEach(r => addEdge(r, 'exit', 'request_flow'));
}

// Step 7: Error handler connections (routes → error handler → exit)
if (errNodes.length > 0) {
  routeNodes.forEach(r => errNodes.forEach(e => addEdge(r, e, 'error_flow')));
  errNodes.forEach(e => addEdge(e, 'exit', 'error_flow'));
}

// ══════════════════════════════════════════════
// ACTION GENERATION - User-triggerable flows
// ══════════════════════════════════════════════

// Route actions (HTTP endpoints)
routeNodes.forEach(routeId => {
  const routeNode = nodes.find(n => n.id === routeId);
  if (!routeNode) return;

  const method = routeNode.metadata.method || 'GET';
  const routePath = routeNode.metadata.path || routeId;

  // Build the flow path for this route
  const flow = ['entrypoint'];
  rlNodes.forEach(id => flow.push(id));
  authNodes.forEach(id => flow.push(id));
  mwNodes.forEach(id => flow.push(id));
  flow.push(routeId);
  dbNodes.forEach(id => flow.push(id));
  cacheNodes.forEach(id => flow.push(id));
  queueNodes.forEach(id => flow.push(id));
  flow.push('exit');

  actions.push({
    id: `action-${routeId}`,
    name: `${method} ${routePath}`,
    description: `${method} ${routePath}`,
    type: 'route',
    routeId: routeId,
    flow: flow,
  });
});

// Worker actions (queue consumers) — if queues exist, create a worker flow
queueNodes.forEach(qId => {
  const qNode = nodes.find(n => n.id === qId);
  if (!qNode) return;
  const qName = qNode.name || 'Job';
  const flow = [qId];
  dbNodes.forEach(id => flow.push(id));
  flow.push('exit');
  actions.push({
    id: `action-worker-${qId}`,
    name: `Process ${qName}`,
    description: `⚡ Process ${qName}`,
    type: 'worker',
    characterType: 'QueueWorker',
    routeId: qId,
    flow: flow,
  });
});

// If no routes, create a default action
if (actions.length === 0) {
  const allNonMeta = nodes.filter(n => n.type !== 'entrypoint' && n.type !== 'exit').map(n => n.id);
  actions.push({
    id: 'action-default',
    name: 'Default Flow',
    description: 'Full pipeline',
    type: 'route',
    routeId: 'entrypoint',
    flow: ['entrypoint', ...allNonMeta, 'exit'],
  });
}

// ── Output ──
const architecture = {
  name: frameworkInfo.meta.packageName || path.basename(projectPath),
  framework: frameworkInfo.framework,
  language: frameworkInfo.language,
  timestamp: new Date().toISOString(),
  nodes,
  edges,
  actions,
};

console.log(JSON.stringify(architecture, null, 2));
