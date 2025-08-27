"use strict";

const { resolve, basename, extname } = require("node:path");
const { createReadStream, promises: fsp } = require("node:fs");
const { openAsBlob: _openAsBlob } = (() => {
    try { return require("node:fs"); } catch { return {}; }
})();
const { blob } = require("node:stream/consumers");
const crypto = require("node:crypto");
const { URL } = require("node:url");
let _fetch = globalThis.fetch;
let _FormData = globalThis.FormData;
let _Blob = globalThis.Blob;
let _Headers = globalThis.Headers;
try {
    if (!_fetch || !_FormData || !_Blob) {
        const undici = require("undici");
        _fetch = undici.fetch || _fetch;
        _FormData = undici.FormData || _FormData;
        _Blob = undici.Blob || _Blob;
        _Headers = undici.Headers || _Headers;
    }
} catch { }

const CATBOX_API = "https://catbox.moe/user/api.php";
const LITTER_API = "https://litterbox.catbox.moe/resources/internals/api.php";
const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const CONFIG = {
    TIMEOUT_MS: 30_000,
    RETRIES: 4,

    CATBOX_MAX: 200 * 1024 * 1024,    
    LITTERBOX_MAX: 1024 * 1024 * 1024, 
    CHUNK: 64 * 1024,

    RATE: { capacity: 10, refillPerSec: 1 },

    URL: {
        ALLOWED_PROTOCOLS: ["http:", "https:"],
        BLOCKED_DOMAINS: ["localhost", "127.0.0.1", "0.0.0.0", "::1"],
        MAX_LEN: 2048
    },

    LITTER_TIMES: new Set(["1h", "12h", "24h", "72h"])
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rid = () => crypto.randomBytes(8).toString("hex");

const mime = (ext) => ({
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif",
    ".webp": "image/webp", ".bmp": "image/bmp", ".svg": "image/svg+xml",
    ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".avi": "video/x-msvideo", ".mkv": "video/x-matroska",
    ".mp3": "audio/mpeg", ".wav": "audio/wav", ".flac": "audio/flac", ".ogg": "audio/ogg", ".aac": "audio/aac",
    ".pdf": "application/pdf", ".txt": "text/plain", ".zip": "application/zip", ".rar": "application/vnd.rar",
    ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}[ext] || "application/octet-stream");

const sanitize = (s) => String(s || "file").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").replace(/\s+/g, "_").slice(0, 255);

const validUrl = (s) => {
    try {
        const u = new URL(s);
        if (!CONFIG.URL.ALLOWED_PROTOCOLS.includes(u.protocol)) return { valid: false, reason: "Invalid protocol" };
        if (s.length > CONFIG.URL.MAX_LEN) return { valid: false, reason: "URL too long" };
        if (CONFIG.URL.BLOCKED_DOMAINS.includes(u.hostname)) return { valid: false, reason: "Blocked domain" };
        if (u.hostname.includes("..") || u.pathname.includes("..")) return { valid: false, reason: "Suspicious URL" };
        return { valid: true, url: u };
    } catch (e) { return { valid: false, reason: e.message }; }
};

const nameFromUrl = (u) => {
    try {
        const p = new URL(u).pathname.toLowerCase();
        const ext = extname(p);
        if (ext) return { filename: sanitize(basename(p) || `file_${Date.now()}${ext}`), extension: ext, mime: mime(ext) };
    } catch { }
    return { filename: `file_${Date.now()}`, extension: "", mime: "application/octet-stream" };
};

class CircuitBreaker {
    constructor(threshold = 5, timeoutMs = 60_000) {
        this.t = threshold; this.T = timeoutMs; this.n = 0; this.last = 0; this.state = "CLOSED";
    }
    async exec(fn) {
        if (this.state === "OPEN") {
            if (Date.now() - this.last > this.T) this.state = "HALF_OPEN"; else throw new Error("Circuit breaker is OPEN");
        }
        try { const r = await fn(); this.n = 0; this.state = "CLOSED"; return r; }
        catch (e) { this.n++; this.last = Date.now(); if (this.n >= this.t) this.state = "OPEN"; throw e; }
    }
}

class TokenBucket {
    constructor(capacity, refillPerSec) { this.c = capacity; this.r = refillPerSec; this.t = capacity; this.last = Date.now(); }
    _refill() { const now = Date.now(); const d = (now - this.last) / 1000; if (d > 0) { this.t = Math.min(this.c, this.t + d * this.r); this.last = now; } }
    async take(n = 1) { for (; ;) { this._refill(); if (this.t >= n) { this.t -= n; return; } const wait = ((n - this.t) / this.r) * 1000; await sleep(Math.max(50, Math.ceil(wait))); } }
}

class UrlAnalyzer {
    constructor(timeout = CONFIG.TIMEOUT_MS) { this.timeout = timeout; }
    async head(url, opts = {}) {
        const ctrl = new AbortController(); const id = setTimeout(() => ctrl.abort(), this.timeout);
        try {
            const res = await _fetch(url, { method: "HEAD", signal: ctrl.signal, redirect: "follow", headers: { "User-Agent": opts.userAgent || USER_AGENT } });
            clearTimeout(id);
            const size = res.headers.get("content-length"); const type = res.headers.get("content-type");
            return {
                ok: res.ok, status: res.status, url: res.url, redirected: res.redirected,
                size: size ? parseInt(size) : null, mime: type || null, ...nameFromUrl(res.url)
            };
        } catch (e) { clearTimeout(id); if (e.name === "AbortError") throw new Error(`HEAD timeout ${this.timeout}ms`); throw e; }
    }
}

class AdvancedCatboxClient {
    constructor(userHash = null, options = {}) {
        this.userHash = userHash || null;
        this.rate = new TokenBucket(options.rateCapacity || CONFIG.RATE.capacity, options.rateRefillPerSec || CONFIG.RATE.refillPerSec);
        this.cb = new CircuitBreaker(options.circuitBreakerThreshold || 5, options.circuitBreakerTimeoutMs || 60_000);
        this.analyzer = new UrlAnalyzer(options.timeout || CONFIG.TIMEOUT_MS);
        this.onProgress = options.onProgress || null;
        this.onSuccess = options.onSuccess || null;
        this.onError = options.onError || null;
        this.onRetry = options.onRetry || null;

        this.stats = { totalUploads: 0, successfulUploads: 0, failedUploads: 0, totalBytesUploaded: 0, averageUploadTime: 0 };
    }

    setUserHash(h) { this.userHash = h || null; }

    _headers(isLitter, extra = {}) {
        return {
            "User-Agent": USER_AGENT,
            Accept: "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            Origin: isLitter ? "https://litterbox.catbox.moe" : "https://catbox.moe",
            Referer: isLitter ? "https://litterbox.catbox.moe/" : "https://catbox.moe/",
            ...extra
        };
    }

    async _post(body, { useLitterbox = false, timeout = CONFIG.TIMEOUT_MS, headers } = {}) {
        const id = rid(); await this.rate.take(1);
        return this.cb.exec(async () => {
            const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeout);
            try {
                const res = await _fetch(useLitterbox ? LITTER_API : CATBOX_API, { method: "POST", signal: ctrl.signal, headers: this._headers(useLitterbox, headers), body });
                clearTimeout(t);
                const text = await res.text().catch(() => "");
                const trimmed = (text || "").trim();
                if (!res.ok) { const msg = `HTTP ${res.status}: ${res.statusText}${trimmed ? ` | ${trimmed}` : ""}`; this.onError && this.onError({ requestId: id, error: msg }); throw new Error(msg); }
                return trimmed;
            } catch (e) { clearTimeout(t); if (e.name === "AbortError") throw new Error(`HTTP Timeout after ${timeout}ms`); throw e; }
        });
    }

    async _blobFromPath(p) {
        if (typeof _openAsBlob?.openAsBlob === "function") return _openAsBlob.openAsBlob(p);
        const buf = await fsp.readFile(p); return new _Blob([buf]);
    }

    async _downloadToBlob(url, { userAgent = USER_AGENT, referer, timeout = CONFIG.TIMEOUT_MS, headers = {} } = {}) {
        const h = new _Headers({ "User-Agent": userAgent, ...(referer ? { Referer: referer } : {}), ...headers });
        const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeout);
        try {
            const res = await _fetch(url, { method: "GET", headers: h, signal: ctrl.signal, redirect: "follow" });
            clearTimeout(t);
            if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(`Download failed ${res.status} ${res.statusText}${txt ? ` | ${txt}` : ""}`); }
            const ab = await res.arrayBuffer(); const ct = res.headers.get("content-type") || "application/octet-stream";
            return new _Blob([ab], { type: ct });
        } catch (e) { clearTimeout(t); if (e.name === "AbortError") throw new Error(`Download timeout after ${timeout}ms`); throw e; }
    }

    async _checkFile(path, useLitterbox = false) {
        try {
            const st = await fsp.stat(path);
            if (!st.isFile()) return { ok: false, reason: "Not a file" };
            const limit = useLitterbox ? CONFIG.LITTERBOX_MAX : CONFIG.CATBOX_MAX;
            if (st.size <= 0) return { ok: false, reason: "Empty file" };
            if (st.size > limit) return { ok: false, reason: `File too large: ${Math.round(st.size / 1048576)}MB > ${Math.round(limit / 1048576)}MB` };
            return { ok: true, size: st.size };
        } catch (e) { return { ok: false, reason: `Stat error: ${e.message}` }; }
    }

    async _uploadBlob(blobData, filename, opts = {}) {
        const fd = new _FormData();
        if (opts.useLitterbox) {
            fd.set("reqtype", "fileupload");
            const t = opts.expiry || "1h";
            if (!CONFIG.LITTER_TIMES.has(t)) throw new Error(`Invalid Litterbox time: ${t}`);
            fd.set("time", t);
        } else {
            fd.set("reqtype", "fileupload");
            if (this.userHash) fd.set("userhash", this.userHash);
        }
        fd.set("fileToUpload", blobData, filename);

        const res = await this._post(fd, opts);
        const prefix = opts.useLitterbox ? "https://litter.catbox.moe/" : "https://files.catbox.moe/";
        if (!res.startsWith(prefix)) throw new Error(`Upload failed: ${res}`);
        return res;
    }

    async uploadFile(filePath, opts = {}) {
        const resolved = resolve(filePath);
        const chk = await this._checkFile(resolved, !!opts.useLitterbox);
        if (!chk.ok) throw new Error(`Invalid file: ${resolved} | ${chk.reason}`);

        const filename = sanitize(opts.filename || basename(resolved));
        let result;
        if (chk.size > CONFIG.CHUNK * 100) {
            const chunks = []; const rs = createReadStream(resolved, { highWaterMark: CONFIG.CHUNK });
            for await (const c of rs) { chunks.push(c); opts.onProgress && opts.onProgress({ current: (chunks.length * CONFIG.CHUNK), total: chk.size }); }
            result = await this._uploadBlob(new _Blob(chunks), filename, opts);
        } else {
            const b = await this._blobFromPath(resolved);
            result = await this._uploadBlob(b, filename, opts);
        }
        this.stats.totalUploads++; this.stats.successfulUploads++; this.stats.totalBytesUploaded += chk.size || 0;
        return { catboxUrl: result, filename, fileSize: chk.size, service: opts.useLitterbox ? "LitterBox" : "Catbox" };
    }

    async uploadURL(url, opts = {}) {
        const val = validUrl(url); if (!val.valid) throw new Error(`Invalid URL: ${val.reason}`);

        // LITTERBOX: only fileupload -> always download->fileupload (per docs)
        if (opts.useLitterbox) {
            const blobData = await this._downloadToBlob(url, { referer: (() => { try { return new URL(url).origin + "/"; } catch { return undefined; } })(), timeout: opts.timeout || CONFIG.TIMEOUT_MS, headers: opts.urlHeaders || {} });
            const { filename, extension } = nameFromUrl(url);
            const name = sanitize(filename || `file_${Date.now()}${extension || ""}`);
            return { catboxUrl: await this._uploadBlob(blobData, name, opts), service: "LitterBox" };
        }

        // Catbox: try urlupload -> fallback on 412/403/timeouts
        let analysis = null;
        if (!opts.skipAnalysis) {
            try { analysis = await this.analyzer.head(url, opts); const lim = CONFIG.CATBOX_MAX; if (analysis.size && analysis.size > lim && opts.strict) throw new Error(`Size ${Math.round(analysis.size / 1048576)}MB exceeds ${Math.round(lim / 1048576)}MB`); }
            catch (e) { if (opts.requireAnalysis) throw e; }
        }

        if (!opts.forceDownload) {
            const fd = new _FormData();
            fd.set("reqtype", "urlupload");
            if (this.userHash) fd.set("userhash", this.userHash);
            fd.set("url", url);

            try {
                const res = await this._post(fd, opts);
                if (!res.startsWith("https://files.catbox.moe/")) throw new Error(`Upload failed: ${res}`);
                this.stats.totalUploads++; this.stats.successfulUploads++; if (analysis?.size) this.stats.totalBytesUploaded += analysis.size;
                return { catboxUrl: res, service: "Catbox" };
            } catch (e) {
                const m = String(e.message || "");
                const fallback = m.includes("HTTP 412") || /precondition failed/i.test(m) || m.includes("HTTP 403") || /forbidden/i.test(m) || /timeout/i.test(m) || opts.alwaysFallbackOnError;
                if (!fallback) throw e;
            }
        }

        // fallback: download -> fileupload
        const blobData = await this._downloadToBlob(url, { referer: (() => { try { return new URL(url).origin + "/"; } catch { return undefined; } })(), timeout: opts.timeout || CONFIG.TIMEOUT_MS, headers: opts.urlHeaders || {} });
        const { filename, extension } = nameFromUrl(url);
        const name = sanitize(filename || `file_${Date.now()}${extension || ""}`);
        const link = await this._uploadBlob(blobData, name, opts);
        this.stats.totalUploads++; this.stats.successfulUploads++; if (analysis?.size) this.stats.totalBytesUploaded += analysis.size;
        return { catboxUrl: link, service: "Catbox" };
    }

    async deleteFiles(files, opts = {}) {
        if (!this.userHash) throw new Error("User hash is required for file deletion");
        if (!Array.isArray(files) || !files.length) throw new Error("files[] required (filenames only)");
        const fd = new _FormData();
        fd.set("reqtype", "deletefiles");
        fd.set("userhash", this.userHash);
        fd.set("files", files.join(" ")); // filenames, not URLs
        const res = await this._post(fd, opts);
        if (/error/i.test(res)) throw new Error(`Delete failed: ${res}`);
        return true;
    }

    async createAlbum(title, description = "", files = [], opts = {}) {
        const fd = new _FormData();
        fd.set("reqtype", "createalbum");
        if (this.userHash) fd.set("userhash", this.userHash); // anonymous album CANNOT be edited/deleted (per docs)
        fd.set("title", String(title || "").trim().slice(0, 100));
        fd.set("desc", String(description || "").trim().slice(0, 1000));
        // SINGLE SPACE SEPARATED, max 500
        const unique = Array.from(new Set((files || []).filter(Boolean)));
        fd.set("files", unique.slice(0, 500).join(" "));
        const res = await this._post(fd, opts);
        if (!res.startsWith("https://catbox.moe/c/")) throw new Error(`Album creation failed: ${res}`);
        return { url: res, title, description, fileCount: unique.length };
    }

    // EDITALBUM MUST supply ALL args (title, desc, files, short, userhash)
    async editAlbum(short, { title, description, files }, opts = {}) {
        if (!this.userHash) throw new Error("User hash is required for album editing");
        if (!short) throw new Error("short (album code) is required");
        if (typeof title !== "string" || typeof description !== "string" || !Array.isArray(files))
            throw new Error("editalbum requires full args: title:string, description:string, files:string[]");
        const fd = new _FormData();
        fd.set("reqtype", "editalbum");
        fd.set("userhash", this.userHash);
        fd.set("short", short);
        fd.set("title", title.trim().slice(0, 100));
        fd.set("desc", description.trim().slice(0, 1000));
        fd.set("files", Array.from(new Set(files)).slice(0, 500).join(" "));
        const res = await this._post(fd, opts);
        const expected = `https://catbox.moe/c/${short}`;
        if (res !== expected) throw new Error(`Album edit failed: ${res}`);
        return { url: res, short };
    }

    async addFilesToAlbum(short, files, opts = {}) {
        if (!this.userHash) throw new Error("User hash is required for album modification");
        if (!short || !Array.isArray(files) || !files.length) throw new Error("short and files[] required");
        const fd = new _FormData();
        fd.set("reqtype", "addtoalbum");
        fd.set("userhash", this.userHash);
        fd.set("short", short);
        fd.set("files", Array.from(new Set(files)).slice(0, 500).join(" "));
        const res = await this._post(fd, opts);
        const expected = `https://catbox.moe/c/${short}`;
        if (res !== expected) throw new Error(`addtoalbum failed: ${res}`);
        return { url: res, short, added: files.length };
    }

    async removeFilesFromAlbum(short, files, opts = {}) {
        if (!this.userHash) throw new Error("User hash is required for album modification");
        if (!short || !Array.isArray(files) || !files.length) throw new Error("short and files[] required");
        const fd = new _FormData();
        fd.set("reqtype", "removefromalbum");
        fd.set("userhash", this.userHash);
        fd.set("short", short);
        fd.set("files", Array.from(new Set(files)).slice(0, 500).join(" "));
        const res = await this._post(fd, opts);
        const expected = `https://catbox.moe/c/${short}`;
        if (res !== expected) throw new Error(`removefromalbum failed: ${res}`);
        return { url: res, short, removed: files.length };
    }

    async deleteAlbum(short, opts = {}) {
        if (!this.userHash) throw new Error("User hash is required for album deletion");
        if (!short) throw new Error("short required");
        const fd = new _FormData();
        fd.set("reqtype", "deletealbum");
        fd.set("userhash", this.userHash);
        fd.set("short", short);
        const res = await this._post(fd, opts);
        // success returns empty
        if (res && /error/i.test(res)) throw new Error(`deletealbum failed: ${res}`);
        return { short, success: true };
    }
}

