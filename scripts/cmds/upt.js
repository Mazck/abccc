const os = require("os");
const fs = require("fs");
const path = require("path");

module.exports = {
    config: {
        name: "uptime",
        version: "2.0.0",
        author: "Mazck",
        countDown: 5,
        role: 0,
        description: {
            vi: "Xem thông tin chi tiết về bot và hệ thống",
            en: "Show detailed bot and system information"
        },
        category: "System",
        guide: {
            vi: "   {pn}: Hiển thị thông tin chi tiết về uptime và tài nguyên",
            en: "   {pn}: Display detailed uptime and resource information"
        }
    },

    langs: {
        vi: {
            fetching: "⏳ | Đang thu thập thông tin chi tiết...",
            title: "📊 THÔNG TIN CHI TIẾT HỆ THỐNG",

            // Bot Info
            botSection: "🤖 THÔNG TIN BOT",
            botUptime: "⏱️ Thời gian hoạt động",
            startedAt: "🕒 Khởi động lúc",
            restarts: "🔄 Số lần khởi động lại",
            users: "👤 Tổng người dùng",
            threads: "👥 Tổng nhóm chat",
            commands: "⚡ Lệnh đã xử lý",

            // Process Info  
            processSection: "⚙️ THÔNG TIN TIẾN TRÌNH",
            pid: "🆔 Process ID",
            ppid: "👨‍👦 Parent PID",
            nodeVersion: "🟢 Node.js",
            platform: "🖥️ Nền tảng",
            architecture: "🏗️ Kiến trúc",

            // CPU Info
            cpuSection: "🧠 THÔNG TIN CPU",
            cpuModel: "💻 CPU Model",
            cpuCores: "🔢 Số lõi",
            cpuSpeed: "⚡ Tốc độ",
            cpuUsageBot: "📊 CPU Bot sử dụng",
            cpuUsageSystem: "📈 CPU Hệ thống",
            cpuLoadAvg: "📉 Load Average",

            // Memory Info
            memSection: "💾 THÔNG TIN BỘ NHỚ",
            memBotUsed: "🤖 RAM Bot sử dụng",
            memBotHeap: "📦 Heap sử dụng",
            memBotHeapTotal: "📋 Tổng Heap",
            memBotExternal: "🔗 Bộ nhớ ngoài",
            memSystemUsed: "💽 RAM Hệ thống",
            memSystemFree: "🆓 RAM trống",
            memSystemTotal: "📊 Tổng RAM",
            memSystemPercent: "📈 % RAM đã dùng",

            // System Info
            systemSection: "🖥️ THÔNG TIN HỆ THỐNG",
            osName: "🔷 Hệ điều hành",
            osVersion: "📋 Phiên bản OS",
            hostname: "🏷️ Tên máy",
            systemUptime: "⏳ Uptime hệ thống",
            networkInfo: "🌐 Thông tin mạng",

            // Performance
            performanceSection: "⚡ HIỆU SUẤT",
            responseTime: "🚀 Thời gian phản hồi",
            memoryLeaks: "🔍 Rò rỉ bộ nhớ",
            gcRuns: "🗑️ Garbage Collection",
            eventLoopLag: "🔄 Event Loop Lag"
        },
        en: {
            fetching: "⏳ | Collecting detailed information...",
            title: "📊 DETAILED SYSTEM INFORMATION",

            // Bot Info
            botSection: "🤖 BOT INFORMATION",
            botUptime: "⏱️ Bot uptime",
            startedAt: "🕒 Started at",
            restarts: "🔄 Restart count",
            users: "👤 Total users",
            threads: "👥 Total threads",
            commands: "⚡ Commands processed",

            // Process Info
            processSection: "⚙️ PROCESS INFORMATION",
            pid: "🆔 Process ID",
            ppid: "👨‍👦 Parent PID",
            nodeVersion: "🟢 Node.js",
            platform: "🖥️ Platform",
            architecture: "🏗️ Architecture",

            // CPU Info
            cpuSection: "🧠 CPU INFORMATION",
            cpuModel: "💻 CPU Model",
            cpuCores: "🔢 Cores",
            cpuSpeed: "⚡ Speed",
            cpuUsageBot: "📊 Bot CPU usage",
            cpuUsageSystem: "📈 System CPU usage",
            cpuLoadAvg: "📉 Load Average",

            // Memory Info
            memSection: "💾 MEMORY INFORMATION",
            memBotUsed: "🤖 Bot RAM used",
            memBotHeap: "📦 Heap used",
            memBotHeapTotal: "📋 Total heap",
            memBotExternal: "🔗 External memory",
            memSystemUsed: "💽 System RAM used",
            memSystemFree: "🆓 Free RAM",
            memSystemTotal: "📊 Total RAM",
            memSystemPercent: "📈 RAM usage %",

            // System Info
            systemSection: "🖥️ SYSTEM INFORMATION",
            osName: "🔷 Operating System",
            osVersion: "📋 OS Version",
            hostname: "🏷️ Hostname",
            systemUptime: "⏳ System uptime",
            networkInfo: "🌐 Network info",

            // Performance
            performanceSection: "⚡ PERFORMANCE",
            responseTime: "🚀 Response time",
            memoryLeaks: "🔍 Memory leaks",
            gcRuns: "🗑️ Garbage Collection",
            eventLoopLag: "🔄 Event Loop Lag"
        }
    },

    onStart: async function ({api, message, usersData, threadsData, getLang }) {
        const startTime = Date.now();

        // Gửi thông báo đang xử lý
        const processingMsg = await message.reply(getLang("fetching"));

        try {
            // Thu thập tất cả thông tin
            const [
                botInfo,
                processInfo,
                cpuInfo,
                memInfo,
                systemInfo,
                performanceInfo
            ] = await Promise.all([
                getBotInfo(usersData, threadsData),
                getProcessInfo(),
                getCpuInfo(),
                getMemoryInfo(),
                getSystemInfo(),
                getPerformanceInfo()
            ]);

            const responseTime = Date.now() - startTime;

            // Tạo thông báo chi tiết
            const detailedInfo = formatDetailedInfo({
                botInfo,
                processInfo,
                cpuInfo,
                memInfo,
                systemInfo,
                performanceInfo: { ...performanceInfo, responseTime }
            }, getLang);

            // Cập nhật tin nhắn
            await api.editMessage(detailedInfo, processingMsg.messageID);

        } catch (error) {
            console.error("Error collecting system info:", error);
            await api.editMessage("❌ Lỗi khi thu thập thông tin hệ thống", processingMsg.messageID);
        }
    }
};

