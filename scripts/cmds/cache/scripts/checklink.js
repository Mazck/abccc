"use strict";

/**
 * NSFW/18+ URL Detector - Advanced AI-Like Detection Engine (All-in-One, Final)
 * - Deep Learning-inspired multi-layer analysis
 * - Bayesian probability scoring with prior knowledge
 * - Advanced NLP with semantic vector analysis
 * - Behavioral pattern recognition
 * - Multi-modal detection (text, visual cues, metadata)
 *
 * Dependencies (runtime): cheerio, undici
 * Optional (media classification): @tensorflow/tfjs-node or @tensorflow/tfjs + nsfwjs
 */

var undici = require("undici");
var cheerio = require("cheerio");

// ===================== Advanced Mathematical Utilities =====================

function softmax(scores) {
    var maxScore = Math.max.apply(Math, scores);
    var expScores = scores.map(function (s) { return Math.exp(s - maxScore); });
    var sumExp = expScores.reduce(function (a, b) { return a + b; }, 0);
    return expScores.map(function (s) { return s / sumExp; });
}

function sigmoidActivation(x) {
    return 1 / (1 + Math.exp(-x));
}

function cosineSimilarity(vecA, vecB) {
    var dotProduct = 0, normA = 0, normB = 0;
    var keys = Object.keys(vecA).concat(Object.keys(vecB));
    var uniqueKeys = keys.filter(function (k, i) { return keys.indexOf(k) === i; });
    for (var i = 0; i < uniqueKeys.length; i++) {
        var key = uniqueKeys[i];
        var a = vecA[key] || 0;
        var b = vecB[key] || 0;
        dotProduct += a * b;
        normA += a * a;
        normB += b * b;
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Enhanced Levenshtein
function weightedLevenshtein(a, b, substitutionWeights) {
    var matrix = [];
    substitutionWeights = substitutionWeights || {};
    for (var i = 0; i <= b.length; i++) matrix[i] = [i];
    for (var j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (var i2 = 1; i2 <= b.length; i2++) {
        for (var j2 = 1; j2 <= a.length; j2++) {
            if (b.charAt(i2 - 1) === a.charAt(j2 - 1)) {
                matrix[i2][j2] = matrix[i2 - 1][j2 - 1];
            } else {
                var substitutionCost = substitutionWeights[a.charAt(j2 - 1) + b.charAt(i2 - 1)] || 1;
                matrix[i2][j2] = Math.min(
                    matrix[i2 - 1][j2 - 1] + substitutionCost,
                    matrix[i2][j2 - 1] + 1,
                    matrix[i2 - 1][j2] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

// ===================== Normalization & Helpers =====================

function contextualNormalize(text, context) {
    context = context || 'general';
    var normalized = (text || "")
        .normalize("NFKD")
        .toLowerCase()
        .replace(/[\u0300-\u036f]/g, "") // Remove combining diacritical marks
        .replace(/[\u00a0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000]/g, " ") // Normalize spaces
        .replace(/[’'`]/g, "'")
        .replace(/[“”"]/g, '"')
        .trim();

    if (context === 'url') {
        normalized = normalized.replace(/[._-]/g, " ");
    } else if (context === 'domain') {
        normalized = normalized.replace(/[0-9]/g, function (d) {
            var digitMap = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't' };
            return digitMap[d] || d;
        });
    }
    return normalized;
}

function headerStringsFrom(headers) {
    if (!headers) return [];
    if (Array.isArray(headers)) return headers;
    if (typeof headers === 'object') {
        return Object.keys(headers).map(function (k) { return String(k) + ': ' + String(headers[k]); });
    }
    return [];
}

// --- ensure URL has scheme (http://) ---
function ensureURLHasScheme(u) {
    if (!u) return u;
    return /^https?:\/\//i.test(u) ? u : 'http://' + u;
}

// ===================== Deep Knowledge Base =====================

var DEEP_KNOWLEDGE_BASE = {
    adultContentTaxonomy: {
        explicit: {
            weight: 1.0,
            subcategories: {
                pornographic: {
                    weight: 1.0,
                    patterns: [
                        { terms: ["porn", "porno", "pornography", "pornographic"], languages: ["en"], semantic_field: "explicit_media" },
                        { terms: ["sex", "sexual", "sexuality", "sexo", "tình dục"], languages: ["en", "es", "vi"], semantic_field: "sexual_activity" },
                        { terms: ["nude", "naked", "nudity", "khỏa thân"], languages: ["en", "vi"], semantic_field: "nudity" },
                        { terms: ["xxx", "x-rated", "adult rated"], languages: ["en"], semantic_field: "rating" }
                    ]
                },
                anatomical: {
                    weight: 0.9,
                    patterns: [
                        { terms: ["penis", "vagina", "breast", "genitals", "cock", "pussy", "dick"], languages: ["en"], semantic_field: "anatomy_explicit" }
                    ]
                }
            }
        },
        suggestive: {
            weight: 0.6,
            subcategories: {
                romantic: { weight: 0.4, patterns: [{ terms: ["love", "romance", "dating", "romantic"], languages: ["en"], semantic_field: "romance" }] },
                fashion: { weight: 0.3, patterns: [{ terms: ["bikini", "lingerie", "underwear"], languages: ["en"], semantic_field: "clothing" }] }
            }
        }
    },
    semanticVectors: {
        "adult": { sexual: 0.9, explicit: 0.8, mature: 0.7, content: 0.5 },
        "porn": { sexual: 1.0, explicit: 1.0, mature: 0.9, adult: 0.9 },
        "education": { sexual: -0.5, explicit: -0.7, learning: 0.9, academic: 0.8 },
        "medical": { sexual: -0.3, explicit: -0.5, health: 0.9, clinical: 0.8 }
    },
    contextualPatterns: {
        educational: { patterns: [/sex\s+education/i, /reproductive\s+health/i, /family\s+planning/i], weight: -0.8, confidence: 0.9 },
        medical: { patterns: [/sexual\s+health/i, /std\s+prevention/i, /contraception/i], weight: -0.7, confidence: 0.85 },
        commercial: { patterns: [/buy\s+now/i, /subscribe/i, /premium\s+content/i], weight: 0.3, confidence: 0.6 }
    },
    domainReputation: {
        // eTLD+1 only (no www.)
        "pornhub.com": { reputation: 1.0, confidence: 1.0, lastUpdate: Date.now() },
        "xvideos.com": { reputation: 1.0, confidence: 1.0, lastUpdate: Date.now() },
        "wikipedia.org": { reputation: -0.9, confidence: 0.95, lastUpdate: Date.now() },
        "reddit.com": { reputation: 0.1, confidence: 0.4, lastUpdate: Date.now() },
        "youtube.com": { reputation: 0.05, confidence: 0.3, lastUpdate: Date.now() },

        // Expanded adult list
        "xnxx.com": { reputation: 1.0, confidence: 1.0, lastUpdate: Date.now() },
        "xhamster.com": { reputation: 1.0, confidence: 1.0, lastUpdate: Date.now() },
        "redtube.com": { reputation: 1.0, confidence: 1.0, lastUpdate: Date.now() },
        "youporn.com": { reputation: 1.0, confidence: 1.0, lastUpdate: Date.now() },
        "spankbang.com": { reputation: 1.0, confidence: 1.0, lastUpdate: Date.now() },
        "tnaflix.com": { reputation: 1.0, confidence: 1.0, lastUpdate: Date.now() },
        "tube8.com": { reputation: 1.0, confidence: 1.0, lastUpdate: Date.now() },
        "rule34.xxx": { reputation: 1.0, confidence: 1.0, lastUpdate: Date.now() },
        "chaturbate.com": { reputation: 0.9, confidence: 1.0, lastUpdate: Date.now() },
        "stripchat.com": { reputation: 0.9, confidence: 1.0, lastUpdate: Date.now() },
        "erome.com": { reputation: 1.0, confidence: 1.0, lastUpdate: Date.now() },
        "javhd.com": { reputation: 1.0, confidence: 1.0, lastUpdate: Date.now() },
        "javmost.com": { reputation: 1.0, confidence: 1.0, lastUpdate: Date.now() }
    },
    evasionPatterns: {
        leetSpeak: {
            "0": ["o", "O"], "1": ["i", "I", "l", "L"], "3": ["e", "E"], "4": ["a", "A"],
            "5": ["s", "S"], "7": ["t", "T"], "8": ["b", "B"], "@": ["a", "A"],
            "$": ["s", "S"], "!": ["i", "I"], "|": ["l", "L", "i", "I"]
        },
        spacingEvasion: { patterns: [/p\s*o\s*r\s*n/gi, /s\s*e\s*x/gi, /n\s*u\s*d\s*e/gi], weight: 0.8 },
        symbolSubstitution: { patterns: [/p[o0][r]*n/gi, /s[e3][x]*[x]*/gi, /[f][u][c][k]/gi], weight: 0.7 }
    }
};

// ===================== PATCH: Adult domain/TLD & helpers =====================

var MULTIPART_TLDS = new Set([
    'co.uk', 'ac.uk', 'org.uk',
    'com.vn', 'net.vn', 'org.vn', 'gov.vn', 'edu.vn'
]);

var KNOWN_ADULT_DOMAINS = new Set([
    'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'redtube.com', 'youporn.com',
    'spankbang.com', 'tnaflix.com', 'tube8.com', 'rule34.xxx', 'chaturbate.com', 'stripchat.com',
    'porndig.com', 'hclips.com', 'erome.com', 'javhd.com', 'javhub.com', 'javmost.com'
]);

var ADULT_HOST_TOKENS = [
    'porn', 'sex', 'xxx', 'xvideo', 'xnxx', 'xhamster', 'redtube', 'youporn', 'spank', 'cam',
    'chaturbate', 'stripchat', 'onlyfans', 'rule34', 'hentai', 'jav', 'erome'
];

var ADULT_PATH_PATTERNS = [
    { re: /\b(18\+|18plus|over18|18y)\b/i, w: 0.25 },
    { re: /\b(porn|sex|xxx|hentai|jav|nsfw)\b/i, w: 0.20 },
    { re: /\b(amateur|milf|teen|anal|hardcore|lesbian|gay|pornstar)\b/i, w: 0.12 },
    { re: /\b(video|videos|gallery|galleries|stream|clip|vod)\b/i, w: 0.08 },
    { re: /\/(category|tags|channels)\//i, w: 0.06 },
    { re: /\.(mp4|m3u8|ts|webm)(\?|$)/i, w: 0.12 }
];

var ADULT_VI_PATTERNS = [
    { re: /\b(phim\s*(?:sex|nguoi\s*lon|người\s*lớn)|clip\s*nóng|khiêu\s*dâm|kh?a\s*th?n|khỏa\s*thân)\b/i, w: 0.22 },
    { re: /\b(dam|dâm|dit|địt|bu\s*vu|bú\s*vú|duong\s*vat|dương\s*vật|am\s*dao|âm\s*đạo)\b/i, w: 0.15 }
];

function getETLDPlusOne(host) {
    host = String(host || '').toLowerCase();
    var parts = host.split('.').filter(Boolean);
    if (parts.length <= 1) return host;
    var last2 = parts.slice(-2).join('.');
    if (MULTIPART_TLDS.has(last2) && parts.length >= 3) {
        return parts.slice(-3).join('.');
    }
    return last2;
}

function isAdultTLD(host) {
    try {
        var tld = (new URL('http://' + host).hostname.split('.').pop() || '').toLowerCase();
        return ['xxx', 'adult', 'porn', 'sex'].indexOf(tld) !== -1;
    } catch { return false; }
}

function isKnownAdultDomain(host) {
    var base = getETLDPlusOne(host);
    return KNOWN_ADULT_DOMAINS.has(base);
}

// ===================== Feature Extraction =====================

function extractDeepFeatures(text, url, metadata) {
    return {
        lexical: extractLexicalFeatures(text),
        syntactic: extractSyntacticFeatures(text),
        semantic: extractSemanticFeatures(text),
        urlStructural: extractURLFeatures(url),
        behavioral: extractBehavioralFeatures(metadata),
        crossModal: extractCrossModalFeatures(text, url, metadata)
    };
}

function extractLexicalFeatures(text) {
    if (!text) return {};
    var words = text.split(/\s+/);
    var chars = text.split('');
    return {
        wordCount: words.length,
        charCount: chars.length,
        avgWordLength: words.reduce(function (s, w) { return s + w.length; }, 0) / words.length || 0,
        uniqueWordsRatio: new Set(words).size / words.length || 0,
        uppercaseRatio: chars.filter(function (c) { return c === c.toUpperCase() && c !== c.toLowerCase(); }).length / chars.length,
        digitRatio: chars.filter(function (c) { return /\d/.test(c); }).length / chars.length,
        symbolRatio: chars.filter(function (c) { return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(c); }).length / chars.length,
        repeatedCharRatio: calculateRepeatedCharRatio(text),
        vowelConsonantRatio: calculateVowelConsonantRatio(text)
    };
}

function extractSyntacticFeatures(text) {
    if (!text) return {};
    var sentences = text.split(/[.!?]+/).filter(function (s) { return s.trim(); });
    var questions = text.match(/\?/g) || [];
    var exclamations = text.match(/!/g) || [];
    return {
        sentenceCount: sentences.length,
        avgSentenceLength: sentences.reduce(function (sum, s) { return sum + s.length; }, 0) / sentences.length || 0,
        questionRatio: questions.length / sentences.length || 0,
        exclamationRatio: exclamations.length / sentences.length || 0,
        parenthesesCount: (text.match(/[()]/g) || []).length,
        quotesCount: (text.match(/["']/g) || []).length
    };
}

function extractSemanticFeatures(text) {
    if (!text) return {};
    return {
        sexualTermDensity: calculateSemanticDensity(text, 'sexual'),
        violenceTermDensity: calculateSemanticDensity(text, 'violence'),
        emotionalTermDensity: calculateSemanticDensity(text, 'emotional'),
        commercialTermDensity: calculateSemanticDensity(text, 'commercial'),
        adultSemanticScore: calculateAdultSemanticScore(text),
        contextualAmbiguity: calculateContextualAmbiguity(text),
        topicCoherence: calculateTopicCoherence(text),
        semanticConsistency: calculateSemanticConsistency({ title: '', description: text, ogTitle: '', ogDescription: '' })
    };
}

function extractURLFeatures(url) {
    if (!url) return {};
    var parsed; try { parsed = new URL(url); } catch (e) { return {}; }
    var hostname = parsed.hostname || '';
    var pathname = parsed.pathname || '';
    var search = parsed.search || '';
    return {
        domainLength: hostname.length,
        pathLength: pathname.length,
        paramCount: (search.match(/=/g) || []).length,
        subdomainCount: hostname.split('.').length - 2,
        hostnameEntropy: calculateEntropy(hostname),
        pathEntropy: calculateEntropy(pathname),
        hasNumbers: /\d/.test(hostname),
        hasHyphens: /-/.test(hostname),
        hasUnderscores: /_/.test(hostname),
        ipAddress: /^\d+\.\d+\.\d+\.\d+$/.test(hostname),
        shortDomain: hostname.length < 6,
        longDomain: hostname.length > 30,
        tldType: classifyTLD(hostname.split('.').pop()),
        hasNonStandardPort: parsed.port && !['80', '443', ''].includes(parsed.port)
    };
}

function extractBehavioralFeatures(metadata) {
    metadata = metadata || {};
    var headerValues = headerStringsFrom(metadata.headers);
    return {
        responseTime: metadata.responseTime || 0,
        redirectCount: metadata.redirectCount || (metadata.redirects ? metadata.redirects.length : 0) || 0,
        hasSSL: metadata.protocol === 'https:',
        statusCode: metadata.statusCode || 0,
        contentLength: metadata.contentLength || 0,
        hasAgeVerification: headerValues.some(function (h) { return /age|adult|mature/i.test(h); }),
        serverResponsePattern: classifyResponseTime(metadata.responseTime || 0),
        serverLocation: metadata.serverLocation || 'unknown',
        cdnUsage: detectCDNUsage(metadata.headers || {})
    };
}

function extractCrossModalFeatures(text, url, metadata) {
    return {
        textUrlConsistency: calculateTextURLConsistency(text || '', url || ''),
        contentMetadataAlignment: calculateContentMetadataAlignment(text || '', metadata || {}),
        signalAgreement: calculateSignalAgreement(text || '', url || '', metadata || {}),
        contextualReinforcement: calculateContextualReinforcement(text || '', url || '', metadata || {})
    };
}

// ===================== Neural Network-Inspired Scoring =====================

function neuralNetworkScoring(features, weights) {
    weights = weights || getDefaultWeights();
    var hidden1 = processHiddenLayer1(features, weights.hidden1);
    var hidden2 = processHiddenLayer2(hidden1, weights.hidden2);
    return processOutputLayer(hidden2, weights.output);
}

function processHiddenLayer1(features, weights) {
    var neurons = {};
    neurons.lexicalSemantic = sigmoidActivation(
        (features.lexical.wordCount || 0) * (weights.wordCount || 0) +
        (features.semantic.adultSemanticScore || 0) * (weights.adultSemantic || 0) +
        (features.lexical.symbolRatio || 0) * (weights.symbolRatio || 0)
    );
    neurons.structuralBehavioral = sigmoidActivation(
        (features.urlStructural.hostnameEntropy || 0) * (weights.hostnameEntropy || 0) +
        (features.behavioral.hasSSL ? 1 : 0) * (weights.hasSSL || 0) +
        (features.urlStructural.pathLength || 0) * (weights.pathLength || 0)
    );
    neurons.crossModalConsistency = sigmoidActivation(
        (features.crossModal.textUrlConsistency || 0) * (weights.textUrlConsistency || 0) +
        (features.crossModal.signalAgreement || 0) * (weights.signalAgreement || 0)
    );
    return neurons;
}

function processHiddenLayer2(hiddenLayer1, weights) {
    var neurons = {};
    neurons.patternIntegration = sigmoidActivation(
        (hiddenLayer1.lexicalSemantic || 0) * (weights.lexicalSemanticWeight || 0) +
        (hiddenLayer1.structuralBehavioral || 0) * (weights.structuralBehavioralWeight || 0)
    );
    neurons.contextAwareness = sigmoidActivation(
        (hiddenLayer1.crossModalConsistency || 0) * (weights.crossModalWeight || 0) +
        (hiddenLayer1.lexicalSemantic || 0) * (weights.lexicalContextWeight || 0)
    );
    return neurons;
}

function processOutputLayer(hiddenLayer2, weights) {
    var rawScore = (hiddenLayer2.patternIntegration || 0) * (weights.patternWeight || 0) +
        (hiddenLayer2.contextAwareness || 0) * (weights.contextWeight || 0);
    var prob = sigmoidActivation(rawScore);
    return { rawScore: rawScore, probability: prob, confidence: calculateNeuralConfidence(hiddenLayer2), classification: classifyScore(prob) };
}

// ===================== Bayesian Inference Engine =====================

function bayesianInference(evidence, priorKnowledge) {
    var posterior = {};
    for (var hypothesis in priorKnowledge) {
        var prior = priorKnowledge[hypothesis].probability;
        var likelihood = calculateLikelihood(evidence, hypothesis);
        posterior[hypothesis] = {
            probability: (likelihood * prior) / calculateMarginalLikelihood(evidence, priorKnowledge),
            confidence: calculateBayesianConfidence(likelihood, prior)
        };
    }
    return posterior;
}

function calculateLikelihood(evidence, hypothesis) {
    var likelihood = 1.0;
    for (var feature in evidence) {
        var featureValue = evidence[feature];
        if (featureValue && typeof featureValue === 'object') {
            if ('adultSemanticScore' in featureValue) {
                likelihood *= getFeatureLikelihoodForHypothesis('adultSemanticScore', featureValue.adultSemanticScore, hypothesis);
            }
            if ('sexualTermDensity' in featureValue) {
                likelihood *= getFeatureLikelihoodForHypothesis('sexualTermDensity', featureValue.sexualTermDensity, hypothesis);
            }
            if ('hasSSL' in featureValue) {
                likelihood *= getFeatureLikelihoodForHypothesis('hasSSL', featureValue.hasSSL, hypothesis);
            }
        }
    }
    return Math.min(likelihood, 0.999);
}

function getFeatureLikelihoodForHypothesis(feature, value, hypothesis) {
    var likelihoods = {
        adult: {
            adultSemanticScore: function (v) { return Math.min(0.9, Math.max(0, v) * 2); },
            sexualTermDensity: function (v) { return Math.min(0.95, Math.max(0, v) * 10); },
            hasSSL: function (v) { return v ? 0.7 : 0.3; }
        },
        clean: {
            adultSemanticScore: function (v) { return Math.max(0.1, 1 - Math.max(0, v) * 2); },
            sexualTermDensity: function (v) { return Math.max(0.05, 1 - Math.max(0, v) * 10); },
            hasSSL: function (v) { return v ? 0.6 : 0.4; }
        }
    };
    var h = likelihoods[hypothesis];
    if (h && h[feature]) return h[feature](value);
    return 0.5;
}

// ===================== Advanced Content Analysis =====================

function advancedContentAnalysis(html, url, metadata) {
    if (!html) return { score: 0, features: {}, confidence: 0 };
    var $ = cheerio.load(html);
    var analysis = {
        textAnalysis: performTextAnalysis($, url),
        structuralAnalysis: performStructuralAnalysis($),
        metadataAnalysis: performMetadataAnalysis($),
        visualCueAnalysis: performVisualCueAnalysis($),
        behavioralAnalysis: performBehavioralAnalysis(metadata)
    };

    var allText = extractAllText($);
    var deepFeatures = extractDeepFeatures(allText, url, metadata);
    var neuralScore = neuralNetworkScoring(deepFeatures);

    var priorKnowledge = { adult: { probability: 0.1 }, clean: { probability: 0.9 } };
    var bayesianResult = bayesianInference(deepFeatures, priorKnowledge);

    var ensembleScore = calculateEnsembleScore([
        { score: neuralScore.probability, weight: 0.4, confidence: neuralScore.confidence },
        { score: bayesianResult.adult.probability, weight: 0.3, confidence: bayesianResult.adult.confidence },
        { score: analysis.textAnalysis.adultScore, weight: 0.2, confidence: analysis.textAnalysis.confidence },
        { score: analysis.structuralAnalysis.suspiciousScore, weight: 0.1, confidence: analysis.structuralAnalysis.confidence }
    ]);

    return {
        score: ensembleScore.score,
        confidence: ensembleScore.confidence,
        features: deepFeatures,
        neuralScore: neuralScore,
        bayesianScore: bayesianResult,
        componentAnalysis: analysis,
        ensemble: ensembleScore
    };
}

function performTextAnalysis($, url) {
    var title = $("title").text() || "";
    var description = $('meta[name="description"]').attr("content") || "";
    var headings = $("h1, h2, h3").map(function () { return $(this).text(); }).get().join(" ");
    var bodyText = $("p, div, span").slice(0, 50).map(function () { return $(this).text(); }).get().join(" ");
    var allText = [title, description, headings, bodyText].join(" ");
    var normalizedText = contextualNormalize(allText, 'content');

    return {
        adultScore: calculateAdvancedAdultScore(normalizedText),
        sentiment: analyzeSentiment(normalizedText),
        topics: extractTopics(normalizedText),
        confidence: calculateTextAnalysisConfidence(allText)
    };
}

function calculateAdvancedAdultScore(text) {
    var score = 0;
    var signals = [];

    for (var categoryName in DEEP_KNOWLEDGE_BASE.adultContentTaxonomy) {
        var category = DEEP_KNOWLEDGE_BASE.adultContentTaxonomy[categoryName];
        for (var subcategoryName in category.subcategories) {
            var subcategory = category.subcategories[subcategoryName];
            for (var i = 0; i < subcategory.patterns.length; i++) {
                var pattern = subcategory.patterns[i];
                var matchScore = calculatePatternMatchScore(text, pattern);
                if (matchScore > 0) {
                    var weightedScore = matchScore * category.weight * subcategory.weight;
                    score += weightedScore;
                    signals.push({ category: categoryName, subcategory: subcategoryName, pattern: pattern.semantic_field, score: weightedScore });
                }
            }
        }
    }

    // Evasion detection
    var evasionScore = detectEvasionPatterns(text);
    score += evasionScore;

    // Contextual adjustments (education/medical)
    var contextualAdjustment = applyContextualAdjustments(text, signals);
    score *= contextualAdjustment;

    // Boost theo naiveAdultSignal để tăng nhạy
    var naive = naiveAdultSignal(text); // 0..1
    score += Math.min(0.3, naive * 0.5);

    return Math.min(1, Math.max(0, score));
}

// NEW: applyContextualAdjustments (giảm điểm nếu có ngữ cảnh giáo dục/y tế; tăng nhẹ khi thương mại)
function applyContextualAdjustments(text, signals) {
    var t = (text || '').toLowerCase();
    var ctx = DEEP_KNOWLEDGE_BASE.contextualPatterns;
    var factor = 1.0;

    // Giáo dục
    if (ctx.educational.patterns.some(function (re) { return re.test(t); })) {
        factor *= (1 + ctx.educational.weight * (ctx.educational.confidence || 0.8) * 0.6); // ~ -0.38
    }
    // Y tế
    if (ctx.medical.patterns.some(function (re) { return re.test(t); })) {
        factor *= (1 + ctx.medical.weight * (ctx.medical.confidence || 0.85) * 0.5); // ~ -0.30
    }
    // Thương mại (sub + premium)
    if (ctx.commercial.patterns.some(function (re) { return re.test(t); })) {
        factor *= (1 + ctx.commercial.weight * (ctx.commercial.confidence || 0.6) * 0.3); // +~0.05
    }

    // Bound
    if (factor < 0.5) factor = 0.5;        // không giảm quá tay
    if (factor > 1.2) factor = 1.2;        // không tăng quá tay
    return factor;
}

function calculatePatternMatchScore(text, pattern) {
    var matchScore = 0;
    for (var i = 0; i < pattern.terms.length; i++) {
        var term = pattern.terms[i];
        if (text.includes(term)) { matchScore += 1.0; continue; }
        var words = text.split(/\s+/);
        for (var j = 0; j < words.length; j++) {
            var distance = weightedLevenshtein(term, words[j]);
            var similarity = 1 - (distance / Math.max(term.length, words[j].length));
            if (similarity > 0.8) { matchScore += similarity; break; }
        }
        var semanticSim = calculateSemanticSimilarity(term, text);
        matchScore += semanticSim * 0.5;
    }
    return Math.min(1, matchScore / pattern.terms.length);
}

function detectEvasionPatterns(text) {
    var evasionScore = 0, evasionPatterns = DEEP_KNOWLEDGE_BASE.evasionPatterns;
    var decodedText = text;
    for (var leetChar in evasionPatterns.leetSpeak) {
        var replacements = evasionPatterns.leetSpeak[leetChar];
        for (var i = 0; i < replacements.length; i++) {
            decodedText = decodedText.replace(new RegExp(leetChar, 'gi'), replacements[i]);
        }
    }
    if (decodedText !== text) {
        var originalScore = naiveAdultSignal(text);
        var decodedScore = naiveAdultSignal(decodedText);
        if (decodedScore > originalScore) evasionScore += (decodedScore - originalScore) * 0.8;
    }
    for (var i2 = 0; i2 < evasionPatterns.spacingEvasion.patterns.length; i2++) {
        var pattern = evasionPatterns.spacingEvasion.patterns[i2];
        if (pattern.test(text)) evasionScore += evasionPatterns.spacingEvasion.weight;
    }
    return evasionScore;
}

function naiveAdultSignal(t) {
    var words = ['porn', 'sex', 'xxx', 'nude', 'fuck', 'hentai', 'jav', 'adult'];
    var count = 0;
    for (var i = 0; i < words.length; i++) {
        var re = new RegExp('\\b' + words[i] + '\\b', 'i');
        if (re.test(t)) count++;
    }
    return Math.min(1, count / 4);
}

// ===================== Utility Functions =====================

function calculateEntropy(str) {
    var frequencies = {};
    for (var i = 0; i < str.length; i++) frequencies[str[i]] = (frequencies[str[i]] || 0) + 1;
    var entropy = 0, length = str.length;
    for (var c in frequencies) {
        var p = frequencies[c] / length;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}

function calculateRepeatedCharRatio(text) {
    var total = text.length, repeated = 0;
    for (var i = 1; i < text.length; i++) if (text[i] === text[i - 1]) repeated++;
    return total > 0 ? repeated / total : 0;
}

function calculateVowelConsonantRatio(text) {
    var vowels = text.match(/[aeiouAEIOU]/g) || [];
    var consonants = text.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || [];
    return consonants.length > 0 ? vowels.length / consonants.length : 0;
}

function calculateSemanticDensity(text, semanticField) {
    var fieldTerms = getSemanticFieldTerms(semanticField);
    var matches = 0, words = text.split(/\s+/);
    for (var i = 0; i < fieldTerms.length; i++) {
        for (var j = 0; j < words.length; j++) {
            if (calculateSemanticSimilarity(fieldTerms[i], words[j]) > 0.7) matches++;
        }
    }
    return words.length > 0 ? matches / words.length : 0;
}

function calculateSemanticSimilarity(term1, term2) {
    var vec1 = DEEP_KNOWLEDGE_BASE.semanticVectors[(term1 || '').toLowerCase()];
    var vec2 = DEEP_KNOWLEDGE_BASE.semanticVectors[(term2 || '').toLowerCase()];
    if (!vec1 || !vec2) {
        var s1 = (term1 || '').toLowerCase();
        var s2 = (term2 || '').toLowerCase();
        var distance = weightedLevenshtein(s1, s2);
        return 1 - (distance / Math.max(s1.length || 1, s2.length || 1));
    }
    return cosineSimilarity(vec1, vec2);
}

function getSemanticFieldTerms(field) {
    var fieldMappings = {
        sexual: ["sex", "sexual", "erotic", "intimate", "sensual"],
        violence: ["violence", "violent", "aggressive", "harmful", "dangerous"],
        emotional: ["love", "hate", "angry", "sad", "happy", "excited"],
        commercial: ["buy", "sell", "price", "discount", "purchase", "shop"]
    };
    return fieldMappings[field] || [];
}

function calculateEnsembleScore(scores) {
    var weightedSum = 0, totalWeight = 0, confidenceSum = 0;
    for (var i = 0; i < scores.length; i++) {
        var item = scores[i];
        var conf = (typeof item.confidence === 'number') ? item.confidence : 0.5;
        weightedSum += (item.score || 0) * (item.weight || 0) * conf;
        totalWeight += (item.weight || 0) * conf;
        confidenceSum += conf;
    }
    var ensembleScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    var averageConfidence = scores.length > 0 ? confidenceSum / scores.length : 0;
    return { score: ensembleScore, confidence: averageConfidence, componentScores: scores };
}

function getDefaultWeights() {
    return {
        hidden1: {
            wordCount: 0.1,
            adultSemantic: 0.8,
            symbolRatio: 0.3,
            hostnameEntropy: 0.2,
            hasSSL: -0.1,
            pathLength: 0.05,
            textUrlConsistency: 0.6,
            signalAgreement: 0.7
        },
        hidden2: {
            lexicalSemanticWeight: 0.6,
            structuralBehavioralWeight: 0.4,
            crossModalWeight: 0.5,
            lexicalContextWeight: 0.3
        },
        output: { patternWeight: 0.7, contextWeight: 0.3 }
    };
}

function calculateNeuralConfidence(hiddenLayer) {
    var activations = Object.values(hiddenLayer);
    var avg = activations.reduce(function (s, v) { return s + v; }, 0) / (activations.length || 1);
    var variance = activations.reduce(function (s, v) { return s + Math.pow(v - avg, 2); }, 0) / (activations.length || 1);
    return Math.min(0.95, 0.5 + variance);
}

function classifyScore(probability) {
    if (probability >= 0.8) return "explicit";
    if (probability >= 0.6) return "adult";
    if (probability >= 0.4) return "suspicious";
    if (probability >= 0.2) return "questionable";
    return "clean";
}

// ===================== Structural/Metadata/Visual/Behavioral =====================

function performStructuralAnalysis($) {
    var structure = {
        imageCount: $("img").length,
        videoCount: $("video").length,
        linkCount: $("a").length,
        formCount: $("form").length,
        scriptCount: $("script").length,
        hiddenElements: $("[style*='display:none'], [style*='visibility:hidden']").length,
        iframeCount: $("iframe").length,
        popupTriggers: $("[onclick*='window.open'], [onclick*='popup']").length,
        ageVerificationForms: $("form:contains('age'), input[name*='age'], select[name*='birth']").length,
        acceptanceCheckboxes: $("input[type='checkbox']:contains('18'), input[type='checkbox']:contains('adult')").length,
        paymentForms: $("form:contains('payment'), input[name*='card'], input[name*='billing']").length,
        subscriptionElements: $("*:contains('subscribe'), *:contains('premium'), *:contains('membership')").length
    };
    var suspiciousScore = calculateStructuralSuspiciousScore(structure);
    return { structure: structure, suspiciousScore: suspiciousScore, confidence: calculateStructuralConfidence(structure) };
}

function calculateStructuralSuspiciousScore(structure) {
    var score = 0;
    var weights = {
        ageVerificationForms: 0.6,
        acceptanceCheckboxes: 0.5,
        paymentForms: 0.4,
        subscriptionElements: 0.3,
        popupTriggers: 0.4,
        hiddenElements: 0.2,
        iframeCount: 0.1
    };
    for (var k in weights) if (structure[k] > 0) score += weights[k] * Math.min(1, structure[k] / 3);
    var suspiciousCount = Object.keys(weights).filter(function (key) { return structure[key] > 0; }).length;
    if (suspiciousCount >= 3) score *= 1.3;
    return Math.min(1, score);
}

function performMetadataAnalysis($) {
    var metadata = {
        title: $("title").text() || "",
        description: $('meta[name="description"]').attr("content") || "",
        keywords: $('meta[name="keywords"]').attr("content") || "",
        ogTitle: $('meta[property="og:title"]').attr("content") || "",
        ogDescription: $('meta[property="og:description"]').attr("content") || "",
        ogImage: $('meta[property="og:image"]').attr("content") || "",
        ogType: $('meta[property="og:type"]').attr("content") || "",
        twitterCard: $('meta[name="twitter:card"]').attr("content") || "",
        twitterTitle: $('meta[name="twitter:title"]').attr("content") || "",
        twitterDescription: $('meta[name="twitter:description"]').attr("content") || "",
        rating: $('meta[name="rating"]').attr("content") || "",
        contentRating: $('meta[name="content-rating"]').attr("content") || "",
        audience: $('meta[name="audience"]').attr("content") || "",
        classification: $('meta[name="classification"]').attr("content") || "",
        language: $('html').attr("lang") || $('meta[http-equiv="content-language"]').attr("content") || ""
    };
    return { metadata: metadata, adultIndicators: findAdultMetadataIndicators(metadata), consistencyScore: calculateMetadataConsistency(metadata) };
}

function findAdultMetadataIndicators(metadata) {
    var indicators = [];
    var adultPatterns = [/18\+/i, /adult/i, /mature/i, /xxx/i, /nsfw/i, /explicit/i, /restricted/i, /parental advisory/i, /age verification/i];
    for (var field in metadata) {
        var value = metadata[field];
        if (typeof value === 'string') {
            for (var i = 0; i < adultPatterns.length; i++) {
                if (adultPatterns[i].test(value)) {
                    indicators.push({ field: field, value: value, pattern: adultPatterns[i].source, confidence: 0.8 });
                }
            }
        }
    }
    return indicators;
}

function performVisualCueAnalysis($) {
    var cues = {
        imageAlts: $("img[alt]").map(function () { return $(this).attr("alt"); }).get(),
        imageTitles: $("img[title]").map(function () { return $(this).attr("title"); }).get(),
        imageSources: $("img[src]").map(function () { return $(this).attr("src"); }).get(),
        videoSources: $("video source").map(function () { return $(this).attr("src"); }).get(),
        videoPosters: $("video[poster]").map(function () { return $(this).attr("poster"); }).get(),
        linkTexts: $("a").map(function () { return $(this).text(); }).get(),
        buttonTexts: $("button, input[type='button'], input[type='submit']").map(function () { return $(this).text() || $(this).val(); }).get(),
        warningElements: $(".warning, .notice, .alert, .disclaimer").map(function () { return $(this).text(); }).get()
    };
    return { cues: cues, adultVisualScore: calculateAdultVisualScore(cues), suspiciousMediaCount: countSuspiciousMedia(cues) };
}

function calculateAdultVisualScore(cues) {
    var score = 0, allTexts = [];
    ['imageAlts', 'imageTitles', 'linkTexts', 'buttonTexts', 'warningElements'].forEach(function (f) { allTexts = allTexts.concat(cues[f] || []); });
    var combinedText = (allTexts.join(' ') || '').toLowerCase();
    if (combinedText.length > 0) score += calculateAdvancedAdultScore(combinedText) * 0.7;
    var mediaUrls = (cues.imageSources || []).concat(cues.videoSources || []);
    for (var i = 0; i < mediaUrls.length; i++) {
        var url = (mediaUrls[i] || '').toLowerCase();
        if (/thumb|preview|sample|teaser/i.test(url)) score += 0.2;
        if (/\d+x\d+/i.test(url)) score += 0.1;
    }
    return Math.min(1, score);
}

function performBehavioralAnalysis(metadata) {
    metadata = metadata || {};
    var behavioral = {
        responseTimeCategory: categorizeResponseTime(metadata.responseTime || 0),
        redirectPattern: analyzeRedirectPattern(metadata.redirects || []),
        securityHeaders: analyzeSecurityHeaders(metadata.headers || {}),
        certificateInfo: analyzeCertificate(metadata.certificate || {}),
        hostingPattern: analyzeHostingPattern(metadata.serverInfo || {}),
        accessPatterns: analyzeAccessPatterns(metadata.accessData || {})
    };
    return { behavioral: behavioral, suspiciousPatterns: identifySuspiciousBehavioralPatterns(behavioral), riskScore: calculateBehavioralRiskScore(behavioral) };
}

function analyzeRedirectPattern(redirects) {
    var pattern = { count: redirects.length, domains: [], suspicious: false };
    for (var i = 0; i < redirects.length; i++) {
        var redirect = redirects[i];
        var domain = hostnameOf(redirect.url || '');
        pattern.domains.push(domain);
        if ((redirect.status === 302 || redirect.status === 301) && /ad|popup|affiliate/i.test(redirect.url || '')) pattern.suspicious = true;
    }
    var uniqueDomains = pattern.domains.filter(function (d, idx) { return pattern.domains.indexOf(d) === idx; });
    if (uniqueDomains.length > 2) pattern.suspicious = true;
    return pattern;
}

function analyzeSecurityHeaders(headers) {
    var lower = {}; Object.keys(headers || {}).forEach(function (k) { lower[k.toLowerCase()] = headers[k]; });
    return {
        hasCSP: !!lower['content-security-policy'],
        hasHSTS: !!lower['strict-transport-security'],
        hasXFrameOptions: !!lower['x-frame-options'],
        hasXContentTypeOptions: !!lower['x-content-type-options'],
        ageVerificationHeader: !!lower['x-age-verification'],
        contentRatingHeader: lower['x-content-rating'] || lower['content-rating'] || ""
    };
}

// ===================== Ensemble / Meta-learning =====================

var SOFT_WHITELIST = new Set(['wikipedia.org', 'who.int', 'nih.gov', 'unicef.org']);
function softWhitelistPenalty(host) {
    var base = getETLDPlusOne(host);
    if (SOFT_WHITELIST.has(base)) return 0.25; // subtract 0.25 from final score
    return 0;
}

function adaptiveEnsembleScoring(analyses, metadata) {
    var scoringMethods = [
        { name: 'neural', weight: 0.3, reliability: 0.85 },
        { name: 'bayesian', weight: 0.25, reliability: 0.80 },
        { name: 'pattern', weight: 0.20, reliability: 0.75 },
        { name: 'structural', weight: 0.15, reliability: 0.70 },
        { name: 'behavioral', weight: 0.10, reliability: 0.65 }
    ];
    var adjusted = adjustWeightsBasedOnSignalStrength(scoringMethods, analyses);
    var ensembleScore = 0, totalWeight = 0, confidenceFactors = [];
    for (var i = 0; i < adjusted.length; i++) {
        var method = adjusted[i];
        var methodScore = getScoreFromMethod(method.name, analyses);
        var effectiveWeight = method.weight * method.reliability;
        ensembleScore += methodScore * effectiveWeight;
        totalWeight += effectiveWeight;
        confidenceFactors.push({ method: method.name, score: methodScore, weight: effectiveWeight, reliability: method.reliability });
    }
    var finalScore = totalWeight > 0 ? ensembleScore / totalWeight : 0;
    finalScore = applyMetaLearningAdjustment(finalScore, analyses, metadata);
    return { score: finalScore, confidence: calculateEnsembleConfidence(confidenceFactors), methodBreakdown: confidenceFactors, metaAdjustment: true };
}

function adjustWeightsBasedOnSignalStrength(methods, analyses) {
    var adjusted = methods.slice();
    if (analyses.neuralScore && analyses.neuralScore.confidence > 0.8) adjusted[0].weight *= 1.2;
    if (analyses.bayesianScore && analyses.bayesianScore.adult && analyses.bayesianScore.adult.confidence > 0.8) adjusted[1].weight *= 1.15;
    if (analyses.componentAnalysis && analyses.componentAnalysis.behavioralAnalysis && analyses.componentAnalysis.behavioralAnalysis.riskScore < 0.3) adjusted[4].weight *= 0.8;
    var tw = adjusted.reduce(function (s, m) { return s + m.weight; }, 0);
    adjusted.forEach(function (m) { m.weight = m.weight / tw; });
    return adjusted;
}

function getScoreFromMethod(methodName, analyses) {
    switch (methodName) {
        case 'neural': return analyses.neuralScore ? analyses.neuralScore.probability : 0;
        case 'bayesian': return analyses.bayesianScore && analyses.bayesianScore.adult ? analyses.bayesianScore.adult.probability : 0;
        case 'pattern': return analyses.componentAnalysis ? analyses.componentAnalysis.textAnalysis.adultScore : 0;
        case 'structural': return analyses.componentAnalysis ? analyses.componentAnalysis.structuralAnalysis.suspiciousScore : 0;
        case 'behavioral': return analyses.componentAnalysis ? analyses.componentAnalysis.behavioralAnalysis.riskScore : 0;
        default: return 0;
    }
}

function applyMetaLearningAdjustment(score, analyses, metadata) {
    var adjustmentFactor = 1.0;
    var hostname = hostnameOf(metadata.url || '');
    var base = getETLDPlusOne(hostname);
    var rep = DEEP_KNOWLEDGE_BASE.domainReputation[base] || DEEP_KNOWLEDGE_BASE.domainReputation[hostname];
    if (rep) {
        var reputationAge = Date.now() - rep.lastUpdate;
        var decayFactor = Math.exp(-reputationAge / (365 * 24 * 60 * 60 * 1000));
        adjustmentFactor += rep.reputation * rep.confidence * decayFactor * 0.3;
    }
    var scoreVariance = calculateScoreVariance(analyses);
    if (scoreVariance < 0.1) adjustmentFactor *= 1.1;

    var detectedLanguage = detectContentLanguage(analyses);
    if (detectedLanguage && detectedLanguage !== 'en') adjustmentFactor *= getLanguageAdjustmentFactor(detectedLanguage);

    var adjusted = score * adjustmentFactor;

    // Soft whitelist penalty for educational/health orgs
    adjusted = Math.max(0, adjusted - softWhitelistPenalty(hostname));

    return Math.min(1, Math.max(0, adjusted));
}

function calculateScoreVariance(analyses) {
    var scores = [
        analyses.neuralScore ? analyses.neuralScore.probability : 0,
        analyses.bayesianScore && analyses.bayesianScore.adult ? analyses.bayesianScore.adult.probability : 0,
        analyses.componentAnalysis ? analyses.componentAnalysis.textAnalysis.adultScore : 0
    ];
    var mean = scores.reduce(function (s, sc) { return s + sc; }, 0) / (scores.length || 1);
    var variance = scores.reduce(function (s, sc) { return s + Math.pow(sc - mean, 2); }, 0) / (scores.length || 1);
    return variance;
}

function calculateEnsembleConfidence(factors) {
    if (!factors || !factors.length) return 0.5;
    var weights = factors.map(function (f) { return f.weight; });
    var total = weights.reduce(function (a, b) { return a + b; }, 0) || 1;
    var norm = weights.map(function (w) { return w / total; });
    var entropy = -norm.reduce(function (s, p) { return s + (p > 0 ? p * Math.log2(p) : 0); }, 0);
    var maxEntropy = Math.log2(factors.length);
    return Math.max(0.5, 1 - (entropy / (maxEntropy || 1)) * 0.5);
}

// ===================== Main Advanced Analysis Function =====================

function analyzeURLAdvanced(inputURL, options) {
    options = options || {};
    var config = {
        fetchContent: options.fetchContent !== false,
        maxBytes: options.maxBytes || 500000,
        timeoutMs: options.timeoutMs || 12000,
        // Lower thresholds to avoid over-clean classification
        thresholdExplicit: options.thresholdExplicit || 0.75,
        thresholdAdult: options.thresholdAdult || 0.55,
        thresholdSuspicious: options.thresholdSuspicious || 0.25,
        enableDeepLearning: options.enableDeepLearning !== false,
        enableEnsemble: options.enableEnsemble !== false,
        enableMetaLearning: options.enableMetaLearning !== false
    };

    // Normalize input (auto add http:// if missing)
    var inputURLNormalized = ensureURLHasScheme(inputURL);

    return new Promise(function (resolve) {
        var startTime = Date.now();
        var analysisReasons = [];

        function completeAdvancedAnalysis(fetchResult) {
            var endTime = Date.now();
            var finalURL = fetchResult.ok ? (fetchResult.finalURL || inputURLNormalized) : inputURLNormalized;
            var host = hostnameOf(finalURL);
            var headersLower = lowerCaseHeaders(fetchResult.headers || {});
            var headerStrings = headerStringsFrom(headersLower);

            var metadata = {
                url: finalURL,
                host: host,
                responseTime: endTime - startTime,
                statusCode: fetchResult.status,
                headers: headersLower,
                headerStrings: headerStrings,
                redirects: fetchResult.redirects || [],
                protocol: safeURL(finalURL) ? safeURL(finalURL).protocol : 'unknown',
                contentLength: fetchResult.body ? fetchResult.body.length : 0
            };

            var finalResult;

            if (config.fetchContent && fetchResult.ok && fetchResult.body) {
                var contentAnalysis = advancedContentAnalysis(fetchResult.body, finalURL, metadata);
                if (config.enableEnsemble) {
                    var ensembleResult = adaptiveEnsembleScoring(contentAnalysis, metadata);
                    finalResult = {
                        score: ensembleResult.score,
                        confidence: ensembleResult.confidence,
                        deepAnalysis: contentAnalysis,
                        ensembleBreakdown: ensembleResult.methodBreakdown
                    };
                } else {
                    finalResult = {
                        score: contentAnalysis.score,
                        confidence: contentAnalysis.confidence,
                        deepAnalysis: contentAnalysis
                    };
                }
            } else {
                // URL-only scoring with floors
                var urlOnlyScore = scoreHostAdvanced(finalURL, analysisReasons) + scorePathQueryAdvanced(finalURL, analysisReasons);
                finalResult = {
                    score: Math.min(1, urlOnlyScore),
                    confidence: 0.6,
                    deepAnalysis: null,
                    fallbackMode: true
                };
            }

            var classification = classifyAdvanced(finalResult.score, config);
            var explanation = generateDetailedExplanation(finalResult, analysisReasons, metadata);

            resolve({
                inputURL: inputURL,
                finalURL: finalURL,
                host: host,
                score: Number((finalResult.score || 0).toFixed(4)),
                confidence: Number((finalResult.confidence || 0).toFixed(3)),
                classification: classification,
                thresholds: {
                    explicit: config.thresholdExplicit,
                    adult: config.thresholdAdult,
                    suspicious: config.thresholdSuspicious
                },
                deepAnalysis: finalResult.deepAnalysis,
                ensembleBreakdown: finalResult.ensembleBreakdown,
                metadata: {
                    analysisTime: endTime - startTime,
                    contentFetched: !!fetchResult.body,
                    redirectCount: (fetchResult.redirects || []).length,
                    finalStatusCode: fetchResult.status,
                    deepLearningUsed: config.enableDeepLearning,
                    ensembleUsed: config.enableEnsemble
                },
                explanation: explanation,
                reasons: analysisReasons,
                fallbackMode: finalResult.fallbackMode || false
            });
        }

        if (config.fetchContent) {
            fetchContentAdvanced(inputURLNormalized, config.maxBytes, config.timeoutMs)
                .then(completeAdvancedAnalysis)
                .catch(function (err) {
                    completeAdvancedAnalysis({ ok: false, error: err && err.message || String(err), finalURL: inputURLNormalized, status: 0 });
                });
        } else {
            completeAdvancedAnalysis({ ok: true, finalURL: inputURLNormalized, body: "", status: 200 });
        }
    });
}

function classifyAdvanced(score, config) {
    if (score >= config.thresholdExplicit) {
        return { label: "explicit", severity: "high", description: "Contains explicit adult content", recommended_action: "block" };
    }
    if (score >= config.thresholdAdult) {
        return { label: "adult", severity: "medium-high", description: "Contains adult content or themes", recommended_action: "restrict" };
    }
    if (score >= config.thresholdSuspicious) {
        return { label: "suspicious", severity: "medium", description: "May contain adult content", recommended_action: "review" };
    }
    return { label: "clean", severity: "low", description: "Appears to be safe content", recommended_action: "allow" };
}

function generateDetailedExplanation(result, reasons, metadata) {
    var explanation = { summary: "", key_factors: [], confidence_explanation: "", recommendation: "" };
    if (result.score >= 0.85) explanation.summary = "URL rất có khả năng chứa nội dung 18+ rõ ràng (explicit) dựa trên nhiều chỉ báo mạnh.";
    else if (result.score >= 0.65) explanation.summary = "URL có khả năng chứa nội dung người lớn hoặc chủ đề trưởng thành.";
    else if (result.score >= 0.35) explanation.summary = "URL có một số dấu hiệu có thể liên quan đến nội dung người lớn.";
    else explanation.summary = "URL có vẻ an toàn và ít khả năng chứa nội dung người lớn.";

    if (result.deepAnalysis) {
        if (result.deepAnalysis.neuralScore && result.deepAnalysis.neuralScore.confidence > 0.7) {
            explanation.key_factors.push("AI pattern recognition phát hiện mẫu nội dung 18+");
        }
        if (result.deepAnalysis.bayesianScore && result.deepAnalysis.bayesianScore.adult && result.deepAnalysis.bayesianScore.adult.probability > 0.6) {
            explanation.key_factors.push("Phân tích thống kê (Bayes) cho thấy xác suất nội dung người lớn");
        }
    }
    var base = getETLDPlusOne(metadata.host || '');
    if (DEEP_KNOWLEDGE_BASE.domainReputation[base]) {
        var reputation = DEEP_KNOWLEDGE_BASE.domainReputation[base];
        if (reputation.reputation > 0.7) explanation.key_factors.push("Tên miền được biết đến là lưu trữ nội dung người lớn");
    }
    if ((result.confidence || 0) >= 0.8) explanation.confidence_explanation = "Độ tin cậy cao nhờ nhiều chỉ báo nhất quán";
    else if ((result.confidence || 0) >= 0.6) explanation.confidence_explanation = "Độ tin cậy trung bình với một số bằng chứng hỗ trợ";
    else explanation.confidence_explanation = "Độ tin cậy thấp do bằng chứng hạn chế hoặc mâu thuẫn";
    return explanation;
}

// ===================== Remaining Utility/Helper Functions =====================

function calculateMarginalLikelihood(evidence, priorKnowledge) {
    var marginal = 0;
    for (var hypothesis in priorKnowledge) {
        var prior = priorKnowledge[hypothesis].probability;
        var likelihood = calculateLikelihood(evidence, hypothesis);
        marginal += likelihood * prior;
    }
    return Math.max(0.001, marginal);
}

function calculateBayesianConfidence(likelihood, prior) {
    var uniformLikelihood = 0.5;
    var evidenceStrength = Math.abs(likelihood - uniformLikelihood) * 2;
    return Math.min(0.95, prior + evidenceStrength * 0.3);
}

function extractAllText($) {
    var texts = [];
    texts.push($("title").text() || "");
    texts.push($('meta[name="description"]').attr("content") || "");
    texts.push($("h1, h2, h3").text() || "");
    $("p, div, span").slice(0, 100).each(function () {
        var text = $(this).text();
        if (text && text.length > 10) texts.push(text);
    });
    return texts.join(" ").substring(0, 10000);
}

function calculateTextAnalysisConfidence(text) {
    if (!text || text.length < 50) return 0.3;
    if (text.length < 200) return 0.5;
    if (text.length < 1000) return 0.7;
    return 0.9;
}

function calculateStructuralConfidence(structure) {
    var indicatorCount = Object.values(structure).filter(function (val) { return typeof val === 'number' && val > 0; }).length;
    return Math.min(0.9, indicatorCount * 0.1 + 0.3);
}

function calculateMetadataConsistency(metadata) {
    var fields = ['title', 'description', 'ogTitle', 'ogDescription'];
    var texts = fields.map(function (f) { return (metadata[f] || "").toLowerCase(); }).filter(function (t) { return t.length > 0; });
    if (texts.length < 2) return 0.5;
    var similarities = [];
    for (var i = 0; i < texts.length; i++) {
        for (var j = i + 1; j < texts.length; j++) {
            similarities.push(calculateSemanticSimilarity(texts[i], texts[j]));
        }
    }
    var avg = similarities.reduce(function (s, v) { return s + v; }, 0) / (similarities.length || 1);
    return avg;
}

function countSuspiciousMedia(cues) {
    var suspiciousCount = 0;
    var suspiciousPatterns = [/thumb/i, /preview/i, /sample/i, /teaser/i, /\d+x\d+/i];
    var allMediaUrls = (cues.imageSources || []).concat(cues.videoSources || []);
    for (var i = 0; i < allMediaUrls.length; i++) {
        var url = allMediaUrls[i] || '';
        for (var j = 0; j < suspiciousPatterns.length; j++) {
            if (suspiciousPatterns[j].test(url)) { suspiciousCount++; break; }
        }
    }
    return suspiciousCount;
}

function categorizeResponseTime(responseTime) {
    if (responseTime < 500) return "fast";
    if (responseTime < 2000) return "normal";
    if (responseTime < 5000) return "slow";
    return "very_slow";
}

function identifySuspiciousBehavioralPatterns(behavioral) {
    var suspicious = [];
    if (behavioral.redirectPattern && behavioral.redirectPattern.suspicious) suspicious.push("suspicious_redirects");
    if (behavioral.responseTimeCategory === "very_slow") suspicious.push("unusual_response_time");
    if (behavioral.securityHeaders && !behavioral.securityHeaders.hasCSP) suspicious.push("missing_security_headers");
    return suspicious;
}

function calculateBehavioralRiskScore(behavioral) {
    var risk = 0;
    if (behavioral.redirectPattern && behavioral.redirectPattern.suspicious) risk += 0.3;
    if (behavioral.responseTimeCategory === "very_slow") risk += 0.2;
    if (behavioral.securityHeaders) {
        if (!behavioral.securityHeaders.hasCSP) risk += 0.1;
        if (!behavioral.securityHeaders.hasHSTS) risk += 0.1;
        if ((behavioral.securityHeaders.contentRatingHeader || '').toString().toLowerCase().includes("adult")) risk += 0.4;
    }
    return Math.min(1, risk);
}

function analyzeCertificate(certificate) {
    return {
        valid: certificate.valid || false,
        issuer: certificate.issuer || "unknown",
        selfSigned: certificate.selfSigned || false,
        expired: certificate.expired || false
    };
}

// ===================== Helpers / URL / Tokens =====================

function lowerCaseHeaders(headers) { var lower = {}; Object.keys(headers || {}).forEach(function (k) { lower[k.toLowerCase()] = headers[k]; }); return lower; }
function classifyResponseTime(ms) { return categorizeResponseTime(ms); }

function detectCDNUsage(headers) {
    var h = lowerCaseHeaders(headers || {});
    var cdnIndicators = ['cf-ray', 'cf-cache-status', 'server-timing', 'x-served-by', 'via', 'x-cache', 'x-amz-cf-id', 'x-amz-cf-pop', 'x-fastly-request-id', 'akamai-grn'];
    for (var i = 0; i < cdnIndicators.length; i++) if (h[cdnIndicators[i]]) return true;
    return false;
}

function classifyTLD(tld) {
    tld = (tld || '').toLowerCase();
    if (!tld) return 'unknown';
    if (['xxx', 'adult', 'porn', 'sex'].includes(tld)) return 'adult';
    if (['com', 'net', 'org', 'io', 'ai', 'co', 'tv'].includes(tld)) return 'generic';
    if (['vn', 'us', 'uk', 'de', 'fr', 'jp', 'kr', 'cn', 'es', 'it', 'ru'].includes(tld)) return 'country';
    return 'other';
}

function hostnameOf(url) { try { return new URL(ensureURLHasScheme(url)).hostname; } catch (e) { return ''; } }
function safeURL(url) { try { return new URL(ensureURLHasScheme(url)); } catch (e) { return null; } }

function tokenizeForCompare(text) {
    return contextualNormalize(text || '', 'content').split(/[^a-zA-Z0-9\u00C0-\u024F]+/).filter(Boolean);
}

function calculateTextURLConsistency(text, url) {
    var u = safeURL(url);
    if (!u) return 0.5;
    var tokensText = new Set(tokenizeForCompare(text));
    var tokensUrl = new Set(tokenizeForCompare(u.hostname + ' ' + u.pathname));
    if (!tokensText.size || !tokensUrl.size) return 0.5;
    var inter = 0; tokensUrl.forEach(function (t) { if (tokensText.has(t)) inter++; });
    var union = tokensText.size + tokensUrl.size - inter;
    var j = union ? inter / union : 0;
    var adultTokens = ['porn', 'sex', 'xxx', 'nude', 'hentai', 'jav', '18'];
    var adultOverlap = adultTokens.filter(function (t) { return tokensUrl.has(t) || tokensText.has(t); }).length;
    var bonus = Math.min(0.3, adultOverlap * 0.1);
    return Math.max(0, Math.min(1, j + bonus));
}

function calculateContentMetadataAlignment(text, metadata) {
    var meta = (metadata && metadata.headers) ? metadata.headers : {};
    var title = (metadata && metadata.title) || '';
    var desc = (metadata && metadata.description) || '';
    var combined = title + ' ' + desc + ' ' + Object.keys(meta).map(function (k) { return String(meta[k]); }).join(' ');
    var sim = calculateSemanticSimilarity(contextualNormalize(text, 'content'), contextualNormalize(combined, 'content'));
    return Math.max(0, Math.min(1, sim));
}

function calculateSignalAgreement(text, url, metadata) {
    var s1 = naiveAdultSignal(text);
    var s2 = naiveAdultSignal(url);
    var s3 = metadata && metadata.headerStrings ? naiveAdultSignal(metadata.headerStrings.join(' ')) : 0;
    var arr = [s1, s2, s3];
    var mean = arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
    var variance = arr.reduce(function (s, x) { return s + Math.pow(x - mean, 2); }, 0) / arr.length;
    return 1 - Math.min(1, variance * 2);
}

function calculateContextualReinforcement(text, url, metadata) {
    var ctx = DEEP_KNOWLEDGE_BASE.contextualPatterns;
    var joined = (text + ' ' + (metadata && metadata.headerStrings ? metadata.headerStrings.join(' ') : '')).toLowerCase();
    var score = 0.5;
    Object.keys(ctx).forEach(function (k) {
        var group = ctx[k];
        var matched = group.patterns.some(function (re) { return re.test(joined); });
        if (matched) score += group.weight * (group.confidence || 0.5) * 0.2;
    });
    return Math.max(0, Math.min(1, score));
}

function calculateAdultSemanticScore(text) {
    var tokens = tokenizeForCompare(text);
    var adultVec = DEEP_KNOWLEDGE_BASE.semanticVectors['porn'];
    var sum = 0, n = 0;
    for (var i = 0; i < tokens.length; i++) {
        var v = DEEP_KNOWLEDGE_BASE.semanticVectors[tokens[i]];
        if (v) { sum += cosineSimilarity(v, adultVec); n++; }
    }
    var score = n ? (sum / n) : 0;
    if (tokens.some(function (t) { return ['porn', 'sex', 'xxx', 'nude', 'hentai', 'jav'].includes(t); })) score = Math.min(1, score + 0.3);
    return Math.max(0, score);
}

function calculateContextualAmbiguity(text) {
    var t = contextualNormalize(text, 'content');
    var adult = naiveAdultSignal(t);
    var edu = /(sex\s+education|reproductive\s+health|family\s+planning)/i.test(t) ? 1 : 0;
    var med = /(sexual\s+health|std\s+prevention|contraception)/i.test(t) ? 1 : 0;
    var amb = (adult > 0 && (edu || med)) ? 0.6 : (adult > 0 ? 0.3 : 0.1);
    return amb;
}

function calculateTopicCoherence(text) {
    var sents = (text || '').split(/[.!?]+/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (!sents.length) return 0.4;
    var avgLen = sents.reduce(function (a, s) { return a + s.length; }, 0) / sents.length;
    return Math.max(0, Math.min(1, avgLen / 200));
}

function calculateSemanticConsistency(metadata) { return calculateMetadataConsistency(metadata); }

function detectContentLanguage(analyses) {
    try {
        var lang = (analyses && analyses.componentAnalysis && analyses.componentAnalysis.metadataAnalysis && analyses.componentAnalysis.metadataAnalysis.metadata && analyses.componentAnalysis.metadataAnalysis.metadata.language) || '';
        if (lang) return lang.split('-')[0].toLowerCase();
    } catch (e) { }
    return 'en';
}

function getLanguageAdjustmentFactor(lang) { if (lang === 'vi') return 1.02; if (lang === 'es') return 1.01; return 1.0; }

function analyzeHostingPattern(serverInfo) {
    var provider = ((serverInfo && serverInfo.provider) || '').toLowerCase();
    var cloud = /(cloudflare|fastly|akamai|aws|amazon|gcp|google|azure)/.test(provider);
    return { provider: provider || 'unknown', cloud: cloud };
}

function analyzeAccessPatterns(accessData) {
    var hours = accessData.hours || [];
    if (!hours.length) return { pattern: 'unknown', nightSpike: false };
    var night = hours.slice(0, 6).concat(hours.slice(22));
    var day = hours.slice(9, 18);
    var nightAvg = night.reduce(function (a, b) { return a + b; }, 0) / (night.length || 1);
    var dayAvg = day.reduce(function (a, b) { return a + b; }, 0) / (day.length || 1);
    return { pattern: (nightAvg > dayAvg * 1.5 ? 'night_spike' : 'normal'), nightSpike: nightAvg > dayAvg * 1.5 };
}

// ===================== URL-only scoring helpers (with floors) =====================

function scoreHostAdvanced(url, reasons) {
    var host = hostnameOf(url);
    if (!host) return 0;

    var score = 0;
    var base = getETLDPlusOne(host);
    var normalized = contextualNormalize(host, 'domain');

    // Floors: TLD 18+ / known adult domains
    var floor = 0;
    if (isAdultTLD(host)) {
        floor = Math.max(floor, 0.80);
        reasons && reasons.push('adultTLD_floor:>=0.80');
    }
    if (isKnownAdultDomain(host)) {
        floor = Math.max(floor, 0.85);
        reasons && reasons.push('knownAdultDomain_floor(' + base + '):>=0.85');
    }

    // Adult tokens in host
    var tokenHit = 0;
    for (var i = 0; i < ADULT_HOST_TOKENS.length; i++) {
        if (normalized.indexOf(ADULT_HOST_TOKENS[i]) !== -1) tokenHit++;
    }
    if (tokenHit) {
        var add = Math.min(0.6, tokenHit * 0.12);
        score += add;
        reasons && reasons.push('hostTokens(' + tokenHit + '):+' + add.toFixed(2));
    }

    // domainReputation (eTLD+1)
    var rep = DEEP_KNOWLEDGE_BASE.domainReputation[base] || DEEP_KNOWLEDGE_BASE.domainReputation[host.toLowerCase()];
    if (rep) {
        var repAdd = (rep.reputation || 0) * (rep.confidence || 0.5) * 0.6;
        score += repAdd;
        reasons && reasons.push('domainReputation(' + base + '):+' + repAdd.toFixed(2));
    }

    // Apply floor
    score = Math.max(score, floor);

    return Math.min(1, Math.max(0, score));
}

function scorePathQueryAdvanced(url, reasons) {
    var u = safeURL(url);
    if (!u) return 0;
    var text = (u.pathname + ' ' + u.search).toLowerCase();
    var score = 0;

    for (var i = 0; i < ADULT_PATH_PATTERNS.length; i++) if (ADULT_PATH_PATTERNS[i].re.test(text)) score += ADULT_PATH_PATTERNS[i].w;
    for (var j = 0; j < ADULT_VI_PATTERNS.length; j++) if (ADULT_VI_PATTERNS[j].re.test(text)) score += ADULT_VI_PATTERNS[j].w;

    var depth = (u.pathname.split('/').filter(Boolean).length);
    if (depth > 4) score += 0.05;
    score = Math.min(1, score);
    reasons && reasons.push('pathIndicators:' + score.toFixed(2));
    return score;
}

// ===================== Simple NLP helpers =====================

function analyzeSentiment(text) {
    var pos = (text.match(/\b(great|love|nice|good|happy|enjoy)\b/gi) || []).length;
    var neg = (text.match(/\b(bad|hate|angry|sad|ugly|gross)\b/gi) || []).length;
    var total = pos + neg || 1;
    return { score: (pos - neg) / total };
}

function extractTopics(text) {
    var keywords = ['sex', 'porn', 'xxx', 'dating', 'romance', 'bikini', 'lingerie', 'education', 'medical', 'health'];
    return keywords.filter(function (k) { return new RegExp('\\b' + k + '\\b', 'i').test(text); });
}

// ===================== Networking: Fetch content with Undici =====================

function fetchContentAdvanced(url, maxBytes, timeoutMs) {
    // Normalize
    url = ensureURLHasScheme(url);

    return new Promise(function (resolve) {
        var redirects = [];
        var finalURL = url;
        var didTimeout = false;
        var controller = new AbortController();
        var to = setTimeout(function () { didTimeout = true; controller.abort(); }, timeoutMs || 10000);

        undici.request(url, {
            method: 'GET',
            headers: {
                'user-agent': 'NSFW-Detector/1.0 (+node; undici)',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            maxRedirections: 3,
            signal: controller.signal
        }).then(function (res) {
            clearTimeout(to);
            finalURL = res.url || finalURL;
            var status = res.statusCode || res.status || 0;
            var headers = {};
            if (res.headers) {
                Object.keys(res.headers).forEach(function (k) {
                    var v = res.headers[k];
                    headers[k] = Array.isArray(v) ? v.join('; ') : v;
                });
            }
            var contentType = (headers['content-type'] || headers['Content-Type'] || '').toString().toLowerCase();
            var isText = contentType.includes('text/html') || contentType.includes('xml') || contentType.includes('text/');

            var chunks = [];
            var received = 0;
            var stream = res.body;
            if (!stream || typeof stream.on !== 'function') {
                resolve({ ok: true, finalURL: finalURL, status: status, headers: headers, body: '' });
                return;
            }
            stream.on('data', function (chunk) {
                if (!isText) return;
                received += chunk.length;
                if (received <= maxBytes) chunks.push(chunk);
                if (received > maxBytes) { try { stream.destroy(); } catch (e) { } }
            });
            stream.on('end', function () {
                var body = isText ? Buffer.concat(chunks).toString('utf8') : '';
                resolve({ ok: true, finalURL: finalURL, status: status, headers: headers, body: body, redirects: redirects });
            });
            stream.on('error', function (err) {
                resolve({ ok: false, finalURL: finalURL, status: status, headers: headers, error: err && err.message });
            });
        }).catch(function (err) {
            if (didTimeout) return resolve({ ok: false, finalURL: url, status: 0, headers: {}, error: 'timeout' });
            resolve({ ok: false, finalURL: url, status: 0, headers: {}, error: err && err.message });
        });
    });
}

// ===================== Optional: Direct media (image/video) analysis =====================

async function analyzeMediaBuffer(buffer, mimeType, opts) {
    opts = opts || {};
    var useNSFW = !!opts.modelPath;
    if (!useNSFW) {
        return { ok: false, reason: 'nsfwjs modelPath not provided', probability: 0, label: 'unknown' };
    }
    try {
        let tf; try { tf = require('@tensorflow/tfjs-node'); } catch { tf = require('@tensorflow/tfjs'); }
        var nsfwjs = require('nsfwjs');
        var model = await nsfwjs.load(opts.modelPath);
        var image = await tf.node.decodeImage(buffer, 3);
        var predictions = await model.classify(image, 1);
        image.dispose();
        var nsfwClasses = ['Porn', 'Hentai', 'Sexy'];
        var prob = 0;
        var top = predictions[0];
        if (top && nsfwClasses.includes(top.className)) prob = top.probability;
        var label = (prob >= (opts.thresholdExplicit || 0.85)) ? 'explicit'
            : (prob >= (opts.thresholdAdult || 0.65) ? 'adult'
                : (prob >= (opts.thresholdSuspicious || 0.35) ? 'suspicious' : 'clean'));
        return { ok: true, probability: prob, label: label, predictions: predictions };
    } catch (e) {
        return { ok: false, reason: e && e.message || String(e), probability: 0, label: 'unknown' };
    }
}

module.exports = {
    analyzeURLAdvanced: analyzeURLAdvanced,
    advancedContentAnalysis: advancedContentAnalysis,
    fetchContentAdvanced: fetchContentAdvanced,
    analyzeMediaBuffer: analyzeMediaBuffer,
    utils: {
        contextualNormalize: contextualNormalize,
        hostnameOf: hostnameOf,
        safeURL: safeURL,
        calculateEntropy: calculateEntropy,
        classifyTLD: classifyTLD,
        getETLDPlusOne: getETLDPlusOne
    }
};