/** Thin wrappers (giống phong cách node-catbox) */
class Catbox extends AdvancedCatboxClient {
    constructor(userHash = null, opts = {}) { super(userHash, opts); }
    async uploadFile({ path, filename, ...rest }) { const r = await super.uploadFile(path, { filename, ...rest }); return r.catboxUrl; }
    async uploadURL({ url, ...rest }) { const r = await super.uploadURL(url, rest); return r.catboxUrl; }
    async deleteFiles({ files }) { return super.deleteFiles(files); }
    async createAlbum({ title, description = "", files = [] }) { const r = await super.createAlbum(title, description, files); return r.url; }
    async editAlbum({ short, title, description, files = [] }) { const r = await super.editAlbum(short, { title, description, files }); return r.url; }
    async addFilesToAlbum({ short, files }) { return super.addFilesToAlbum(short, files); }
    async removeFilesFromAlbum({ short, files }) { return super.removeFilesFromAlbum(short, files); }
    async deleteAlbum({ short }) { return super.deleteAlbum(short); }
}

class Litterbox extends AdvancedCatboxClient {
    constructor(opts = {}) { super(null, opts); }
    async uploadFile({ path, duration = "1h", filename }) { const r = await super.uploadFile(path, { useLitterbox: true, expiry: duration, filename }); return r.catboxUrl; }
    async upload({ path, duration = "1h", filename }) { return this.uploadFile({ path, duration, filename }); } // alias
}

const FileLifetime = { OneHour: "1h", TwelveHours: "12h", TwentyFourHours: "24h", SeventyTwoHours: "72h" };

module.exports = {
    AdvancedCatboxClient,
    Catbox,
    Litterbox,
    TokenBucketRateLimiter: TokenBucket,
    CircuitBreaker,
    UrlAnalyzer,
    CONFIG,
    // utils
    sleep,
    sanitize,
    validUrl,
    nameFromUrl,
    FileLifetime
};
