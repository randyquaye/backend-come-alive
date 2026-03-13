/**
 * Backend Factory Visualizer - Service Karma & Dependency Debt
 *
 * Calculates karma scores (0-100) for each architecture node based on
 * documentation, security posture, error handling, caching, and test coverage.
 * Renders glowing auras around nodes and debt tethers along edges.
 *
 * Karma tiers:
 *   80-100  Hero      Gold radiant glow, upward sparkle particles
 *   60-79   Healthy   Green healthy glow
 *   40-59   Neutral   No visible aura
 *   20-39   At Risk   Amber warning pulse
 *    0-19   Critical  Red danger pulse with falling particles
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════
  // KARMA CALCULATION
  // ═══════════════════════════════════════════

  /**
   * Calculate a karma score (0-100) for a single architecture node.
   *
   * @param {Object} node           - Architecture node ({ id, type, metadata })
   * @param {Object} securityData   - Optional security-sentinel output
   * @param {Object} performanceData - Optional performance-pundit output
   * @returns {number} Clamped karma score 0-100
   */
  function calculateNodeKarma(node, securityData, performanceData) {
    let score = 20; // base karma — every node starts here
    const meta = node.metadata || {};

    // Positive contributions
    if (meta.description)   score += 10;  // documented
    if (node.type === 'auth')          score += 15;  // has auth protection
    if (node.type === 'ratelimit')     score += 10;  // has rate limiting
    if (node.type === 'error_handler') score += 15;  // handles errors
    if (node.type === 'cache')         score += 10;  // caching present
    if (meta.scenario)      score += 5;   // has scenario mapping
    if (meta.testCoverage)  score += 15;  // tested

    // Security penalties
    if (securityData) {
      var vulnerabilities = securityData.vulnerabilities || [];
      var nodeVulns = vulnerabilities.filter(function(v) {
        return v.affected_node_id === node.id;
      });
      score -= nodeVulns.length * 15;
    }

    // Performance penalties
    if (performanceData) {
      var bottlenecks = performanceData.bottlenecks || [];
      var nodeBottlenecks = bottlenecks.filter(function(b) {
        return b.affected_node_id === node.id;
      });
      score -= nodeBottlenecks.length * 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  // ═══════════════════════════════════════════
  // DEPENDENCY DEBT
  // ═══════════════════════════════════════════

  /**
   * Calculate dependency debt flowing across an edge.
   * Debt flows FROM a low-karma source TO its consumers.
   *
   * @param {Object} edge        - Architecture edge ({ source, target })
   * @param {number} sourceKarma - Karma score of the source node
   * @param {number} targetKarma - Karma score of the target node
   * @returns {number} Debt score 0-100
   */
  function calculateEdgeDebt(edge, sourceKarma, targetKarma) {
    var debt = 0;
    if (sourceKarma < 40) debt += (40 - sourceKarma) * 1.5;
    if (sourceKarma < 20) debt += 20; // critical source = heavy debt
    // High-karma targets depending on low-karma sources accumulate extra debt
    if (targetKarma > 60 && sourceKarma < 40) debt += 10;
    return Math.min(100, debt);
  }

  // ═══════════════════════════════════════════
  // KARMA AURA RENDERING
  // ═══════════════════════════════════════════

  /**
   * Draw a karma aura around a node position on the canvas.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x           - Center X
   * @param {number} y           - Center Y
   * @param {number} karmaScore  - 0-100
   * @param {number} radius      - Aura radius in pixels
   */
  function drawKarmaAura(ctx, x, y, karmaScore, radius) {
    if (karmaScore >= 80) {
      // Gold radiant glow with upward sparkle particles
      var pulse = 0.2 + Math.sin(Date.now() / 500) * 0.1;
      ctx.beginPath();
      var gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(255, 213, 74, ' + pulse + ')');
      gradient.addColorStop(1, 'rgba(255, 213, 74, 0)');
      ctx.fillStyle = gradient;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle particles rising upward
      var time = Date.now() / 1000;
      for (var i = 0; i < 3; i++) {
        var px = x + Math.sin(time * 2 + i * 2.1) * (radius * 0.4);
        var py = y - ((time * 20 + i * 15) % radius);
        var sparkleAlpha = 0.4 + Math.sin(time * 4 + i) * 0.3;
        ctx.fillStyle = 'rgba(255, 235, 150, ' + sparkleAlpha + ')';
        ctx.fillRect(px - 1, py - 1, 2, 2);
      }
    } else if (karmaScore >= 60) {
      // Green healthy glow
      var pulse = 0.15 + Math.sin(Date.now() / 600) * 0.08;
      ctx.beginPath();
      var gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(74, 255, 127, ' + pulse + ')');
      gradient.addColorStop(1, 'rgba(74, 255, 127, 0)');
      ctx.fillStyle = gradient;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (karmaScore >= 40) {
      // Neutral — no visible aura
      return;
    } else if (karmaScore >= 20) {
      // Amber warning pulse
      var pulse = 0.2 + Math.sin(Date.now() / 400) * 0.12;
      ctx.beginPath();
      var gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(224, 122, 58, ' + pulse + ')');
      gradient.addColorStop(1, 'rgba(224, 122, 58, 0)');
      ctx.fillStyle = gradient;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Red danger pulse with falling particles
      var pulse = 0.3 + Math.sin(Date.now() / 300) * 0.15;
      ctx.beginPath();
      var gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(255, 74, 74, ' + pulse + ')');
      gradient.addColorStop(1, 'rgba(255, 74, 74, 0)');
      ctx.fillStyle = gradient;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Falling danger particles
      var time = Date.now() / 1000;
      for (var i = 0; i < 3; i++) {
        var px = x + Math.sin(time * 1.5 + i * 2.5) * (radius * 0.5);
        var py = y + ((time * 15 + i * 12) % radius);
        var particleAlpha = 0.5 + Math.sin(time * 3 + i) * 0.3;
        ctx.fillStyle = 'rgba(255, 100, 100, ' + particleAlpha + ')';
        ctx.fillRect(px - 1, py - 1, 2, 2);
      }
    }
  }

  // ═══════════════════════════════════════════
  // DEBT TETHER RENDERING
  // ═══════════════════════════════════════════

  /**
   * Draw a dependency-debt tether between two nodes.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x1         - Source X
   * @param {number} y1         - Source Y
   * @param {number} x2         - Target X
   * @param {number} y2         - Target Y
   * @param {number} debtScore  - 0-100
   */
  function drawDebtTether(ctx, x1, y1, x2, y2, debtScore) {
    if (debtScore < 10) return; // no visible debt

    var colors = {
      low:      '#4aff7f',  // green, healthy
      medium:   '#ffd54a',  // yellow
      high:     '#e07a3a',  // orange
      critical: '#ff4a4a'   // red, pulsing
    };

    var color = debtScore > 75 ? colors.critical
              : debtScore > 50 ? colors.high
              : debtScore > 25 ? colors.medium
              : colors.low;
    var width = 1 + (debtScore / 25);

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ═══════════════════════════════════════════
  // LABELS
  // ═══════════════════════════════════════════

  /**
   * Return a human-readable karma tier label.
   *
   * @param {number} score - Karma score 0-100
   * @returns {string}
   */
  function getKarmaLabel(score) {
    if (score >= 80) return 'Hero';
    if (score >= 60) return 'Healthy';
    if (score >= 40) return 'Neutral';
    if (score >= 20) return 'At Risk';
    return 'Critical';
  }

  // ═══════════════════════════════════════════
  // KARMA REPORT GENERATOR
  // ═══════════════════════════════════════════

  /**
   * Generate a full karma report across all nodes and edges.
   *
   * @param {Array}  nodes           - Architecture nodes
   * @param {Array}  edges           - Architecture edges
   * @param {Object} securityData    - Optional security-sentinel output
   * @param {Object} performanceData - Optional performance-pundit output
   * @returns {Object} { heroes, atRisk, avgKarma, totalDebt, karmaMap, debtMap, narrative }
   */
  function getKarmaReport(nodes, edges, securityData, performanceData) {
    // Calculate karma for every node
    var karmaMap = {};
    var scores = [];

    (nodes || []).forEach(function(node) {
      var score = calculateNodeKarma(node, securityData, performanceData);
      karmaMap[node.id] = { node: node, score: score, label: getKarmaLabel(score) };
      scores.push({ id: node.id, name: node.label || node.id, score: score });
    });

    // Sort for heroes and at-risk
    var sorted = scores.slice().sort(function(a, b) { return b.score - a.score; });
    var heroes = sorted.slice(0, 3);
    var atRisk = sorted.slice().sort(function(a, b) { return a.score - b.score; }).slice(0, 3);

    // Average karma
    var totalKarma = scores.reduce(function(sum, s) { return sum + s.score; }, 0);
    var avgKarma = scores.length > 0 ? Math.round(totalKarma / scores.length) : 0;

    // Calculate debt for every edge
    var debtMap = {};
    var totalDebt = 0;

    (edges || []).forEach(function(edge) {
      var sourceEntry = karmaMap[edge.source];
      var targetEntry = karmaMap[edge.target];
      var sourceKarma = sourceEntry ? sourceEntry.score : 50;
      var targetKarma = targetEntry ? targetEntry.score : 50;
      var debt = calculateEdgeDebt(edge, sourceKarma, targetKarma);
      var key = edge.source + '->' + edge.target;
      debtMap[key] = { edge: edge, debt: debt };
      totalDebt += debt;
    });

    totalDebt = Math.round(totalDebt);

    // Build narrative
    var narrative = buildNarrative(heroes, atRisk, avgKarma, totalDebt, karmaMap);

    return {
      heroes: heroes,
      atRisk: atRisk,
      avgKarma: avgKarma,
      totalDebt: totalDebt,
      karmaMap: karmaMap,
      debtMap: debtMap,
      narrative: narrative
    };
  }

  /**
   * Build a creative factory-themed narrative string.
   */
  function buildNarrative(heroes, atRisk, avgKarma, totalDebt, karmaMap) {
    var lines = [];

    lines.push('=== KARMA REPORT ===');
    lines.push('');

    // Overall health
    if (avgKarma >= 70) {
      lines.push('The factory hums with righteous energy. Average karma: ' + avgKarma + '/100.');
    } else if (avgKarma >= 45) {
      lines.push('The factory runs, but shadows linger in the corridors. Average karma: ' + avgKarma + '/100.');
    } else {
      lines.push('WARNING: The factory is drowning in technical debt. Average karma: ' + avgKarma + '/100.');
    }
    lines.push('');

    // Heroes
    lines.push('--- HEROES ---');
    heroes.forEach(function(h) {
      var entry = karmaMap[h.id];
      var tierLabel = entry ? entry.label : getKarmaLabel(h.score);
      lines.push(h.name + ' shines with golden aura (score: ' + h.score + ', tier: ' + tierLabel + ')');
    });
    lines.push('');

    // At-risk
    lines.push('--- AT RISK ---');
    atRisk.forEach(function(r) {
      var entry = karmaMap[r.id];
      var tierLabel = entry ? entry.label : getKarmaLabel(r.score);
      if (r.score < 20) {
        lines.push(r.name + ' pulses with dangerous red light (score: ' + r.score + ', tier: ' + tierLabel + ')');
      } else if (r.score < 40) {
        lines.push(r.name + ' flickers with amber warning (score: ' + r.score + ', tier: ' + tierLabel + ')');
      } else {
        lines.push(r.name + ' sits quietly in neutral (score: ' + r.score + ', tier: ' + tierLabel + ')');
      }
    });
    lines.push('');

    // Debt
    lines.push('--- DEPENDENCY DEBT ---');
    lines.push('Total accumulated debt: ' + totalDebt + ' units.');
    if (totalDebt > 200) {
      lines.push('The factory groans under the weight of its debts. Refactoring is urgent.');
    } else if (totalDebt > 50) {
      lines.push('Some debt tethers glow orange between stations. Worth addressing soon.');
    } else {
      lines.push('Debt levels are manageable. The supply chain holds firm.');
    }

    return lines.join('\n');
  }

  // ═══════════════════════════════════════════
  // EXPORTS
  // ═══════════════════════════════════════════

  window.FactoryKarma = {
    calculateNodeKarma: calculateNodeKarma,
    calculateEdgeDebt: calculateEdgeDebt,
    drawKarmaAura: drawKarmaAura,
    drawDebtTether: drawDebtTether,
    getKarmaLabel: getKarmaLabel,
    getKarmaReport: getKarmaReport
  };

})();
