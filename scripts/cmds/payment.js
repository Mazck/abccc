const PaymentHandler = require('../../bot/handler/paymentHandler.js');
const fs = require('fs');

module.exports = {
    config: {
        name: "payment",
        aliases: ["pay", "thanhtoan"],
        version: "2.0",
        author: "ABC Bot",
        countDown: 10,
        role: 0,
        description: {
            vi: "Quản lý thanh toán và kích hoạt bot cho nhóm",
            en: "Manage payment and bot activation for groups"
        },
        category: "system",
        guide: {
            vi: "   {pn} info: Xem thông tin gói và trạng thái nhóm\n" +
                "   {pn} buy <tên gói>: Mua gói dịch vụ\n" +
                "   {pn} renew: Gia hạn dịch vụ hiện tại\n" +
                "   {pn} packages: Xem danh sách các gói\n" +
                "   {pn} history: Xem lịch sử thanh toán",
            en: "   {pn} info: View package info and group status\n" +
                "   {pn} buy <package>: Buy service package\n" +
                "   {pn} renew: Renew current service\n" +
                "   {pn} packages: View available packages\n" +
                "   {pn} history: View payment history"
        }
    },

    langs: {
        vi: {
            noPermission: "❌ Chỉ admin nhóm mới có thể sử dụng lệnh này",
            groupInfo: "📊 THÔNG TIN NHÓM\n\n" +
                "🏷️ Trạng thái: %1\n" +
                "📦 Gói hiện tại: %2\n" +
                "⏰ Hết hạn: %3\n" +
                "🔄 Số lần gia hạn: %4\n" +
                "💎 Giảm giá gia hạn tiếp theo: %5%",
            groupActive: "🟢 Đang hoạt động",
            groupExpired: "🔴 Đã hết hạn",
            groupInactive: "⚪ Chưa kích hoạt",
            permanent: "Vĩnh viễn",
            packages: "📦 DANH SÁCH GÓI DỊCH VỤ\n\n%1",
            packageItem: "%1. %2\n   💰 Giá: %3đ\n   ⏱️ Thời hạn: %4 ngày\n   📝 %5\n\n",
            invalidPackage: "❌ Gói không tồn tại. Sử dụng `%1payment packages` để xem danh sách",
            paymentCreated: "💳 ĐÃ TẠO THANH TOÁN\n\n" +
                "📦 Gói: %1\n" +
                "💰 Giá gốc: %2đ\n" +
                "🎁 Giảm giá: %3đ (%4%)\n" +
                "💵 Thành tiền: %5đ\n" +
                "⏰ Link có hiệu lực: 30 phút\n\n" +
                "🔗 Link thanh toán: %6\n\n" +
                "Hoặc quét mã QR đính kèm 👆",
            paymentError: "❌ Có lỗi khi tạo thanh toán: %1",
            noHistory: "📜 Nhóm chưa có lịch sử thanh toán nào",
            history: "📜 LỊCH SỬ THANH TOÁN\n\n%1",
            historyItem: "🔸 %1\n   💰 %2đ - %3\n   📅 %4\n\n",
            renewSuccess: "✅ Gia hạn thành công!\n⏰ Hết hạn mới: %1",
            renewError: "❌ Lỗi khi gia hạn: %1"
        },
        en: {
            noPermission: "❌ Only group admins can use this command",
            groupInfo: "📊 GROUP INFO\n\n" +
                "🏷️ Status: %1\n" +
                "📦 Current package: %2\n" +
                "⏰ Expires: %3\n" +
                "🔄 Renewal count: %4\n" +
                "💎 Next renewal discount: %5%",
            groupActive: "🟢 Active",
            groupExpired: "🔴 Expired",
            groupInactive: "⚪ Inactive",
            permanent: "Permanent",
            packages: "📦 AVAILABLE PACKAGES\n\n%1",
            packageItem: "%1. %2\n   💰 Price: %3đ\n   ⏱️ Duration: %4 days\n   📝 %5\n\n",
            invalidPackage: "❌ Package not found. Use `%1payment packages` to view list",
            paymentCreated: "💳 PAYMENT CREATED\n\n" +
                "📦 Package: %1\n" +
                "💰 Original price: %2đ\n" +
                "🎁 Discount: %3đ (%4%)\n" +
                "💵 Final amount: %5đ\n" +
                "⏰ Link valid for: 30 minutes\n\n" +
                "🔗 Payment link: %6\n\n" +
                "Or scan the QR code attached 👆",
            paymentError: "❌ Payment creation error: %1",
            noHistory: "📜 No payment history found for this group",
            history: "📜 PAYMENT HISTORY\n\n%1",
            historyItem: "🔸 %1\n   💰 %2đ - %3\n   📅 %4\n\n",
            renewSuccess: "✅ Renewal successful!\n⏰ New expiry: %1",
            renewError: "❌ Renewal error: %1"
        }
    },

    onStart: async function ({ message, args, event, threadsData, getLang, role }) {
        const { threadID, senderID } = event;

        // Kiểm tra quyền admin nhóm (trừ lệnh info và packages)
        if (!['info', 'packages'].includes(args[0]) && role < 1) {
            return message.reply(getLang("noPermission"));
        }

        const paymentHandler = new PaymentHandler();
        const subCommand = args[0]?.toLowerCase();

        try {
            switch (subCommand) {
                case "info":
                case "status":
                    await this.handleInfo(message, threadID, threadsData, getLang);
                    break;

                case "packages":
                case "pkg":
                    await this.handlePackages(message, getLang);
                    break;

                case "buy":
                case "mua":
                    await this.handleBuy(message, args, threadID, senderID, threadsData, getLang, paymentHandler);
                    break;

                case "renew":
                case "giahan":
                    await this.handleRenew(message, threadID, senderID, threadsData, getLang, paymentHandler);
                    break;

                case "history":
                case "lichsu":
                    await this.handleHistory(message, threadID, getLang);
                    break;

                default:
                    await this.handleInfo(message, threadID, threadsData, getLang);
                    break;
            }
        } catch (error) {
            console.error("Payment command error:", error);
            message.reply("❌ Có lỗi xảy ra, vui lòng thử lại sau");
        }
    },

    // Xem thông tin nhóm
    async handleInfo(message, threadID, threadsData, getLang) {
        const threadData = await threadsData.get(threadID);
        const paymentHandler = new PaymentHandler();

        const status = threadData.data?.status || 'inactive';
        const packageType = threadData.data?.packageType || 'Chưa có';
        const expiresAt = threadData.data?.expiresAt;
        const renewalCount = threadData.data?.renewalCount || 0;
        const isPermanent = threadData.data?.isPermanent;

        let statusText = getLang("groupInactive");
        if (status === 'active') {
            statusText = isPermanent ? `${getLang("groupActive")} (${getLang("permanent")})` : getLang("groupActive");
        } else if (status === 'expired') {
            statusText = getLang("groupExpired");
        }

        let expiryText = getLang("permanent");
        if (expiresAt && !isPermanent) {
            const moment = require('moment-timezone');
            expiryText = moment(expiresAt).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm');
        }

        const renewalDiscount = paymentHandler.calculateRenewalDiscount(renewalCount);

        const infoText = getLang("groupInfo",
            statusText,
            packageType,
            expiryText,
            renewalCount,
            renewalDiscount
        );

        message.reply(infoText);
    },

    // Xem danh sách gói
    async handlePackages(message, getLang) {
        const packages = global.GoatBot.config.payos.package;
        let packageText = "";
        let index = 1;

        for (const [key, pkg] of Object.entries(packages)) {
            packageText += getLang("packageItem",
                index++,
                pkg.name,
                pkg.price.toLocaleString(),
                pkg.days,
                pkg.description
            );
        }

        message.reply(getLang("packages", packageText));
    },

    // Mua gói
    async handleBuy(message, args, threadID, senderID, threadsData, getLang, paymentHandler) {
        const packageName = args[1]?.toLowerCase();
        if (!packageName) {
            return this.handlePackages(message, getLang);
        }

        const packages = global.GoatBot.config.payos.package;
        const selectedPackage = packages[packageName];

        if (!selectedPackage) {
            return message.reply(getLang("invalidPackage", global.utils.getPrefix(threadID)));
        }

        try {
            // Tính giảm giá nếu có
            const threadData = await threadsData.get(threadID);
            const renewalCount = threadData.data?.renewalCount || 0;
            const discountPercent = paymentHandler.calculateRenewalDiscount(renewalCount);

            // Tạo thông tin thanh toán
            const orderCode = paymentHandler.generateOrderCode();
            const paymentInfo = {
                orderCode: orderCode,
                amount: selectedPackage.price,
                description: `Thanh toán ${selectedPackage.name} - Group ${threadID}`,
                threadID: threadID,
                userID: senderID,
                packageType: packageName,
                discountPercent: renewalCount > 0 ? discountPercent : 0
            };

            // Tạo link thanh toán
            const paymentResult = await paymentHandler.createPaymentLink(paymentInfo);

            // Lưu thông tin thanh toán vào database
            const { paymentData } = global.db;
            await paymentData.create({
                transactionId: orderCode.toString(),
                threadID: threadID,
                amount: paymentResult.amount,
                status: 'PENDING',
                paymentLinkId: paymentResult.paymentLinkId,
                description: paymentInfo.description,
                packageType: packageName,
                originalAmount: selectedPackage.price,
                discountAmount: paymentResult.discountAmount
            });

            // Tạo file QR tạm thời
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

            const replyText = getLang("paymentCreated",
                selectedPackage.name,
                selectedPackage.price.toLocaleString(),
                paymentResult.discountAmount.toLocaleString(),
                discountPercent,
                paymentResult.amount.toLocaleString(),
                paymentResult.checkoutUrl
            );

            const messageData = {
                body: replyText
            };

            if (attachment) {
                messageData.attachment = attachment;
            }

            message.reply(messageData);

        } catch (error) {
            console.error('Payment creation error:', error);
            message.reply(getLang("paymentError", error.message));
        }
    },

    // Gia hạn
    async handleRenew(message, threadID, senderID, threadsData, getLang, paymentHandler) {
        const threadData = await threadsData.get(threadID);

        if (!threadData.data?.packageType || threadData.data?.packageType === 'permanent') {
            return message.reply("❌ Nhóm chưa có gói để gia hạn hoặc đã là gói vĩnh viễn");
        }

        const currentPackage = global.GoatBot.config.payos.package[threadData.data.packageType];
        if (!currentPackage) {
            return message.reply("❌ Không tìm thấy thông tin gói hiện tại");
        }

        // Sử dụng logic mua với gói hiện tại
        const args = ['renew', threadData.data.packageType];
        await this.handleBuy(message, args, threadID, senderID, threadsData, getLang, paymentHandler);
    },

    // Lịch sử thanh toán
    async handleHistory(message, threadID, getLang) {
        try {
            const { paymentData } = global.db;
            const payments = await paymentData.getByThreadID(threadID);

            if (!payments || payments.length === 0) {
                return message.reply(getLang("noHistory"));
            }

            let historyText = "";
            const moment = require('moment-timezone');

            payments.slice(0, 10).forEach(payment => { // Chỉ hiển thị 10 giao dịch gần nhất
                const status = payment.status === 'PAID' ? '✅ Thành công' :
                    payment.status === 'PENDING' ? '⏳ Đang chờ' : '❌ Thất bại';

                const date = moment(payment.createdAt).tz('Asia/Ho_Chi_Minh').format('DD/MM/YY HH:mm');

                historyText += getLang("historyItem",
                    payment.transactionId,
                    payment.amount.toLocaleString(),
                    status,
                    date
                );
            });

            message.reply(getLang("history", historyText));

        } catch (error) {
            console.error('History error:', error);
            message.reply("❌ Có lỗi khi lấy lịch sử thanh toán");
        }
    }
};