// ====== Thu thập thông tin Bot ======
async function getBotInfo(usersData, threadsData) {
    const procUptimeSec = process.uptime();
    const botUptime = formatDuration(procUptimeSec);
    const startedAt = new Date(Date.now() - procUptimeSec * 1000).toLocaleString();

    // Đếm users và threads
    const [users, threads] = await Promise.all([
        usersData.getAll().catch(() => []),
        threadsData.getAll().catch(() => [])
    ]);

    const totalUsers = Array.isArray(users) ? users.length : 0;
    const totalThreads = Array.isArray(threads) ? threads.length : 0;

    // Thông tin restart (lưu trong file tạm)
    const restartCount = getRestartCount();

    return {
        uptime: botUptime,
        startedAt,
        totalUsers,
        totalThreads,
        restartCount,
        commandsProcessed: global.commandsProcessed || 0
    };
}

// ====== Thu thập thông tin Process ======
async function getProcessInfo() {
    return {
        pid: process.pid,
        ppid: process.ppid || 'N/A',
        nodeVersion: process.version,
        platform: `${process.platform} (${process.arch})`,
        execPath: process.execPath,
        workingDir: process.cwd(),
        argv: process.argv.slice(2).join(' ') || 'N/A'
    };
}

// ====== Thu thập thông tin CPU chi tiết ======
async function getCpuInfo() {
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Unknown';
    const cpuCores = cpus.length;
    const cpuSpeed = `${(cpus[0]?.speed || 0)}MHz`;

    // Đo CPU usage của bot
    const botCpuUsage = await measureProcessCpuPercent();

    // Tính CPU usage tổng hệ thống
    const systemCpuUsage = await measureSystemCpuPercent();

    // Load average (chỉ có trên Unix-like systems)
    const loadAvg = os.loadavg();
    const loadAvgStr = loadAvg.map(l => l.toFixed(2)).join(', ');

    return {
        model: cpuModel,
        cores: cpuCores,
        speed: cpuSpeed,
        botUsage: `${botCpuUsage.toFixed(1)}%`,
        systemUsage: `${systemCpuUsage.toFixed(1)}%`,
        loadAverage: loadAvgStr
    };
}

