/**
 * Backend Factory Visualizer - Localhost Server
 * Zero-dependency HTTP + SSE server serving the visualization.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// ── Configuration ──
const CONFIG = {
  port: process.env.PORT || 7777,
  host: '127.0.0.1',
  staticDir: path.join(__dirname, '..', 'visualization'),
  maxPayloadBytes: 5 * 1024 * 1024, // 5 MB
  broadcastDebounceMs: 100,
  shutdownTimeout: 2000,
  cors: {
    allowOrigin: '*',
    allowMethods: 'GET, POST, OPTIONS',
    allowHeaders: 'Content-Type',
  },
};

const PORT = CONFIG.port;
const STATIC_DIR = CONFIG.staticDir;

let architectureData = null;
let lastUpdate = null;
let sseClients = [];
let broadcastDebounceTimer = null;
const BROADCAST_DEBOUNCE_MS = CONFIG.broadcastDebounceMs;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', CONFIG.cors.allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', CONFIG.cors.allowMethods);
  res.setHeader('Access-Control-Allow-Headers', CONFIG.cors.allowHeaders);
}

function sendJSON(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients = sseClients.filter(client => {
    try { client.write(payload); return true; } catch { return false; }
  });
}

/**
 * Debounced SSE broadcast – collapses rapid-fire updates into a single
 * broadcast of the latest data after BROADCAST_DEBOUNCE_MS of quiet time.
 */
function debouncedBroadcastSSE(event, data) {
  if (broadcastDebounceTimer) clearTimeout(broadcastDebounceTimer);
  broadcastDebounceTimer = setTimeout(() => {
    broadcastDebounceTimer = null;
    broadcastSSE(event, data);
  }, BROADCAST_DEBOUNCE_MS);
}

const MAX_PAYLOAD_BYTES = CONFIG.maxPayloadBytes;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_PAYLOAD_BYTES) {
        req.destroy();
        reject(new PayloadTooLargeError());
        return;
      }
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

class PayloadTooLargeError extends Error {
  constructor() { super('Payload exceeds 5 MB limit'); }
}

/**
 * Strip HTML tags and encode dangerous characters to prevent XSS.
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Recursively sanitize all string values in an object/array.
 */
function deepSanitize(obj) {
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  if (obj !== null && typeof obj === 'object') {
    const out = {};
    for (const key of Object.keys(obj)) {
      out[key] = deepSanitize(obj[key]);
    }
    return out;
  }
  return obj;
}

const VALID_NODE_TYPES = [
  'api', 'database', 'queue', 'cache', 'service', 'gateway', 'storage',
  'auth', 'worker', 'scheduler', 'loadbalancer', 'cdn', 'custom',
];

/**
 * Validate the architecture payload shape and required fields.
 * Returns null on success or an error message string on failure.
 */
