"use strict";

const fs = require("fs-extra");
const path = require("path");
const { request } = require("undici");
const zlib = require("zlib");
const { createCanvas, loadImage, registerFont } = require("canvas");

try {
  const localFont = path.join(__dirname, "assets", "Inter-Regular.ttf");
  if (fs.existsSync(localFont)) registerFont(localFont, { family: "Inter" });
} catch {}
const FONT_FAMILY = "Inter, system-ui, Arial";
//url chi tiet recommended https://lol-mobile-bff.op.gg/api/tft/v1/recommended-decks/d1384dc938e05fce5b21b11184677e09?hl=vi&include_early_middle_units=true&region=VN&tier=all&version=15.2c
const API_URL = (limit = 12, version = "15.2c") =>
  `https://lol-mobile-bff.op.gg/api/tft/v1/recommended-decks?hl=vi&limit=${limit}&mode=RANKED_TFT&region=VN&tier=all&version=${encodeURIComponent(version)}`;

const OP_GG_HEADERS = {
  "accept": "*/*",
  "accept-language": "vi-VN;q=1.0, en-VN;q=0.9, zh-Hans-VN;q=0.8",
  "accept-encoding": "gzip, deflate, br",
  "user-agent": "OP.GG Mobile iOS (1.1.5));X-DEVICE-WIDTH=393.0;X-DEVICE-LANGUAGE=vi;"
};

const COLORS = {
    background: "#0A0B0F",
    surface: {
        primary: "#1A1D24",
        secondary: "#252932",
        elevated: "#2A2F3A"
    },

    text: {
        primary: "#F8FAFC",
        secondary: "#CBD5E1",
        muted: "#64748B",
        accent: "#3B82F6"
    },

    tier: {
        OP: {
            primary: "#FF6B35",
            secondary: "#FF8E53",
            gradient: "linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%)"
        },
        S: {
            primary: "#3B82F6",
            secondary: "#60A5FA",
            gradient: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)"
        },
        A: {
            primary: "#F59E0B",
            secondary: "#FBBF24",
            gradient: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)"
        },
        B: {
            primary: "#10B981",
            secondary: "#34D399",
            gradient: "linear-gradient(135deg, #10B981 0%, #34D399 100%)"
        },
        C: {
            primary: "#8B5CF6",
            secondary: "#A78BFA",
            gradient: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)"
        },
        D: {
            primary: "#6B7280",
            secondary: "#9CA3AF",
            gradient: "linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)"
        }
    },

    cost: {
        1: { border: "#718096", glow: "rgba(113, 128, 150, 0.4)" },
        2: { border: "#38A169", glow: "rgba(56, 161, 105, 0.4)" },
        3: { border: "#3182CE", glow: "rgba(49, 130, 206, 0.4)" },
        4: { border: "#805AD5", glow: "rgba(128, 90, 213, 0.4)" },
        5: { border: "#D69E2E", glow: "rgba(214, 158, 46, 0.4)" }
    },

    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",

    border: {
        subtle: "rgba(255, 255, 255, 0.06)",
        medium: "rgba(255, 255, 255, 0.12)",
        strong: "rgba(255, 255, 255, 0.18)"
    }
};

const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
};

const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999
};

const CACHE_DIR = path.join(__dirname, "cache", "tft_assets");

