'use strict';

const undici = require('undici');
const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');
const { fetch } = undici;
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const { once } = require('events');
const { execFile } = require('child_process');

class SoundCloudAllWays {
    constructor(opts = {}) {
        this.cacheFile = opts.cacheFile || path.resolve('./soundcloud_client_id.json');
        this.candidatePages = opts.candidatePages || [
            'https://soundcloud.com/discover',
            'https://soundcloud.com/charts/top',
            'https://soundcloud.com/'
        ];
        this.jsHostHint = 'a-v2.sndcdn.com';
        this.clientIdPatterns = [
            /client_id\s*[:=]\s*["']([0-9a-zA-Z]{32})["']/g,
            /["']client_id["']\s*[:=]\s*["']([0-9a-zA-Z]{32})["']/g,
            /client_id=([0-9a-zA-Z]{32})/g
        ];
        this.defaultHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Origin': 'https://soundcloud.com',
            'Referer': 'https://soundcloud.com'
        };
        this.CACHE_TTL = 24 * 60 * 60 * 1000;
        this.DEFAULT_TIMEOUT = 10000;
    }

    delay(ms) { return new Promise(r => setTimeout(r, ms)); }

    async fetchWithTimeout(url, options = {}, timeout = this.DEFAULT_TIMEOUT, retries = 2) {
        let last;
        for (let attempt = 0; attempt <= retries; attempt++) {
            const controller = new AbortController();
            const to = setTimeout(() => controller.abort(), timeout);
            try {
                const res = await fetch(url, {
                    ...options,
                    signal: controller.signal,
                    headers: { ...this.defaultHeaders, ...(options.headers || {}) }
                });
                if (!res.ok && res.status >= 500 && attempt < retries) throw new Error(`HTTP ${res.status}`);
                clearTimeout(to);
                return res;
            } catch (e) {
                last = e; clearTimeout(to);
                const aborted = String(e.name || '').toLowerCase().includes('abort');
                if (attempt < retries && !aborted) { await this.delay(2 ** attempt * 500); continue; }
                throw e;
            }
        }
        throw last;
    }
    async getText(url, timeout = this.DEFAULT_TIMEOUT) {
        const r = await this.fetchWithTimeout(url, {}, timeout);
        return r.text();
    }
    async getJson(url, timeout = this.DEFAULT_TIMEOUT) {
        const r = await this.fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, timeout);
        return r.json();
    }

