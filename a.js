// ===== 1. CẬP NHẬT CONFIG.JSON =====
// Thêm vào config.json
{
    "payos": {
        "enable": true,
            "clientId": "YOUR_PAYOS_CLIENT_ID",
                "apiKey": "YOUR_PAYOS_API_KEY",
                    "checksumKey": "YOUR_PAYOS_CHECKSUM_KEY",
                        "webhookUrl": "https://your-domain.com", // URL webhook của bạn
                            "cancelUrl": "https://your-domain.com/payment-cancel",
                                "returnUrl": "https://your-domain.com/payment-success",
                                    "package": {
            "basic": {
                "name": "Gói Cơ Bản",
                    "price": 50000,
                        "days": 30,
                            "description": "Gói cơ bản 1 tháng, đầy đủ tính năng"
            },
            "premium": {
                "name": "Gói Premium",
                    "price": 100000,
                        "days": 60,
                            "description": "Gói premium 2 tháng, ưu tiên hỗ trợ"
            },
            "vip": {
                "name": "Gói VIP",
                    "price": 200000,
                        "days": 90,
                            "description": "Gói VIP 3 tháng, tính năng độc quyền"
            }
        }
    },
    "freeTrialDays": 3,
        "adminBot": ["YOUR_ADMIN_USER_ID"]
}

// ===== 2. KHỞI TẠO HỆ THỐNG TRONG GOAT.JS =====
// Thêm vào cuối file Goat.js (trước dòng cuối)
const PaymentIntegration = require('./bot/handler/paymentIntegration.js');

// Khởi tạo hệ thống thanh toán
(async () => {
    if (global.GoatBot.config.payos?.enable) {
        try {
            global.paymentSystem = new PaymentIntegration();
            await global.paymentSystem.initialize();
            console.log('✅ Payment system initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize payment system:', error);
        }
    }
})();

// ===== 3. MIDDLEWARE KIỂM TRA QUYỀN TRUY CẬP =====
// Cập nhật bot/handler/handlerEvents.js - thêm vào đầu hàm onStart()
async function checkGroupAccess(threadID, senderID) {
    try {
        const { threadsData } = global.db;
        const config = global.GoatBot.config;

        // Admin bot luôn có quyền truy cập
        if (config.adminBot && config.adminBot.includes(senderID)) {
            return { allowed: true };
        }

        const threadData = await threadsData.get(threadID);
        const groupStatus = threadData.data?.status;
        const expiresAt = threadData.data?.expiresAt;
        const isPermanent = threadData.data?.isPermanent;
        const createdAt = threadData.createdAt;

        // Kiểm tra thời gian dùng thử miễn phí
        const moment = require('moment-timezone');
        const now = moment();
        const created = moment(createdAt);
        const freeTrialDays = config.freeTrialDays || 3;
        const freeTrialExpires = created.add(freeTrialDays, 'days');

        // Nếu trong thời gian dùng thử và chưa hết hạn
        if (now.isBefore(freeTrialExpires) && (!groupStatus || groupStatus !== 'active')) {
            return { allowed: true, isTrial: true };
        }

        // Kiểm tra trạng thái nhóm đã kích hoạt
        if (!groupStatus || groupStatus !== 'active') {
            return {
                allowed: false,
                message: await generateActivationMessage(threadID, threadData)
            };
        }

        // Kiểm tra hết hạn (trừ permanent)
        if (!isPermanent && expiresAt) {
            const expiry = moment(expiresAt);
            if (now.isAfter(expiry)) {
                // Cập nhật trạng thái hết hạn
                await threadsData.set(threadID, {
                    status: 'expired',
                    expiredAt: new Date().toISOString()
                }, 'data');

                return {
                    allowed: false,
                    message: await generateActivationMessage(threadID, threadData, true)
                };
            }
        }

        return { allowed: true };

    } catch (error) {
        console.error('Error checking group access:', error);
        return { allowed: true }; // Cho phép sử dụng nếu có lỗi
    }
}

