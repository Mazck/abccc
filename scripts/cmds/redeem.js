const RedeemManager = require('../../bot/handler/redeemManager.js');

module.exports = {
    config: {
        name: "redeem",
        aliases: ["code", "giftcode"],
        version: "2.1",
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
                "   {pn} list: Xem danh sách mã redeem (Admin)",
            en: "   {pn} <code>: Use redeem code\n" +
                "   {pn} create <type> <value> [notes]: Create redeem code (Admin)\n" +
                "   {pn} list: View redeem code list (Admin)"
        }
    },

    onStart: async function ({ message, args, event, getLang, role, threadsData, usersData }) {
        const { threadID, senderID } = event;
        const redeemManager = new RedeemManager();

        if (!args[0]) {
            return message.reply("❌ Vui lòng nhập mã redeem\nVí dụ: " + global.utils.getPrefix(threadID) + "redeem BOT-ABC12345");
        }

        const subCommand = args[0].toLowerCase();

        try {
            switch (subCommand) {
                case "create":
                    await this.handleCreate(message, args, role, redeemManager);
                    break;
                case "list":
                    await this.handleList(message, args, role, redeemManager);
                    break;
                default:
                    await this.handleUse(message, args[0], threadID, senderID, redeemManager, threadsData, usersData);
                    break;
            }
        } catch (error) {
            console.error("Redeem command error:", error);
            message.reply("❌ Có lỗi xảy ra, vui lòng thử lại sau");
        }
    },

    // Sử dụng mã redeem với tích hợp database
    async handleUse(message, code, threadID, senderID, redeemManager, threadsData, usersData) {
        if (!redeemManager.validateRedeemCode(code)) {
            return message.reply("❌ Mã redeem không hợp lệ\nFormat đúng: BOT-XXXXXXXX");
        }

        try {
            // Sử dụng mã redeem
            const result = await redeemManager.useRedeemCode(code.toUpperCase(), threadID, senderID);

            if (result.success) {
                let successMessage = result.message;

                // Xử lý kích hoạt nhóm
                if (result.activationResult) {
                    if (result.activationResult.isPermanent) {
                        successMessage += `\n👑 Nhóm đã được kích hoạt VĨNH VIỄN!`;
                    } else if (result.activationResult.expiresAt) {
                        const moment = require('moment-timezone');
                        const expiryDate = moment(result.activationResult.expiresAt).format('DD/MM/YYYY HH:mm');
                        successMessage += `\n⏰ Nhóm kích hoạt đến: ${expiryDate}`;
                    }
                }

                // Xử lý thêm tiền
                if (result.rewardType === 'MONEY' && result.rewardValue > 0) {
                    await usersData.addMoney(senderID, result.rewardValue);
                    successMessage += `\n💰 Đã thêm ${result.rewardValue.toLocaleString()}đ vào tài khoản`;
                }

                return message.reply("🎉 SỬ DỤNG MÃ REDEEM THÀNH CÔNG!\n\n" + successMessage);
            } else {
                return message.reply("❌ " + result.message);
            }

        } catch (error) {
            console.error('Redeem use error:', error);
            message.reply("❌ Có lỗi khi sử dụng mã redeem: " + error.message);
        }
    },

    // Tạo mã redeem (Admin only)
    async handleCreate(message, args, role, redeemManager) {
        if (role < 2) {
            return message.reply("❌ Chỉ admin bot mới có thể tạo mã redeem");
        }

        if (args.length < 3) {
            return message.reply(
                "📝 Cách tạo mã redeem:\n" +
                "• redeem create DAYS <số ngày> [ghi chú]\n" +
                "• redeem create PERMANENT 0 [ghi chú]\n" +
                "• redeem create MONEY <số tiền> [ghi chú]\n\n" +
                "Ví dụ:\n" +
                "• redeem create DAYS 30 Event tháng 12\n" +
                "• redeem create PERMANENT 0 Gift VIP"
            );
        }

        const rewardType = args[1].toUpperCase();
        const rewardValue = parseInt(args[2]);
        const notes = args.slice(3).join(' ') || 'Không có ghi chú';

        if (!['DAYS', 'PERMANENT', 'MONEY'].includes(rewardType)) {
            return message.reply("❌ Loại mã không hợp lệ. Chỉ hỗ trợ: DAYS, PERMANENT, MONEY");
        }

        if (rewardType !== 'PERMANENT' && (isNaN(rewardValue) || rewardValue <= 0)) {
            return message.reply("❌ Giá trị không hợp lệ. Phải là số > 0 (trừ PERMANENT = 0)");
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

            message.reply(
                `✅ Tạo mã redeem thành công!\n\n` +
                `🎁 Mã: \`${codes[0]}\`\n` +
                `📦 Loại: ${rewardType}\n` +
                `💎 Giá trị: ${valueText}\n` +
                `📝 Ghi chú: ${notes}`
            );

        } catch (error) {
            console.error('Create redeem error:', error);
            message.reply("❌ Lỗi khi tạo mã redeem: " + error.message);
        }
    }
};