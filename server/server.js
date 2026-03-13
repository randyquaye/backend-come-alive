/**
 * Backend Factory Visualizer - Localhost Server
 * Zero-dependency HTTP + SSE server serving the visualization.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 7777;
const STATIC_DIR = path.join(__dirname, '..', 'visualization');

let architectureData = null;
let lastUpdate = null;
let sseClients = [];

const MIME_TYPES = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
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
      architectureData = JSON.parse(body);
      lastUpdate = new Date().toISOString();
      broadcastSSE('architecture_updated', architectureData);
      sendJSON(res, 200, { success: true, lastUpdate });
    } catch {
      sendJSON(res, 400, { error: 'Invalid JSON' });
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

  // GET /api/status
  if (urlPath === '/api/status' && req.method === 'GET') {
    sendJSON(res, 200, { status: 'running', lastUpdate, clients: sseClients.length });
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, '127.0.0.1', () => {
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
  sseClients.forEach(c => { try { c.end(); } catch {} });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