// ====== Thu thập thông tin Memory chi tiết ======
async function getMemoryInfo() {
    // Memory của bot
    const mem = process.memoryUsage();
    const botMemUsed = byte2human(mem.rss);
    const botHeapUsed = byte2human(mem.heapUsed);
    const botHeapTotal = byte2human(mem.heapTotal);
    const botExternal = byte2human(mem.external);

    // Memory hệ thống
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usagePercent = ((usedMem / totalMem) * 100).toFixed(1);

    return {
        bot: {
            used: botMemUsed,
            heapUsed: botHeapUsed,
            heapTotal: botHeapTotal,
            external: botExternal
        },
        system: {
            used: byte2human(usedMem),
            free: byte2human(freeMem),
            total: byte2human(totalMem),
            percent: `${usagePercent}%`
        }
    };
}

// ====== Thu thập thông tin System ======
async function getSystemInfo() {
    const networkInterfaces = os.networkInterfaces();
    const mainInterface = Object.keys(networkInterfaces).find(name =>
        networkInterfaces[name].some(net => !net.internal && net.family === 'IPv4')
    );
    const mainNet = mainInterface ? networkInterfaces[mainInterface].find(net => net.family === 'IPv4') : null;

    return {
        osName: `${os.type()} ${os.release()}`,
        version: os.version ? os.version() : 'N/A',
        hostname: os.hostname(),
        uptime: formatDuration(os.uptime()),
        networkInterface: mainInterface || 'N/A',
        ipAddress: mainNet?.address || 'N/A',
        homeDir: os.homedir(),
        tmpDir: os.tmpdir()
    };
}

// ====== Thu thập thông tin Performance ======
async function getPerformanceInfo() {
    // Event loop lag
    const eventLoopLag = await measureEventLoopLag();

    // Memory leak detection (so sánh với lần đo trước)
    const currentMem = process.memoryUsage().heapUsed;
    const previousMem = global.previousMemUsage || currentMem;
    global.previousMemUsage = currentMem;
    const memoryTrend = currentMem > previousMem ? '📈' : currentMem < previousMem ? '📉' : '➡️';

    return {
        eventLoopLag: `${eventLoopLag.toFixed(2)}ms`,
        memoryTrend: `${memoryTrend} ${byte2human(Math.abs(currentMem - previousMem))}`,
        gcRuns: global.gcRuns || 0
    };
}

