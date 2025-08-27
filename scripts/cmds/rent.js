const {
    getRemainingTime,
    scheduleThreadExpire
} = require('../../bot/handler/handlerPayment');

function calculateNewExpiresAt(currentThread, daysToAdd) {
    const now = Date.now();
    const currentExpiration = currentThread.data?.expiresAt ? new Date(currentThread.data.expiresAt).getTime() : 0;
    const baseTime = currentExpiration > now ? currentExpiration : now;
    return new Date(baseTime + parseInt(daysToAdd) * 24 * 60 * 60 * 1000);
}

function generateCode(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}


module.exports = {
    config: {
        name: "rent",
        version: "1.2",
        author: "",
        countDown: 5,
        role: 0,
        description: {
            vi: "Thống kê các nhóm thuê bot",
            en: "Show subscription stats"
        },
        category: "info",
        guide: {
            en: "{pn}"
        }
    },

    onStart: async function ({ message, event, threadsData, }) {
        if (event.senderID === global.botID) return;
        const { GifcodeData } = global.db;
        
        async function getSubscriptionStatsFull(threadsData) {
            const allThreads = await threadsData.getAll();
            const now = Date.now();

            let total = 0;
            let activeCount = 0;
            let expiredCount = 0;

            const expiredThreads = [];
            const expiringSoonThreads = [];
            const activeThreads = [];

            for (const thread of allThreads) {
                const threadID = thread.threadID;
                const threadName = thread.threadName || 'Không tên';
                const expiresAtRaw = thread.data?.expiresAt;

                if (!expiresAtRaw) continue;

                const expiresAt = new Date(expiresAtRaw).getTime();
                const timeLeft = expiresAt - now;

                // Hết hạn
                if (!thread.isActive || expiresAt <= now) {
                    expiredCount++;
                    expiredThreads.push({
                        threadID,
                        threadName,
                        expiredSince: getRemainingTime(expiresAt)
                    });
                    total++;
                    continue;
                }

                // Sắp hết hạn (<= 2 ngày)
                if (timeLeft <= 2 * 24 * 60 * 60 * 1000) {
                    expiringSoonThreads.push({
                        threadID,
                        threadName,
                        timeLeftText: getRemainingTime(expiresAt)
                    });
                } else {
                    activeThreads.push({
                        threadID,
                        threadName,
                        timeLeftText: getRemainingTime(expiresAt)
                    });
                }

                activeCount++;
                total++;
            }

            return {
                summary: {
                    totalThreads: total,
                    active: activeCount,
                    expired: expiredCount,
                    expiringSoon: expiringSoonThreads.length
                },
                lists: {
                    expiringSoonThreads,
                    activeThreads,
                    expiredThreads
                }
            };
        }

        // Gửi báo cáo thống kê
        async function sendSubscriptionReport(message, threadsData) {
            const stats = await getSubscriptionStatsFull(threadsData);

            const filteredActiveThreads = stats.lists.activeThreads.filter(active =>
                !stats.lists.expiringSoonThreads.some(exp => exp.threadID === active.threadID)
            );

            const safeActiveCount = filteredActiveThreads.length;

            let report = `📊 [THỐNG KÊ NHÓM THUÊ BOT]
━━━━━━━━━━━━━━━━
📦 Tổng số nhóm: ${stats.summary.totalThreads}
✅ Còn hạn: ${safeActiveCount}
⚠️ Sắp hết hạn (<2 ngày): ${stats.summary.expiringSoon}
⛔ Hết hạn: ${stats.summary.expired}
━━━━━━━━━━━━━━━━

📍 Sắp hết hạn:
${stats.lists.expiringSoonThreads.length > 0
                    ? stats.lists.expiringSoonThreads.map(t =>
                        `• ${t.threadName} (${t.threadID}) – còn ${t.timeLeftText}`
                    ).join('\n')
                    : '• Không có nhóm nào'}

📍 Hết hạn:
${stats.lists.expiredThreads.length > 0
                    ? stats.lists.expiredThreads.map(t =>
                        `• ${t.threadName} (${t.threadID}) – hết hạn ${t.expiredSince}`
                    ).join('\n')
                    : '• Không có nhóm nào'}

📍 Còn hạn:
${filteredActiveThreads.length > 0
                    ? filteredActiveThreads.map(t =>
                        `• ${t.threadName} (${t.threadID}) – còn ${t.timeLeftText}`
                    ).join('\n')
                    : '• Không có nhóm nào'}
━━━━━━━━━━━━━━━━`;
            await message.reply(report);
        }

        async function taocode(args) {
            const { threadsData, GifcodeData } = global.db;
            let msg;
            const type = args[2]?.toUpperCase();
            const value = args[3];
            const notes = args.slice(4).join(" ") || null;
            if (!type || !value || isNaN(value)) {
                return msg = "⚠️ Cú pháp không hợp lệ.\n- `rent createcode DAYS <số_ngày>`\n- `rent createcode MONEY <số_tiền>`"
            }

            if (!['DAYS', 'MONEY'].includes(type)) {
                return msg = "⚠️ Loại phần thưởng không được hỗ trợ. Hiện chỉ có: `DAYS` và `MONEY`."
            }

            try {
                const newCode = generateCode();

                await GifcodeData.create({
                    code: newCode,
                    rewardType: type,
                    rewardValue: parseInt(value),
                    notes: notes
                });

                let rewardText = type === 'DAYS' ? `${value} ngày sử dụng` : `${parseInt(value).toLocaleString('vi-VN')} VNĐ`;

                return msg =
                    `✅ Đã tạo mã quà tặng thành công!\n` +
                    `- Mã code: ${newCode}\n` +
                    `- Phần thưởng: ${rewardText}\n` +
                    `- Ghi chú: ${notes || 'Không có'}`

            } catch (error) {
                console.error("Lỗi khi tạo gift code:", error);
                return `❌ Đã xảy ra lỗi khi tạo mã quà tặng: ${error.message}`;
            }
        }

        const subCommand = event.args;
        switch (subCommand[1]?.toLowerCase()) {
            case "check":
                await sendSubscriptionReport(message, threadsData);
                break;

            case "taocode":
                const msg = await taocode(subCommand);
                return message.reply(msg);
            default:
                break;
        }
    },

    onChat: async function ({ threadsData, usersData, event, message, getLang, api }) {
        const { GifcodeData } = global.db;
        const { args, sender } = event;
        if (event.logMessageType) return;
        const potentialCode = event.args.length === 1 ? event.args[0].toUpperCase() : "";
        const CODE_LENGTH = 12;
        const CODE_REGEX = /^[A-Z0-9]+$/; 
        if (
            !potentialCode ||
            potentialCode.length !== CODE_LENGTH ||
            !CODE_REGEX.test(potentialCode)
        ) {
            return;
        }
        const giftCode = await GifcodeData.findOne(event.body.toUpperCase());
        if (!giftCode) return;
        if (giftCode.usedAt) {
            return message.reply("⚠️ Mã code này đã được sử dụng trước đó.");
        }
        const { rewardType, rewardValue } = giftCode;
        let successMessage = "";

        switch (rewardType) {
            case 'DAYS': {
                const thread = await threadsData.get(event.threadID);
                const newExpiresAt = calculateNewExpiresAt(thread, rewardValue);
                await threadsData.set(event.threadID, {
                    isActive: true,
                    data: { ...thread.data, expiresAt: newExpiresAt.toISOString() }
                });
                scheduleThreadExpire(event.threadID, newExpiresAt, threadsData, api);
                successMessage = `Nhóm của bạn đã được cộng thêm ${rewardValue} ngày sử dụng bot.\n` +
                    `Ngày hết hạn mới: ${newExpiresAt.toLocaleString('vi-VN')}.`;
                break;
            }
            // case 'MONEY': {
            //     const userData = await usersData.get(senderID);
            //     const currentMoney = userData.money || 0;    
            //     const newMoney = currentMoney + rewardValue;
            //     await usersData.set(senderID, { money: newMoney });
            //     successMessage = `Bạn đã nhận được ${rewardValue.toLocaleString('vi-VN')} VNĐ vào tài khoản.\n` +
            //         `Số dư hiện tại của bạn là: ${newMoney.toLocaleString('vi-VN')} VNĐ.`;
            //     break;
            // }
            default:
                return;
        }
        await GifcodeData.set(giftCode.code, {
            usedByThreadID: event.threadID,
            usedByUserID: event.senderID,
            usedAt: new Date()
        });

        const finalMessage = `🎉 REDEEM THÀNH CÔNG! 🎉\n\n` +
            `${successMessage}\n\n` +
            `Cảm ơn bạn đã sử dụng dịch vụ! ❤️`;

        return message.reply(finalMessage);
    }
};
