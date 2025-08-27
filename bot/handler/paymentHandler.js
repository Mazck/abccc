const PayOS = require('@payos/node');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

class PaymentHandler {
    constructor() {
        this.config = global.GoatBot.config.payos;
        this.payOS = new PayOS(
            this.config.clientId,
            this.config.apiKey,
            this.config.checksumKey
        );
    }

    // Tạo mã đơn hàng duy nhất
    generateOrderCode() {
        return Math.floor(Date.now() / 1000);
    }

    // Tạo link thanh toán
    async createPaymentLink(paymentInfo) {
        try {
            const { orderCode, amount, description, threadID, userID, packageType, discountPercent = 0 } = paymentInfo;

            // Áp dụng giảm giá
            const finalAmount = Math.floor(amount * (1 - discountPercent / 100));

            const paymentData = {
                orderCode: orderCode,
                amount: finalAmount,
                description: description,
                cancelUrl: this.config.cancelUrl || `${this.config.webhookUrl}/payment-cancel`,
                returnUrl: this.config.returnUrl || `${this.config.webhookUrl}/payment-success`,
                signature: null,
                items: [{
                    name: this.config.package[packageType]?.name || "Dịch vụ bot",
                    quantity: 1,
                    price: finalAmount
                }],
                buyerName: `User ${userID}`,
                buyerEmail: `user${userID}@example.com`,
                buyerPhone: "0123456789",
                buyerAddress: "Việt Nam",
                expiredAt: Math.floor(Date.now() / 1000) + (30 * 60) // 30 phút
            };

            const paymentLinkResponse = await this.payOS.createPaymentLink(paymentData);

            return {
                checkoutUrl: paymentLinkResponse.checkoutUrl,
                paymentLinkId: paymentLinkResponse.paymentLinkId,
                qrCode: paymentLinkResponse.qrCode,
                amount: finalAmount,
                originalAmount: amount,
                discountAmount: amount - finalAmount
            };
        } catch (error) {
            console.error('Error creating payment link:', error);
            throw error;
        }
    }

    // Kiểm tra trạng thái thanh toán
    async checkPaymentStatus(paymentLinkId) {
        try {
            const paymentInfo = await this.payOS.getPaymentLinkInformation(paymentLinkId);
            return paymentInfo;
        } catch (error) {
            console.error('Error checking payment status:', error);
            throw error;
        }
    }

    // Xử lý webhook PayOS
    async handleWebhook(webhookData) {
        try {
            // Xác minh webhook signature
            const isValidSignature = this.payOS.verifyPaymentWebhookData(webhookData);
            if (!isValidSignature) {
                throw new Error('Invalid webhook signature');
            }

            const { orderCode, code, desc, data } = webhookData;

            if (code === '00') {
                // Thanh toán thành công
                await this.processSuccessfulPayment(orderCode, data);
            } else {
                // Thanh toán thất bại
                await this.processFailedPayment(orderCode, desc);
            }

            return { success: true };
        } catch (error) {
            console.error('Error handling webhook:', error);
            throw error;
        }
    }

    // Xử lý thanh toán thành công
    async processSuccessfulPayment(orderCode, paymentData) {
        const { paymentData: paymentDataController, threadsData } = global.db;

        // Tìm thông tin thanh toán
        const payment = await paymentDataController.findByTransactionId(orderCode.toString());
        if (!payment) {
            console.error('Payment not found:', orderCode);
            return;
        }

        // Cập nhật trạng thái thanh toán
        await paymentDataController.updatePaymentStatus(
            orderCode.toString(),
            'PAID',
            new Date().toISOString(),
            paymentData
        );

        // Kích hoạt nhóm
        await this.activateGroup(payment.threadID, payment.packageType || 'basic');

        // Gửi thông báo thành công
        await this.sendPaymentSuccessNotification(payment.threadID, payment);
    }

    // Xử lý thanh toán thất bại
    async processFailedPayment(orderCode, reason) {
        const { paymentData: paymentDataController } = global.db;

        await paymentDataController.updatePaymentStatus(
            orderCode.toString(),
            'FAILED',
            new Date().toISOString(),
            { reason }
        );
    }

