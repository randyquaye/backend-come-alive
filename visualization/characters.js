/**
 * Backend Factory Visualizer - Procedural Pixel Art Characters
 *
 * Each character is defined as 2D arrays of color indices.
 * Palette index 0 = transparent.
 * Characters are 10x10 pixel grids, rendered at 4x scale (40x40 on screen).
 */

(function() {
  'use strict';

  const PIXEL_SCALE = 4;
  const CHAR_SIZE = 10;

  // Color palettes per character type
  const PALETTES = {
    RequestWorker: {
      0: null,                    // transparent
      1: '#4a9eff',              // body blue
      2: '#2d6bbf',              // dark blue (shading)
      3: '#0d0d1a',              // eyes (near-black)
      4: '#6bb5ff',              // highlight blue
    },
    ErrorHandler: {
      0: null,
      1: '#ff4a4a',              // body red
      2: '#bf2d2d',              // dark red
      3: '#0d0d1a',              // eyes
      4: '#ff7b7b',              // highlight red
    },
    CacheManager: {
      0: null,
      1: '#4aff7f',              // body green
      2: '#2dbf5a',              // dark green
      3: '#0d0d1a',              // eyes
      4: '#7bffaa',              // highlight green
    },
    DBOperator: {
      0: null,
      1: '#ffd54a',              // body gold
      2: '#bf9f2d',              // dark gold
      3: '#0d0d1a',              // eyes
      4: '#ffe47b',              // highlight gold
    },
    QueueWorker: {
      0: null,
      1: '#b44aff',              // body purple
      2: '#862dbf',              // dark purple
      3: '#0d0d1a',              // eyes
      4: '#cc7bff',              // highlight purple
    },
    RateLimiter: {
      0: null,
      1: '#e07a3a',              // body orange
      2: '#a85a2a',              // dark orange
      3: '#0d0d1a',              // eyes
      4: '#f0a06a',              // highlight orange
    },
    AuthGuard: {
      0: null,
      1: '#cccccc',              // body grey
      2: '#888888',              // dark grey
      3: '#0d0d1a',              // eyes
      4: '#ffffff',              // highlight white
      5: '#ff4a4a',              // badge red
    },
    ResponseCarrier: {
      0: null,
      1: '#4af5ff',              // body cyan
      2: '#2db8bf',              // dark cyan
      3: '#0d0d1a',              // eyes
      4: '#7bfaff',              // highlight cyan
    },
  };

  // ═══════════════════════════════════════════
  // CHARACTER SPRITE DEFINITIONS
  // Base shape inspired by reference image:
  // Chunky body, stubby legs, two ears/horns on top, simple eyes
  // ═══════════════════════════════════════════

  const SPRITES = {

    // ── REQUEST WORKER (Blue) ── Base character
    RequestWorker: {
      idle: [
        [ // Frame 0 - standing
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
        [ // Frame 1 - slight bounce
          [0,0,0,0,0,0,0,0,0,0],
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
      ],
      walk: [
        [ // Frame 0 - left leg forward
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,2,1,0,0,1,0,0,0],
          [0,2,2,0,0,0,0,2,0,0],
        ],
        [ // Frame 1 - standing
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
        [ // Frame 2 - right leg forward
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,0,1,0,0,1,2,0,0],
          [0,0,2,0,0,0,0,2,2,0],
        ],
        [ // Frame 3 - standing (return)
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
      ],
      action: [
        [ // Frame 0 - arms up
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [4,1,1,1,1,1,1,1,1,4],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
        [ // Frame 1 - interact
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,4,1,1,4,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,4,1,1,1,1,1,1,4,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
        [ // Frame 2 - return
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
      ],
    },

    // ── ERROR HANDLER (Red) ── X-eyes, jagged top
    ErrorHandler: {
      idle: [
        [
          [0,0,1,0,0,0,0,1,0,0],
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,4,4,3,1,0,0],
          [0,0,1,4,3,3,4,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
        [
          [0,0,0,0,0,0,0,0,0,0],
          [0,0,1,0,0,0,0,1,0,0],
          [0,0,0,1,1,1,1,0,0,0],
          [0,0,1,3,4,4,3,1,0,0],
          [0,0,1,4,3,3,4,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
      ],
      walk: [
        [
          [0,0,1,0,0,0,0,1,0,0],
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,4,4,3,1,0,0],
          [0,0,1,4,3,3,4,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,2,1,0,0,1,0,0,0],
          [0,2,2,0,0,0,0,2,0,0],
        ],
        [
          [0,0,1,0,0,0,0,1,0,0],
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,4,4,3,1,0,0],
          [0,0,1,4,3,3,4,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
        [
          [0,0,1,0,0,0,0,1,0,0],
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,4,4,3,1,0,0],
          [0,0,1,4,3,3,4,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,0,1,0,0,1,2,0,0],
          [0,0,2,0,0,0,0,2,2,0],
        ],
        [
          [0,0,1,0,0,0,0,1,0,0],
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,4,4,3,1,0,0],
          [0,0,1,4,3,3,4,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
      ],
      action: [
        [
          [0,4,1,0,0,0,0,1,4,0],
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,4,3,4,4,3,4,0,0],
          [0,0,1,4,3,3,4,1,0,0],
          [4,1,1,1,1,1,1,1,1,4],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
        [
          [0,0,1,0,0,0,0,1,0,0],
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,4,1,1,4,1,0,0],
          [0,0,1,1,4,4,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,4,1,4,4,1,4,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
        [
          [0,0,1,0,0,0,0,1,0,0],
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,4,4,3,1,0,0],
          [0,0,1,4,3,3,4,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
      ],
    },

    // ── CACHE MANAGER (Green) ── Flat top (shelf instead of ears)
    CacheManager: {
      idle: [
        [
          [0,0,0,0,0,0,0,0,0,0],
          [0,0,4,4,4,4,4,4,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
        [
          [0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0],
          [0,0,4,4,4,4,4,4,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
      ],
      walk: null, // will inherit from RequestWorker with color swap
      action: null,
    },

    // ── DB OPERATOR (Gold) ── Wider body
    DBOperator: {
      idle: [
        [
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [1,1,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1,1,1],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
        [
          [0,0,0,0,0,0,0,0,0,0],
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [1,1,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1,1,1],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
      ],
      walk: null,
      action: null,
    },

    // ── QUEUE WORKER (Purple) ── Carries box above head
    QueueWorker: {
      idle: [
        [
          [0,0,0,4,4,4,0,0,0,0],
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
        [
          [0,0,0,0,0,0,0,0,0,0],
          [0,0,0,4,4,4,0,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
      ],
      walk: null,
      action: null,
    },

    // ── RATE LIMITER (Orange) ── Arms extended
    RateLimiter: {
      idle: [
        [
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [4,1,1,1,1,1,1,1,1,4],
          [4,1,1,1,1,1,1,1,1,4],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
        [
          [0,0,0,0,0,0,0,0,0,0],
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [4,1,1,1,1,1,1,1,1,4],
          [4,1,1,1,1,1,1,1,1,4],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
      ],
      walk: null,
      action: null,
    },

    // ── AUTH GUARD (Grey) ── Badge on chest
    AuthGuard: {
      idle: [
        [
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,5,5,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
        [
          [0,0,0,0,0,0,0,0,0,0],
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,5,5,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
      ],
      walk: null,
      action: null,
    },

    // ── RESPONSE CARRIER (Cyan) ── Same as base but mirrored/facing left
    ResponseCarrier: {
      idle: [
        [
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,4,4,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
        [
          [0,0,0,0,0,0,0,0,0,0],
          [0,0,0,1,0,0,1,0,0,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,3,1,1,3,1,0,0],
          [0,0,1,1,4,4,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,0,0,1,1,0,0],
          [0,0,2,2,0,0,2,2,0,0],
        ],
      ],
      walk: null,
      action: null,
    },
  };

  // ═══════════════════════════════════════════
  // Generate missing walk/action frames from RequestWorker template
  // ═══════════════════════════════════════════
  function generateFramesFromTemplate(characterName, templateFrames) {
    // Clone template frames and remap: just use the same shape
    // The palette swap happens at render time
    return templateFrames.map(frame =>
      frame.map(row => [...row])
    );
  }

  // Fill in missing walk/action frames from RequestWorker
  Object.keys(SPRITES).forEach(name => {
    if (!SPRITES[name].walk) {
      SPRITES[name].walk = generateFramesFromTemplate(name, SPRITES.RequestWorker.walk);
    }
    if (!SPRITES[name].action) {
      SPRITES[name].action = generateFramesFromTemplate(name, SPRITES.RequestWorker.action);
    }
  });

  // ═══════════════════════════════════════════
  // RENDERING
  // ═══════════════════════════════════════════

  /**
   * Draw a single sprite frame on a canvas context
   */
  function drawSprite(ctx, spriteFrame, palette, x, y, scale) {
    const ps = scale || PIXEL_SCALE;
    for (let row = 0; row < spriteFrame.length; row++) {
      for (let col = 0; col < spriteFrame[row].length; col++) {
        const colorIdx = spriteFrame[row][col];
        if (colorIdx === 0) continue; // transparent
        const color = palette[colorIdx];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x + col * ps, y + row * ps, ps, ps);
      }
    }
  }

  /**
   * Create an offscreen canvas with a pre-rendered sprite for performance
   */
  function prerenderSprite(spriteFrame, palette, scale) {
    const ps = scale || PIXEL_SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = CHAR_SIZE * ps;
    canvas.height = CHAR_SIZE * ps;
    const ctx = canvas.getContext('2d');
    drawSprite(ctx, spriteFrame, palette, 0, 0, ps);
    return canvas;
  }

  // ═══════════════════════════════════════════
  // CHARACTER ENTITY
  // ═══════════════════════════════════════════

  // ═══════════════════════════════════════════
  // HUE SHIFTING - randomize character colors
  // ═══════════════════════════════════════════

  function hexToHsl(hex) {
    const r = parseInt(hex.slice(1,3), 16) / 255;
    const g = parseInt(hex.slice(3,5), 16) / 255;
    const b = parseInt(hex.slice(5,7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }

  function hslToHex(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q-p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q-p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1+s) : l + s - l*s;
      const p = 2*l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    const toHex = v => Math.round(v * 255).toString(16).padStart(2, '0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  function shiftPalette(palette, hueShift) {
    const shifted = {};
    for (const [key, color] of Object.entries(palette)) {
      if (!color) { shifted[key] = null; continue; }
      const [h, s, l] = hexToHsl(color);
      shifted[key] = hslToHex((h + hueShift) % 1, s, l);
    }
    return shifted;
  }

  // ═══════════════════════════════════════════
  // SPEECH BUBBLE DRAWING
  // ═══════════════════════════════════════════

  function drawSpeechBubble(ctx, text, x, y, color) {
    const fontSize = 7;
    const lineHeight = fontSize + 3;
    const pad = 5;
    const maxWidth = 160; // max bubble width in pixels
    ctx.font = fontSize + 'px monospace';

    // Word-wrap text into lines
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
      if (ctx.measureText(testLine).width > maxWidth - pad * 2 && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Calculate bubble dimensions
    let bw = 0;
    for (let i = 0; i < lines.length; i++) {
      const lw = ctx.measureText(lines[i]).width;
      if (lw > bw) bw = lw;
    }
    bw = Math.min(bw + pad * 2, maxWidth);
    const bh = lines.length * lineHeight + pad * 2 - 2;
    const bx = x - bw / 2;
    const by = y - bh - 8;

    // Bubble background
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(bx, by, bw, bh);

    // Border
    ctx.strokeStyle = color || '#33ff99';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);

    // Pointer triangle
    ctx.fillStyle = color || '#33ff99';
    ctx.beginPath();
    ctx.moveTo(x - 3, by + bh);
    ctx.lineTo(x + 3, by + bh);
    ctx.lineTo(x, by + bh + 5);
    ctx.closePath();
    ctx.fill();

    // Text lines
    ctx.fillStyle = color || '#33ff99';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, by + pad + i * lineHeight + fontSize / 2);
    }
  }

  // ═══════════════════════════════════════════
  // RESPONSE BADGE RENDERING
  // ═══════════════════════════════════════════

  const BADGE_COLORS = {
    '200': '#4aff7f',
    '201': '#4aff7f',
    '304': '#88ffcc',
    '400': '#e07a3a',
    '401': '#ff4a4a',
    '403': '#ff4a4a',
    '404': '#ffd54a',
    '429': '#e07a3a',
    '500': '#ff4a4a',
  };

  function drawBadge(ctx, code, x, y) {
    const color = BADGE_COLORS[code] || '#88ffcc';
    const fontSize = 6;
    ctx.font = 'bold ' + fontSize + 'px monospace';
    const tw = ctx.measureText(code).width;
    const pad = 2;
    const bx = x - (tw + pad * 2) / 2;
    const by = y;

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(bx, by, tw + pad * 2, fontSize + pad * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, tw + pad * 2, fontSize + pad * 2);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, x, by + (fontSize + pad * 2) / 2);
  }

  // ═══════════════════════════════════════════
  // CHARACTER ENTITY
  // ═══════════════════════════════════════════

  class Character {
    constructor(type, x, y) {
      this.type = type;
      this.x = x;
      this.y = y;
      this.targetX = x;
      this.targetY = y;
      this.speed = 1.5; // pixels per frame
      this.state = 'idle'; // idle, walk, action, blocked
      this.frameIndex = 0;
      this.frameTick = 0;
      this.frameRate = 8; // frames between animation changes
      this.actionTimer = 0;
      this.actionDuration = 60; // frames to stay in action state
      this.path = []; // waypoints [{x, y, stationId}]
      this.pathIndex = 0;
      this.done = false;

      // Color randomization: shift hue by random amount
      this.hueShift = (Math.random() * 0.3 - 0.15); // ±15% hue
      const basePalette = PALETTES[type] || PALETTES.RequestWorker;
      this.palette = shiftPalette(basePalette, this.hueShift);
      this.sprites = SPRITES[type] || SPRITES.RequestWorker;
      this.prerendered = {};
      this._prerenderAll();

      // Speech bubble
      this.bubble = null; // { text, timer, color }

      // Response badge
      this.badge = null; // '200', '404', '500' etc
    }

    _prerenderAll() {
      ['idle', 'walk', 'action'].forEach(state => {
        this.prerendered[state] = this.sprites[state].map(
          frame => prerenderSprite(frame, this.palette)
        );
      });
    }

    setPath(waypoints) {
      this.path = waypoints;
      this.pathIndex = 0;
      if (waypoints.length > 0) {
        this.targetX = waypoints[0].x;
        this.targetY = waypoints[0].y;
        this.state = 'walk';
      }
    }

    update() {
      this.frameTick++;

      // Update speech bubble timer
      if (this.bubble) {
        this.bubble.timer--;
        if (this.bubble.timer <= 0) this.bubble = null;
      }

      // Blocked characters fade out and die
      if (this.state === 'blocked') {
        this.actionTimer++;
        if (this.actionTimer > 240) { // ~4 seconds at 60fps
          this.done = true;
        }
        // Advance idle animation
        if (this.frameTick % this.frameRate === 0) {
          const frames = this.sprites.idle;
          this.frameIndex = (this.frameIndex + 1) % frames.length;
        }
        return;
      }

      if (this.state === 'action') {
        this.actionTimer++;
        if (this.actionTimer >= this.actionDuration) {
          this.actionTimer = 0;

          // 429: redirect to exit after lingering at rate limiter
          if (this._redirectToExit) {
            const exitWp = this._redirectToExit;
            this._redirectToExit = null;
            this.path = [exitWp];
            this.pathIndex = 0;
            this.targetX = exitWp.x;
            this.targetY = exitWp.y;
            this.state = 'walk';
            return;
          }

          // 500: redirect through error handler to exit
          if (this._errorRedirect) {
            const errorPath = this._errorRedirect;
            this._errorRedirect = null;
            this.path = errorPath;
            this.pathIndex = 0;
            this.targetX = errorPath[0].x;
            this.targetY = errorPath[0].y;
            this.state = 'walk';
            return;
          }

          this.pathIndex++;
          if (this.pathIndex < this.path.length) {
            this.targetX = this.path[this.pathIndex].x;
            this.targetY = this.path[this.pathIndex].y;
            this.state = 'walk';
          } else {
            this.done = true;
          }
        }
      }

      if (this.state === 'walk') {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.speed) {
          this.x = this.targetX;
          this.y = this.targetY;
          // Arrived at waypoint
          const wp = this.path[this.pathIndex];
          if (wp && wp.stationId) {
            this.state = 'action';
            this.actionTimer = 0;
          } else {
            this.pathIndex++;
            if (this.pathIndex < this.path.length) {
              this.targetX = this.path[this.pathIndex].x;
              this.targetY = this.path[this.pathIndex].y;
            } else {
              this.done = true;
            }
          }
        } else {
          this.x += (dx / dist) * this.speed;
          this.y += (dy / dist) * this.speed;
        }
      }

      // Advance animation frame
      if (this.frameTick % this.frameRate === 0) {
        const drawState = this.state === 'blocked' ? 'idle' : this.state;
        const frames = this.sprites[drawState];
        this.frameIndex = (this.frameIndex + 1) % frames.length;
      }
    }

    showBubble(text, durationFrames, color) {
      this.bubble = { text: text, timer: durationFrames || 90, color: color || null };
    }

    // Transform into ErrorHandler "bug" character (red, X-eyes)
    _transformToBug(factory) {
      this.type = 'ErrorHandler';
      this.palette = shiftPalette(PALETTES.ErrorHandler, this.hueShift);
      this.sprites = SPRITES.ErrorHandler;
      this.prerendered = {};
      this._prerenderAll();
    }

    setBadge(code) {
      this.badge = code; // '200', '404', '500', etc.
    }

    draw(ctx) {
      const drawState = this.state === 'blocked' ? 'idle' : this.state;
      const frames = this.prerendered[drawState];
      if (!frames || frames.length === 0) return;
      const frameCanvas = frames[this.frameIndex % frames.length];
      const drawX = Math.round(this.x - (CHAR_SIZE * PIXEL_SCALE) / 2);
      const drawY = Math.round(this.y - (CHAR_SIZE * PIXEL_SCALE) / 2);

      // If blocked, draw with reduced opacity and red tint
      if (this.state === 'blocked') {
        ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 150) * 0.2;
      }

      ctx.drawImage(frameCanvas, drawX, drawY);
      ctx.globalAlpha = 1;

      // Draw badge (response code)
      if (this.badge) {
        drawBadge(ctx, this.badge, this.x, drawY - 4);
      }

      // Draw prop (emoji icon from scenario, shown to the right of the character)
      if (this._prop && this.state === 'action') {
        ctx.font = '14px serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.9;
        ctx.fillText(this._prop, drawX + CHAR_SIZE * PIXEL_SCALE + 2, this.y);
        ctx.globalAlpha = 1;
      }

      // Draw speech bubble
      if (this.bubble && this.bubble.timer > 0) {
        const alpha = Math.min(1, this.bubble.timer / 20); // fade out last 20 frames
        ctx.globalAlpha = alpha;
        drawSpeechBubble(ctx, this.bubble.text, this.x, drawY - (this.badge ? 14 : 0), this.bubble.color);
        ctx.globalAlpha = 1;
      }
    }
  }

  // ═══════════════════════════════════════════
  // EXPORTS
  // ═══════════════════════════════════════════

  window.Characters = {
    PALETTES,
    SPRITES,
    PIXEL_SCALE,
    CHAR_SIZE,
    Character,
    drawSprite,
    prerenderSprite,
    // Map node types to character types
    typeMap: {
      'entrypoint':    'RequestWorker',
      'route':         'RequestWorker',
      'middleware':     'RequestWorker',
      'auth':          'AuthGuard',
      'ratelimit':     'RateLimiter',
      'controller':    'RequestWorker',
      'service':       'RequestWorker',
      'database':      'DBOperator',
      'cache':         'CacheManager',
      'queue':         'QueueWorker',
      'external_api':  'RequestWorker',
      'error_handler': 'ErrorHandler',
      'websocket':     'RequestWorker',
      'exit':          'ResponseCarrier',
    },
  };

})();
