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