function decodeStream(stream, encoding) {
  if (!encoding || encoding === "identity") return stream;
  const enc = String(encoding).toLowerCase();
  if (enc.includes("br")) return stream.pipe(zlib.createBrotliDecompress());
  if (enc.includes("gzip")) return stream.pipe(zlib.createGunzip());
  if (enc.includes("deflate")) return stream.pipe(zlib.createInflate());
  return stream;
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function fetchJson(url) {
  const { body, headers, statusCode } = await request(url, {
    method: "GET",
    headers: OP_GG_HEADERS,
    headersTimeout: 10000,
    bodyTimeout: 30000
  });
  if (statusCode !== 200) throw new Error("HTTP " + statusCode);
  const decoded = decodeStream(body, headers["content-encoding"]);
  const buf = await streamToBuffer(decoded);
  return JSON.parse(buf.toString("utf8"));
}

function ensureDir(p) { fs.mkdirpSync(p); }

async function fetchImageCached(url) {
  ensureDir(CACHE_DIR);
  const name = url.split("/").pop().split("?")[0];
  const p = path.join(CACHE_DIR, name);
  if (!fs.existsSync(p)) {
    const res = await request(url, { method: "GET", headersTimeout: 10000, bodyTimeout: 30000 });
    if (res.statusCode !== 200) throw new Error("IMG HTTP " + res.statusCode);
    const buf = await streamToBuffer(res.body);
    await fs.writeFile(p, buf);
  }
  return loadImage(p);
}

function mapTier(tier) {
    if (!tier) return "A";
    const t = String(tier).toUpperCase();
    return ["OP", "S", "A", "B", "C", "D"].includes(t) ? t : "A";
}

function formatPercentage(n, decimals = 1) {
    if (typeof n !== "number") return "-";
    return `${(n * 100).toFixed(decimals)}%`;
}

function createGradient(ctx, x, y, w, h, colorStops, direction = "vertical") {
    let gradient;
    if (direction === "horizontal") {
        gradient = ctx.createLinearGradient(x, y, x + w, y);
    } else if (direction === "diagonal") {
        gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    } else {
        gradient = ctx.createLinearGradient(x, y, x, y + h);
    }

    colorStops.forEach((stop, i) => {
        gradient.addColorStop(i / (colorStops.length - 1), stop);
    });

    return gradient;
}

function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, height / 2, width / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
}

function drawElevatedCard(ctx, x, y, width, height, elevation = 2) {
    ctx.save();

    const shadows = [
        { blur: 32, offsetY: 8, opacity: 0.25 },
        { blur: 16, offsetY: 4, opacity: 0.15 },
        { blur: 8, offsetY: 2, opacity: 0.1 }
    ];

    shadows.forEach(shadow => {
        ctx.shadowColor = `rgba(0, 0, 0, ${shadow.opacity})`;
        ctx.shadowBlur = shadow.blur;
        ctx.shadowOffsetY = shadow.offsetY;
        ctx.fillStyle = COLORS.surface.primary;
        roundedRect(ctx, x, y, width, height, RADIUS.lg);
        ctx.fill();
        ctx.shadowColor = "transparent";
    });

    ctx.strokeStyle = COLORS.border.subtle;
    ctx.lineWidth = 1;
    roundedRect(ctx, x, y, width, height, RADIUS.lg);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    roundedRect(ctx, x + 1, y + 1, width - 2, height - 2, RADIUS.lg - 1);
    ctx.stroke();

    ctx.restore();
}

function drawGlowingChip(ctx, text, x, y, tierColors, size = "md") {
    const sizes = {
        sm: { font: `600 20px ${FONT_FAMILY}`, padX: 12, padY: 6, height: 32 },
        md: { font: `700 24px ${FONT_FAMILY}`, padX: 16, padY: 8, height: 40 },
        lg: { font: `700 28px ${FONT_FAMILY}`, padX: 20, padY: 10, height: 48 }
    };

    const config = sizes[size] || sizes.md;

    ctx.save();
    ctx.font = config.font;
    const metrics = ctx.measureText(text);
    const width = metrics.width + config.padX * 2;

    // Glow effect
    ctx.shadowColor = tierColors.primary;
    ctx.shadowBlur = 20;
    ctx.fillStyle = tierColors.primary;
    roundedRect(ctx, x, y, width, config.height, RADIUS.sm);
    ctx.fill();

    const gradient = createGradient(ctx, x, y, width, config.height,
        [tierColors.secondary, tierColors.primary], "diagonal");
    ctx.fillStyle = gradient;
    roundedRect(ctx, x, y, width, config.height, RADIUS.sm);
    ctx.fill();

    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = config.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + width / 2, y + config.height / 2);

    ctx.restore();
    return { width, height: config.height };
}

