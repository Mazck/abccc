const fetch = require('node-fetch');
const fs = require("fs");
const path = require("path");
const ytdl = require("@distube/ytdl-core");
const https = require("https");
const crypto = require('crypto');
const axios = require('axios');
const qs = require('qs');
const cheerio = require('cheerio');
const { ZingMp3 } = require('zingmp3-api-full');
const { console } = require('inspector');
const ffmpegPath = "C:\\Users\\datng\\OneDrive\\Máy tính\\ffmpeg-7.1.1-essentials_build\\ffmpeg-7.1.1-essentials_build\\bin\\ffmpeg.exe"; // đường dẫn tuyệt đối
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const SPOTIFY_CLIENT_ID = '80b63877532a4c049b6877657fd48ce8';
const SPOTIFY_CLIENT_SECRET = '28e6d9157b5b407199cff2b9685cefa2';

function getFileSizeMB(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024);
}

function compressAudio(input, output, bitrateKbps) {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .audioBitrate(bitrateKbps)
            .on('end', () => resolve(output))
            .on('error', err => reject(err))
            .save(output);
    });
}

async function compressLoopAudioFile(inputPath, targetSizeMB = 25, outputDir = './cache') {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    let currentPath = inputPath;
    let currentSize = getFileSizeMB(currentPath);
    let bitrate = 128;
    const maxIterations = 10;
    let iteration = 0;

    console.log(`🔄 Bắt đầu nén: ${currentSize.toFixed(2)}MB`);

    while (currentSize > targetSizeMB && iteration < maxIterations) {
        iteration++;
        const outputPath = path.join(outputDir, `compressed_${Date.now()}.mp3`);
        bitrate = Math.max(32, bitrate - 16);

        console.log(`➡️  Nén lần ${iteration} với bitrate ${bitrate}kbps...`);
        await compressAudio(currentPath, outputPath, bitrate);

        currentPath = outputPath;
        currentSize = getFileSizeMB(currentPath);
        console.log(`✅ Kích thước sau nén lần ${iteration}: ${currentSize.toFixed(2)}MB`);
    }

    return currentPath;
}

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function downloadSnapcdn(url, filename, callback) {
    if (typeof url !== "string" || !url.startsWith("http")) {
        return callback(new Error("❌ URL không hợp lệ"));
    }

    const filePath = path.join(__dirname, "cache", filename);

    axios({
        method: "GET",
        url: url,
        responseType: "stream"
    })
        .then(response => {
            const writer = fs.createWriteStream(filePath);

            response.data.pipe(writer);

            writer.on("finish", () => {
                // Delay nhẹ để đảm bảo hệ điều hành flush file hoàn toàn
                setTimeout(() => {
                    if (fs.existsSync(filePath)) {
                        console.log("✅ Tải xong:", filePath);
                        callback(null, filePath);
                    } else {
                        callback(new Error("❌ File chưa tồn tại sau ghi xong."));
                    }
                }, 300); // Delay nhẹ 300ms
            });

            writer.on("error", err => {
                console.error("❌ Ghi file lỗi:", err.message);
                callback(err);
            });
        })
        .catch(error => {
            console.error("❌ Tải xuống lỗi:", error.message);
            callback(error);
        });
}


async function downloadMedia(url) {
    try {
        const platform = detectPlatform(url);
        switch (platform) {
            case 'facebook': return await downloadFacebook(url);
            case 'tiktok':
            case 'capcut': return await downloadTikTokCapcut(url);
            case 'instagram': return await downloadInstagram(url);
            case 'youtube': return await downloadYouTube(url);
            case 'douyin': return await downloadDouyin(url);
            case 'soundcloud': return await downloadSoundCloud(url);
            case 'spotify': return await getSpotifyTrackInfo(url);
            case 'zingmp3': return await downloadZingMp3(url);
            default: throw new Error("Platform không được hỗ trợ: " + platform);
        }
    } catch (error) {
        return { success: false, error: error.message, platform: detectPlatform(url) };
    }
}

