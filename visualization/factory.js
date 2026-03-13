/**
 * Backend Factory Visualizer - Factory Rendering Engine
 * Renders the factory scene on HTML5 Canvas with animated characters
 */

(function() {
  'use strict';

  // ── Configuration ──
  const CONFIG = {
    // Grid
    gridSize: 40,

    // Layout
    stationWidth: 120,
    stationHeight: 70,
    layerGap: 160,
    nodeGap: 80,
    marginX: 80,
    marginY: 80,

    // Animation / movement
    characterSpeed: 1.2,
    defaultDwellMultiplier: 1.0,
    minDwellFrames: 30,
    defaultDwellFrames: 120,
    dbTimingJitter: 90,
    externalTimingJitter: 60,

    // Dwell speed slider mapping
    dwellSliderMin: 0.33,     // multiplier at slider 0  (3x slower)
    dwellSliderMid: 1.0,      // multiplier at slider 50 (normal)
    dwellSliderMax: 5.0,      // multiplier at slider 100 (5x faster)

    // Color palette
    colors: {
      floor: '#0d0d1a',
      grid: '#151528',
      conveyor: '#1a2a1f',
      conveyorLine: '#2a4a3a',
      conveyorDot: '#33ff99',
      stationBg: '#1a1a2e',
      stationBorder: '#2a4a3a',
      stationLabel: '#88ffcc',
      entryGate: '#4a9eff',
      exitGate: '#4af5ff',
      errorStation: '#ff4a4a',
      particle: '#ffaa33',
      pathLine: '#1a3a2a',
    },
  };

  const COLORS = CONFIG.colors;

  // Station visual configs
  const STATION_STYLES = {
    entrypoint:    { icon: '▶', color: '#4a9eff', label: 'ENTRY',  shape: 'gate' },
    route:         { icon: '◆', color: '#4a9eff', label: 'ROUTE',  shape: 'signpost' },
    middleware:     { icon: '⚙', color: '#88ffcc', label: 'MW',     shape: 'conveyor' },
    auth:          { icon: '🛡', color: '#cccccc', label: 'AUTH',   shape: 'booth' },
    ratelimit:     { icon: '⏱', color: '#e07a3a', label: 'LIMIT',  shape: 'tollgate' },
    controller:    { icon: '◈', color: '#4a9eff', label: 'CTRL',   shape: 'workbench' },
    service:       { icon: '⚡', color: '#ffd54a', label: 'SVC',    shape: 'workbench' },
    database:      { icon: '▣', color: '#ffd54a', label: 'DB',     shape: 'cabinet' },
    cache:         { icon: '≡', color: '#4aff7f', label: 'CACHE',  shape: 'shelf' },
    queue:         { icon: '☰', color: '#b44aff', label: 'QUEUE',  shape: 'belt' },
    external_api:  { icon: '⇄', color: '#e07a3a', label: 'API',   shape: 'dish' },
    error_handler: { icon: '✕', color: '#ff4a4a', label: 'ERR',    shape: 'alarm' },
    websocket:     { icon: '↔', color: '#4af5ff', label: 'WS',     shape: 'plugs' },
    exit:          { icon: '◀', color: '#4af5ff', label: 'EXIT',   shape: 'exitgate' },
  };

  // Layer order for layout
  const LAYER_ORDER = {
    'entrypoint': 0,
    'ratelimit': 1,
    'auth': 1,
    'middleware': 2,
    'route': 3,
    'controller': 4,
    'service': 5,
    'database': 6,
    'cache': 6,
    'queue': 6,
    'external_api': 6,
    'error_handler': 7,
    'websocket': 5,
    'exit': 8,
  };

  const STATION_WIDTH = CONFIG.stationWidth;
  const STATION_HEIGHT = CONFIG.stationHeight;
  const LAYER_GAP = CONFIG.layerGap;
  const NODE_GAP = CONFIG.nodeGap;
  const MARGIN_X = CONFIG.marginX;
  const MARGIN_Y = CONFIG.marginY;

  // Variable processing times per station type (in frames at 60fps)
  // These are BASE times — multiplied by the dwell speed multiplier
  const STATION_TIMING = {
    entrypoint:    120,  // ~2s pause at entry
    ratelimit:     180,  // ~3s check
    auth:          300,  // ~5s auth verification
    middleware:    210,  // ~3.5s processing
    route:         240,  // ~4s routing
    controller:    240,
    service:       240,
    database:      360,  // ~6s base (randomized up to 7.5s)
    cache:         150,  // ~2.5s (noticeably faster than DB)
    queue:         300,  // ~5s queuing
    external_api:  420,  // ~7s external call
    error_handler: 180,
    websocket:     150,
    exit:          90,   // ~1.5s exit
    worker:        300,  // ~5s worker processing
    external:      420,  // ~7s external API
  };

  // Dwell speed multiplier (0-100 slider maps to 0.2x-3.0x)
  // 50 = 1.0x (default), 0 = 3.0x (slowest), 100 = 0.2x (fastest)
  let dwellSpeedMultiplier = CONFIG.defaultDwellMultiplier;

  // Speech bubble messages per station type
  const STATION_MESSAGES = {
    entrypoint:    ['incoming!', 'new request!', 'hello server!', 'knock knock'],
    ratelimit:     ['checking limit...', 'rate check...', 'am I allowed?'],
    auth:          ['verifying token...', 'checking auth...', 'JWT verify...', 'who am I?', 'API key check...'],
    middleware:    ['processing...', 'parsing body...', 'CORS check', 'validating...', 'looks good...'],
    route:         ['routing...', 'found handler!', 'matched!', 'this way...'],
    database:      ['querying DB...', 'SELECT *...', 'INSERT INTO...', 'reading rows...', 'waiting for DB...', 'so many rows...'],
    cache:         ['checking drawer...', 'cache HIT!', 'found a copy!', 'saving a copy', 'drawer check...', 'in case I need it'],
    queue:         ['joining queue...', 'waiting my turn', 'so many ahead!', 'enqueuing...', 'taking a number', 'ticket #' + Math.floor(Math.random()*999)],
    error_handler: ['oops!', 'catching error!', 'something broke!', 'not my fault!'],
    exit:          ['sending back!', 'done!', 'response ready', 'bye!'],
  };

  // Messages for blocked characters
  const BLOCKED_MESSAGES = ['BLOCKED!', 'rate limited!', 'too many!', '429!', 'slow down!'];

  // Response codes based on station type
  const RESPONSE_CODES = {
    database:   ['200', '200', '200', '200', '404', '500'],  // mostly 200, sometimes 404/500
    cache:      ['200', '200', '200', '304'],                 // mostly hits
    queue:      ['201', '201', '200'],                        // created
    exit:       null, // inherits from previous
  };

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ═══════════════════════════════════════════
  // RATE LIMIT SIMULATOR
  // ═══════════════════════════════════════════
  class RateLimitSimulator {
    constructor() {
      this.windows = {}; // routeId -> [timestamp, timestamp, ...]
      this.limit = 5;    // max requests per window
      this.windowMs = 3000; // 3 second sliding window
    }

    check(routeId) {
      const now = Date.now();
      if (!this.windows[routeId]) this.windows[routeId] = [];
      // Clean old entries
      this.windows[routeId] = this.windows[routeId].filter(t => now - t < this.windowMs);
      if (this.windows[routeId].length >= this.limit) {
        return false; // BLOCKED
      }
      this.windows[routeId].push(now);
      return true; // ALLOWED
    }
  }

  // ═══════════════════════════════════════════
  // PARTICLES
  // ═══════════════════════════════════════════
  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 3;
      this.vy = (Math.random() - 0.5) * 3;
      this.life = 20 + Math.random() * 20;
      this.maxLife = this.life;
      this.color = color || COLORS.particle;
      this.size = 2 + Math.random() * 2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
      this.vx *= 0.95;
      this.vy *= 0.95;
    }

    draw(ctx) {
      const alpha = this.life / this.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.fillRect(
        Math.round(this.x - this.size / 2),
        Math.round(this.y - this.size / 2),
        this.size,
        this.size
      );
      ctx.globalAlpha = 1;
    }
  }

  // ═══════════════════════════════════════════
  // FACTORY ENGINE
  // ═══════════════════════════════════════════
  class Factory {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.width = 0;
      this.height = 0;
      this.architecture = null;
      this.stations = {}; // id -> { x, y, node, layer }
      this.paths = [];    // computed conveyor paths between stations
      this.characters = [];
      this.particles = [];
      this.conveyorOffset = 0;
      this.running = false;
      this.camera = { x: 0, y: 0, zoom: 1, targetX: 0, targetY: 0 };
      this.cameraFollowEnabled = true;
      this.cameraFollowSpeed = 0.04; // lerp factor
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };
      this.cameraStart = { x: 0, y: 0 };

      // Rate limit simulation
      this.rateLimiter = new RateLimitSimulator();

      // Edit mode
      this.editMode = false;
      this.dragStation = null; // station being dragged in edit mode
      this.dragStationOffset = { x: 0, y: 0 };

      // Dirty-flag system: skip rendering when nothing has changed
      this.needsRedraw = true;
    }

    init(canvasElement) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext('2d');
      this.resize();
      this._createTooltip();
      this._setupInput();
      this.running = true;
      this._loop();
    }

    _createTooltip() {
      const tip = document.createElement('div');
      tip.id = 'factory-tooltip';
      tip.style.cssText = [
        'position:fixed', 'display:none', 'pointer-events:none', 'z-index:9999',
        'background:#0d0d1a', 'border:2px solid #2a4a3a', 'padding:8px 12px',
        'font-family:"Press Start 2P",monospace', 'font-size:8px', 'color:#88ffcc',
        'max-width:320px', 'white-space:pre-line', 'line-height:1.6',
        'box-shadow:0 0 12px rgba(0,0,0,0.8),inset 0 0 4px rgba(51,255,153,0.05)',
        'image-rendering:pixelated',
      ].join(';');
      document.body.appendChild(tip);
      this._tooltip = tip;
      this._tooltipStationId = null;
    }

    resize() {
      const container = this.canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;
      this.width = container.clientWidth;
      this.height = container.clientHeight;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.canvas.style.width = this.width + 'px';
      this.canvas.style.height = this.height + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.needsRedraw = true;
    }

    _setupInput() {
      // Convert screen coords to world coords
      const screenToWorld = (sx, sy) => {
        return {
          x: (sx - this.camera.x) / this.camera.zoom,
          y: (sy - this.camera.y) / this.camera.zoom,
        };
      };

      // Hit-test stations
      const hitTestStation = (wx, wy) => {
        for (const [id, s] of Object.entries(this.stations)) {
          if (wx >= s.x && wx <= s.x + STATION_WIDTH &&
              wy >= s.y && wy <= s.y + STATION_HEIGHT) {
            return { id, station: s };
          }
        }
        return null;
      };

      // Click to inspect stations and characters
      this.canvas.addEventListener('click', (e) => {
        if (this.isDragging || this.dragStation) return;
        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const world = screenToWorld(sx, sy);

        // Check if clicked on a character
        const charSize = 40; // CHAR_SIZE * PIXEL_SCALE
        for (const char of this.characters) {
          const dx = world.x - char.x;
          const dy = world.y - char.y;
          if (Math.abs(dx) < charSize/2 && Math.abs(dy) < charSize/2) {
            // Show character context
            const wp = char.path[char.pathIndex];
            const stationId = wp ? wp.stationId : null;
            const station = stationId ? this.stations[stationId] : null;

            // Check for flow descriptions from the action
            let msg = '';
            if (char._actionContext) {
              msg = char._actionContext;
            } else if (char._rateLimited) {
              msg = '429 — This request was rate limited and rejected.';
            } else if (char.badge === '500') {
              msg = 'ERROR — This request hit a server error and was routed to the error handler.';
            } else if (station) {
              const meta = station.node.metadata || {};
              msg = (meta.description || station.node.name) + (meta.filePath ? '  [' + meta.filePath + ']' : '');
            } else {
              msg = 'Request character in transit...';
            }
            this._showInfoPanel(msg, char.badge === '500' ? '#ff4a4a' : char.badge === '429' ? '#e07a3a' : '#4a9eff', 360);
            return;
          }
        }

        // Check if clicked on a station
        const hit = hitTestStation(world.x, world.y);
        if (hit) {
          const node = hit.station.node;
          const meta = node.metadata || {};
          const parts = [];
          parts.push(node.name);
          if (meta.description) parts.push(meta.description);
          if (meta.filePath) parts.push('File: ' + meta.filePath);
          if (meta.handler) parts.push('Handler: ' + meta.handler);
          if (meta.dbTables) parts.push('Tables: ' + (Array.isArray(meta.dbTables) ? meta.dbTables.join(', ') : meta.dbTables));
          if (meta.tables) parts.push('Tables: ' + (Array.isArray(meta.tables) ? meta.tables.join(', ') : meta.tables));
          if (meta.orm) parts.push('ORM: ' + meta.orm);
          if (meta.authMethods) parts.push('Auth: ' + (Array.isArray(meta.authMethods) ? meta.authMethods.join(', ') : meta.authMethods));
          if (meta.queueName) parts.push('Queue: ' + meta.queueName);
          if (meta.middlewareChain) parts.push('MW: ' + (Array.isArray(meta.middlewareChain) ? meta.middlewareChain.join(' → ') : meta.middlewareChain));

          const style = STATION_STYLES[node.type] || STATION_STYLES.service;
          this._showInfoPanel(parts.join('  —  '), style.color, 480);
          return;
        }
      });

      this.canvas.addEventListener('mousedown', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        // Edit mode: try to pick up a station
        if (this.editMode) {
          const world = screenToWorld(sx, sy);
          const hit = hitTestStation(world.x, world.y);
          if (hit) {
            this.dragStation = hit;
            this.dragStationOffset.x = world.x - hit.station.x;
            this.dragStationOffset.y = world.y - hit.station.y;
            this.canvas.style.cursor = 'move';
            return;
          }
        }

        // Hide tooltip on drag
        if (this._tooltip) { this._tooltip.style.display = 'none'; this._tooltipStationId = null; }

        // Normal: pan with mouse drag
        this.isDragging = true;
        this.cameraFollowEnabled = false; // disable auto-follow while panning
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
        this.cameraStart.x = this.camera.x;
        this.cameraStart.y = this.camera.y;
        this.canvas.style.cursor = 'grabbing';
      });

      window.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        // Edit mode: drag station
        if (this.dragStation) {
          const world = screenToWorld(sx, sy);
          const s = this.dragStation.station;
          s.x = world.x - this.dragStationOffset.x;
          s.y = world.y - this.dragStationOffset.y;
          s.centerX = s.x + STATION_WIDTH / 2;
          s.centerY = s.y + STATION_HEIGHT / 2;
          this._recalcPaths(); // recalculate conveyor paths
          this.needsRedraw = true;
          return;
        }

        if (!this.isDragging) {
          // Hover tooltip detection
          this._updateTooltip(e, screenToWorld, hitTestStation);
          return;
        }
        this.camera.x = this.cameraStart.x + (e.clientX - this.dragStart.x);
        this.camera.y = this.cameraStart.y + (e.clientY - this.dragStart.y);
        this.needsRedraw = true;
      });

      window.addEventListener('mouseup', () => {
        if (this.dragStation) {
          this.dragStation = null;
          this.canvas.style.cursor = this.editMode ? 'crosshair' : 'grab';
          return;
        }
        this.isDragging = false;
        this.canvas.style.cursor = this.editMode ? 'crosshair' : 'grab';
      });

      // Zoom with scroll
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.3, Math.min(3, this.camera.zoom * delta));
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        this.camera.x = mx - (mx - this.camera.x) * (newZoom / this.camera.zoom);
        this.camera.y = my - (my - this.camera.y) * (newZoom / this.camera.zoom);
        this.camera.zoom = newZoom;
        this.needsRedraw = true;
      }, { passive: false });

      this.canvas.style.cursor = 'grab';

      // Hide tooltip when mouse leaves canvas
      this.canvas.addEventListener('mouseleave', () => {
        if (this._tooltip) {
          this._tooltip.style.display = 'none';
          this._tooltipStationId = null;
        }
      });

      // ── Keyboard shortcuts ──
      const PAN_STEP = 60;
      const ZOOM_STEP = 1.15;

      window.addEventListener('keydown', (e) => {
        // Don't fire when typing in input/textarea/select
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;

        let handled = true;
        switch (e.key) {
          case 'ArrowLeft':
            this.camera.x += PAN_STEP;
            this.cameraFollowEnabled = false;
            break;
          case 'ArrowRight':
            this.camera.x -= PAN_STEP;
            this.cameraFollowEnabled = false;
            break;
          case 'ArrowUp':
            this.camera.y += PAN_STEP;
            this.cameraFollowEnabled = false;
            break;
          case 'ArrowDown':
            this.camera.y -= PAN_STEP;
            this.cameraFollowEnabled = false;
            break;
          case '+':
          case '=': {
            const newZoom = Math.min(3, this.camera.zoom * ZOOM_STEP);
            const cx = this.width / 2;
            const cy = this.height / 2;
            this.camera.x = cx - (cx - this.camera.x) * (newZoom / this.camera.zoom);
            this.camera.y = cy - (cy - this.camera.y) * (newZoom / this.camera.zoom);
            this.camera.zoom = newZoom;
            break;
          }
          case '-':
          case '_': {
            const newZoom = Math.max(0.3, this.camera.zoom / ZOOM_STEP);
            const cx = this.width / 2;
            const cy = this.height / 2;
            this.camera.x = cx - (cx - this.camera.x) * (newZoom / this.camera.zoom);
            this.camera.y = cy - (cy - this.camera.y) * (newZoom / this.camera.zoom);
            this.camera.zoom = newZoom;
            break;
          }
          case '0':
          case 'Home':
            this._centerCamera();
            this.cameraFollowEnabled = true;
            break;
          case ' ':
            document.getElementById('btn-auto-sim').click();
            break;
          default:
            handled = false;
        }
        if (handled) e.preventDefault();
      });
    }

    // ═══════════════════════════════════════════
    // LAYOUT
    // ═══════════════════════════════════════════

    loadArchitecture(data) {
      if (this._archUpdateTimer) clearTimeout(this._archUpdateTimer);
      const hasActiveChars = this.characters && this.characters.some(c => !c.done);
      if (hasActiveChars) {
        this._archUpdateTimer = setTimeout(() => this._applyArchitecture(data), 300);
        return;
      }
      this._applyArchitecture(data);
    }

    _applyArchitecture(data) {
      this.architecture = data;
      this.stations = {};
      this.paths = [];
      this.characters = [];
      this.particles = [];

      if (!data || !data.nodes || data.nodes.length === 0) return;

      // Group nodes by layer
      const layers = {};
      data.nodes.forEach(node => {
        const layer = LAYER_ORDER[node.type] !== undefined ? LAYER_ORDER[node.type] : 5;
        if (!layers[layer]) layers[layer] = [];
        layers[layer].push(node);
      });

      // Compute positions — distribute large layers across multiple columns
      const MAX_PER_COL = 6; // max nodes per column before splitting
      const layerKeys = Object.keys(layers).map(Number).sort((a, b) => a - b);

      // Build columns: each layer may occupy 1+ columns if it has many nodes
      const columns = []; // [{nodes: [...], layerIdx}]
      layerKeys.forEach(layerIdx => {
        const nodesInLayer = layers[layerIdx];
        if (nodesInLayer.length <= MAX_PER_COL) {
          columns.push({ nodes: nodesInLayer, layerIdx });
        } else {
          // Split into multiple columns
          for (let start = 0; start < nodesInLayer.length; start += MAX_PER_COL) {
            columns.push({
              nodes: nodesInLayer.slice(start, start + MAX_PER_COL),
              layerIdx,
            });
          }
        }
      });

      // Find max nodes in any single column for vertical centering
      let maxNodesInCol = 0;
      columns.forEach(col => {
        if (col.nodes.length > maxNodesInCol) maxNodesInCol = col.nodes.length;
      });

      columns.forEach((col, i) => {
        const layerX = MARGIN_X + i * LAYER_GAP;
        const totalHeight = col.nodes.length * (STATION_HEIGHT + NODE_GAP) - NODE_GAP;
        const startY = MARGIN_Y + (maxNodesInCol * (STATION_HEIGHT + NODE_GAP) - NODE_GAP - totalHeight) / 2;

        col.nodes.forEach((node, j) => {
          const y = startY + j * (STATION_HEIGHT + NODE_GAP);
          this.stations[node.id] = {
            x: layerX,
            y: y,
            centerX: layerX + STATION_WIDTH / 2,
            centerY: y + STATION_HEIGHT / 2,
            node: node,
            layer: col.layerIdx,
          };
        });
      });

      // Compute conveyor paths from edges (support both from/to and source/target keys)
      if (data.edges) {
        data.edges.forEach(edge => {
          const srcId = edge.source || edge.from;
          const tgtId = edge.target || edge.to;
          const src = this.stations[srcId];
          const tgt = this.stations[tgtId];
          if (!src || !tgt) {
            console.warn(`[factory] Orphaned edge: ${srcId} → ${tgtId}`);
            return;
          }
          this.paths.push({
            edge: edge,
            from: { x: src.x + STATION_WIDTH, y: src.centerY },
            to: { x: tgt.x, y: tgt.centerY },
          });
        });
      }

      // Center camera on the layout
      this._centerCamera();
      this.needsRedraw = true;
    }

    _centerCamera() {
      if (Object.keys(this.stations).length === 0) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      Object.values(this.stations).forEach(s => {
        if (s.x < minX) minX = s.x;
        if (s.y < minY) minY = s.y;
        if (s.x + STATION_WIDTH > maxX) maxX = s.x + STATION_WIDTH;
        if (s.y + STATION_HEIGHT > maxY) maxY = s.y + STATION_HEIGHT;
      });
      const sceneW = maxX - minX + MARGIN_X * 2;
      const sceneH = maxY - minY + MARGIN_Y * 2;
      const zoomX = this.width / sceneW;
      const zoomY = this.height / sceneH;
      this.camera.zoom = Math.min(zoomX, zoomY, 1.5);
      this.camera.x = (this.width - sceneW * this.camera.zoom) / 2 - minX * this.camera.zoom + MARGIN_X * this.camera.zoom;
      this.camera.y = (this.height - sceneH * this.camera.zoom) / 2 - minY * this.camera.zoom + MARGIN_Y * this.camera.zoom;
    }

    // ═══════════════════════════════════════════
    // PATH RECALCULATION (for edit mode)
    // ═══════════════════════════════════════════

    _recalcPaths() {
      if (!this.architecture || !this.architecture.edges) return;
      this.paths = [];
      this.architecture.edges.forEach(edge => {
        const src = this.stations[edge.source || edge.from];
        const tgt = this.stations[edge.target || edge.to];
        if (src && tgt) {
          this.paths.push({
            edge: edge,
            from: { x: src.x + STATION_WIDTH, y: src.centerY },
            to: { x: tgt.x, y: tgt.centerY },
          });
        }
      });
    }

    // ═══════════════════════════════════════════
    // EDIT MODE
    // ═══════════════════════════════════════════

    toggleEditMode() {
      this.editMode = !this.editMode;
      this.canvas.style.cursor = this.editMode ? 'crosshair' : 'grab';
      this.needsRedraw = true;
      return this.editMode;
    }

    // ═══════════════════════════════════════════
    // SIMULATION
    // ═══════════════════════════════════════════

    simulateRequest(routeId) {
      if (!this.architecture || !this.architecture.actions) return;

      // Find the action by id, routeId, or workerId
      let action = this.architecture.actions.find(a =>
        a.id === routeId || a.routeId === routeId || a.workerId === routeId
      );
      if (!action) return;

      // Check rate limit
      const isAllowed = this.rateLimiter.check(routeId);

      // Build waypoints from the action flow
      const waypoints = [];
      let rateLimitStationIdx = -1;

      action.flow.forEach((nodeId, i) => {
        const station = this.stations[nodeId];
        if (station) {
          waypoints.push({
            x: station.centerX,
            y: station.centerY,
            stationId: nodeId,
            stationType: station.node.type,
          });
          if (station.node.type === 'ratelimit') rateLimitStationIdx = waypoints.length - 1;
        }
      });

      if (waypoints.length === 0) return;

      // Pick character type based on action type
      const ACTION_CHAR_MAP = {
        'route': 'RequestWorker',
        'worker': 'QueueWorker',
        'cron': 'RateLimiter',
        'webhook': 'ResponseCarrier',
        'poller': 'CacheManager',
        'event': 'DBOperator',
      };
      const charType = (action.characterType) ||
        ACTION_CHAR_MAP[action.type] || 'RequestWorker';
      const char = new window.Characters.Character(charType, waypoints[0].x, waypoints[0].y);
      char.speed = CONFIG.characterSpeed;

      if (!isAllowed && rateLimitStationIdx > 0) {
        // Character walks to the rate limiter then gets blocked
        const truncatedPath = waypoints.slice(1, rateLimitStationIdx + 1);
        char.setPath(truncatedPath);
        char._rateLimited = true;
      } else {
        char.setPath(waypoints.slice(1));
      }

      // Set variable timing per station (affected by dwell speed multiplier)
      char._stationTimings = {};
      waypoints.forEach(wp => {
        if (wp.stationType) {
          let timing = STATION_TIMING[wp.stationType] || CONFIG.defaultDwellFrames;
          // Add randomness to DB/external timing
          if (wp.stationType === 'database') {
            timing += Math.floor(Math.random() * CONFIG.dbTimingJitter);
          } else if (wp.stationType === 'external' || wp.stationType === 'external_api') {
            timing += Math.floor(Math.random() * CONFIG.externalTimingJitter);
          }
          // Apply dwell speed multiplier (only affects station pause, not travel)
          timing = Math.max(CONFIG.minDwellFrames, Math.round(timing / dwellSpeedMultiplier));
          char._stationTimings[wp.stationId] = timing;
        }
      });

      // Override the character's action handling
      const factory = this;
      const origSetPath = char.setPath.bind(char);

      // When character arrives at a station, show contextual bubble
      char.onStation = (stationId) => {
        const s = factory.stations[stationId];
        if (!s) return;
        const stationType = s.node.type;
        const meta = s.node.metadata || {};

        // Set variable action duration for this station
        char.actionDuration = char._stationTimings[stationId] || 18;

        // Try to match a scenario for this station
        // Priority: 1) explicit scenario from agent, 2) pattern match, 3) generic
        const explicitScenarioId = meta.scenario || null;
        let matchText = [
          meta.handler, meta.description, meta.filePath, s.node.name,
          stationType, meta.orm, meta.queueName
        ].filter(Boolean).join(' ');
        const scenarioId = explicitScenarioId || (window.Scenarios ? window.Scenarios.matchScenario(matchText) : null);
        const scenario = scenarioId && window.Scenarios ? window.Scenarios.getScenario(scenarioId) : null;

        // Show speech bubble — prefer flow-specific descriptions from agents, then scenario bubbles
        const flowDesc = char._flowDescriptions ? char._flowDescriptions[stationId] : null;
        const stationDesc = meta.description;
        const scenarioBubble = scenario ? pickRandom(scenario.bubbles) : null;
        const genericMessages = STATION_MESSAGES[stationType];
        const bubbleText = flowDesc || stationDesc || scenarioBubble || (genericMessages ? pickRandom(genericMessages) : stationType);
        const style = STATION_STYLES[stationType];
        const bubbleColor = scenario ? scenario.stationGlow : (style ? style.color : null);
        char.showBubble(bubbleText, char.actionDuration + 30, bubbleColor);

        // Attach prop from scenario
        if (scenario && scenario.prop) {
          char._prop = scenario.prop;
          char._propColor = scenario.propColor;
        }

        // Spawn particles (use scenario glow color if available)
        const particleColor = scenario ? scenario.stationGlow : (style ? style.color : COLORS.particle);
        for (let i = 0; i < 8; i++) {
          factory.particles.push(new Particle(s.centerX, s.centerY, particleColor));
        }

        // Assign response badge after data stores
        if (RESPONSE_CODES[stationType]) {
          const code = pickRandom(RESPONSE_CODES[stationType]);
          char.setBadge(code);

          // 500 error handling — check for retry logic
          if (code === '500') {
            const retryCount = action.retryCount || 0;
            if (!char._retryAttempt) char._retryAttempt = 0;

            if (retryCount > 0 && char._retryAttempt < retryCount) {
              // RETRY: character goes back and tries again
              char._retryAttempt++;
              char.showBubble('retry #' + char._retryAttempt + '...', 120, '#e07a3a');
              char.setBadge(null); // clear the 500 badge for retry
              // Stay at current station — the actionDuration will let it loop back
              // Reset so it re-visits this station
              for (let i = 0; i < 6; i++) {
                factory.particles.push(new Particle(s.centerX, s.centerY, '#e07a3a'));
              }
              // On final retry, 50% chance of success
              if (char._retryAttempt >= retryCount) {
                if (Math.random() < 0.5) {
                  char.setBadge('200');
                  char.showBubble('retry worked!', 120, '#4aff7f');
                } else {
                  char.setBadge('500');
                }
              }
            } else {
              // No retry or retries exhausted: transform to bug
              char.showBubble('EXCEPTION!', 180, '#ff4a4a');
              char._transformToBug(factory);
              const errStation = Object.values(factory.stations).find(st => st.node.type === 'error_handler');
              const exitStation = Object.values(factory.stations).find(st => st.node.type === 'exit');
              const errorPath = [];
              if (errStation) errorPath.push({ x: errStation.centerX, y: errStation.centerY, stationId: errStation.node.id, stationType: 'error_handler' });
              if (exitStation) errorPath.push({ x: exitStation.centerX, y: exitStation.centerY, stationId: exitStation.node.id, stationType: 'exit' });
              if (errorPath.length > 0) {
                char._errorRedirect = errorPath;
              }
            }
          }

          // 404: show a confused bubble
          if (code === '404') {
            char.showBubble('not found?!', 120, '#ffd54a');
          }
        }

        // Rate limit block: if this is the rate limiter and character is blocked
        if (stationType === 'ratelimit' && char._rateLimited) {
          char.showBubble(pickRandom(BLOCKED_MESSAGES), 150, '#ff4a4a');
          char.setBadge('429');
          // Spawn red particles
          for (let i = 0; i < 12; i++) {
            factory.particles.push(new Particle(s.centerX, s.centerY, '#ff4a4a'));
          }
          // Redirect to exit
          const exitStation = Object.values(factory.stations).find(st => st.node.type === 'exit');
          if (exitStation) {
            char.actionDuration = 90; // linger 1.5s looking sad
            char._redirectToExit = { x: exitStation.centerX, y: exitStation.centerY, stationId: exitStation.node.id, stationType: 'exit' };
          }
        }

        // Exit station: show final response
        if (stationType === 'exit') {
          const badge = char.badge || '200';
          if (badge === '429') {
            char.showBubble('429 rejected...', 60, '#ff4a4a');
          } else if (badge === '500') {
            char.showBubble('500 error sent', 60, '#ff4a4a');
          } else if (badge === '404') {
            char.showBubble('404 not found', 60, '#ffd54a');
          } else {
            char.showBubble(badge + ' OK!', 60, '#4af5ff');
          }
        }
      };

      // Re-enable camera follow when new character spawns
      this.cameraFollowEnabled = true;

      // Attach action context for click-to-inspect
      char._actionContext = action.context || action.description || action.name;

      // Attach flow descriptions from enriched action data
      char._flowDescriptions = action.flowDescriptions || {};

      // Show entry bubble
      const entryMsg = char._flowDescriptions['entrypoint'] || pickRandom(STATION_MESSAGES.entrypoint);
      char.showBubble(entryMsg, 60, STATION_STYLES.entrypoint.color);

      this.characters.push(char);
      this.needsRedraw = true;
    }

    simulateAll() {
      if (!this.architecture || !this.architecture.actions) return;
      this.architecture.actions.forEach((action, i) => {
        setTimeout(() => {
          this.simulateRequest(action.id || action.routeId);
        }, i * 600);
      });
    }

    // ═══════════════════════════════════════════
    // RENDER LOOP
    // ═══════════════════════════════════════════

    _loop() {
      if (!this.running) return;
      this._update();
      if (this.needsRedraw) {
        this._draw();
        this.needsRedraw = false;
      }
      requestAnimationFrame(() => this._loop());
    }

    _update() {
      // Mark dirty when there are active characters, particles, or a visible info panel
      if (this.characters.length > 0 || this.particles.length > 0 ||
          (this._infoPanel && this._infoPanel.timer > 0)) {
        this.needsRedraw = true;
      }

      this.conveyorOffset = (this.conveyorOffset + 0.5) % 12;

      // Update characters
      for (let i = this.characters.length - 1; i >= 0; i--) {
        const char = this.characters[i];
        const prevState = char.state;
        char.update();

        // Fire onStation callback when character enters action state at a station
        if (char.state === 'action' && prevState !== 'action') {
          const wp = char.path[char.pathIndex];
          if (wp && wp.stationId && char.onStation) {
            char.onStation(wp.stationId);
          }
        }

        if (char.done) {
          // Spawn exit particles
          const exitColor = char.state === 'blocked' ? '#ff4a4a' : '#4af5ff';
          for (let p = 0; p < 10; p++) {
            this.particles.push(new Particle(char.x, char.y, exitColor));
          }
          this.characters.splice(i, 1);
        }
      }

      // Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].update();
        if (this.particles[i].life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // Camera follow: smooth lerp toward active characters
      this._updateCameraFollow();
    }

    _updateCameraFollow() {
      if (!this.cameraFollowEnabled || this.isDragging || this.characters.length === 0) return;

      // Find active (non-done) characters
      const active = this.characters.filter(c => !c.done);
      if (active.length === 0) return;

      // Average position of active characters
      let avgX = 0, avgY = 0;
      active.forEach(c => { avgX += c.x; avgY += c.y; });
      avgX /= active.length;
      avgY /= active.length;

      // Target: center the average position on screen
      const targetX = -(avgX * this.camera.zoom - this.width / 2);
      const targetY = -(avgY * this.camera.zoom - this.height / 2);

      // Lerp toward target
      this.camera.x += (targetX - this.camera.x) * this.cameraFollowSpeed;
      this.camera.y += (targetY - this.camera.y) * this.cameraFollowSpeed;
    }

    _draw() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      // Clear
      ctx.fillStyle = COLORS.floor;
      ctx.fillRect(0, 0, w, h);

      // Apply camera transform
      ctx.save();
      ctx.translate(this.camera.x, this.camera.y);
      ctx.scale(this.camera.zoom, this.camera.zoom);

      // Draw grid
      this._drawGrid(ctx);

      // Draw conveyor paths
      this._drawConveyors(ctx);

      // Build per-station character lookup (once per frame)
      const charsByStation = new Map();
      this.characters.forEach(c => {
        if (c.state === 'action' && c.path[c.pathIndex]) {
          const sid = c.path[c.pathIndex].stationId;
          if (!charsByStation.has(sid)) charsByStation.set(sid, []);
          charsByStation.get(sid).push(c);
        }
      });
      const drawTime = Date.now();

      // Draw stations
      Object.values(this.stations).forEach(station => {
        this._drawStation(ctx, station, charsByStation, drawTime);
      });

      // Draw characters
      this.characters.forEach(char => char.draw(ctx));

      // Draw particles
      this.particles.forEach(p => p.draw(ctx));

      ctx.restore();

      // Draw HUD (not affected by camera)
      this._drawHUD(ctx);
      this._drawInfoPanel(ctx);
    }

    _drawGrid(ctx) {
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 0.5;
      const gridSize = CONFIG.gridSize;
      // Compute visible area
      const startX = Math.floor(-this.camera.x / this.camera.zoom / gridSize) * gridSize - gridSize;
      const startY = Math.floor(-this.camera.y / this.camera.zoom / gridSize) * gridSize - gridSize;
      const endX = startX + (this.width / this.camera.zoom) + gridSize * 2;
      const endY = startY + (this.height / this.camera.zoom) + gridSize * 2;

      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    }

    _drawConveyors(ctx) {
      this.paths.forEach(path => {
        const { from, to } = path;
        const midX = (from.x + to.x) / 2;

        // Draw conveyor belt path (right-angle segments)
        ctx.strokeStyle = COLORS.conveyorLine;
        ctx.lineWidth = 8;
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(midX, from.y);
        ctx.lineTo(midX, to.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Conveyor belt background
        ctx.strokeStyle = COLORS.conveyor;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(midX, from.y);
        ctx.lineTo(midX, to.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Animated dots on conveyor
        ctx.fillStyle = COLORS.conveyorDot;
        const totalLen = Math.abs(midX - from.x) + Math.abs(to.y - from.y) + Math.abs(to.x - midX);
        const dotSpacing = 12;
        const numDots = Math.floor(totalLen / dotSpacing);

        ctx.globalAlpha = 0.4;
        for (let i = 0; i < numDots; i++) {
          let t = ((i * dotSpacing + this.conveyorOffset) % totalLen) / totalLen;
          let px, py;

          const seg1 = Math.abs(midX - from.x) / totalLen;
          const seg2 = Math.abs(to.y - from.y) / totalLen;

          if (t < seg1) {
            const p = t / seg1;
            px = from.x + (midX - from.x) * p;
            py = from.y;
          } else if (t < seg1 + seg2) {
            const p = (t - seg1) / seg2;
            px = midX;
            py = from.y + (to.y - from.y) * p;
          } else {
            const p = (t - seg1 - seg2) / (1 - seg1 - seg2);
            px = midX + (to.x - midX) * p;
            py = to.y;
          }

          ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2);
        }
        ctx.globalAlpha = 1;
      });
    }

    _drawStation(ctx, station, charsByStation, t) {
      const { x, y, node } = station;
      const style = STATION_STYLES[node.type] || STATION_STYLES.service;
      const meta = node.metadata || {};
      const W = STATION_WIDTH;
      const H = STATION_HEIGHT;
      const cx = x + W / 2;
      const cy = y + H / 2;

      // Determine active characters at this station (pre-cached)
      const activeChars = charsByStation ? (charsByStation.get(node.id) || []) : [];
      const isActive = activeChars.length > 0;

      // ── Common background ──
      ctx.fillStyle = COLORS.stationBg;
      ctx.fillRect(x, y, W, H);

      // ── Shape-specific rendering ──
      const shape = style.shape || 'workbench';
      switch (shape) {

        // ════════════════════════════════════════
        // ENTRY GATE — two posts with arch, green light
        // ════════════════════════════════════════
        case 'gate': {
          const postW = 8;
          const postH = H - 12;
          const gateOpen = isActive ? Math.min(Math.sin(t / 300) * 0.5 + 0.5, 1) : 0;
          // Left post
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.7;
          ctx.fillRect(x + 10, y + 8, postW, postH);
          // Right post
          ctx.fillRect(x + W - 18, y + 8, postW, postH);
          // Arch across top
          ctx.fillRect(x + 10, y + 8, W - 20, 6);
          // Gate bars (animated open)
          ctx.globalAlpha = 0.5;
          const barSpread = gateOpen * 20;
          for (let i = 0; i < 4; i++) {
            const bx = cx - 12 + i * 8;
            ctx.fillRect(bx - barSpread * (i < 2 ? 1 : -1) * 0.3, y + 16, 3, postH - 10);
          }
          // Green OPEN light
          ctx.globalAlpha = 0.6 + Math.sin(t / 400) * 0.3;
          ctx.fillStyle = '#33ff66';
          ctx.fillRect(cx - 4, y + 2, 8, 5);
          ctx.globalAlpha = 1;
          break;
        }

        // ════════════════════════════════════════
        // SIGNPOST — angular directional sign with method color
        // ════════════════════════════════════════
        case 'signpost': {
          // Post
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.6;
          ctx.fillRect(cx - 2, y + 10, 4, H - 14);
          // Sign board (angular / arrow shape)
          const method = (meta.method || 'GET').toUpperCase();
          const methodColors = { GET: '#33ff66', POST: '#4a9eff', PUT: '#e0a030', DELETE: '#ff4a4a', PATCH: '#ffee44' };
          const signColor = methodColors[method] || style.color;
          ctx.fillStyle = signColor;
          ctx.globalAlpha = 0.7;
          // Main sign rectangle
          ctx.fillRect(x + 8, y + 14, W - 30, 18);
          // Arrow point on right side
          ctx.fillRect(x + W - 26, y + 16, 8, 14);
          ctx.fillRect(x + W - 20, y + 18, 6, 10);
          ctx.fillRect(x + W - 16, y + 20, 4, 6);
          // Method label on sign
          ctx.fillStyle = '#0d0d1a';
          ctx.globalAlpha = 0.9;
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(method, x + 8 + (W - 30) / 2, y + 23);
          // Path label below sign
          const path = meta.path || node.name;
          const trimPath = path.length > 16 ? path.substring(0, 14) + '..' : path;
          ctx.fillStyle = signColor;
          ctx.globalAlpha = 0.5;
          ctx.font = '6px monospace';
          ctx.fillText(trimPath, cx, y + 40);
          ctx.globalAlpha = 1;
          break;
        }

        // ════════════════════════════════════════
        // CONVEYOR CHECKPOINT — rails through a scanner box
        // ════════════════════════════════════════
        case 'conveyor': {
          // Parallel rails
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.4;
          ctx.fillRect(x, y + 20, W, 3);
          ctx.fillRect(x, y + H - 20, W, 3);
          // Scanner box in center
          ctx.globalAlpha = 0.6;
          ctx.fillRect(x + 20, y + 12, W - 40, H - 24);
          ctx.fillStyle = COLORS.stationBg;
          ctx.fillRect(x + 24, y + 16, W - 48, H - 32);
          // Scanning line animation
          if (isActive) {
            const scanX = x + 24 + ((t / 8) % (W - 48));
            ctx.fillStyle = style.color;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(scanX, y + 16, 2, H - 32);
          }
          // Rail dots moving
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.6;
          const dotOffset = (t / 50) % 12;
          for (let d = 0; d < W; d += 12) {
            const dx = x + ((d + dotOffset) % W);
            ctx.fillRect(dx, y + 21, 2, 1);
            ctx.fillRect(dx, y + H - 20, 2, 1);
          }
          // Description ticker
          if (meta.description) {
            ctx.fillStyle = style.color;
            ctx.globalAlpha = 0.5;
            ctx.font = '6px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const desc = meta.description.length > 18 ? meta.description.substring(0, 16) + '..' : meta.description;
            ctx.fillText(desc, cx, cy);
          }
          ctx.globalAlpha = 1;
          break;
        }

        // ════════════════════════════════════════
        // GUARD BOOTH — hut with barrier arm, shield
        // ════════════════════════════════════════
        case 'booth': {
          // Booth body
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.5;
          ctx.fillRect(x + 8, y + 14, W - 16, H - 22);
          // Roof (wider)
          ctx.globalAlpha = 0.7;
          ctx.fillRect(x + 4, y + 10, W - 8, 6);
          // Window
          ctx.fillStyle = '#1a3a5a';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(x + 20, y + 22, W - 40, 12);
          // Shield icon in window
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.7;
          ctx.fillRect(cx - 4, y + 24, 8, 8);
          ctx.fillRect(cx - 3, y + 32, 6, 2);
          ctx.fillRect(cx - 2, y + 34, 4, 1);
          // Barrier arm
          const armAngle = isActive ? Math.min((Math.sin(t / 300) + 1) * 0.5, 1) : 0;
          const armLen = 30;
          ctx.fillStyle = '#ff4444';
          ctx.globalAlpha = 0.8;
          // Barrier post
          ctx.fillRect(x + W - 14, y + 36, 4, H - 40);
          // Arm (rotates up when active)
          const armEndY = y + 38 - armAngle * 20;
          ctx.fillRect(x + W - 14 - armLen, armEndY, armLen, 3);
          // Stripe on arm
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.5;
          for (let s = 0; s < armLen; s += 8) {
            ctx.fillRect(x + W - 14 - armLen + s, armEndY, 4, 3);
          }
          // Idle bounce
          if (!isActive) {
            const bounce = Math.sin(t / 2000) * 1;
            ctx.fillStyle = '#ff4444';
            ctx.globalAlpha = 0.6;
            ctx.fillRect(x + W - 14 - armLen, y + 38 + bounce, armLen, 3);
          }
          // Auth method label
          const authMethod = meta.authType || meta.strategy || '';
          if (authMethod) {
            ctx.fillStyle = style.color;
            ctx.globalAlpha = 0.5;
            ctx.font = '6px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(authMethod, cx, y + H - 4);
          }
          ctx.globalAlpha = 1;
          break;
        }

        // ════════════════════════════════════════
        // TOLLGATE — traffic lights + toll booth
        // ════════════════════════════════════════
        case 'tollgate': {
          // Toll booth structure
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.4;
          ctx.fillRect(x + 6, y + 6, W - 12, H - 12);
          ctx.fillStyle = COLORS.stationBg;
          ctx.fillRect(x + 10, y + 10, W - 20, H - 20);
          // Traffic light housing (left side)
          ctx.fillStyle = '#222233';
          ctx.globalAlpha = 0.9;
          ctx.fillRect(x + 12, y + 14, 14, 38);
          // Light cycling animation
          const lightCycle = Math.floor((t / 800) % 3);
          // Red light
          ctx.fillStyle = lightCycle === 0 ? '#ff3333' : '#331111';
          ctx.globalAlpha = lightCycle === 0 ? (0.8 + Math.sin(t / 150) * 0.2) : 0.3;
          ctx.fillRect(x + 15, y + 16, 8, 8);
          // Yellow light
          ctx.fillStyle = lightCycle === 1 ? '#ffcc00' : '#332200';
          ctx.globalAlpha = lightCycle === 1 ? (0.8 + Math.sin(t / 150) * 0.2) : 0.3;
          ctx.fillRect(x + 15, y + 28, 8, 8);
          // Green light
          ctx.fillStyle = lightCycle === 2 ? '#33ff66' : '#003311';
          ctx.globalAlpha = lightCycle === 2 ? (0.8 + Math.sin(t / 150) * 0.2) : 0.3;
          ctx.fillRect(x + 15, y + 40, 8, 8);
          // Capacity meter (preserved)
          let totalRecent = 0;
          if (this.rateLimiter && this.rateLimiter.windows) {
            for (const [, timestamps] of Object.entries(this.rateLimiter.windows)) {
              const now = Date.now();
              totalRecent += timestamps.filter(ts => now - ts < this.rateLimiter.windowMs).length;
            }
          }
          const ratio = this.rateLimiter ? Math.min(totalRecent / this.rateLimiter.limit, 1) : 0;
          const barMaxW = W - 40;
          ctx.fillStyle = ratio > 0.8 ? '#ff4a4a' : ratio > 0.5 ? '#e07a3a' : '#4aff7f';
          ctx.globalAlpha = 0.6;
          ctx.fillRect(x + 32, y + H - 16, barMaxW * ratio, 5);
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = '#446655';
          ctx.fillRect(x + 32, y + H - 16, barMaxW, 5);
          // Gate bars right side
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.5;
          ctx.fillRect(x + W - 20, y + 14, 4, H - 22);
          ctx.globalAlpha = 1;
          break;
        }

        // ════════════════════════════════════════
        // FILING CABINET — stacked drawers, cylinder top
        // ════════════════════════════════════════
        case 'cabinet': {
          // Cylinder/disk at top
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.5;
          ctx.fillRect(x + 14, y + 4, W - 28, 4);
          ctx.fillRect(x + 10, y + 6, W - 20, 3);
          ctx.fillRect(x + 14, y + 8, W - 28, 2);
          // Cabinet body
          ctx.globalAlpha = 0.4;
          ctx.fillRect(x + 12, y + 12, W - 24, H - 18);
          // Drawers
          const drawerCount = 4;
          const drawerH = 8;
          const drawerGap = 3;
          const drawerStartY = y + 16;
          // Idle wiggle
          const wiggleDrawer = Math.floor((t / 3000) % drawerCount);
          const wiggle = Math.sin(t / 300) * 1.5;
          for (let d = 0; d < drawerCount; d++) {
            const dy = drawerStartY + d * (drawerH + drawerGap);
            const activeSlide = isActive && d === Math.floor((t / 400) % drawerCount) ? 6 : 0;
            const idleWiggle = (!isActive && d === wiggleDrawer) ? wiggle : 0;
            ctx.fillStyle = style.color;
            ctx.globalAlpha = isActive ? 0.7 : 0.35;
            ctx.fillRect(x + 16 + idleWiggle + activeSlide, dy, W - 32, drawerH);
            // Drawer handle
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.4;
            ctx.fillRect(cx - 4 + idleWiggle + activeSlide, dy + 3, 8, 2);
          }
          // Table count / ORM label
          const dbLabel = meta.orm || meta.driver || (meta.tableCount ? meta.tableCount + ' tables' : '');
          if (dbLabel) {
            ctx.fillStyle = style.color;
            ctx.globalAlpha = 0.5;
            ctx.font = '6px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(dbLabel, cx, y + H - 2);
          }
          ctx.globalAlpha = 1;
          break;
        }

        // ════════════════════════════════════════
        // SHELF — bookshelf with cached items
        // ════════════════════════════════════════
        case 'shelf': {
          // Shelf frame
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.4;
          // Left side
          ctx.fillRect(x + 10, y + 6, 3, H - 12);
          // Right side
          ctx.fillRect(x + W - 13, y + 6, 3, H - 12);
          // Shelves (3 rows)
          const shelfRows = 3;
          const shelfH = Math.floor((H - 20) / shelfRows);
          for (let s = 0; s < shelfRows; s++) {
            const sy = y + 10 + s * shelfH;
            // Shelf plank
            ctx.fillStyle = style.color;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(x + 10, sy + shelfH - 2, W - 20, 2);
            // Items on shelf (small blocks)
            const itemCount = 4 + (s * 2) % 3;
            const shimmer = (!isActive) ? Math.sin(t / 1500 + s) * 0.15 : 0;
            for (let i = 0; i < itemCount; i++) {
              const ix = x + 16 + i * 12;
              if (ix + 8 > x + W - 16) break;
              const itemH = 4 + (i % 3) * 2;
              ctx.fillStyle = style.color;
              ctx.globalAlpha = isActive ? (0.6 + Math.sin(t / 200 + i * 0.5) * 0.3) : (0.25 + shimmer);
              ctx.fillRect(ix, sy + shelfH - 2 - itemH, 8, itemH);
            }
          }
          // Hit rate concept
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.4;
          ctx.font = '6px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const hitLabel = meta.engine || meta.store || 'cache';
          ctx.fillText(hitLabel, cx, y + H - 1);
          ctx.globalAlpha = 1;
          break;
        }

        // ════════════════════════════════════════
        // CONVEYOR BELT — stacked items sliding
        // ════════════════════════════════════════
        case 'belt': {
          // Belt rails
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.35;
          ctx.fillRect(x + 4, y + H - 16, W - 8, 3);
          ctx.fillRect(x + 4, y + H - 10, W - 8, 3);
          // Belt dots (rolling)
          const beltOffset = (t / 60) % 10;
          ctx.globalAlpha = 0.5;
          for (let d = 0; d < W - 8; d += 10) {
            const dx = x + 4 + ((d + beltOffset) % (W - 8));
            ctx.fillRect(dx, y + H - 15, 2, 1);
            ctx.fillRect(dx, y + H - 9, 2, 1);
          }
          // Queued item blocks
          const queuedCount = this.characters.filter(c =>
            c.state === 'walk' && c.path[c.pathIndex] &&
            c.path[c.pathIndex].stationId === node.id
          ).length + activeChars.length;
          const displayCount = Math.max(queuedCount, 3);
          const slideOffset = isActive ? (t / 80) % 16 : 0;
          for (let q = 0; q < Math.min(displayCount, 8); q++) {
            const qx = x + 10 + q * 14 + (isActive ? slideOffset * (q === 0 ? 1 : 0) : 0);
            if (qx + 10 > x + W - 10) break;
            // Idle sliding animation
            const idleSlide = (!isActive) ? Math.sin(t / 2000 + q * 0.8) * 1 : 0;
            ctx.fillStyle = style.color;
            ctx.globalAlpha = 0.4 + (q < queuedCount ? 0.3 : 0);
            ctx.fillRect(qx + idleSlide, y + 14 + (q % 2) * 3, 10, 14);
            // Item label line
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.2;
            ctx.fillRect(qx + 2 + idleSlide, y + 18 + (q % 2) * 3, 6, 1);
          }
          // Queue depth bar (preserved)
          if (queuedCount > 0) {
            const barWidth = Math.min(queuedCount * 10, W - 8);
            ctx.fillStyle = style.color;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(x + 4, y + H - 22, barWidth, 4);
            ctx.globalAlpha = 1;
            ctx.fillStyle = style.color;
            ctx.font = '6px monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText('Q:' + queuedCount, x + W - 4, y + H - 1);
          }
          // Queue name
          const qName = meta.queueName || meta.name || '';
          if (qName) {
            ctx.fillStyle = style.color;
            ctx.globalAlpha = 0.5;
            ctx.font = '6px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText(qName, x + 4, y + H - 1);
          }
          ctx.globalAlpha = 1;
          break;
        }

        // ════════════════════════════════════════
        // SATELLITE DISH — signal waves
        // ════════════════════════════════════════
        case 'dish': {
          // Dish base/post
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.5;
          ctx.fillRect(cx - 2, y + 30, 4, H - 34);
          // Dish (blocky parabola shape)
          ctx.globalAlpha = 0.6;
          ctx.fillRect(x + 16, y + 10, W - 32, 4);
          ctx.fillRect(x + 12, y + 14, W - 24, 4);
          ctx.fillRect(x + 16, y + 18, W - 32, 4);
          ctx.fillRect(x + 24, y + 22, W - 48, 4);
          ctx.fillRect(x + 32, y + 26, W - 64, 4);
          // Signal waves (animated arcs as blocky rings)
          const wavePulse = isActive ? 1 : (0.3 + Math.sin(t / 1500) * 0.2);
          const waveCount = 3;
          for (let w = 0; w < waveCount; w++) {
            const wPhase = ((t / 300) + w * 2) % 6;
            const wDist = wPhase * 5;
            ctx.fillStyle = style.color;
            ctx.globalAlpha = Math.max(0, (0.5 - wPhase * 0.08)) * wavePulse;
            // Blocky wave arcs going right
            ctx.fillRect(x + W - 16 + wDist, y + 10 + w * 2, 3, 2);
            ctx.fillRect(x + W - 14 + wDist, y + 14 + w, 3, 2);
            ctx.fillRect(x + W - 16 + wDist, y + 18 - w * 2, 3, 2);
          }
          ctx.globalAlpha = 1;
          break;
        }

        // ════════════════════════════════════════
        // ALARM — fire extinguisher / alarm bell, red theme
        // ════════════════════════════════════════
        case 'alarm': {
          // Red alarm housing
          ctx.fillStyle = '#ff4a4a';
          ctx.globalAlpha = 0.5;
          ctx.fillRect(x + 10, y + 8, W - 20, H - 16);
          ctx.fillStyle = COLORS.stationBg;
          ctx.fillRect(x + 14, y + 12, W - 28, H - 24);
          // Bell shape (blocky)
          ctx.fillStyle = '#ff4a4a';
          ctx.globalAlpha = 0.6;
          ctx.fillRect(cx - 10, y + 16, 20, 4);
          ctx.fillRect(cx - 14, y + 20, 28, 14);
          ctx.fillRect(cx - 16, y + 34, 32, 4);
          // Clapper
          ctx.fillRect(cx - 2, y + 38, 4, 6);
          // Flashing when active
          if (isActive) {
            const flash = Math.sin(t / 100) > 0;
            ctx.fillStyle = flash ? '#ff0000' : '#ff6600';
            ctx.globalAlpha = 0.4;
            ctx.fillRect(x + 6, y + 4, W - 12, H - 8);
          }
          // Idle subtle pulse
          if (!isActive) {
            ctx.fillStyle = '#ff4a4a';
            ctx.globalAlpha = 0.1 + Math.sin(t / 1000) * 0.05;
            ctx.fillRect(x + 8, y + 6, W - 16, H - 12);
          }
          ctx.globalAlpha = 1;
          break;
        }

        // ════════════════════════════════════════
        // PLUGS — bidirectional connected plugs, websocket
        // ════════════════════════════════════════
        case 'plugs': {
          // Left plug
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.6;
          ctx.fillRect(x + 8, cy - 8, 20, 6);
          ctx.fillRect(x + 8, cy + 2, 20, 6);
          ctx.fillRect(x + 24, cy - 10, 8, 20);
          // Right plug
          ctx.fillRect(x + W - 28, cy - 8, 20, 6);
          ctx.fillRect(x + W - 28, cy + 2, 20, 6);
          ctx.fillRect(x + W - 32, cy - 10, 8, 20);
          // Connection in middle
          const pulse = isActive ? (0.5 + Math.sin(t / 150) * 0.4) : (0.2 + Math.sin(t / 800) * 0.1);
          ctx.fillStyle = style.color;
          ctx.globalAlpha = pulse;
          ctx.fillRect(x + 32, cy - 3, W - 64, 6);
          // Bidirectional arrows
          ctx.globalAlpha = 0.7;
          // Left arrow
          ctx.fillRect(x + 34, cy - 6, 6, 2);
          ctx.fillRect(x + 34, cy + 4, 6, 2);
          // Right arrow
          ctx.fillRect(x + W - 40, cy - 6, 6, 2);
          ctx.fillRect(x + W - 40, cy + 4, 6, 2);
          // Data dots flowing both directions
          ctx.globalAlpha = 0.5;
          const dotFlow1 = (t / 40) % (W - 64);
          const dotFlow2 = (W - 64) - (t / 50) % (W - 64);
          ctx.fillRect(x + 32 + dotFlow1, cy - 1, 3, 2);
          ctx.fillRect(x + 32 + dotFlow2, cy, 3, 2);
          ctx.globalAlpha = 1;
          break;
        }

        // ════════════════════════════════════════
        // EXIT GATE — similar to entry, reversed
        // ════════════════════════════════════════
        case 'exitgate': {
          const postW = 8;
          const postH = H - 12;
          const gateOpen = isActive ? Math.min(Math.sin(t / 300) * 0.5 + 0.5, 1) : 0;
          // Left post
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.7;
          ctx.fillRect(x + 10, y + 8, postW, postH);
          // Right post
          ctx.fillRect(x + W - 18, y + 8, postW, postH);
          // Arch
          ctx.fillRect(x + 10, y + 8, W - 20, 6);
          // Gate bars
          ctx.globalAlpha = 0.5;
          const exitSpread = gateOpen * 20;
          for (let i = 0; i < 4; i++) {
            const bx = cx - 12 + i * 8;
            ctx.fillRect(bx + exitSpread * (i < 2 ? -1 : 1) * 0.3, y + 16, 3, postH - 10);
          }
          // EXIT sign (red/orange)
          ctx.fillStyle = '#ff6644';
          ctx.globalAlpha = 0.7 + Math.sin(t / 500) * 0.2;
          ctx.fillRect(cx - 14, y + 2, 28, 6);
          ctx.fillStyle = '#0d0d1a';
          ctx.globalAlpha = 0.9;
          ctx.font = 'bold 5px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('EXIT', cx, y + 5);
          ctx.globalAlpha = 1;
          break;
        }

        // ════════════════════════════════════════
        // WORKBENCH — tools and work surface (service/controller)
        // ════════════════════════════════════════
        case 'workbench':
        default: {
          // Workbench surface
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.35;
          ctx.fillRect(x + 6, y + H - 22, W - 12, 4);
          // Legs
          ctx.fillRect(x + 10, y + H - 18, 4, 14);
          ctx.fillRect(x + W - 14, y + H - 18, 4, 14);
          // Tool rack (top area)
          ctx.globalAlpha = 0.25;
          ctx.fillRect(x + 8, y + 6, W - 16, 2);
          // Hanging tools
          const toolPositions = [0.2, 0.35, 0.5, 0.65, 0.8];
          for (let ti = 0; ti < toolPositions.length; ti++) {
            const tx = x + W * toolPositions[ti];
            ctx.fillStyle = style.color;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(tx - 1, y + 8, 2, 6 + (ti % 3) * 3);
            // Tool head
            ctx.fillRect(tx - 2, y + 8 + 6 + (ti % 3) * 3, 4, 3);
          }
          // Active work indicator
          if (isActive) {
            ctx.fillStyle = style.color;
            ctx.globalAlpha = 0.15 + Math.sin(t / 200) * 0.1;
            ctx.fillRect(x + 14, y + H - 40, W - 28, 16);
          }
          // Service name prominently
          ctx.fillStyle = style.color;
          ctx.globalAlpha = 0.7;
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const svcName = node.name.length > 16 ? node.name.substring(0, 14) + '..' : node.name;
          ctx.fillText(svcName, cx, cy - 4);
          ctx.globalAlpha = 1;
          break;
        }
      }

      // ── Common border (subtle, shape-aware) ──
      ctx.strokeStyle = style.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.strokeRect(x, y, W, H);
      ctx.globalAlpha = 1;

      // ── Type label (top-left corner) ──
      ctx.fillStyle = style.color;
      ctx.font = '7px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.globalAlpha = 0.6;
      ctx.fillText(style.label, x + 4, y + 2);
      ctx.globalAlpha = 1;

      // ── Node name (bottom, skip for shapes that handle their own) ──
      if (shape !== 'workbench' && shape !== 'signpost' && shape !== 'belt') {
        ctx.fillStyle = COLORS.stationLabel;
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const name = node.name.length > 16 ? node.name.substring(0, 14) + '..' : node.name;
        ctx.fillText(name, cx, y + H - 3);
      }

      // ── Subtle glow pulse for active stations ──
      if (isActive) {
        const glowChar = activeChars[0];
        const glowColor = (glowChar._propColor) || style.color;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3 + Math.sin(t / 200) * 0.2;
        ctx.strokeRect(x - 3, y - 3, W + 6, H + 6);
        ctx.globalAlpha = 1;
      }

      // ── Context label (description below station) ──
      this._drawStationContext(ctx, x, y, node, style);

      // ── Edit mode: draw drag handle ──
      if (this.editMode) {
        ctx.fillStyle = '#ff4a4a';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x + 2, y + 2, 8, 8);
        ctx.fillRect(x + 2, y + 4, 8, 1);
        ctx.fillRect(x + 2, y + 7, 8, 1);
        ctx.globalAlpha = 1;
      }
    }

    _drawStationContext(ctx, x, y, node, style) {
      const meta = node.metadata || {};
      const desc = meta.description || meta.purpose || '';
      if (!desc) return;

      ctx.fillStyle = style.color;
      ctx.globalAlpha = 0.35;
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const trimmed = desc.length > 22 ? desc.substring(0, 20) + '..' : desc;
      ctx.fillText(trimmed, x + STATION_WIDTH / 2, y + STATION_HEIGHT + 3);
      ctx.globalAlpha = 1;
    }

    // ═══════════════════════════════════════════
    // INFO PANEL (bottom of screen)
    // ═══════════════════════════════════════════

    _updateTooltip(e, screenToWorld, hitTestStation) {
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy);
      const hit = hitTestStation(world.x, world.y);

      if (!hit) {
        if (this._tooltipStationId !== null) {
          this._tooltip.style.display = 'none';
          this._tooltipStationId = null;
        }
        return;
      }

      // Same station — just reposition
      if (this._tooltipStationId === hit.id) {
        this._positionTooltip(e.clientX, e.clientY);
        return;
      }

      // New station hovered
      this._tooltipStationId = hit.id;
      const node = hit.station.node;
      const meta = node.metadata || {};
      const style = STATION_STYLES[node.type] || STATION_STYLES.service;

      // Build tooltip content
      const lines = [];
      lines.push(style.icon + ' ' + node.name);
      lines.push('Type: ' + (style.label || node.type).toUpperCase());
      if (meta.description) lines.push(meta.description);
      if (meta.filePath) lines.push('File: ' + meta.filePath);
      if (meta.handler) lines.push('Handler: ' + meta.handler);
      if (meta.dbTables) lines.push('Tables: ' + (Array.isArray(meta.dbTables) ? meta.dbTables.join(', ') : meta.dbTables));
      if (meta.tables) lines.push('Tables: ' + (Array.isArray(meta.tables) ? meta.tables.join(', ') : meta.tables));
      if (meta.orm) lines.push('ORM: ' + meta.orm);
      if (meta.authMethods) lines.push('Auth: ' + (Array.isArray(meta.authMethods) ? meta.authMethods.join(', ') : meta.authMethods));
      if (meta.queueName) lines.push('Queue: ' + meta.queueName);
      if (meta.middlewareChain) lines.push('MW: ' + (Array.isArray(meta.middlewareChain) ? meta.middlewareChain.join(' > ') : meta.middlewareChain));

      this._tooltip.innerHTML = lines.map((l, i) => {
        if (i === 0) return '<div style="color:' + style.color + ';margin-bottom:4px">' + this._escHtml(l) + '</div>';
        if (i === 1) return '<div style="color:#557766;margin-bottom:4px;font-size:7px">' + this._escHtml(l) + '</div>';
        return '<div style="color:#88ffcc;font-size:7px">' + this._escHtml(l) + '</div>';
      }).join('');
      this._tooltip.style.borderColor = style.color;
      this._tooltip.style.display = 'block';
      this._positionTooltip(e.clientX, e.clientY);
    }

    _positionTooltip(cx, cy) {
      const tip = this._tooltip;
      const pad = 14;
      let tx = cx + pad;
      let ty = cy + pad;
      // Keep tooltip on-screen
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      if (tx + tw > window.innerWidth - 4) tx = cx - tw - pad;
      if (ty + th > window.innerHeight - 4) ty = cy - th - pad;
      tip.style.left = tx + 'px';
      tip.style.top = ty + 'px';
    }

    _escHtml(str) {
      const d = document.createElement('div');
      d.textContent = str;
      return d.innerHTML;
    }

    _showInfoPanel(text, color, duration) {
      this._infoPanel = { text, color: color || '#33ff99', timer: duration || 300 };
      this.needsRedraw = true;
    }

    _drawInfoPanel(ctx) {
      if (!this._infoPanel || this._infoPanel.timer <= 0) return;
      this._infoPanel.timer--;

      const text = this._infoPanel.text;
      const color = this._infoPanel.color;
      const alpha = Math.min(1, this._infoPanel.timer / 30);

      const panelH = 44;
      const panelY = this.height - panelH - 8;
      const panelX = 8;
      const panelW = this.width - 296; // leave space for side panel

      // Background
      ctx.fillStyle = '#0d0d1a';
      ctx.globalAlpha = 0.9 * alpha;
      ctx.fillRect(panelX, panelY, panelW, panelH);

      // Border
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.7 * alpha;
      ctx.lineWidth = 1;
      ctx.strokeRect(panelX, panelY, panelW, panelH);

      // Text
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Word wrap
      const maxW = panelW - 16;
      const words = text.split(' ');
      let line = '';
      let y = panelY + 8;
      const lineH = 12;
      for (const word of words) {
        const test = line + (line ? ' ' : '') + word;
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, panelX + 8, y);
          line = word;
          y += lineH;
          if (y > panelY + panelH - 8) break;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, panelX + 8, y);

      ctx.globalAlpha = 1;
    }

    _drawHUD(ctx) {
      // Factory title
      ctx.fillStyle = '#33ff99';
      ctx.globalAlpha = 0.15;
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('BACKEND FACTORY v2.1', 12, this.height - 12);
      ctx.globalAlpha = 1;

      // Active characters count
      if (this.characters.length > 0) {
        ctx.fillStyle = '#ffaa33';
        ctx.globalAlpha = 0.6;
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('ACTIVE: ' + this.characters.length, this.width - 12, this.height - 12);
        ctx.globalAlpha = 1;
      }

      // Edit mode indicator
      if (this.editMode) {
        ctx.fillStyle = '#ff4a4a';
        ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 300) * 0.3;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EDIT MODE — DRAG STATIONS', this.width / 2, 20);
        ctx.globalAlpha = 1;
      }

      // "No architecture" message
      if (!this.architecture || Object.keys(this.stations).length === 0) {
        ctx.fillStyle = '#33ff99';
        ctx.globalAlpha = 0.5;
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AWAITING ARCHITECTURE DATA...', this.width / 2, this.height / 2);
        ctx.font = '10px monospace';
        ctx.fillText('Run /factory-analyze to scan your backend', this.width / 2, this.height / 2 + 24);
        ctx.globalAlpha = 1;
      }
    }

    destroy() {
      this.running = false;
    }
  }

  // ═══════════════════════════════════════════
  // DWELL SPEED API
  // ═══════════════════════════════════════════
  // Slider value 0-100: 0=slowest (3x dwell), 50=default (1x), 100=fastest (0.2x dwell)
  window.setDwellSpeed = function(sliderValue) {
    // Map 0-100 to multiplier using CONFIG slider bounds
    const v = Math.max(0, Math.min(100, sliderValue));
    if (v <= 50) {
      // 0-50: maps to dwellSliderMin-dwellSliderMid (slower range)
      dwellSpeedMultiplier = CONFIG.dwellSliderMin + (v / 50) * (CONFIG.dwellSliderMid - CONFIG.dwellSliderMin);
    } else {
      // 50-100: maps to dwellSliderMid-dwellSliderMax (faster range)
      dwellSpeedMultiplier = CONFIG.dwellSliderMid + ((v - 50) / 50) * (CONFIG.dwellSliderMax - CONFIG.dwellSliderMid);
    }
  };

  // ═══════════════════════════════════════════
  // EXPORTS
  // ═══════════════════════════════════════════
  window.Factory = new Factory();

})();