function drawStyledText(ctx, text, x, y, style = {}) {
    const defaults = {
        font: `400 16px ${FONT_FAMILY}`,
        color: COLORS.text.primary,
        align: "left",
        baseline: "top",
        shadow: false,
        maxWidth: null
    };

    const config = { ...defaults, ...style };

    ctx.save();
    ctx.font = config.font;
    ctx.fillStyle = config.color;
    ctx.textAlign = config.align;
    ctx.textBaseline = config.baseline;

    if (config.shadow) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetY = 1;
    }

    if (config.maxWidth) {
        ctx.fillText(text, x, y, config.maxWidth);
    } else {
        ctx.fillText(text, x, y);
    }

    ctx.restore();

    const metrics = ctx.measureText(text);
    return {
        width: config.maxWidth ? Math.min(metrics.width, config.maxWidth) : metrics.width,
        height: parseInt(config.font.match(/\d+/)[0])
    };
}

async function drawChampionAvatar(ctx, unit, x, y, size = 80) {
    const imgURL = unit?.champion?.tile_image_url || unit?.champion?.image_url;
    if (!imgURL) return;

    const cost = unit?.champion?.cost || 1;
    const costConfig = COLORS.cost[cost] || COLORS.cost[1];

    ctx.save();

    const bgGradient = createGradient(ctx, x, y, size, size,
        ["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"]);
    ctx.fillStyle = bgGradient;
    roundedRect(ctx, x, y, size, size, RADIUS.md);
    ctx.fill();

    // Champion image
    try {
        const img = await fetchImageCached(imgURL);
        ctx.beginPath();
        roundedRect(ctx, x + 2, y + 2, size - 4, size - 4, RADIUS.md - 2);
        ctx.clip();
        ctx.drawImage(img, x + 2, y + 2, size - 4, size - 4);
    } catch (e) {
        console.warn("Failed to load champion image:", imgURL);
    }

    ctx.restore();

    ctx.save();
    ctx.shadowColor = costConfig.glow;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = costConfig.border;
    ctx.lineWidth = 3;
    roundedRect(ctx, x, y, size, size, RADIUS.md);
    ctx.stroke();
    ctx.restore();

    // Items overlay
    const items = Array.isArray(unit.items) ? unit.items.slice(0, 3) : [];
    if (items.length > 0) {
        const itemSize = 24;
        const itemSpacing = 4;
        const totalItemsWidth = items.length * itemSize + (items.length - 1) * itemSpacing;
        let itemX = x + (size - totalItemsWidth) / 2;
        const itemY = y + size - itemSize - 0;

        for (const item of items) {
            if (!item?.image_url) continue;

            try {
                ctx.save();

                ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                roundedRect(ctx, itemX, itemY, itemSize, itemSize, 4);
                ctx.fill();

                const itemImg = await fetchImageCached(item.image_url);
                ctx.beginPath();
                roundedRect(ctx, itemX + 1, itemY + 1, itemSize - 2, itemSize - 2, 3);
                ctx.clip();
                ctx.drawImage(itemImg, itemX + 1, itemY + 1, itemSize - 2, itemSize - 2);

                ctx.restore();

                ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
                ctx.lineWidth = 1;
                roundedRect(ctx, itemX, itemY, itemSize, itemSize, 4);
                ctx.stroke();

            } catch (e) {
                console.warn("Failed to load item image:", item.image_url);
            }

            itemX += itemSize + itemSpacing;
        }
    }
}

function drawStatBadge(ctx, label, value, x, y, type = "default") {
    const colors = {
        default: { bg: "rgba(100, 116, 139, 0.15)", text: COLORS.text.secondary },
        success: { bg: "rgba(16, 185, 129, 0.15)", text: COLORS.success },
        warning: { bg: "rgba(245, 158, 11, 0.15)", text: COLORS.warning }
    };

    const config = colors[type] || colors.default;

    ctx.save();

    const font = `500 14px ${FONT_FAMILY}`;
    ctx.font = font;
    const text = `${label} ${value}`;
    const metrics = ctx.measureText(text);
    const width = metrics.width + SPACING.md * 2;
    const height = 28;

    // Background
    ctx.fillStyle = config.bg;
    roundedRect(ctx, x, y, width, height, RADIUS.sm);
    ctx.fill();

    // Text
    ctx.fillStyle = config.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + width / 2, y + height / 2);

    ctx.restore();
    return { width, height };
}