    // ===== client_id cache =====
    async readCache() {
        try {
            const raw = await fs.readFile(this.cacheFile, 'utf8');
            const obj = JSON.parse(raw);
            if (obj?.checkedAt) {
                const age = Date.now() - new Date(obj.checkedAt).getTime();
                if (age > this.CACHE_TTL) return null;
            }
            return obj?.client_id || null;
        } catch { return null; }
    }
    async writeCache(client_id) {
        try {
            await fs.writeFile(this.cacheFile, JSON.stringify({
                client_id, checkedAt: new Date().toISOString(), version: '3.6'
            }, null, 2), 'utf8');
        } catch { /* ignore */ }
    }
    async validateClientId(client_id) {
        if (!client_id || client_id.length !== 32) return false;
        try {
            const test = `https://api-v2.soundcloud.com/search/tracks?q=test&client_id=${encodeURIComponent(client_id)}&limit=1`;
            const j = await this.getJson(test, 6000);
            return !!j && typeof j === 'object';
        } catch { return false; }
    }
    extractScriptSrcs(html, baseUrl) {
        const re = /<script[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
        const urls = new Set(); let m;
        while ((m = re.exec(html))) {
            const src = (m[1] || '').trim(); if (!src) continue;
            try {
                const abs = src.startsWith('http') ? src : new URL(src, baseUrl).href;
                if (abs.includes(this.jsHostHint) && /\/[^\/]+\.js(\?.*)?$/.test(abs)
                    && !abs.includes('gtm') && !abs.includes('analytics')) urls.add(abs);
            } catch { }
        }
        return [...urls];
    }
    async extractClientIdFromWeb() {
        const pages = await Promise.allSettled(this.candidatePages.map(u => this.getText(u, 12000)));
        const bundles = new Set();
        for (let i = 0; i < pages.length; i++) {
            if (pages[i].status !== 'fulfilled') continue;
            this.extractScriptSrcs(pages[i].value, this.candidatePages[i]).forEach(u => bundles.add(u));
        }
        const list = [...bundles];
        if (!list.length) throw new Error('Không tìm thấy bundle JS để trích xuất client_id');
        for (const js of list) {
            try {
                const txt = await this.getText(js, 15000);
                for (const pat of this.clientIdPatterns) {
                    pat.lastIndex = 0;
                    const m = pat.exec(txt);
                    if (m?.[1]?.length === 32) {
                        if (await this.validateClientId(m[1])) {
                            await this.writeCache(m[1]); return m[1];
                        }
                    }
                }
            } catch { }
        }
        throw new Error('Không tìm thấy client_id hợp lệ');
    }
    async getClientId(force = false) {
        if (!force) {
            const cached = await this.readCache();
            if (cached && await this.validateClientId(cached)) return cached;
        }
        return this.extractClientIdFromWeb();
    }

    // ===== Search & paging (robust) =====
    async searchTracks(query, limit, client_id) {
        const url = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${client_id}&limit=${limit}`;
        return this.getJson(url);
    }
    async robustSearch(query, limit = 6) {
        let client_id = await this.getClientId(false);
        let res = null;
        try { res = await this.searchTracks(query, limit, client_id); } catch { }
        if (!res?.collection?.length) {
            client_id = await this.getClientId(true);
            try { res = await this.searchTracks(query, limit, client_id); } catch { }
        }
        return { client_id, res };
    }

    // ===== Track processing =====
    upgradeArtwork(url, size = 't500x500') {
        if (!url) return null;
        return url.replace(/-large(\.\w+)$/, `-${size}$1`);
    }
    msToTime(ms) {
        if (!ms) return '0:00';
        const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); const ss = s % 60;
        return `${m}:${String(ss).padStart(2, '0')}`;
    }
    _summarizeTranscoding(t) {
        return {
            url: t.url,
            protocol: t.format?.protocol,
            mime_type: t.format?.mime_type,
            preset: t.preset,
            quality: t.quality,
            is_legacy: !!t.is_legacy_transcoding
        };
    }
    simplifyTrack(track) {
        const user = track.user || {};
        const trans = track.media?.transcodings || [];
        const summary = trans.map(t => this._summarizeTranscoding(t));
        const pick = (cond) => summary.find(cond);
        const best = pick(x => x.protocol === 'progressive')
            || pick(x => x.protocol === 'hls' && /mpeg(url)?$/i.test(x.mime_type || ''))
            || pick(x => x.protocol === 'hls')
            || summary[0] || null;
        return {
            id: track.id,
            title: track.title || 'Untitled',
            permalink_url: track.permalink_url,
            artwork_url: this.upgradeArtwork(track.artwork_url),
            duration_ms: track.duration || 0,
            duration_formatted: this.msToTime(track.duration),
            genre: track.genre || '',
            created_at: track.created_at,
            artist: {
                username: user.username || 'Unknown Artist',
                verified: !!user.badges?.verified
            },
            stats: {
                playback_count: track.playback_count || 0,
                likes_count: track.likes_count || 0
            },
            downloadable: !!track.downloadable,
            streamable: !!track.streamable,
            transcodings: summary,
            best_transcoding: best,
            track_authorization: track.track_authorization
        };
    }

    async resolveTranscoding(t, client_id, track_authorization) {
        if (!t?.url) return null;
        const url = t.url +
            (t.url.includes('?') ? '&' : '?') +
            `client_id=${encodeURIComponent(client_id)}` +
            (track_authorization ? `&track_authorization=${encodeURIComponent(track_authorization)}` : '');
        try {
            const j = await this.getJson(url, 8000);
            return j?.url || null;
        } catch { return null; }
    }

    async resolveStreams(tracks, client_id) {
        const out = [];
        for (const item of tracks) {
            if (!item.streamable || !item.best_transcoding?.url) {
                out.push({ ...item, stream: null }); continue;
            }
            const u = await this.resolveTranscoding(item.best_transcoding, client_id, item.track_authorization);
            out.push({
                ...item,
                stream: u ? {
                    resolved_url: u,
                    protocol: item.best_transcoding.protocol,
                    mime_type: item.best_transcoding.mime_type
                } : null
            });
        }
        return out;
    }

    // ===== File & progress =====
    _sanitize(name) {
        const s = (name || 'unnamed').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
        return s || 'unnamed';
    }
    async _head(url) {
        const r = await this.fetchWithTimeout(url, { method: 'HEAD', headers: { Referer: 'https://soundcloud.com' } }, 10000);
        return {
            ok: r.ok,
            status: r.status,
            length: Number(r.headers.get('content-length') || 0),
            acceptRanges: (r.headers.get('accept-ranges') || '').toLowerCase().includes('bytes')
        };
    }
    async _writeWebStreamToFile(webStream, outPath, onChunk) {
        const ws = fss.createWriteStream(outPath);
        if (Readable && typeof Readable.fromWeb === 'function') {
            const nodeStream = Readable.fromWeb(webStream);
            nodeStream.on('data', (chunk) => onChunk && onChunk(chunk.length));
            await pipeline(nodeStream, ws);
        } else {
            const reader = webStream.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                onChunk && onChunk(value.length || value.byteLength || 0);
                if (!ws.write(Buffer.from(value))) await once(ws, 'drain');
            }
            ws.end(); await once(ws, 'close');
        }
        return outPath;
    }

    async downloadProgressive(url, outPath, { resume = true, onProgress } = {}) {
        let total = 0, startSize = 0, canRange = false;
        try {
            const h = await this._head(url);
            total = h.length || 0; canRange = h.acceptRanges;
            if (resume && fss.existsSync(outPath) && total) {
                const st = await fs.stat(outPath);
                if (st.size > 0 && canRange && st.size < total) startSize = st.size;
            }
        } catch { }

        const headers = { Referer: 'https://soundcloud.com' };
        if (startSize) headers.Range = `bytes=${startSize}-`;

        const res = await this.fetchWithTimeout(url, { headers }, 30000);
        if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status} khi tải progressive`);

        const t0 = Date.now();
        let downloaded = 0, lastReport = 0;
        const report = () => {
            if (!onProgress || !total) return;
            const now = Date.now();
            if (now - lastReport < 1000) return;
            lastReport = now;
            const done = startSize + downloaded;
            const percent = total ? (done / total) * 100 : 0;
            const speed = downloaded / Math.max(1, (now - t0) / 1000);
            const eta = speed > 0 ? (total - done) / speed : 0;
            onProgress({ percent, downloaded: done, total, speed, eta });
        };

        await this._writeWebStreamToFile(res.body, outPath, (n) => { downloaded += n; report(); });

        if (onProgress && total) {
            const done = startSize + downloaded;
            onProgress({ percent: 100, downloaded: done, total, speed: 0, eta: 0, done: true });
        }

        const st = await fs.stat(outPath); if (!st.size) throw new Error('File rỗng (progressive)');
        return outPath;
    }