function validateArchitecturePayload(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return 'Payload must be a JSON object';
  }

  // --- nodes ---
  if (!Array.isArray(data.nodes)) {
    return 'Missing or invalid "nodes" array';
  }
  for (let i = 0; i < data.nodes.length; i++) {
    const n = data.nodes[i];
    if (n === null || typeof n !== 'object' || Array.isArray(n)) {
      return `nodes[${i}] must be an object`;
    }
    if (typeof n.id !== 'string' || n.id.trim() === '') {
      return `nodes[${i}] is missing a valid "id" string`;
    }
    if (typeof n.type !== 'string' || n.type.trim() === '') {
      return `nodes[${i}] is missing a valid "type" string`;
    }
    if (typeof n.label !== 'string' || n.label.trim() === '') {
      return `nodes[${i}] is missing a valid "label" string`;
    }
  }

  // --- edges ---
  if (!Array.isArray(data.edges)) {
    return 'Missing or invalid "edges" array';
  }

  // --- actions ---
  if (!Array.isArray(data.actions)) {
    return 'Missing or invalid "actions" array';
  }

  return null; // valid
}

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const fullPath = path.join(STATIC_DIR, filePath);
  const resolved = path.resolve(fullPath);

  // Path traversal protection
  if (!resolved.startsWith(path.resolve(STATIC_DIR))) {
    sendJSON(res, 403, { error: 'Forbidden' });
    return;
  }

  fs.readFile(resolved, (err, data) => {
    if (err) { sendJSON(res, 404, { error: 'Not found' }); return; }
    const ext = path.extname(resolved);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  corsHeaders(res);

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const urlPath = req.url.split('?')[0];

  // GET /api/architecture
  if (urlPath === '/api/architecture' && req.method === 'GET') {
    sendJSON(res, 200, architectureData || { nodes: [], edges: [], actions: [] });
    return;
  }

  // POST /api/architecture
  if (urlPath === '/api/architecture' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendJSON(res, 400, { error: 'Invalid JSON: body is not valid JSON' });
        return;
      }

      const validationError = validateArchitecturePayload(parsed);
      if (validationError) {
        sendJSON(res, 400, { error: validationError });
        return;
      }

      architectureData = deepSanitize(parsed);
      lastUpdate = new Date().toISOString();
      debouncedBroadcastSSE('architecture_updated', architectureData);
      sendJSON(res, 200, { success: true, lastUpdate });
    } catch (err) {
      if (err instanceof PayloadTooLargeError) {
        sendJSON(res, 413, { error: err.message });
      } else {
        sendJSON(res, 400, { error: 'Invalid request' });
      }
    }
    return;
  }

  // GET /api/events (SSE)
  if (urlPath === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected' })}\n\n`);
    sseClients.push(res);
    req.on('close', () => { sseClients = sseClients.filter(c => c !== res); });
    return;
  }

  // GET /api/export/mermaid
  if (urlPath === '/api/export/mermaid' && req.method === 'GET') {
    const data = architectureData || { nodes: [], edges: [], actions: [] };
    const lines = ['flowchart TD'];

    function mermaidId(id) {
      return id.replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    function mermaidLabel(str) {
      return (str || '').replace(/"/g, '#quot;').replace(/[[\](){}|<>]/g, ' ');
    }

    const shapeMap = {
      database:      (id, l) => `  ${id}[(${l})]`,
      cache:         (id, l) => `  ${id}[(${l})]`,
      queue:         (id, l) => `  ${id}([${l}])`,
      entrypoint:    (id, l) => `  ${id}(((${l})))`,
      exit:          (id, l) => `  ${id}(((${l})))`,
      middleware:    (id, l) => `  ${id}{{${l}}}`,
      auth:          (id, l) => `  ${id}{{${l}}}`,
      ratelimit:     (id, l) => `  ${id}{{${l}}}`,
      error_handler: (id, l) => `  ${id}{{${l}}}`,
      route:         (id, l) => `  ${id}[${l}]`,
      service:       (id, l) => `  ${id}[${l}]`,
      websocket:     (id, l) => `  ${id}([${l}])`,
    };

    (data.nodes || []).forEach(n => {
      const mid = mermaidId(n.id);
      const label = mermaidLabel(n.name || n.label || n.id);
      const shapeFn = shapeMap[n.type] || ((id, l) => `  ${id}[${l}]`);
      lines.push(shapeFn(mid, label));
    });

    const edgeLabelMap = {
      request_flow: '',
      middleware_chain: 'middleware',
      data_access: 'data',
      message_publish: 'publish',
      error_flow: 'error',
    };

    (data.edges || []).forEach(e => {
      const src = mermaidId(e.source);
      const tgt = mermaidId(e.target);
      const label = edgeLabelMap[e.type] || e.type || '';
      if (label) {
        lines.push(`  ${src} -->|${mermaidLabel(label)}| ${tgt}`);
      } else {
        lines.push(`  ${src} --> ${tgt}`);
      }
    });

    const mermaidText = lines.join('\n');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(mermaidText);
    return;
  }

  // GET /api/status
  if (urlPath === '/api/status' && req.method === 'GET') {
    sendJSON(res, 200, { status: 'running', lastUpdate, clients: sseClients.length });
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, CONFIG.host, () => {
  console.log(`\n  ╔══════════════════════════════════════╗`);
  console.log(`  ║   BACKEND FACTORY v1.0               ║`);
  console.log(`  ║   Running at http://localhost:${PORT}   ║`);
  console.log(`  ╚══════════════════════════════════════╝\n`);

  // Auto-open browser
  const openCmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${openCmd} http://localhost:${PORT}`);
});

function shutdown() {
  console.log('\nShutting down Backend Factory...');
  if (broadcastDebounceTimer) clearTimeout(broadcastDebounceTimer);
  sseClients.forEach(c => { try { c.end(); } catch {} });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), CONFIG.shutdownTimeout);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