function detectPlatform(url) {
    const patterns = {
        facebook: /(?:https?:\/\/)?(?:www\.)?(facebook|fb)\.com/,
        tiktok: /(?:https?:\/\/)?(?:www\.)?(vm|vt|m|www)?\.?tiktok\.com/,
        capcut: /(?:https?:\/\/)?(?:www\.)?(capcut|cc)\.com/,
        instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com/,
        youtube: /(?:https?:\/\/)?(?:www\.)?(youtube|youtu)\.(?:com|be)/,
        douyin: /douyin\.com/,
        soundcloud: /(?:https?:\/\/)?(?:www\.)?soundcloud\.com/,
        spotify: /(?:https?:\/\/)?(?:www\.)?spotify\.com/,
        zingmp3: /(?:https?:\/\/)?(?:www\.)?zingmp3\.vn/
    };
    for (const platform in patterns) if (patterns[platform].test(url)) return platform;
    return 'unknown';
}

async function downloadFacebook(url) {
    const res = await fetch('https://fsave.net/proxy.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ url })
    });
    const data = await res.json();
    return { success: true, platform: 'facebook', data };
}

/**
 * Download TikTok/CapCut video
 */
async function downloadTikTokCapcut(url) {
    function decodeBase64Url(apiPath, prefix) {
        const encoded = apiPath.replace(prefix, '');
        let decoded = Buffer.from(encoded, 'base64').toString('utf-8');
        decoded += decoded.includes('?') ? '&type=mp4' : '?type=mp4';
        return decoded;
    }

    const isTikTok = /(?:https?:\/\/)?(?:www\.)?(vm|vt|m|www)?\.?tiktok\.com/.test(url);
    const isCapcut = /(?:https?:\/\/)?(?:www\.)?(capcut|cc)\.com/.test(url);

    if (isTikTok) {
        const response = await fetch(`https://www.tikwm.com/api/?url=${url}&hd=0`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ url })
        });

        const data = await response.json();
        const images = Array.isArray(data?.data?.images) ? data.data.images : null;
        const video = data?.data?.wmplay || null;

        return {
            success: true,
            platform: 'tiktok',
            code: data.code === 0 ? 200 : data.code,
            hasVideo: !!video,
            hasImages: !!images?.length,
            originalDownloadUrl: video,
            images,
            thumb: data?.data?.cover || null,
            music_info: {
                musicId: data?.data?.music_info?.id || '',
                musicName: data?.data?.music_info?.title || '',
                musicAuthor: data?.data?.music_info?.author || '',
                musicPlayUrl: data?.data?.music_info?.play || ''
            },
            title: data?.data?.title || '',
            authorName: data?.data?.author?.nickname || '',
            videoStats: {
                playCount: data?.data?.play_count || 0,
                likeCount: data?.data?.digg_count || 0,
                commentCount: data?.data?.comment_count || 0,
                shareCount: data?.data?.share_count || 0
            }
        };
    }

    if (isCapcut) {
        const response = await fetch('https://3bic.com/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ url })
        });

        const data = await response.json();
        return {
            success: true,
            platform: 'capcut',
            code: data.code,
            hasVideo: !!data.originalVideoUrl,
            hasImages: false,
            originalDownloadUrl: decodeBase64Url(data.originalVideoUrl, '/api/cdn/'),
            images: null,
            thumb: data.coverUrl,
            title: data.title,
            authorName: data.authorName
        };
    }

    throw new Error('Invalid TikTok or CapCut URL');
}


/**
 * Download Instagram media
 */
async function downloadInstagram(url) {
    const response = await fetch('https://loveinsta.com/proxy.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ url })
    });

    const data = await response.json();
    return {
        success: true,
        platform: 'instagram',
        data
    };
}

/**
 * Download YouTube video
 */
