/**
 * Backend Factory Visualizer - Adaptive Mood System
 *
 * Calculates a "mood" for the factory based on architecture quality,
 * security vulnerabilities, and performance bottlenecks. Drives ambient
 * particle effects and overlay tinting on the canvas.
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════
  // MOOD STATES
  // ═══════════════════════════════════════════

  const MOOD_STATES = {
    THRIVING:  { min: 81, label: 'THRIVING',  color: '#ffd54a', particleColor: '#ffe47b', ambientAlpha: 0.03 },
    CALM:      { min: 61, label: 'CALM',      color: '#4a9eff', particleColor: '#6bb5ff', ambientAlpha: 0.02 },
    ANXIOUS:   { min: 41, label: 'ANXIOUS',   color: '#e07a3a', particleColor: '#f0a06a', ambientAlpha: 0.04 },
    STRESSED:  { min: 21, label: 'STRESSED',  color: '#ff4a4a', particleColor: '#ff7b7b', ambientAlpha: 0.05 },
    CRITICAL:  { min: 0,  label: 'CRITICAL',  color: '#ff0000', particleColor: '#ff4a4a', ambientAlpha: 0.08 },
  };

  // ═══════════════════════════════════════════
  // MOOD SCORE CALCULATION
  // ═══════════════════════════════════════════

  function calculateMood(architectureData) {
    let score = 70; // base
    const nodes = architectureData.nodes || [];
    const nodesByType = {};
    nodes.forEach(function(n) { nodesByType[n.type] = (nodesByType[n.type] || 0) + 1; });

    // Bonuses for good architecture
    if (nodesByType.cache) score += 5;
    if (nodesByType.ratelimit) score += 5;
    if (nodesByType.error_handler) score += 5;
    if (nodesByType.auth) score += 5;

    // Security report penalties
    if (architectureData.security_report) {
      var vulns = architectureData.security_report.vulnerabilities || [];
      score -= vulns.filter(function(v) { return v.severity === 'CRITICAL'; }).length * 15;
      score -= vulns.filter(function(v) { return v.severity === 'HIGH'; }).length * 10;
      score -= vulns.filter(function(v) { return v.severity === 'MEDIUM'; }).length * 5;
    }

    // Performance report penalties
    if (architectureData.performance_report) {
      var bottlenecks = architectureData.performance_report.bottlenecks || [];
      score -= bottlenecks.filter(function(b) { return b.severity === 'HIGH'; }).length * 10;
      score -= bottlenecks.filter(function(b) { return b.severity === 'MEDIUM'; }).length * 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  // ═══════════════════════════════════════════
  // MOOD STATE LOOKUP
  // ═══════════════════════════════════════════

  function getMoodState(score) {
    if (score >= MOOD_STATES.THRIVING.min) return MOOD_STATES.THRIVING;
    if (score >= MOOD_STATES.CALM.min)     return MOOD_STATES.CALM;
    if (score >= MOOD_STATES.ANXIOUS.min)  return MOOD_STATES.ANXIOUS;
    if (score >= MOOD_STATES.STRESSED.min) return MOOD_STATES.STRESSED;
    return MOOD_STATES.CRITICAL;
  }

  // ═══════════════════════════════════════════
  // MOOD MESSAGES
  // ═══════════════════════════════════════════

  var MOOD_MESSAGES = {};
  MOOD_MESSAGES[MOOD_STATES.THRIVING.label] = [
    'Factory is thriving! All systems running smoothly.',
    'Peak performance! The factory hums with confidence.',
    'Everything is in order. Workers are happy.',
  ];
  MOOD_MESSAGES[MOOD_STATES.CALM.label] = [
    'Factory is calm. Steady operations.',
    'All quiet on the factory floor.',
    'Systems nominal. A good day at the factory.',
  ];
  MOOD_MESSAGES[MOOD_STATES.ANXIOUS.label] = [
    'Factory is anxious. Some concerns detected.',
    'Workers are uneasy. Minor issues brewing.',
    'The factory floor feels tense today.',
  ];
  MOOD_MESSAGES[MOOD_STATES.STRESSED.label] = [
    'Factory is stressed! Multiple issues detected.',
    'Warning lights are flashing. Address problems soon.',
    'Workers are overwhelmed. Systems under strain.',
  ];
  MOOD_MESSAGES[MOOD_STATES.CRITICAL.label] = [
    'CRITICAL! Factory is in danger!',
    'EMERGENCY! Severe issues require immediate attention!',
    'ALARM! Systems are failing!',
  ];

  function getMoodMessage(score) {
    var state = getMoodState(score);
    var messages = MOOD_MESSAGES[state.label] || [];
    return messages[Math.floor(Math.random() * messages.length)] || '';
  }

  // ═══════════════════════════════════════════
  // PARTICLE SYSTEM
  // ═══════════════════════════════════════════

  /**
   * A single mood particle rendered on the factory canvas.
   */
  function MoodParticle(x, y, mood) {
    this.x = x;
    this.y = y;
    this.alpha = 0.4 + Math.random() * 0.5;
    this.size = 1 + Math.random() * 2;
    this.lifetime = 60 + Math.floor(Math.random() * 120); // frames
    this.age = 0;
    this.color = mood.particleColor;
    this.shape = 'circle'; // default

    // Behaviour varies by mood label
    switch (mood.label) {
      case 'THRIVING':
        // Golden sparkles rising upward slowly
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = -(0.3 + Math.random() * 0.5);
        this.shape = 'square';
        break;
      case 'CALM':
        // Blue motes drifting horizontally
        this.vx = 0.3 + Math.random() * 0.4;
        this.vy = (Math.random() - 0.5) * 0.15;
        break;
      case 'ANXIOUS':
        // Amber embers with slight jitter
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = -(0.2 + Math.random() * 0.3);
        this._jitter = true;
        break;
      case 'STRESSED':
        // Red sparks shooting from random positions
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.lifetime = 30 + Math.floor(Math.random() * 40);
        this.shape = 'square';
        break;
      case 'CRITICAL':
        // Dark smoke particles falling, periodic red flash
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = 0.3 + Math.random() * 0.5;
        this.color = '#444444';
        this.size = 2 + Math.random() * 3;
        this._flash = Math.random() < 0.3; // 30% chance of being a red flash particle
        if (this._flash) {
          this.color = '#ff0000';
          this.size = 1 + Math.random() * 1.5;
          this.lifetime = 10 + Math.floor(Math.random() * 15);
          this.alpha = 0.6 + Math.random() * 0.4;
        }
        break;
      default:
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = -(0.2 + Math.random() * 0.3);
    }
  }

  MoodParticle.prototype.update = function() {
    this.age++;
    this.x += this.vx;
    this.y += this.vy;

    // Jitter for ANXIOUS mood
    if (this._jitter) {
      this.x += (Math.random() - 0.5) * 0.8;
      this.y += (Math.random() - 0.5) * 0.4;
    }

    // Fade out in the last third of lifetime
    var fadeStart = this.lifetime * 0.66;
    if (this.age > fadeStart) {
      this.alpha *= 0.95;
    }
  };

  MoodParticle.prototype.draw = function(ctx) {
    if (this.alpha < 0.01) return;
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;

    if (this.shape === 'square') {
      ctx.fillRect(
        Math.round(this.x - this.size / 2),
        Math.round(this.y - this.size / 2),
        Math.round(this.size),
        Math.round(this.size)
      );
    } else {
      ctx.beginPath();
      ctx.arc(Math.round(this.x), Math.round(this.y), this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  };

  MoodParticle.prototype.isDead = function() {
    return this.age >= this.lifetime || this.alpha < 0.01;
  };

  // ═══════════════════════════════════════════
  // PARTICLE MANAGEMENT
  // ═══════════════════════════════════════════

  var MAX_PARTICLES = 80;
  var SPAWN_RATE = {
    THRIVING: 2,
    CALM:     1,
    ANXIOUS:  3,
    STRESSED: 4,
    CRITICAL: 5,
  };

  function createMoodParticles(mood, canvasWidth, canvasHeight) {
    var particles = [];
    var count = SPAWN_RATE[mood.label] || 2;
    for (var i = 0; i < count; i++) {
      var x, y;
      switch (mood.label) {
        case 'THRIVING':
          // Rise from bottom area
          x = Math.random() * canvasWidth;
          y = canvasHeight - Math.random() * 40;
          break;
        case 'CALM':
          // Drift in from left side
          x = -5;
          y = Math.random() * canvasHeight;
          break;
        case 'ANXIOUS':
          // Float up from lower half
          x = Math.random() * canvasWidth;
          y = canvasHeight * 0.6 + Math.random() * canvasHeight * 0.4;
          break;
        case 'STRESSED':
          // Shoot from random positions
          x = Math.random() * canvasWidth;
          y = Math.random() * canvasHeight;
          break;
        case 'CRITICAL':
          // Fall from top
          x = Math.random() * canvasWidth;
          y = -5 + Math.random() * 20;
          break;
        default:
          x = Math.random() * canvasWidth;
          y = Math.random() * canvasHeight;
      }
      particles.push(new MoodParticle(x, y, mood));
    }
    return particles;
  }

  function updateParticles(particles) {
    for (var i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      if (particles[i].isDead()) {
        particles.splice(i, 1);
      }
    }
    // Cap particle count
    if (particles.length > MAX_PARTICLES) {
      particles.splice(0, particles.length - MAX_PARTICLES);
    }
    return particles;
  }

  function drawParticles(ctx, particles) {
    for (var i = 0; i < particles.length; i++) {
      particles[i].draw(ctx);
    }
  }

  // ═══════════════════════════════════════════
  // AMBIENT OVERLAY
  // ═══════════════════════════════════════════

  function drawMoodAmbient(ctx, mood, width, height) {
    // Soft radial gradient overlay tinted with the mood color
    ctx.globalAlpha = mood.ambientAlpha;
    ctx.fillStyle = mood.color;
    ctx.fillRect(0, 0, width, height);

    // For CRITICAL mood, add a pulsing red vignette
    if (mood.label === 'CRITICAL') {
      var pulse = 0.5 + 0.5 * Math.sin(Date.now() / 250);
      ctx.globalAlpha = mood.ambientAlpha * pulse;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.globalAlpha = 1;
  }

  // ═══════════════════════════════════════════
  // SPEED MULTIPLIER
  // ═══════════════════════════════════════════

  function getMoodSpeedMultiplier(mood) {
    switch (mood.label) {
      case 'THRIVING':  return 1.2;
      case 'CALM':      return 1.0;
      case 'ANXIOUS':   return 0.95;
      case 'STRESSED':  return 0.9;
      case 'CRITICAL':  return 0.8;
      default:          return 1.0;
    }
  }

  // ═══════════════════════════════════════════
  // EXPORTS
  // ═══════════════════════════════════════════

  window.FactoryMood = {
    MOOD_STATES: MOOD_STATES,
    calculateMood: calculateMood,
    getMoodState: getMoodState,
    getMoodMessage: getMoodMessage,
    createMoodParticles: createMoodParticles,
    updateParticles: updateParticles,
    drawParticles: drawParticles,
    drawMoodAmbient: drawMoodAmbient,
    getMoodSpeedMultiplier: getMoodSpeedMultiplier,
  };

})();