    async hasFfmpeg() { return new Promise(r => execFile('ffmpeg', ['-version'], e => r(!e))); }
    async ffmpegDownloadHls(m3u8Url, outPath) {
        return new Promise((resolve, reject) => {
            const args = [
                '-loglevel', 'error', '-y',
                '-headers', 'Referer: https://soundcloud.com\r\nUser-Agent: Mozilla/5.0\r\n',
                '-i', m3u8Url, '-c', 'copy', outPath
            ];
            const p = execFile('ffmpeg', args);
            let stderr = ''; p.stderr?.on('data', d => stderr += String(d));
            p.on('exit', code => code === 0 ? resolve(outPath) : reject(new Error(`ffmpeg failed (${code}): ${stderr}`)));
        });
    }
    async downloadHLS(m3u8Url, outPath) {
        const has = await this.hasFfmpeg();
        const final = path.extname(outPath) ? outPath : outPath + '.m4a';
        if (has) {
            const p = await this.ffmpegDownloadHls(m3u8Url, final);
            const st = await fs.stat(p); if (!st.size) throw new Error('File rỗng (ffmpeg)');
            return p;
        }
        const txt = await this.getText(m3u8Url, 15000);
        if (/^#EXT-X-KEY:.*METHOD=(?!NONE)/m.test(txt) || /^#EXT-X-MAP:/m.test(txt)) {
            throw new Error('HLS mã hoá hoặc fMP4 – cần cài ffmpeg để tải.');
        }
        const base = new URL(m3u8Url);
        const segs = txt.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'))
            .map(u => u.startsWith('http') ? u : new URL(u, base).href);
        if (!segs.length) throw new Error('Playlist HLS không có segment');
        const tmp = final.replace(/\.(mp3|m4a|aac|ts|ogg|mp4)?$/i, `.ts`);
        const ws = fss.createWriteStream(tmp);
        for (let i = 0; i < segs.length; i++) {
            const r = await this.fetchWithTimeout(segs[i], { headers: { Referer: 'https://soundcloud.com' } }, 20000);
            if (!r.ok) throw new Error(`HTTP ${r.status} ở segment ${i}`);
            const ab = await r.arrayBuffer();
            if (!ws.write(Buffer.from(ab))) await once(ws, 'drain');
        }
        ws.end(); await once(ws, 'close');
        const st = await fs.stat(tmp); if (!st.size) throw new Error('File rỗng (HLS node)');
        return tmp;
    }