    // Kích hoạt nhóm
    async activateGroup(threadID, packageType) {
        const { threadsData } = global.db;
        const packageInfo = this.config.package[packageType];

        if (!packageInfo) {
            console.error('Package not found:', packageType);
            return;
        }

        const expiresAt = moment().add(packageInfo.days, 'days').toISOString();

        await threadsData.set(threadID, {
            status: 'active',
            activatedAt: new Date().toISOString(),
            expiresAt: expiresAt,
            packageType: packageType,
            renewalCount: (await threadsData.get(threadID, 'data.renewalCount', 0)) + 1
        }, 'data');

        console.log(`✅ Activated group ${threadID} with package ${packageType} until ${expiresAt}`);
    }

    // Tính toán giảm giá gia hạn
    calculateRenewalDiscount(renewalCount) {
        // Giảm giá tích lũy: 5% cho lần gia hạn đầu tiên, tăng 2% mỗi lần, tối đa 20%
        const baseDiscount = 5;
        const incrementDiscount = 2;
        const maxDiscount = 20;

        const discount = Math.min(baseDiscount + (renewalCount * incrementDiscount), maxDiscount);
        return discount;
    }

    // Gửi thông báo thanh toán thành công
    async sendPaymentSuccessNotification(threadID, payment) {
        const api = global.GoatBot.fcaApi;
        if (!api) return;

        const packageInfo = this.config.package[payment.packageType || 'basic'];
        const message = `🎉 THANH TOÁN THÀNH CÔNG!\n\n` +
            `✅ Nhóm đã được kích hoạt\n` +
            `📦 Gói: ${packageInfo.name}\n` +
            `💰 Số tiền: ${payment.amount.toLocaleString()}đ\n` +
            `⏰ Thời hạn: ${packageInfo.days} ngày\n` +
            `🎯 Cảm ơn bạn đã sử dụng dịch vụ!`;

        try {
            await api.sendMessage(message, threadID);
        } catch (error) {
            console.error('Error sending success notification:', error);
        }
    }

    // Kiểm tra nhóm sắp hết hạn (chạy định kỳ)
    async checkExpiringGroups() {
        const { threadsData } = global.db;
        const api = global.GoatBot.fcaApi;
        if (!api) return;

        try {
            const allThreads = await threadsData.getAll();
            const now = moment();

            for (const thread of allThreads) {
                if (!thread.data || thread.data.status !== 'active') continue;

                const expiresAt = moment(thread.data.expiresAt);
                const daysLeft = expiresAt.diff(now, 'days');

                // Thông báo khi còn 3 ngày, 1 ngày và khi hết hạn
                if ([3, 1].includes(daysLeft)) {
                    const renewalDiscount = this.calculateRenewalDiscount(thread.data.renewalCount || 0);

                    const message = `⚠️ THÔNG BÁO HẾT HẠN\n\n` +
                        `📅 Nhóm sẽ hết hạn trong ${daysLeft} ngày\n` +
                        `💡 Gia hạn ngay để tiếp tục sử dụng\n` +
                        `🎁 Giảm giá gia hạn: ${renewalDiscount}%\n\n` +
                        `Sử dụng lệnh "!payment renew" để gia hạn`;

                    await api.sendMessage(message, thread.threadID);
                } else if (daysLeft <= 0) {
                    // Hết hạn
                    await threadsData.set(thread.threadID, {
                        status: 'expired',
                        expiredAt: new Date().toISOString()
                    }, 'data');

                    const message = `❌ NHÓM ĐÃ HẾT HẠN\n\n` +
                        `Bot đã tạm ngừng hoạt động trong nhóm\n` +
                        `Sử dụng lệnh "!payment renew" để gia hạn`;

                    await api.sendMessage(message, thread.threadID);
                }
            }
        } catch (error) {
            console.error('Error checking expiring groups:', error);
        }
    }

    // Tạo QR code từ chuỗi VietQR
    async createVietQRFromRaw(qrData, filename = 'payment_qr.png') {
        return new Promise((resolve, reject) => {
            const https = require('https');
            const fs = require('fs');
            const path = require('path');

            const encodedData = encodeURIComponent(qrData);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodedData}&size=300x300`;
            const filePath = path.join(__dirname, '..', 'temp', filename);

            // Tạo thư mục temp nếu chưa có
            const tempDir = path.dirname(filePath);
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const file = fs.createWriteStream(filePath);
            https.get(qrUrl, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Lỗi tạo mã QR: ${res.statusCode}`));
                    return;
                }

                res.pipe(file);
                file.on('finish', () => {
                    file.close(() => {
                        resolve({ filePath, qrUrl });
                    });
                });
            }).on('error', (err) => {
                fs.unlink(filePath, () => reject(err));
            });
        });
    }
}

module.exports = PaymentHandler;