// ====== Format thông tin chi tiết ======
function formatDetailedInfo(info, getLang) {
    return `${getLang("title")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getLang("botSection")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getLang("botUptime")}: ${info.botInfo.uptime}
${getLang("startedAt")}: ${info.botInfo.startedAt}
${getLang("users")}: ${info.botInfo.totalUsers.toLocaleString()}
${getLang("threads")}: ${info.botInfo.totalThreads.toLocaleString()}
${getLang("commands")}: ${info.botInfo.commandsProcessed.toLocaleString()}
${getLang("restarts")}: ${info.botInfo.restartCount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getLang("processSection")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getLang("pid")}: ${info.processInfo.pid}
${getLang("ppid")}: ${info.processInfo.ppid}
${getLang("nodeVersion")}: ${info.processInfo.nodeVersion}
${getLang("platform")}: ${info.processInfo.platform}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getLang("cpuSection")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getLang("cpuModel")}: ${info.cpuInfo.model}
${getLang("cpuCores")}: ${info.cpuInfo.cores}
${getLang("cpuSpeed")}: ${info.cpuInfo.speed}
${getLang("cpuUsageBot")}: ${info.cpuInfo.botUsage}
${getLang("cpuUsageSystem")}: ${info.cpuInfo.systemUsage}
${getLang("cpuLoadAvg")}: ${info.cpuInfo.loadAverage}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getLang("memSection")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getLang("memBotUsed")}: ${info.memInfo.bot.used}
${getLang("memBotHeap")}: ${info.memInfo.bot.heapUsed}
${getLang("memBotHeapTotal")}: ${info.memInfo.bot.heapTotal}
${getLang("memBotExternal")}: ${info.memInfo.bot.external}
${getLang("memSystemUsed")}: ${info.memInfo.system.used}
${getLang("memSystemFree")}: ${info.memInfo.system.free}
${getLang("memSystemTotal")}: ${info.memInfo.system.total}
${getLang("memSystemPercent")}: ${info.memInfo.system.percent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getLang("systemSection")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getLang("osName")}: ${info.systemInfo.osName}
${getLang("hostname")}: ${info.systemInfo.hostname}
${getLang("systemUptime")}: ${info.systemInfo.uptime}
${getLang("networkInfo")}: ${info.systemInfo.networkInterface} (${info.systemInfo.ipAddress})

━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getLang("performanceSection")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getLang("responseTime")}: ${info.performanceInfo.responseTime}ms
${getLang("eventLoopLag")}: ${info.performanceInfo.eventLoopLag}
${getLang("memoryLeaks")}: ${info.performanceInfo.memoryTrend}
${getLang("gcRuns")}: ${info.performanceInfo.gcRuns}`;
}

// ====== Helper Functions ======

function byte2human(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let l = 0, n = parseInt(bytes, 10) || 0;
    while (n >= 1024 && ++l) n = n / 1024;
    return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
}

function formatDuration(totalSeconds) {
    totalSeconds = Math.max(0, Math.floor(totalSeconds));
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h || d) parts.push(`${h}h`);
    if (m || h || d) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Đo CPU usage của bot process
async function measureProcessCpuPercent(intervalMs = 500) {
    const cpus = os.cpus();
    const cores = Math.max(1, cpus.length);

    const startUsage = process.cpuUsage();
    const startHr = process.hrtime.bigint();

    await sleep(intervalMs);

    const elapUsage = process.cpuUsage(startUsage);
    const elapHrMs = Number(process.hrtime.bigint() - startHr) / 1e6;

    const elapCpuMs = (elapUsage.user + elapUsage.system) / 1000;
    const percent = (elapCpuMs / (elapHrMs * cores)) * 100;
    return Math.max(0, Number.isFinite(percent) ? percent : 0);
}

// Đo CPU usage tổng hệ thống
async function measureSystemCpuPercent() {
    const cpus1 = os.cpus();
    const idle1 = cpus1.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const total1 = cpus1.reduce((acc, cpu) =>
        acc + Object.values(cpu.times).reduce((a, b) => a + b, 0), 0
    );

    await sleep(300);

    const cpus2 = os.cpus();
    const idle2 = cpus2.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const total2 = cpus2.reduce((acc, cpu) =>
        acc + Object.values(cpu.times).reduce((a, b) => a + b, 0), 0
    );

    const idleDiff = idle2 - idle1;
    const totalDiff = total2 - total1;

    return totalDiff === 0 ? 0 : Math.max(0, 100 - (100 * idleDiff / totalDiff));
}

// Đo Event Loop Lag
async function measureEventLoopLag() {
    const start = process.hrtime.bigint();
    await new Promise(resolve => setImmediate(resolve));
    const lag = Number(process.hrtime.bigint() - start) / 1e6; // ns to ms
    return lag;
}

// Đếm số lần restart
function getRestartCount() {
    const restartFile = path.join(__dirname, '.restart_count');
    try {
        if (fs.existsSync(restartFile)) {
            const count = parseInt(fs.readFileSync(restartFile, 'utf8')) || 0;
            fs.writeFileSync(restartFile, (count + 1).toString());
            return count + 1;
        } else {
            fs.writeFileSync(restartFile, '1');
            return 1;
        }
    } catch {
        return 0;
    }
}

// Track Garbage Collection (nếu có)
if (global.gc) {
    const originalGc = global.gc;
    global.gc = function () {
        global.gcRuns = (global.gcRuns || 0) + 1;
        return originalGc();
    };
}