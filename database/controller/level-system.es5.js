// level-system.es5.js
function clampSafeInt(x) { x = Math.floor(x || 0); if (x < 0) x = 0; if (x > Number.MAX_SAFE_INTEGER) x = Number.MAX_SAFE_INTEGER; return x; }
function sum0toNminus1(n) { return n * (n - 1) / 2; }
function sumSquares0toNminus1(n) { return (n - 1) * n * (2 * n - 1) / 6; }

function reqExpForLevel(level, cfg) {
    var L = Math.max(1, Math.floor(level));
    var x = L - 1;
    var raw = cfg.base + cfg.linear * x + cfg.quad * x * x;
    return Math.max(1, clampSafeInt(Math.floor(raw)));
}
function cumulativeExpToLevelStart(level, cfg) {
    var L = Math.max(1, Math.floor(level));
    var n = L - 1;
    var termBase = cfg.base * n;
    var termLin = cfg.linear * sum0toNminus1(n);
    var termQuad = cfg.quad * sumSquares0toNminus1(n);
    return clampSafeInt(Math.floor(termBase + termLin + termQuad));
}
function bsearchLevel(T, cfg, lo, hi) {
    var l = Math.max(1, Math.floor(lo));
    var r = Math.max(l, Math.floor(hi));
    while (l < r) {
        var mid = Math.floor((l + r + 1) / 2);
        if (cumulativeExpToLevelStart(mid, cfg) <= T) l = mid;
        else r = mid - 1;
    }
    return l;
}
function totalToState(totalExp, cfg) {
    var T = clampSafeInt(totalExp);
    if (cfg.maxLevel && cfg.maxLevel > 0) {
        var startAtMax = cumulativeExpToLevelStart(cfg.maxLevel, cfg);
        if (T <= startAtMax) {
            var level = bsearchLevel(T, cfg, 1, cfg.maxLevel);
            var exp = T - cumulativeExpToLevelStart(level, cfg);
            return { level: level, exp: exp };
        } else {
            return { level: cfg.maxLevel, exp: T - startAtMax };
        }
    }
    var hi = 2;
    while (cumulativeExpToLevelStart(hi, cfg) <= T) {
        if (hi > 1e9) break;
        hi *= 2;
    }
    var level = bsearchLevel(T, cfg, 1, hi);
    var exp = T - cumulativeExpToLevelStart(level, cfg);
    return { level: level, exp: exp };
}
function stateToTotal(s, cfg) {
    var start = cumulativeExpToLevelStart(Math.max(1, Math.floor(s.level || 1)), cfg);
    return clampSafeInt(start + clampSafeInt(s.exp));
}
function applyExpChange(current, deltaExp, cfg) {
    var before = { level: Math.max(1, Math.floor(current.level || 1)), exp: clampSafeInt(current.exp) };
    var totalBefore = stateToTotal(before, cfg);
    var delta = Math.floor(deltaExp);
    if (!cfg.allowLevelDown && delta < 0) {
        var minTotal = cumulativeExpToLevelStart(before.level, cfg) + before.exp;
        delta = Math.max(0, delta + (minTotal - totalBefore));
    }
    var totalAfter = clampSafeInt(totalBefore + delta);
    var reachedMaxLevel = false, overflowExpAtMax = 0;

    if (cfg.maxLevel && cfg.maxLevel > 0) {
        var startAtMax = cumulativeExpToLevelStart(cfg.maxLevel, cfg);
        if (totalAfter >= startAtMax) {
            reachedMaxLevel = true;
            if (!cfg.carryOverflowAtMax) {
                overflowExpAtMax = Math.max(0, totalAfter - startAtMax);
                totalAfter = startAtMax;
            }
        }
        totalAfter = Math.max(0, totalAfter);
    } else {
        totalAfter = Math.max(0, totalAfter);
    }

    var after = totalToState(totalAfter, cfg);
    if (cfg.maxLevel && after.level === cfg.maxLevel && !cfg.carryOverflowAtMax) {
        after.exp = Math.min(after.exp, reqExpForLevel(after.level, cfg) - 1);
    }

    return {
        before: before,
        after: after,
        delta: totalAfter - totalBefore,
        levelsGained: Math.max(0, after.level - before.level),
        levelsLost: Math.max(0, before.level - after.level),
        reachedMaxLevel: reachedMaxLevel,
        overflowExpAtMax: overflowExpAtMax,
        totalExpBefore: totalBefore,
        totalExpAfter: totalAfter
    };
}

module.exports = {
    reqExpForLevel,
    cumulativeExpToLevelStart,
    totalToState,
    stateToTotal,
    applyExpChange,
    DEFAULT_CFG: {
        base: 100,
        linear: 20,
        quad: 5,
        maxLevel: 100,
        allowLevelDown: true,
        carryOverflowAtMax: false
    }
};