async function downloadYouTube(url) {
    // Load cookie nếu có
    const cookiePath = path.join(__dirname, "cookie.json");
    let agent = null;

    if (fs.existsSync(cookiePath)) {
        const rawCookie = JSON.parse(fs.readFileSync(cookiePath, "utf8"));
        const cookiesArray = rawCookie.cookies;

        function formatCookieStringToArray(cookies) {
            return cookies.map(c => ({ name: c.name, value: c.value }));
        }

        const agentOptions = { pipelining: 5, maxRedirections: 0 };
        agent = ytdl.createAgent(formatCookieStringToArray(cookiesArray), agentOptions);
    }

    const info = await ytdl.getInfo(url, agent ? { agent } : {});
    const formats = info.formats;
    const results = [];

    for (const f of formats) {
        const type = f.mimeType?.startsWith("video/") ? "video" :
            f.mimeType?.startsWith("audio/") ? "audio" : "unknown";

        if (type === 'unknown') continue;

        results.push({
            itag: f.itag,
            type,
            container: f.container,
            bitrate: f.bitrate || f.audioBitrate || 0,
            audioChannels: f.audioChannels || null,
            duration: parseFloat(f.approxDurationMs) / 1000 || null,
            url: f.url
        });
    }

    return {
        success: true,
        platform: 'youtube',
        title: info.videoDetails.title,
        author: info.videoDetails.author.name,
        duration: info.videoDetails.lengthSeconds,
        thumbnail: info.videoDetails.thumbnails[0]?.url,
        formats: results
    };
}

/**
 * Download Douyin video
 */
async function downloadDouyin(url) {
    const response = await fetch('https://savetik.co/api/ajaxSearch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ q: url, lang: 'vi', cftoken: '' })
    });

    const { msg, statusCode, status, data: html } = await response.json();
    if (statusCode) {
        const data = {
            success: false,
            platform: 'douyin',
            error: `Lỗi từ server: ${statusCode}`,
            code: statusCode,
            message: msg
        }

        return data;
    }

    const $ = cheerio.load(html);
    return {
        success: true,
        platform: 'douyin',
        thumbnail: $('.image-tik img').attr('src'),
        title: $('.content h3').text().trim(),
        duration: $('.content p').first().text().trim(),
        videoId: $('#TikTokId').val(),
        videoSrc: $('#popup_play video').attr('data-src'),
        downloadLinks: $('.dl-action a.tik-button-dl').map((_, el) => ({
            type: $(el).text().trim(),
            href: $(el).attr('href')
        })).get()
    };
}

function resolveShortUrl(shortUrl) {
    return axios.get(shortUrl, {
        maxRedirects: 0,
        validateStatus: null
    }).then(res => res.headers.location || shortUrl);
}

