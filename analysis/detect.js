/**
 * Backend Factory Visualizer - Framework & Component Detection
 * Scans a project directory to detect backend frameworks and components.
 * Uses only Node.js built-in modules.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Helpers ──

function escapeShellArg(arg) {
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

function grepMultiGlob(pattern, extensions, cwd) {
  const results = [];
  for (const ext of extensions) {
    try {
      const cmd = `find . -type f -name "*.${ext}" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" ! -path "*/__pycache__/*" ! -path "*/.venv/*" ! -path "*/venv/*" -print0 2>/dev/null | xargs -0 grep -nE ${escapeShellArg(pattern)} 2>/dev/null || true`;
      const result = execSync(cmd, { cwd, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 30000 });
      results.push(...parseGrepOutput(result, cwd));
    } catch {
      // continue
    }
  }
  return results;
}

function parseGrepOutput(output, cwd) {
  if (!output || !output.trim()) return [];
  return output.trim().split('\n').filter(Boolean).map(line => {
    const firstColon = line.indexOf(':');
    if (firstColon === -1) return null;
    const secondColon = line.indexOf(':', firstColon + 1);
    if (secondColon === -1) return null;
    const rawPath = line.substring(0, firstColon);
    const lineNum = parseInt(line.substring(firstColon + 1, secondColon), 10);
    const content = line.substring(secondColon + 1).trim();
    if (isNaN(lineNum)) return null;
    let relPath = rawPath;
    if (path.isAbsolute(relPath)) relPath = path.relative(cwd, relPath);
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    return { filePath: relPath, lineNumber: lineNum, content };
  }).filter(Boolean);
}

// ── Framework Detection ──

function detectFramework(projectPath) {
  const pkgJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (allDeps['hono'] || allDeps['@hono/node-server']) {
        return { framework: 'hono', language: 'typescript', meta: { packageName: pkg.name || path.basename(projectPath) } };
      }
      if (allDeps['express']) {
        return { framework: 'express', language: 'javascript', meta: { packageName: pkg.name || path.basename(projectPath) } };
      }
      if (allDeps['fastify']) {
        return { framework: 'express', language: 'javascript', meta: { packageName: pkg.name || path.basename(projectPath) } };
      }
    } catch {}
  }

  // Monorepo: check for apps/api/package.json, apps/server/package.json, etc.
  const monorepoApiDirs = ['apps/api', 'apps/server', 'apps/backend', 'packages/api', 'packages/server'];
  for (const sub of monorepoApiDirs) {
    const subPkg = path.join(projectPath, sub, 'package.json');
    if (fs.existsSync(subPkg)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(subPkg, 'utf-8'));
        const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        if (allDeps['hono'] || allDeps['@hono/node-server']) {
          return { framework: 'hono', language: 'typescript', meta: { packageName: pkg.name || path.basename(projectPath), subdir: sub } };
        }
        if (allDeps['express']) {
          return { framework: 'express', language: 'javascript', meta: { packageName: pkg.name || path.basename(projectPath), subdir: sub } };
        }
        if (allDeps['fastapi']) {
          return { framework: 'fastapi', language: 'python', meta: { packageName: path.basename(projectPath), subdir: sub } };
        }
      } catch {}
    }
  }

  const pythonDeps = readPythonDeps(projectPath);
  if (pythonDeps.has('fastapi')) {
    return { framework: 'fastapi', language: 'python', meta: { packageName: path.basename(projectPath) } };
  }
  if (pythonDeps.has('flask')) {
    return { framework: 'flask', language: 'python', meta: { packageName: path.basename(projectPath) } };
  }

  if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
    return { framework: 'go', language: 'go', meta: { packageName: path.basename(projectPath) } };
  }

  return { framework: 'unknown', language: 'unknown', meta: { packageName: path.basename(projectPath) } };
}

function readPythonDeps(projectPath) {
  const deps = new Set();
  const files = ['requirements.txt', 'Pipfile', 'pyproject.toml'];
  for (const f of files) {
    const fp = path.join(projectPath, f);
    if (!fs.existsSync(fp)) continue;
    const content = fs.readFileSync(fp, 'utf-8').toLowerCase();
    if (content.includes('fastapi')) deps.add('fastapi');
    if (content.includes('flask')) deps.add('flask');
    if (content.includes('django')) deps.add('django');
    // Extract from requirements.txt format
    if (f === 'requirements.txt') {
      content.split('\n').forEach(line => {
        const name = line.trim().split(/[=<>!~\[;#]/)[0].trim().replace(/-/g, '');
        if (name) deps.add(name);
      });
    }
  }
  return deps;
}

// ── Component Detection Patterns ──

const PATTERNS = {
  express: {
    routes:        { pattern: '(app|router)\\.(get|post|put|delete|patch|all)\\s*\\(', globs: ['js', 'ts', 'mjs'] },
    middleware:     { pattern: '(app|router)\\.use\\s*\\(', globs: ['js', 'ts', 'mjs'] },
    database:      { pattern: 'mongoose|sequelize|prisma|knex|typeorm|pg\\.Pool|mongodb|Pool\\(', globs: ['js', 'ts', 'mjs'] },
    cache:         { pattern: 'redis|node-cache|memcached|ioredis', globs: ['js', 'ts', 'mjs'] },
    queues:        { pattern: 'bull|bullmq|amqplib|bee-queue|agenda', globs: ['js', 'ts', 'mjs'] },
    auth:          { pattern: 'passport|jsonwebtoken|jwt\\.sign|jwt\\.verify|bcrypt|express-session', globs: ['js', 'ts', 'mjs'] },
    rateLimit:     { pattern: 'express-rate-limit|rate-limiter|rateLimit', globs: ['js', 'ts', 'mjs'] },
    errorHandlers: { pattern: '(err,\\s*req,\\s*res,\\s*next)', globs: ['js', 'ts', 'mjs'] },
    websocket:     { pattern: 'socket\\.io|ws\\.Server|WebSocket\\.Server', globs: ['js', 'ts', 'mjs'] },
    workers:       { pattern: 'new Worker\\(|process\\(|bull\\.process|agenda\\.define', globs: ['js', 'ts', 'mjs'] },
    cron:          { pattern: 'cron|node-cron|agenda|setInterval.*fetch|schedule', globs: ['js', 'ts', 'mjs'] },
    webhooks:      { pattern: 'webhook|stripe\\.webhooks|svix|WEBHOOK_SECRET', globs: ['js', 'ts', 'mjs'] },
  },
  flask: {
    routes:        { pattern: '@(app|blueprint|bp)\\.(route|get|post|put|delete)', globs: ['py'] },
    middleware:     { pattern: 'before_request|after_request|teardown_request', globs: ['py'] },
    database:      { pattern: 'SQLAlchemy|psycopg2|motor|asyncpg|pymongo|sqlite3', globs: ['py'] },
    cache:         { pattern: 'Flask.Caching|redis\\.Redis|aioredis', globs: ['py'] },
    queues:        { pattern: 'celery|rq\\.Queue|dramatiq|huey', globs: ['py'] },
    auth:          { pattern: 'Flask.Login|flask.jwt|passlib|python.jose', globs: ['py'] },
    rateLimit:     { pattern: 'Flask.Limiter|slowapi|limiter\\.limit', globs: ['py'] },
    errorHandlers: { pattern: '@app\\.errorhandler|exception_handler', globs: ['py'] },
    websocket:     { pattern: 'socketio|websockets\\.serve|@app\\.websocket', globs: ['py'] },
  },
  fastapi: {
    routes:        { pattern: '@(app|router|api_router)\\.(get|post|put|delete|patch)', globs: ['py'] },
    middleware:     { pattern: 'add_middleware|@app\\.middleware', globs: ['py'] },
    database:      { pattern: 'SQLAlchemy|asyncpg|databases|tortoise|motor|pymongo', globs: ['py'] },
    cache:         { pattern: 'aioredis|redis\\.Redis|aiocache', globs: ['py'] },
    queues:        { pattern: 'celery|arq|dramatiq|huey', globs: ['py'] },
    auth:          { pattern: 'fastapi.security|python.jose|passlib|OAuth2PasswordBearer', globs: ['py'] },
    rateLimit:     { pattern: 'slowapi|fastapi.limiter', globs: ['py'] },
    errorHandlers: { pattern: 'exception_handler|HTTPException|@app\\.exception_handler', globs: ['py'] },
    websocket:     { pattern: '@app\\.websocket|WebSocket|websocket_route', globs: ['py'] },
  },
};

// Hono patterns (similar to Express but also covers Hono-specific APIs)
PATTERNS.hono = {
  routes:        { pattern: '(app|router|api)\\.(get|post|put|delete|patch|all|route)\\s*\\(', globs: ['ts', 'js', 'mjs'] },
  middleware:     { pattern: '(app|router|api)\\.use\\s*\\(', globs: ['ts', 'js', 'mjs'] },
  database:      { pattern: 'drizzle|prisma|sequelize|knex|typeorm|pg\\.Pool|postgres\\(|neon|Pool\\(', globs: ['ts', 'js', 'mjs'] },
  cache:         { pattern: 'redis|ioredis|node-cache|memcached|Redis\\(', globs: ['ts', 'js', 'mjs'] },
  queues:        { pattern: 'bull|bullmq|BullMQ|Queue\\(|Worker\\(|amqplib|bee-queue', globs: ['ts', 'js', 'mjs'] },
  auth:          { pattern: 'clerk|verifyToken|jsonwebtoken|jwt\\.sign|jwt\\.verify|bcrypt|passport|OAuth2', globs: ['ts', 'js', 'mjs'] },
  rateLimit:     { pattern: 'rateLimit|rateLimiter|rate.limit|slidingWindow', globs: ['ts', 'js', 'mjs'] },
  errorHandlers: { pattern: 'onError|app\\.onError|HTTPException|errorHandler', globs: ['ts', 'js', 'mjs'] },
  websocket:     { pattern: 'upgradeWebSocket|socket\\.io|ws\\.Server|WebSocket', globs: ['ts', 'js', 'mjs'] },
  workers:       { pattern: 'new Worker\\(|process\\(|Worker\\(.*\\{', globs: ['ts', 'js', 'mjs'] },
  cron:          { pattern: 'cron|node-cron|agenda|setInterval.*fetch|schedule|@Cron', globs: ['ts', 'js', 'mjs'] },
  webhooks:      { pattern: 'webhook|WEBHOOK_SECRET|svix|stripe\\.webhooks|verifyWebhook', globs: ['ts', 'js', 'mjs'] },
};

// Use flask patterns as fallback for fastapi too
PATTERNS.fastapi = { ...PATTERNS.flask, ...PATTERNS.fastapi };

const CATEGORY_TO_TYPE = {
  routes: 'route',
  middleware: 'middleware',
  database: 'database',
  cache: 'cache',
  queues: 'queue',
  auth: 'auth',
  rateLimit: 'ratelimit',
  errorHandlers: 'error_handler',
  websocket: 'websocket',
};

// ── Detect Components ──

function detectComponents(projectPath, framework) {
  const patterns = PATTERNS[framework];
  if (!patterns) return {};

  const components = {};
  for (const [category, config] of Object.entries(patterns)) {
    const raw = grepMultiGlob(config.pattern, config.globs, projectPath);
    components[category] = raw.map(m => ({
      ...m,
      ...parseMatch(category, m, framework),
      category,
    }));
  }
  return components;
}

function parseMatch(category, match, framework) {
  const meta = {};
  const line = match.content;

  if (category === 'routes') {
    if (framework === 'express' || framework === 'hono') {
      const rm = line.match(/(?:app|router|api)\.(get|post|put|delete|patch|all)\s*\(\s*['"`]([^'"`]+)['"`]/i);
      if (rm) { meta.method = rm[1].toUpperCase(); meta.path = rm[2]; }
      const hm = line.match(/['"`][^'"`]+['"`]\s*,\s*([A-Za-z_]\w*)/);
      if (hm) meta.handler = hm[1];
      // Hono .route() mounting
      const routeMount = line.match(/\.route\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (routeMount) { meta.method = 'MOUNT'; meta.path = routeMount[1]; }
    } else {
      const dm = line.match(/@(?:app|blueprint|bp|router|api_router)\.(route|get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/i);
      if (dm) { meta.method = dm[1] === 'route' ? 'GET' : dm[1].toUpperCase(); meta.path = dm[2]; }
    }
  }

  if (category === 'middleware') {
    const mm = line.match(/\.use\s*\(\s*([A-Za-z_]\w*)/);
    if (mm) meta.handler = mm[1];
    // Hono middleware with path: app.use('/path', handler)
    const pm = line.match(/\.use\s*\(\s*['"`][^'"`]+['"`]\s*,\s*([A-Za-z_]\w*)/);
    if (pm) meta.handler = pm[1];
  }

  if (category === 'database') {
    const dbMap = { drizzle: 'drizzle', mongoose: 'mongodb', mongodb: 'mongodb', pymongo: 'mongodb', sequelize: 'sequelize', prisma: 'prisma', knex: 'knex', typeorm: 'typeorm', 'pg.Pool': 'postgresql', Pool: 'postgresql', postgres: 'postgresql', neon: 'postgresql', psycopg2: 'postgresql', asyncpg: 'postgresql', SQLAlchemy: 'sqlalchemy', sqlite3: 'sqlite' };
    for (const [kw, sub] of Object.entries(dbMap)) {
      if (line.includes(kw)) { meta.subType = sub; break; }
    }
  }

  if (category === 'cache') {
    if (/ioredis|redis/i.test(line)) meta.subType = 'redis';
    else if (/memcached/i.test(line)) meta.subType = 'memcached';
    else if (/node-cache/i.test(line)) meta.subType = 'node-cache';
  }

  if (category === 'queues') {
    if (/BullMQ|bullmq/i.test(line)) meta.subType = 'bullmq';
    else if (/Queue\(|Worker\(/i.test(line)) meta.subType = 'bullmq';
    else if (/bull/i.test(line)) meta.subType = 'bull';
    else if (/amqplib/i.test(line)) meta.subType = 'rabbitmq';
    else if (/celery/i.test(line)) meta.subType = 'celery';
    else if (/dramatiq/i.test(line)) meta.subType = 'dramatiq';
  }

  if (category === 'auth') {
    if (/clerk/i.test(line)) meta.subType = 'clerk';
    else if (/passport/i.test(line)) meta.subType = 'passport';
    else if (/jsonwebtoken|jwt/i.test(line)) meta.subType = 'jwt';
    else if (/bcrypt/i.test(line)) meta.subType = 'bcrypt';
    else if (/OAuth2/i.test(line)) meta.subType = 'oauth2';
  }

  return meta;
}

module.exports = { detectFramework, detectComponents, CATEGORY_TO_TYPE };