    _guessExt(mime, protocol) {
        if (protocol === 'progressive') return /mpeg/i.test(mime) ? '.mp3' : '.m4a';
        if (protocol === 'hls') return /mpegurl|m3u8/i.test(mime) ? '.m4a' : (/ogg|opus/i.test(mime) ? '.ogg' : '.m4a');
        return '.mp3';
    }

    async getOfficialDownloadUrl(trackId, client_id) {
        const meta = await this.getJson(`https://api.soundcloud.com/tracks/${trackId}?client_id=${client_id}`).catch(() => null);
        if (meta?.downloadable && meta?.download_url) {
            if (!/client_id=/.test(meta.download_url)) {
                const join = meta.download_url.includes('?') ? '&' : '?';
                return meta.download_url + join + 'client_id=' + encodeURIComponent(client_id);
            }
            return meta.download_url;
        }
        return null;
    }

    async tagMp3IfAvailable(outPath, item) {
        let NodeID3; try { NodeID3 = require('node-id3'); } catch { return; }
        const tags = { title: item.title || '', artist: item.artist?.username || '' };
        if (item.artwork_url) {
            try {
                const res = await this.fetchWithTimeout(item.artwork_url, {}, 12000);
                if (res.ok) tags.image = Buffer.from(await res.arrayBuffer());
            } catch { }
        }
        try { NodeID3.write(tags, outPath); } catch { }
    }

    // ===== Method pickers =====
    findTranscodingByKey(item, key) {
        if (!item?.transcodings?.length) return null;
        const T = item.transcodings;
        if (key === 'p') return T.find(t => t.protocol === 'progressive') || null;
        if (key === 'hm') return T.find(t => t.protocol === 'hls' && /mpeg(url)?$/i.test(t.mime_type || '')) || null;
        if (key === 'ho') return T.find(t => t.protocol === 'hls' && /ogg|opus/i.test(t.mime_type || '')) || null;
        if (key === 'h') return T.find(t => t.protocol === 'hls') || null;
        return null;
    }