async function generateActivationMessage(threadID, threadData, isExpired = false) {
    const config = global.GoatBot.config.payos;
    const prefix = global.utils.getPrefix(threadID);

    if (!config || !config.enable) {
        return "❌ Hệ thống thanh toán chưa được cấu hình";
    }

    const packages = Object.entries(config.package);
    const renewalCount = threadData.data?.renewalCount || 0;

    let message = isExpired ?
        `❌ NHÓM ĐÃ HẾT HẠN\n\n` :
        `🔒 NHÓM CHƯA ĐƯỢC KÍCH HOẠT\n\n`;

    message += `📦 CÁC GÓI DỊCH VỤ HIỆN CÓ:\n\n`;

    packages.forEach(([key, pkg], index) => {
        const discount = renewalCount > 0 ? calculateRenewalDiscount(renewalCount) : 0;
        const finalPrice = pkg.price * (1 - discount / 100);

        message += `${index + 1}. ${pkg.name}\n`;
        message += `   💰 Giá: ${pkg.price.toLocaleString()}đ`;
        if (discount > 0) {
            message += ` → ${finalPrice.toLocaleString()}đ (giảm ${discount}%)`;
        }
        message += `\n   ⏰ Thời hạn: ${pkg.days} ngày\n`;
        message += `   📝 ${pkg.description}\n`;
        message += `   💳 Mua: ${prefix}payment buy ${key}\n\n`;
    });

    message += `🎁 Hoặc sử dụng mã redeem: ${prefix}redeem <mã>\n`;
    message += `📞 Liên hệ admin để được hỗ trợ!`;

    return message;
}

function calculateRenewalDiscount(renewalCount) {
    const baseDiscount = 5;
    const incrementDiscount = 2;
    const maxDiscount = 20;
    return Math.min(baseDiscount + (renewalCount * incrementDiscount), maxDiscount);
}

// ===== 4. CẬP NHẬT HANDLER EVENTS ĐỂ KIỂM TRA QUYỀN =====
// Trong bot/handler/handlerEvents.js, cập nhật hàm onStart() 
async function onStart() {
    // Kiểm tra quyền truy cập trước khi xử lý lệnh
    if (!body || !body.startsWith(prefix))
        return;

    const args = body.slice(prefix.length).trim().split(/ +/);
    let commandName = args.shift().toLowerCase();
    let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));

    // Các lệnh được phép sử dụng mà không cần kích hoạt
    const allowedCommands = ['payment', 'pay', 'thanhtoan', 'redeem', 'code', 'giftcode', 'help', 'info'];

    if (command && !allowedCommands.includes(commandName)) {
        const accessCheck = await checkGroupAccess(threadID, senderID);
        if (!accessCheck.allowed) {
            return await message.reply(accessCheck.message);
        }

        // Thông báo nếu đang trong thời gian dùng thử
        if (accessCheck.isTrial) {
            const moment = require('moment-timezone');
            const threadData = await threadsData.get(threadID);
            const created = moment(threadData.createdAt);
            const freeTrialExpires = created.add(global.GoatBot.config.freeTrialDays || 3, 'days');
            const daysLeft = freeTrialExpires.diff(moment(), 'days');

            if (daysLeft <= 1) {
                await message.reply(`⚠️ THÔNG BÁO: Thời gian dùng thử còn ${daysLeft} ngày. Sử dụng "${prefix}payment" để kích hoạt vĩnh viễn!`);
            }
        }
    }

    // Tiếp tục xử lý lệnh như bình thường...
    // [Phần code xử lý lệnh hiện tại]
}

// ===== 5. CẬP NHẬT WEBHOOK HANDLER =====
// Cập nhật bot/handler/webhook/paymentWebhook.js
const express = require('express');
const PaymentHandler = require('../paymentHandler.js');

class PaymentWebhookServer {
    constructor() {
        this.app = express();
        this.paymentHandler = new PaymentHandler();
        this.server = null;
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupRoutes() {
        // PayOS webhook endpoint
        this.app.post('/payos-webhook', async (req, res) => {
            try {
                console.log('🔔 PayOS Webhook received:', JSON.stringify(req.body, null, 2));

                const webhookData = req.body;
                const { orderCode, code, desc, data } = webhookData;

                if (code === '00') {
                    // Thanh toán thành công
                    await this.processSuccessfulPayment(orderCode, data);

                    // Gửi thông báo đến nhóm
                    await this.sendSuccessNotification(orderCode);
                } else {
                    // Thanh toán thất bại
                    await this.processFailedPayment(orderCode, desc);
                }

                res.json({
                    success: true,
                    message: 'Webhook processed successfully'
                });

            } catch (error) {
                console.error('❌ PayOS Webhook error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Webhook processing failed',
                    error: error.message
                });
            }
        });
    }

