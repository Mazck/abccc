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

module.exports = PaymentWebhookServer;