function drawProgressBar(ctx, value, maxValue, x, y, width, height = 4) {
    const progress = Math.min(Math.max(value / maxValue, 0), 1);

    ctx.save();

    ctx.fillStyle = "rgba(100, 116, 139, 0.2)";
    roundedRect(ctx, x, y, width, height, height / 2);
    ctx.fill();

    // Progress
    if (progress > 0) {
        const gradient = createGradient(ctx, x, y, width * progress, height,
            [COLORS.tier.S.primary, COLORS.tier.S.secondary], "horizontal");
        ctx.fillStyle = gradient;
        roundedRect(ctx, x, y, width * progress, height, height / 2);
        ctx.fill();
    }

    ctx.restore();
}

async function renderTFTBoard(decks, outputPath) {

    const groups = {};
    decks.forEach(deck => {
        const tier = mapTier(deck?.op?.tier || deck?.tier);
        if (!groups[tier]) groups[tier] = [];
        groups[tier].push(deck);
    });

    const tierOrder = ["OP", "S", "A", "B", "C", "D"].filter(t => groups[t]);

    const canvas = {
        width: 1400,
        padding: 40,
        cardSpacing: 20
    };

    const card = {
        width: canvas.width - canvas.padding * 2,
        height: 180,
        padding: 24
    };

    let totalHeight = canvas.padding * 2 + 100; 
    tierOrder.forEach(tier => {
        totalHeight += 60; 
        totalHeight += groups[tier].length * (card.height + canvas.cardSpacing);
        totalHeight += 40; 
    });

    const canvasEl = createCanvas(canvas.width, totalHeight);
    const ctx = canvasEl.getContext("2d");

    // Background with subtle texture
    const bgGradient = createGradient(ctx, 0, 0, canvas.width, totalHeight,
        [COLORS.background, "#0F1015"], "diagonal");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, totalHeight);

    ctx.save();
    ctx.globalAlpha = 0.02;
    for (let i = 0; i < 1000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? "#FFFFFF" : "#000000";
        ctx.fillRect(
            Math.random() * canvas.width,
            Math.random() * totalHeight,
            1, 1
        );
    }
    ctx.restore();

    let currentY = canvas.padding;

    drawStyledText(ctx, "TFT Meta Comps", canvas.padding, currentY, {
        font: `800 42px ${FONT_FAMILY}`,
        color: COLORS.text.primary,
        shadow: true
    });

    currentY += 50;

    drawStyledText(ctx, "SET 15 - Patch 15.2 Meta Snapshot", canvas.padding, currentY, {
        font: `500 18px ${FONT_FAMILY}`,
        color: COLORS.text.muted
    });

    currentY += 60;

    for (const tier of tierOrder) {
        const tierDecks = groups[tier];
        const tierColors = COLORS.tier[tier];

        const chipSize = drawGlowingChip(ctx, tier === "OP" ? "S+" : tier,
            canvas.padding, currentY, tierColors, "lg");

        drawStyledText(ctx, `${tierDecks.length} comps`,
            canvas.padding + chipSize.width + SPACING.md, currentY + 14, {
            font: `500 16px ${FONT_FAMILY}`,
            color: COLORS.text.muted
        });

        currentY += chipSize.height + SPACING.lg;

        for (const deck of tierDecks) {
            drawElevatedCard(ctx, canvas.padding, currentY, card.width, card.height);

            let contentX = canvas.padding + card.padding;
            let contentY = currentY + card.padding;

            drawStyledText(ctx, deck.name || "Unknown Comp", contentX, contentY, {
                font: `700 24px ${FONT_FAMILY}`,
                color: COLORS.text.primary,
                maxWidth: card.width - 150
            });

            drawGlowingChip(ctx, tier === "OP" ? "S+" : tier,
                canvas.padding + card.width - 80, currentY + 16, tierColors, "sm");

            contentY += 40;

            const stats = [
                { label: "Win Rate", value: formatPercentage(deck.win_rate), type: "success" },
                { label: "Top 4", value: formatPercentage(deck.top4_rate), type: "default" },
                { label: "Pick Rate", value: formatPercentage(deck.pick_rate), type: "warning" }
            ];

            let statX = contentX;
            stats.forEach(stat => {
                const badge = drawStatBadge(ctx, stat.label, stat.value, statX, contentY, stat.type);
                statX += badge.width + SPACING.sm;
            });

            contentY += 40;

            const units = Array.isArray(deck.units) ? deck.units.slice(0, 8) : [];
            const champSize = 64;
            const champSpacing = 12;

            let champX = contentX;
            const maxChampionsPerRow = Math.floor((card.width - card.padding * 2) / (champSize + champSpacing));

            for (let i = 0; i < units.length; i++) {
                if (i > 0 && i % maxChampionsPerRow === 0) {
                    champX = contentX;
                    contentY += champSize + SPACING.sm;
                }

                await drawChampionAvatar(ctx, units[i], champX, contentY, champSize);
                champX += champSize + champSpacing;
            }

            currentY += card.height + canvas.cardSpacing;
        }

        currentY += 20;
    }

    ensureDir(path.dirname(outputPath));
    const out = fs.createWriteStream(outputPath);

    await new Promise((res) => canvasEl.createPNGStream().pipe(out).on("finish", res));
    return outputPath;
}