    async processSuccessfulPayment(orderCode, paymentData) {
        try {
            const { paymentData: paymentController, threadsData } = global.db;

            // Tìm thông tin thanh toán
            const payment = await paymentController.findByTransactionId(orderCode.toString());
            if (!payment) {
                console.error('Payment not found:', orderCode);
                return;
            }

            // Cập nhật trạng thái thanh toán
            await paymentController.updatePaymentStatus(
                orderCode.toString(),
                'PAID',
                new Date().toISOString(),
                paymentData
            );

            // Kích hoạt nhóm
            const packageInfo = global.GoatBot.config.payos.package[payment.packageType || 'basic'];
            if (packageInfo) {
                const moment = require('moment-timezone');
                const expiresAt = moment().add(packageInfo.days, 'days').toISOString();

                await threadsData.set(payment.threadID, {
                    status: 'active',
                    activatedAt: new Date().toISOString(),
                    expiresAt: expiresAt,
                    packageType: payment.packageType,
                    renewalCount: (await threadsData.get(payment.threadID, 'data.renewalCount', 0)) + 1
                }, 'data');

                console.log(`✅ Activated group ${payment.threadID} with package ${payment.packageType}`);
            }

        } catch (error) {
            console.error('Error processing successful payment:', error);
        }
    }

    async sendSuccessNotification(orderCode) {
        try {
            const api = global.GoatBot.fcaApi;
            if (!api) return;

            const { paymentData: paymentController } = global.db;
            const payment = await paymentController.findByTransactionId(orderCode.toString());
            if (!payment) return;

            const packageInfo = global.GoatBot.config.payos.package[payment.packageType || 'basic'];
            const moment = require('moment-timezone');

            const message = `🎉 THANH TOÁN THÀNH CÔNG!\n\n` +
                `✅ Nhóm đã được kích hoạt thành công!\n` +
                `📦 Gói: ${packageInfo?.name || 'Không xác định'}\n` +
                `💰 Số tiền: ${payment.amount.toLocaleString()}đ\n` +
                `⏰ Thời hạn: ${packageInfo?.days || 0} ngày\n` +
                `📅 Hết hạn: ${moment().add(packageInfo?.days || 0, 'days').format('DD/MM/YYYY HH:mm')}\n\n` +
                `🎯 Cảm ơn bạn đã sử dụng dịch vụ!\n` +
                `🤖 Bot giờ đã hoạt động đầy đủ trong nhóm này.`;

            await api.sendMessage(message, payment.threadID);

        } catch (error) {
            console.error('Error sending success notification:', error);
        }
    }
}

// ===== 6. CẬP NHẬT REDEEM COMMAND =====
// Cập nhật scripts/cmds/redeem.js để tích hợp với database
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

// ===== 7. CẬP NHẬT PAYMENT COMMAND =====
// Cập nhật scripts/cmds/payment.js để tích hợp hoàn chỉnh
const PaymentHandler = require('../../bot/handler/paymentHandler.js');
const fs = require('fs');