    // ===== Download by specified method or auto-best =====
    async downloadAuto(item, baseDir, progressCb) {
        const client_id = await this.getClientId(false);
        const safeTitle = this._sanitize(item.title);
        const dir = path.join(baseDir, safeTitle);
        await fs.mkdir(dir, { recursive: true });

        // Official nếu có
        try {
            const official = await this.getOfficialDownloadUrl(item.id, client_id);
            if (official) {
                const dest = path.join(dir, `${safeTitle}.mp3`);
                const p = await this.downloadProgressive(official, dest, { resume: true, onProgress: progressCb });
                await this.tagMp3IfAvailable(p, item);
                return { path: p, method: 'official' };
            }
        } catch { }

        let streamUrl = item?.stream?.resolved_url || null;
        let proto = item?.stream?.protocol || item?.best_transcoding?.protocol || null;
        let mime = item?.stream?.mime_type || item?.best_transcoding?.mime_type || '';

        if (!streamUrl && item?.best_transcoding?.url) {
            streamUrl = await this.resolveTranscoding(item.best_transcoding, client_id, item.track_authorization);
            proto = item.best_transcoding.protocol; mime = item.best_transcoding.mime_type || mime;
        }
        if (!streamUrl) throw new Error('Không có stream hợp lệ cho bài này');

        if (proto === 'progressive') {
            const ext = this._guessExt(mime, 'progressive');
            const dest = path.join(dir, `${safeTitle}${ext}`);
            const p = await this.downloadProgressive(streamUrl, dest, { resume: true, onProgress: progressCb });
            if (/\.mp3$/i.test(p)) await this.tagMp3IfAvailable(p, item);
            return { path: p, method: 'progressive' };
        }

        if (proto === 'hls') {
            const ext = this._guessExt(mime, 'hls');
            const dest = path.join(dir, `${safeTitle}${ext}`);
            const p = await this.downloadHLS(streamUrl, dest);
            return { path: p, method: 'hls' };
        }

        throw new Error(`Protocol không hỗ trợ: ${proto}`);
    }

    async downloadVia(item, baseDir, key, progressCb) {
        const client_id = await this.getClientId(false);
        const safeTitle = this._sanitize(item.title);
        const dir = path.join(baseDir, safeTitle);
        await fs.mkdir(dir, { recursive: true });

        if (key === 'o') {
            const official = await this.getOfficialDownloadUrl(item.id, client_id);
            if (!official) throw new Error('Không có official download cho bài này');
            const dest = path.join(dir, `${safeTitle}.mp3`);
            const p = await this.downloadProgressive(official, dest, { resume: true, onProgress: progressCb });
            await this.tagMp3IfAvailable(p, item);
            return { path: p, method: 'official' };
        }

        const chosen = this.findTranscodingByKey(item, key) || item.best_transcoding;
        if (!chosen?.url) throw new Error('Không có transcoding phù hợp');

        const streamUrl = await this.resolveTranscoding(chosen, client_id, item.track_authorization);
        if (!streamUrl) throw new Error('Không resolve được stream URL');

        const proto = chosen.protocol;
        const mime = chosen.mime_type || '';
        const ext = this._guessExt(mime, proto);
        const dest = path.join(dir, `${safeTitle}${ext}`);

        if (proto === 'progressive') {
            const p = await this.downloadProgressive(streamUrl, dest, { resume: true, onProgress: progressCb });
            if (/\.mp3$/i.test(p)) await this.tagMp3IfAvailable(p, item);
            return { path: p, method: 'progressive' };
        }
        if (proto === 'hls') {
            const p = await this.downloadHLS(streamUrl, dest);
            return { path: p, method: 'hls' };
        }
        throw new Error(`Protocol không hỗ trợ: ${proto}`);
    }
}

const shared = new SoundCloudAllWays();
module.exports = { SoundCloudAllWays, shared };