module.exports = {
  config: {
    name: "tftboard",
    version: "1.0.0",
    author: "you + gpt",
    countDown: 5,
    role: 0,
    description: {
      vi: "Vẽ ảnh meta TFT (giống OP.GG) kèm đội hình & item",
      en: "Render TFT meta board like OP.GG (teams & items)"
    },
    category: "image",
    guide: {
      vi: "{pn} [limit=12] [version=15.2c]\n{pn} file  (đính kèm JSON giống mẫu)",
      en: "{pn} [limit=12] [version=15.2c]\n{pn} file  (attach JSON like example)"
    }
  },

  onStart: async function (ctx) {
    const { args, message, api, event } = ctx;
    let limit = Number(args?.[0]) || 12;
    let version = args?.[1] || "15.2c";
    let data;

    const wantFile = String(args?.[0] || "").toLowerCase() === "file";
    const attachments = (event?.attachments || message?.attachments || []).filter(a => /json$/i.test(a?.type || a?.filetype || "") || /application\/json/i.test(a?.contentType || ""));

    try {
      if (wantFile && attachments.length) {
        const att = attachments[0];
        const url = att?.url || att?.previewUrl || att?.largePreviewUrl;
        if (!url) throw new Error("Không tìm thấy URL file đính kèm");
        const res = await request(url);
        const buf = await streamToBuffer(res.body);
        data = JSON.parse(buf.toString("utf8"));
      } else {
        data = await fetchJson(API_URL(limit, version));
      }
    } catch (e) {
      console.error(e);
      const text = "Không lấy được dữ liệu TFT: " + e.message;
      if (message?.reply) return message.reply(text);
      if (api?.sendMessage) return api.sendMessage(text, event.threadID, event.messageID);
      return;
    }

    const decks = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    if (!decks.length) {
      const text = "Dữ liệu rỗng hoặc sai định dạng.";
      if (message?.reply) return message.reply(text);
      if (api?.sendMessage) return api.sendMessage(text, event.threadID, event.messageID);
      return;
    }

    const order = { OP:0, S:1, A:2, B:3, C:4, D:5 };
    decks.sort((a,b) => {
      const ta = mapTier(a?.op?.tier || a?.tier);
      const tb = mapTier(b?.op?.tier || b?.tier);
      const da = (order[ta] ?? 99) - (order[tb] ?? 99);
      if (da !== 0) return da;
      return (b.pick_rate||0) - (a.pick_rate||0);
    });

    const outPath = path.join(__dirname, "cache", `tft_board_${Date.now()}.png`);
    try {
      const file = await renderTFTBoard(decks, outPath);
      const stream = fs.createReadStream(file);
      const msg = {
        body: `TFT Meta Board • ${version} • ${decks.length} đội`,
        attachment: stream
      };

      if (message?.reply) return message.reply(msg), fs.unlink(file);
        if (api?.sendMessage) return api.sendMessage(msg, event.threadID, event.messageID), fs.unlink(file);
    } catch (e) {
      console.error(e);
      const text = "Lỗi render ảnh: " + e.message;
      if (message?.reply) return message.reply(text);
      if (api?.sendMessage) return api.sendMessage(text, event.threadID, event.messageID);
    }
  }
};