module.exports = {
    config: {
        name: "payment",
        aliases: ["pay", "thanhtoan"],
        version: "2.1",
        author: "ABC Bot",
        countDown: 10,
        role: 0,
        description: {
            vi: "Quản lý thanh toán và kích hoạt bot cho nhóm",
            en: "Manage payment and bot activation for groups"
        },
        category: "system"
    },

    onStart: async function ({ message, args, event, threadsData, role }) {
        const { threadID, senderID } = event;
        const paymentHandler = new PaymentHandler();
        const subCommand = args[0]?.toLowerCase();

        try {
            switch (subCommand) {
                case "info":
                case "status":
                    await this.handleInfo(message, threadID, threadsData);
                    break;
                case "packages":
                case "pkg":
                    await this.handlePackages(message);
                    break;
                case "buy":
                    if (role < 1) {
                        return message.reply("❌ Chỉ admin nhóm mới có thể mua gói dịch vụ");
                    }
                    await this.handleBuy(message, args, threadID, senderID, threadsData, paymentHandler);
                    break;
                case "admin":
                    if (role < 2) {
                        return message.reply("❌ Chỉ admin bot mới có thể sử dụng lệnh này");
                    }
                    await this.handleAdmin(message, args, threadID, threadsData);
                    break;
                default:
                    await this.handleInfo(message, threadID, threadsData);
                    break;
            }
        } catch (error) {
            console.error("Payment command error:", error);
            message.reply("❌ Có lỗi xảy ra, vui lòng thử lại sau");
        }
    },

    // Thông tin trạng thái nhóm
    async handleInfo(message, threadID, threadsData) {
        const threadData = await threadsData.get(threadID);
        const moment = require('moment-timezone');
        const created = moment(threadData.createdAt);
        const now = moment();
        const freeTrialDays = global.GoatBot.config.freeTrialDays || 3;
        const freeTrialExpires = created.clone().add(freeTrialDays, 'days');

        let statusText = "⚪ Chưa kích hoạt";
        let expiryText = "Không có";
        let packageText = "Chưa có gói";

        const status = threadData.data?.status;
        const expiresAt = threadData.data?.expiresAt;
        const isPermanent = threadData.data?.isPermanent;
        const packageType = threadData.data?.packageType;

        // Kiểm tra thời gian dùng thử
        if (now.isBefore(freeTrialExpires) && (!status || status !== 'active')) {
            const trialDaysLeft = freeTrialExpires.diff(now, 'days');
            statusText = `🟡 Đang dùng thử (${trialDaysLeft} ngày còn lại)`;
            expiryText = freeTrialExpires.format('DD/MM/YYYY HH:mm');
        } else if (status === 'active') {
            if (isPermanent) {
                statusText = "🟢 Đang hoạt động (Vĩnh viễn)";
                expiryText = "Vĩnh viễn";
            } else {
                statusText = "🟢 Đang hoạt động";
                expiryText = moment(expiresAt).format('DD/MM/YYYY HH:mm');
            }

            if (packageType) {
                const packageInfo = global.GoatBot.config.payos.package[packageType];
                packageText = packageInfo ? packageInfo.name : packageType;
            }
        } else if (status === 'expired') {
            statusText = "🔴 Đã hết hạn";
            expiryText = moment(expiresAt).format('DD/MM/YYYY HH:mm');
        }

        const renewalCount = threadData.data?.renewalCount || 0;
        const discount = renewalCount > 0 ? this.calculateRenewalDiscount(renewalCount) : 0;

        const infoMessage =
            `📊 THÔNG TIN NHÓM\n\n` +
            `🏷️ Trạng thái: ${statusText}\n` +
            `📦 Gói hiện tại: ${packageText}\n` +
            `⏰ Hết hạn: ${expiryText}\n` +
            `🔄 Số lần gia hạn: ${renewalCount}\n` +
            `💎 Giảm giá gia hạn: ${discount}%\n\n` +
            `📅 Nhóm tạo: ${created.format('DD/MM/YYYY HH:mm')}\n` +
            `💳 Sử dụng "payment packages" để xem gói dịch vụ`;

        message.reply(infoMessage);
    },

    // Danh sách gói dịch vụ
    async handlePackages(message) {
        const packages = global.GoatBot.config.payos.package;
        if (!packages) {
            return message.reply("❌ Chưa cấu hình gói dịch vụ");
        }

        let packageText = "📦 DANH SÁCH GÓI DỊCH VỤ\n\n";
        let index = 1;

        for (const [key, pkg] of Object.entries(packages)) {
            packageText += `${index}. ${pkg.name}\n`;
            packageText += `   💰 Giá: ${pkg.price.toLocaleString()}đ\n`;
            packageText += `   ⏱️ Thời hạn: ${pkg.days} ngày\n`;
            packageText += `   📝 ${pkg.description}\n`;
            packageText += `   💳 Mua: payment buy ${key}\n\n`;
            index++;
        }

        packageText += `🎁 Hoặc sử dụng mã redeem: redeem <mã>`;

        message.reply(packageText);
    },

    // Mua gói dịch vụ
    async handleBuy(message, args, threadID, senderID, threadsData, paymentHandler) {
        const packageName = args[1]?.toLowerCase();
        if (!packageName) {
            return this.handlePackages(message);
        }

        const packages = global.GoatBot.config.payos.package;
        const selectedPackage = packages[packageName];

        if (!selectedPackage) {
            return message.reply(`❌ Gói "${packageName}" không tồn tại. Sử dụng "payment packages" để xem danh sách`);
        }

        try {
            // Tính giảm giá
            const threadData = await threadsData.get(threadID);
            const renewalCount = threadData.data?.renewalCount || 0;
            const discountPercent = renewalCount > 0 ? this.calculateRenewalDiscount(renewalCount) : 0;

            // Tạo thanh toán
            const orderCode = paymentHandler.generateOrderCode();
            const paymentInfo = {
                orderCode: orderCode,
                amount: selectedPackage.price,
                description: `Thanh toán ${selectedPackage.name} - Group ${threadID}`,
                threadID: threadID,
                userID: senderID,
                packageType: packageName,
                discountPercent: discountPercent
            };

            const paymentResult = await paymentHandler.createPaymentLink(paymentInfo);

            // Lưu vào database
            const { paymentData } = global.db;
            await paymentData.create({
                transactionId: orderCode.toString(),
                threadID: threadID,
                amount: paymentResult.amount,
                status: 'PENDING',
                paymentLinkId: paymentResult.paymentLinkId,
                description: paymentInfo.description,
                packageType: packageName
            });

            // Tạo QR code
            let attachment = null;
            if (paymentResult.qrCode) {
                try {
                    const { filePath } = await paymentHandler.createVietQRFromRaw(
                        paymentResult.qrCode,
                        `qr_${orderCode}.png`
                    );
                    attachment = fs.createReadStream(filePath);
                } catch (qrError) {
                    console.error('QR creation error:', qrError);
                }
            }

            const replyText =
                `💳 ĐÃ TẠO THANH TOÁN\n\n` +
                `📦 Gói: ${selectedPackage.name}\n` +
                `💰 Giá gốc: ${selectedPackage.price.toLocaleString()}đ\n` +
                (discountPercent > 0 ? `🎁 Giảm giá: ${paymentResult.discountAmount.toLocaleString()}đ (${discountPercent}%)\n` : '') +
                `💵 Thành tiền: ${paymentResult.amount.toLocaleString()}đ\n` +
                `⏰ Link có hiệu lực: 30 phút\n\n` +
                `🔗 Link thanh toán: ${paymentResult.checkoutUrl}\n\n` +
                `Hoặc quét mã QR đính kèm 👆`;

            const messageData = { body: replyText };
            if (attachment) {
                messageData.attachment = attachment;
            }

            message.reply(messageData);

        } catch (error) {
            console.error('Payment creation error:', error);
            message.reply("❌ Có lỗi khi tạo thanh toán: " + error.message);
        }
    },

    // Admin commands
    async handleAdmin(message, args, threadID, threadsData) {
        const subCmd = args[1]?.toLowerCase();

        switch (subCmd) {
            case "activate":
                const days = parseInt(args[2]) || 30;
                const moment = require('moment-timezone');
                const expiresAt = days > 0 ? moment().add(days, 'days').toISOString() : null;

                await threadsData.set(threadID, {
                    status: 'active',
                    activatedAt: new Date().toISOString(),
                    expiresAt: expiresAt,
                    packageType: 'admin',
                    manualActivation: true,
                    isPermanent: days === 0
                }, 'data');

                message.reply(`✅ Đã kích hoạt nhóm thành công!\n${days > 0 ? `⏰ Thời hạn: ${days} ngày` : '👑 Kích hoạt vĩnh viễn'}`);
                break;

            case "deactivate":
                await threadsData.set(threadID, {
                    status: 'expired',
                    expiredAt: new Date().toISOString()
                }, 'data');

                message.reply("❌ Đã hủy kích hoạt nhóm");
                break;

            default:
                message.reply(
                    "🔧 ADMIN COMMANDS:\n\n" +
                    "• payment admin activate [ngày] - Kích hoạt nhóm\n" +
                    "• payment admin activate 0 - Kích hoạt vĩnh viễn\n" +
                    "• payment admin deactivate - Hủy kích hoạt"
                );
        }
    },

    calculateRenewalDiscount(renewalCount) {
        const baseDiscount = 5;
        const incrementDiscount = 2;
        const maxDiscount = 20;
        return Math.min(baseDiscount + (renewalCount * incrementDiscount), maxDiscount);
    }
};

console.log("Hệ thống PayOS và Redeem đã được cài đặt hoàn chỉnh!");
console.log("Cấu hình cần thiết:");
console.log("1. Cập nhật config.json với thông tin PayOS");
console.log("2. Thiết lập webhook URL");
console.log("3. Khởi động lại bot");