function getAllClientIDsFromTrack() {
    return new Promise((resolve, reject) => {
        https.get("https://soundcloud.com/", res => {
            let html = "";
            res.on("data", chunk => html += chunk);
            res.on("end", () => {
                const externalScripts = [...html.matchAll(/<script[^>]+src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"/g)];
                const inlineScripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
                const clientIDs = new Set();
                const patterns = [
                    /client_id\s*[:=]\s*["']([a-zA-Z0-9]{32})["']/g,
                    /clientId\s*[:=]\s*["']([a-zA-Z0-9]{32})["']/g
                ];

                const findClientIDs = (text) => {
                    patterns.forEach(pat => {
                        const matches = [...text.matchAll(pat)];
                        matches.forEach(match => clientIDs.add(match[1]));
                    });
                };

                inlineScripts.forEach(script => findClientIDs(script[1]));
                if (clientIDs.size > 0) return resolve([...clientIDs]);

                let completed = 0;
                if (!externalScripts.length) return reject("Không tìm thấy JS files");

                externalScripts.forEach(match => {
                    const jsUrl = match[1];
                    https.get(jsUrl, res2 => {
                        let js = "";
                        res2.on("data", chunk => js += chunk);
                        res2.on("end", () => {
                            findClientIDs(js);
                            completed++;
                            if (completed === externalScripts.length) {
                                if (clientIDs.size > 0) resolve([...clientIDs]);
                                else reject("Không tìm thấy client_id");
                            }
                        });
                    }).on("error", () => {
                        completed++;
                        if (completed === externalScripts.length) {
                            if (clientIDs.size > 0) resolve([...clientIDs]);
                            else reject("Không tìm thấy client_id");
                        }
                    });
                });
            });
        }).on("error", err => reject(err.message));
    });
}

function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s < 10 ? "0" + s : s} giây`;
}

function bytesToMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
}

async function getSoundCloudDataAndDownload(inputUrl) {
    try {
        const resolvedUrl = inputUrl.includes("on.soundcloud.com")
            ? await resolveShortUrl(inputUrl)
            : inputUrl;

        const clientIds = await getAllClientIDsFromTrack();
        const clientId = clientIds[0];
        if (!clientId) throw new Error("Không tìm thấy client_id");

        const trackRes = await axios.get("https://api-v2.soundcloud.com/resolve", {
            params: { url: resolvedUrl, client_id: clientId }
        });

        const track = trackRes.data;
        const title = track.title || "unknown";
        const author = track.user?.username || "unknown";
        const duration = formatDuration(Math.floor((track.duration || 0) / 1000));

        const stream = track.media?.transcodings?.find(t => t.format.protocol === "progressive");
        if (!stream) throw new Error("Không có stream progressive");

        const streamRes = await axios.get(stream.url, {
            params: { client_id: clientId }
        });

        const streamUrl = streamRes.data?.url;
        if (!streamUrl) throw new Error("Không lấy được stream URL");

        const tempPath = path.join(__dirname, `${Date.now()}.mp3`);
        const writer = fs.createWriteStream(tempPath);
        const downloadRes = await axios.get(streamUrl, { responseType: "stream" });
        downloadRes.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        const fileSizeMB = bytesToMB(fs.statSync(tempPath).size);

        return {
            success: true,
            title,
            author,
            duration,
            size: fileSizeMB,
            filePath: tempPath,
            url: resolvedUrl,
            stream_url: streamUrl,
            description: track.description || "Không có mô tả"
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Get Spotify track info
 */
async function getSpotifyTrackInfo(url) {
    const trackId = url.match(/track\/([a-zA-Z0-9]+)/)?.[1];
    if (!trackId) throw new Error('Invalid Spotify URL');

    const token = await getSpotifyToken();
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = response.data;
    return {
        success: true,
        platform: 'spotify',
        title: data.name,
        artist: data.artists.map(a => a.name).join(', '),
        album: data.album.name,
        duration: data.duration_ms,
        preview_url: data.preview_url,
        image: data.album.images[0]?.url
    };
}

/**
 * Download ZingMP3
 */
async function downloadZingMp3(url) {
    const songId = url.match(/\/([A-Z0-9]+)\.html/)?.[1];
    if (!songId) throw new Error('Invalid ZingMP3 URL');

    const data = await ZingMp3.getSong(songId);
    return {
        success: true,
        platform: 'zingmp3',
        data
    };
}

async function getSpotifyToken() {
    const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        qs.stringify({ grant_type: 'client_credentials' }),
        {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    );
    return response.data.access_token;
}

module.exports = {
    config: {
        name: "audodownload",
        version: "1.3",
        author: "Mazck",
        cooldowns: 5,
        role: 1,
        description: {
            vi: "auto download video từ link"
        },
        category: "box chat",
        guide: {
            vi: '  {pn} on: dùng để bật tính năng tự động tải video từ link\n',
            en: '  {pn} on: use to turn on auto download video from link\n'
        },
    },

    langs: {
        vi: {
            missingConfig: "Vui lòng nhập cấu hình cần thiết",
            configSuccess: "Cấu hình đã được cài đặt thành công",
            currentConfig: "Cấu hình audodownloadq hiện tại trong nhóm chat của bạn là:\n%1",
            notSetConfig: "Hiện tại nhóm bạn chưa cài đặt cấu hình audodownload ji",
            syntaxError: "Sai cú pháp, chỉ có thể dùng \"{pn} on\" hoặc \"{pn} off\"",
            turnOnSuccess: "Tính năng audodownload đã được bật",
            turnOffSuccess: "Tính năng audodownload đã được tắt",
            error: "Đã có lỗi xảy ra khi sử dụng chức năng audodownload"
        },
        en: {
            missingConfig: "Please enter the required configuration",
            configSuccess: "The configuration has been set successfully",
            currentConfig: "The current audodownload configuration in your chat group is:\n%1",
            notSetConfig: "Your group has not set the audodownload configuration",
            syntaxError: "Syntax error, only \"{pn} on\" or \"{pn} off\" can be used",
            turnOnSuccess: "The audodownload feature has been turned on",
            turnOffSuccess: "The audodownload feature has been turned off",
            error: "An error occurred while using the audodownload feature"
        }
    },

    onStart: async function ({ message, event, args, threadsData, getLang }) {
        switch (args[0]) {
            case "on": {
                const isEnabled = await threadsData.get(event.threadID, "settings.enableAutoSetName");
                if (isEnabled) return message.reply("Tính năng đã được bật rồi, bật nữa ăn con cặc 🤨");

                await threadsData.set(event.threadID, true, "settings.enableAutoSetName");
                return message.reply(getLang("turnOnSuccess"));
            }

            case "off": {
                const isEnabled = await threadsData.get(event.threadID, "settings.enableAutoSetName");
                if (!isEnabled) return message.reply("Tính năng đã tắt rồi, tắt nữa ăn con cặc 😡");

                await threadsData.set(event.threadID, false, "settings.enableAutoSetName");
                return message.reply(getLang("turnOffSuccess"));
            }

            default:
                return message.reply(getLang("syntaxError"));
        }
    },

    onChat: async ({ message, event, api, threadsData, getLang }) => {
        const isEnabled = await threadsData.get(event.threadID, "settings.enableAutoSetName");

        if (!isEnabled) return;

        const { threadID } = event;
        const body = (event.body || '');

        const regex = /(https?:\/\/[^\s]+)/g;

        var matches = body.match(regex);

        if (!matches) return;

        if (/douyin\.com/.test(matches[0])) {
            try {
                await downloadDouyin(matches[0])
                    .then(data => {
                        if (!data.success) {
                            return message.reply(getLang("error", data.error));
                        }

                        const replyMessage = `Tên: ${data.title}\nThời gian: ${data.duration}\nVideo ID: ${data.videoId}\n`;
                        console.log(data.downloadLinks)
                        downloadSnapcdn(data.downloadLinks[1].type == "Tải xuống MP4 HD" ? data.downloadLinks[1].href : data.videoSrc, `${data.videoId}.mp4`, function (err, filePath) {
                            if (err) return message.reply("❌ Lỗi tải: " + err.message);

                            const stats = fs.statSync(filePath);
                            const sizeMB = stats.size / (1024 * 1024);

                            if (sizeMB > 25) {
                                message.reply(`⚠️ File quá lớn (${sizeMB.toFixed(2)}MB), vượt quá giới hạn 25MB.`);
                                return fs.unlink(filePath, () => { });
                            }

                            fs.access(filePath, fs.constants.F_OK, (accessErr) => {
                                if (accessErr) return message.reply("❌ Không tìm thấy file sau tải.");

                                message.reply({
                                    body: replyMessage,
                                    attachment: fs.createReadStream(filePath)
                                }, () => {
                                    fs.unlink(filePath, () => { }); // xóa sau khi gửi xong
                                });
                            });
                        });
                    })
                    .catch(err => {
                        return message.reply(`❌ Lỗi: ${err.message}`);
                    });
            } catch (error) {
                return message.reply('❌ Lỗi: ' + error.message);
            }
        }

        if (/(?:https?:\/\/)?(?:www\.)?soundcloud\.com/.test(matches[0])) {
            try {
                const url = matches[0];
                const data = await getSoundCloudDataAndDownload(url);

                if (!data.success) {
                    return message.reply(getLang("error", data.error));
                }

                const replyMessage = `🎵 Tiêu đề: ${data.title}\n🕒 Thời lượng: ${data.duration}\n📄 Mô tả: ${data.description}/n🌳Size: ${data.size}`;

                const stats = fs.statSync(data.filePath);
                const sizeMB = stats.size / (1024 * 1024);

                // Nếu quá lớn và là file mp3 → nén
                if (sizeMB > 25 && data.filePath.endsWith(".mp3")) {
                    message.reply(`⚠️ File quá lớn (${sizeMB.toFixed(2)}MB). Đang nén...`);

                    const compressedPath = await compressLoopAudioFile(data.filePath, 25, path.join(__dirname, "cache"));

                    return message.reply({
                        body: replyMessage + "\n(Đã nén dưới 25MB)",
                        attachment: fs.createReadStream(compressedPath)
                    }, () => {
                        fs.unlink(data.filePath, () => { });
                        fs.unlink(compressedPath, () => { });
                    });
                }

                // Quá lớn nhưng không phải mp3 → từ chối gửi
                if (sizeMB > 25) {
                    fs.unlink(data.filePath, () => { });
                    return message.reply(`⚠️ File quá lớn (${sizeMB.toFixed(2)}MB), không thể gửi.`);
                }

                // Gửi bình thường
                return message.reply({
                    body: replyMessage,
                    attachment: fs.createReadStream(data.filePath)
                }, () => {
                    fs.unlink(data.filePath, () => { });
                });

            } catch (error) {
                return message.reply(`❌ Đã xảy ra lỗi: ${error.message}`);
            }
        }



        const isTikTok = /(?:https?:\/\/)?(?:www\.)?(vm|vt|m|www)?\.?tiktok\.com/.test(matches[0]);
        const isCapcut = /(?:https?:\/\/)?(?:www\.)?(capcut|cc)\.com/.test(matches[0]);

        if (isTikTok || isCapcut) {
            await downloadTikTokCapcut(matches[0])
                .then(async data => {
                    if (!data.success) {
                        return message.reply(getLang("error", data.error || "Không lấy được dữ liệu."));
                    }

                    const attachments = [];
                    let replyMessage = `📄 Tiêu đề: ${data.title}\n✍️ Tác giả: ${data.authorName}`;

                    async function sendAllAttachments() {
                        if (attachments.length > 0) {
                            message.reply({
                                body: replyMessage,
                                attachment: attachments.length === 1 ? attachments[0] : attachments
                            }, () => {
                                // Xóa file sau khi gửi
                                attachments.forEach(stream => {
                                    if (stream.path) fs.unlink(stream.path, () => { });
                                });
                            });
                        } else {
                            message.reply(replyMessage); // Không có file, chỉ gửi text
                        }
                    }

                    // Nếu có video
                    if (data.hasVideo) {
                        try {
                            await new Promise((resolve, reject) => {
                                downloadSnapcdn(data.originalDownloadUrl, `${data.videoId || Date.now()}.mp4`, function (err, filePath) {
                                    if (err) return reject(err);

                                    const stats = fs.statSync(filePath);
                                    const sizeMB = stats.size / (1024 * 1024);

                                    if (sizeMB > 25) {
                                        message.reply(`⚠️ File video quá lớn (${sizeMB.toFixed(2)}MB), vượt quá giới hạn 25MB.`);
                                        fs.unlink(filePath, () => { });
                                        return resolve();
                                    }

                                    const stream = fs.createReadStream(filePath);
                                    attachments.push(stream);
                                    resolve();
                                });
                            });
                        } catch (err) {
                            message.reply("❌ Lỗi tải video: " + err.message);
                        }
                    }

                    // Nếu có ảnh
                    if (data.hasImages && Array.isArray(data.images) && data.images.length > 0) {
                        for (let i = 0; i < data.images.length; i++) {
                            const imageUrl = data.images[i];
                            const imageFile = `img_${Date.now()}_${i + 1}.jpg`;

                            try {
                                await new Promise((resolve, reject) => {
                                    downloadSnapcdn(imageUrl, imageFile, (err, filePath) => {
                                        if (err) return resolve(); // Bỏ qua ảnh lỗi

                                        fs.stat(filePath, (errStat, stats) => {
                                            if (errStat) return resolve();

                                            const sizeMB = stats.size / (1024 * 1024);
                                            if (sizeMB > 25) {
                                                message.reply(`⚠️ Ảnh ${i + 1} quá lớn (${sizeMB.toFixed(2)}MB), đã bỏ qua.`);
                                                fs.unlink(filePath, () => resolve());
                                                return;
                                            }

                                            const stream = fs.createReadStream(filePath);
                                            attachments.push(stream);
                                            resolve();
                                        });
                                    });
                                });
                            } catch (err) {
                                console.error("Lỗi tải ảnh:", err);
                            }
                        }
                    }

                    // Gửi tất cả file + nội dung một lần
                    await sendAllAttachments();
                })
                .catch(err => {
                    return message.reply(`❌ Lỗi xử lý: ${err.message}`);
                });
        }
    }
};