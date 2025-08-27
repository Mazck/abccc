const RedeemManager = require('../../bot/handler/redeemManager.js');

module.exports = {
    config: {
        name: "redeem",
        aliases: ["code", "giftcode"],
        version: "2.0",
        author: "ABC Bot",
        countDown: 5,
        role: 0,
        description: {
            vi: "Sử dụng mã redeem để nhận thưởng hoặc kích hoạt nhóm",
            en: "Use redeem codes to get rewards or activate groups"
        },
        category: "system",
        guide: {
            vi: "   {pn} <mã code>: Sử dụng mã redeem\n" +
                "   {pn} create <loại> <giá trị> [ghi chú]: Tạo mã redeem (Admin)\n" +
                "   {pn} list: Xem danh sách mã redeem (Admin)\n" +
                "   {pn} stats: Thống kê mã redeem (Admin)",
            en: "   {pn} <code>: Use redeem code\n" +
                "   {pn} create <type> <value> [notes]: Create redeem code (Admin)\n" +
                "   {pn} list: View redeem code list (Admin)\n" +
                "   {pn} stats: Redeem code statistics (Admin)"
        }
    },

    langs: {
        vi: {
            invalidCode: "❌ Mã redeem không hợp lệ\nFormat đúng: BOT-XXXXXXXX",
            missingCode: "❌ Vui lòng nhập mã redeem\nVí dụ: %1redeem BOT-ABC12345",
            redeemSuccess: "🎉 SỬ DỤNG MÃ REDEEM THÀNH CÔNG!\n\n%1",
            redeemFailed: "❌ Sử dụng mã redeem thất bại\n%1",
            onlyAdmin: "❌ Chỉ admin bot mới có thể sử dụng lệnh này",
            createUsage: "📝 Cách tạo mã redeem:\n" +
                "• {pn} create DAYS <số ngày> [ghi chú]\n" +
                "• {pn} create PERMANENT 0 [ghi chú]\n" +
                "• {pn} create MONEY <số tiền> [ghi chú]\n" +
                "\nVí dụ:\n" +
                "• {pn} create DAYS 30 Event tháng 12\n" +
                "• {pn} create PERMANENT 0 Gift VIP\n" +
                "• {pn} create MONEY 10000 Thưởng hoạt động",
            invalidType: "❌ Loại mã không hợp lệ. Chỉ hỗ trợ: DAYS, PERMANENT, MONEY",
            invalidValue: "❌ Giá trị không hợp lệ. Phải là số > 0 (trừ PERMANENT = 0)",
            createSuccess: "✅ Tạo mã redeem thành công!\n\n" +
                "🎁 Mã: `%1`\n" +
                "📦 Loại: %2\n" +
                "💎 Giá trị: %3\n" +
                "📝 Ghi chú: %4",
            createError: "❌ Lỗi khi tạo mã redeem: %1",
            noCodesFound: "📜 Chưa có mã redeem nào được tạo",
            codesList: "📜 DANH SÁCH MÃ REDEEM\n" +
                "Trang %1/%2 (Tổng: %3)\n\n%4",
            codeItem: "🎁 `%1`\n" +
                "   📦 %2: %3\n" +
                "   📅 %4\n" +
                "   %5\n\n",
            statsTitle: "📊 THỐNG KÊ MÃ REDEEM\n\n",
            statsTotal: "📊 Tổng: %1 mã\n",
            statsUsed: "✅ Đã dùng: %1 mã\n",
            statsUnused: "⏳ Chưa dùng: %1 mã\n",
            statsExpired: "⏰ Hết hạn: %1 mã\n\n",
            statsByType: "📈 Theo loại:\n%1",
            typeStats: "• %1: %2 total (%3 used, %4 unused)\n"
        },
        en: {
            invalidCode: "❌ Invalid redeem code format\nCorrect format: BOT-XXXXXXXX",
            missingCode: "❌ Please enter redeem code\nExample: %1redeem BOT-ABC12345",
            redeemSuccess: "🎉 REDEEM CODE USED SUCCESSFULLY!\n\n%1",
            redeemFailed: "❌ Failed to use redeem code\n%1",
            onlyAdmin: "❌ Only bot admins can use this command",
            createUsage: "📝 How to create redeem codes:\n" +
                "• {pn} create DAYS <days> [notes]\n" +
                "• {pn} create PERMANENT 0 [notes]\n" +
                "• {pn} create MONEY <amount> [notes]\n" +
                "\nExamples:\n" +
                "• {pn} create DAYS 30 December event\n" +
                "• {pn} create PERMANENT 0 VIP gift\n" +
                "• {pn} create MONEY 10000 Activity reward",
            invalidType: "❌ Invalid type. Only supports: DAYS, PERMANENT, MONEY",
            invalidValue: "❌ Invalid value. Must be number > 0 (except PERMANENT = 0)",
            createSuccess: "✅ Redeem code created successfully!\n\n" +
                "🎁 Code: `%1`\n" +
                "📦 Type: %2\n" +
                "💎 Value: %3\n" +
                "📝 Notes: %4",
            createError: "❌ Error creating redeem code: %1",
            noCodesFound: "📜 No redeem codes found",
            codesList: "📜 REDEEM CODES LIST\n" +
                "Page %1/%2 (Total: %3)\n\n%4",
            codeItem: "🎁 `%1`\n" +
                "   📦 %2: %3\n" +
                "   📅 %4\n" +
                "   %5\n\n",
            statsTitle: "📊 REDEEM CODE STATISTICS\n\n",
            statsTotal: "📊 Total: %1 codes\n",
            statsUsed: "✅ Used: %1 codes\n",
            statsUnused: "⏳ Unused: %1 codes\n",
            statsExpired: "⏰ Expired: %1 codes\n\n",
            statsByType: "📈 By type:\n%1",
            typeStats: "• %1: %2 total (%3 used, %4 unused)\n"
        }
    },

    onStart: async function ({ message, args, event, getLang, role }) {
        const { threadID, senderID } = event;
        const redeemManager = new RedeemManager();

        if (!args[0]) {
            return message.reply(getLang("missingCode", global.utils.getPrefix(threadID)));
        }

        const subCommand = args[0].toLowerCase();

        try {
            switch (subCommand) {
                case "create":
                    await this.handleCreate(message, args, getLang, role, redeemManager);
                    break;

                case "list":
                case "danh-sach":
                    await this.handleList(message, args, getLang, role, redeemManager);
                    break;

                case "stats":
                case "thong-ke":
                    await this.handleStats(message, getLang, role, redeemManager);
                    break;

                default:
                    // Sử dụng mã redeem
                    await this.handleUse(message, args[0], threadID, senderID, getLang, redeemManager);
                    break;
            }
        } catch (error) {
            console.error("Redeem command error:", error);
            message.reply("❌ Có lỗi xảy ra, vui lòng thử lại sau");
        }
    },

    // Sử dụng mã redeem
    async handleUse(message, code, threadID, senderID, getLang, redeemManager) {
        // Validate format
        if (!redeemManager.validateRedeemCode(code)) {
            return message.reply(getLang("invalidCode"));
        }

        const result = await redeemManager.useRedeemCode(code.toUpperCase(), threadID, senderID);

        if (result.success) {
            // Thêm thông tin chi tiết vào message thành công
            let detailMessage = result.message;

            if (result.activationResult && result.activationResult.expiresAt) {
                const moment = require('moment-timezone');
                const expiryDate = moment(result.activationResult.expiresAt).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm');
                detailMessage += `\n⏰ Hết hạn: ${expiryDate}`;
            }

            if (result.activationResult && result.activationResult.isPermanent) {
                detailMessage += `\n👑 Kích hoạt vĩnh viễn - không giới hạn thời gian!`;
            }

            message.reply(getLang("redeemSuccess", detailMessage));
        } else {
            message.reply(getLang("redeemFailed", result.message));
        }
    },

    // Tạo mã redeem (Admin only)
    async handleCreate(message, args, getLang, role, redeemManager) {
        if (role < 2) {
            return message.reply(getLang("onlyAdmin"));
        }

        if (args.length < 3) {
            return message.reply(getLang("createUsage"));
        }

        const rewardType = args[1].toUpperCase();
        const rewardValue = parseInt(args[2]);
        const notes = args.slice(3).join(' ') || 'Không có ghi chú';

        // Validate type
        if (!['DAYS', 'PERMANENT', 'MONEY'].includes(rewardType)) {
            return message.reply(getLang("invalidType"));
        }

        // Validate value
        if (rewardType !== 'PERMANENT' && (isNaN(rewardValue) || rewardValue <= 0)) {
            return message.reply(getLang("invalidValue"));
        }

        if (rewardType === 'PERMANENT' && rewardValue !== 0) {
            return message.reply(getLang("invalidValue"));
        }

        try {
            const codes = await redeemManager.createRedeemCode({
                rewardType: rewardType,
                rewardValue: rewardType === 'PERMANENT' ? 0 : rewardValue,
                notes: notes,
                quantity: 1
            });

            let valueText = '';
            switch (rewardType) {
                case 'DAYS':
                    valueText = `${rewardValue} ngày`;
                    break;
                case 'PERMANENT':
                    valueText = 'Vĩnh viễn';
                    break;
                case 'MONEY':
                    valueText = `${rewardValue.toLocaleString()}đ`;
                    break;
            }

            message.reply(getLang("createSuccess", codes[0], rewardType, valueText, notes));

        } catch (error) {
            console.error('Create redeem error:', error);
            message.reply(getLang("createError", error.message));
        }
    },

    // Danh sách mã redeem (Admin only)
    async handleList(message, args, getLang, role, redeemManager) {
        if (role < 2) {
            return message.reply(getLang("onlyAdmin"));
        }

        const page = parseInt(args[1]) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        try {
            const result = await redeemManager.getRedeemCodes({
                limit: limit,
                offset: offset,
                onlyUnused: false
            });

            if (result.total === 0) {
                return message.reply(getLang("noCodesFound"));
            }

            const totalPages = Math.ceil(result.total / limit);
            let codesList = "";
            const moment = require('moment-timezone');

            for (const code of result.codes) {
                let valueText = '';
                switch (code.rewardType) {
                    case 'DAYS':
                        valueText = `${code.rewardValue} ngày`;
                        break;
                    case 'PERMANENT':
                        valueText = 'Vĩnh viễn';
                        break;
                    case 'MONEY':
                        valueText = `${code.rewardValue.toLocaleString()}đ`;
                        break;
                }

                const createdDate = moment(code.createdAt).tz('Asia/Ho_Chi_Minh').format('DD/MM/YY');
                const status = code.usedByThreadID ? '✅ Đã dùng' :
                    code.expiresAt && moment().isAfter(moment(code.expiresAt)) ? '⏰ Hết hạn' : '⏳ Chưa dùng';

                codesList += getLang("codeItem",
                    code.code,
                    code.rewardType,
                    valueText,
                    createdDate,
                    status
                );
            }

            message.reply(getLang("codesList", page, totalPages, result.total, codesList));

        } catch (error) {
            console.error('List redeem error:', error);
            message.reply("❌ Có lỗi khi lấy danh sách mã redeem");
        }
    },

    // Thống kê mã redeem (Admin only)  
    async handleStats(message, getLang, role, redeemManager) {
        if (role < 2) {
            return message.reply(getLang("onlyAdmin"));
        }

        try {
            const stats = await redeemManager.getRedeemStats();

            let statsText = getLang("statsTitle");
            statsText += getLang("statsTotal", stats.total);
            statsText += getLang("statsUsed", stats.used);
            statsText += getLang("statsUnused", stats.unused);
            statsText += getLang("statsExpired", stats.expired);

            // Thống kê theo loại
            let byTypeText = "";
            for (const [type, data] of Object.entries(stats.byType)) {
                byTypeText += getLang("typeStats", type, data.total, data.used, data.unused);
            }

            if (byTypeText) {
                statsText += getLang("statsByType", byTypeText);
            }

            message.reply(statsText);

        } catch (error) {
            console.error('Stats redeem error:', error);
            message.reply("❌ Có lỗi khi lấy thống kê mã redeem");
        }
    }
};