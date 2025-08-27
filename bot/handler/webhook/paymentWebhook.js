const express = require('express');
const PaymentHandler = require('../paymentHandler.js');
const ngrok = require('ngrok');

class PaymentWebhookServer {
    constructor() {
        this.app = express();
        this.paymentHandler = new PaymentHandler();
        this.server = null;
        this.ngrokUrl = null;

        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // Parse JSON bodies
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Logging middleware
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });

        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                service: 'PayOS Webhook Server'
            });
        });

        // PayOS webhook endpoint
        this.app.post('/payos-webhook', async (req, res) => {
            try {
                console.log('🔔 PayOS Webhook received:', JSON.stringify(req.body, null, 2));

                await this.paymentHandler.handleWebhook(req.body);

                res.json({
                    success: true,
                    message: 'Webhook processed successfully',
                    timestamp: new Date().toISOString()
                });

                console.log('✅ PayOS Webhook processed successfully');

            } catch (error) {
                console.error('❌ PayOS Webhook error:', error);

                res.status(500).json({
                    success: false,
                    message: 'Webhook processing failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Payment success redirect
        this.app.get('/payment-success', (req, res) => {
            const { orderCode, status } = req.query;

            res.send(`
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Thanh toán thành công</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .container {
                            background: white;
                            padding: 2rem;
                            border-radius: 12px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                            text-align: center;
                            max-width: 400px;
                        }
                        .success-icon {
                            color: #4CAF50;
                            font-size: 4rem;
                            margin-bottom: 1rem;
                        }
                        h1 {
                            color: #333;
                            margin-bottom: 0.5rem;
                        }
                        p {
                            color: #666;
                            margin-bottom: 1rem;
                        }
                        .order-code {
                            background: #f5f5f5;
                            padding: 0.5rem 1rem;
                            border-radius: 6px;
                            font-family: monospace;
                            margin: 1rem 0;
                        }
                        .note {
                            font-size: 0.9rem;
                            color: #888;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="success-icon">✅</div>
                        <h1>Thanh toán thành công!</h1>
                        <p>Cảm ơn bạn đã sử dụng dịch vụ</p>
                        ${orderCode ? `<div class="order-code">Mã đơn hàng: ${orderCode}</div>` : ''}
                        <p class="note">Bot sẽ được kích hoạt trong vòng vài phút.<br>Bạn có thể đóng trang này.</p>
                    </div>
                </body>
                </html>
            `);
        });

        // Payment cancel redirect
        this.app.get('/payment-cancel', (req, res) => {
            const { orderCode } = req.query;

            res.send(`
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Thanh toán đã hủy</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #ff7b7b 0%, #ff6b6b 100%);
                        }
                        .container {
                            background: white;
                            padding: 2rem;
                            border-radius: 12px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                            text-align: center;
                            max-width: 400px;
                        }
                        .cancel-icon {
                            color: #f44336;
                            font-size: 4rem;
                            margin-bottom: 1rem;
                        }
                        h1 {
                            color: #333;
                            margin-bottom: 0.5rem;
                        }
                        p {
                            color: #666;
                            margin-bottom: 1rem;
                        }
                        .order-code {
                            background: #f5f5f5;
                            padding: 0.5rem 1rem;
                            border-radius: 6px;
                            font-family: monospace;
                            margin: 1rem 0;
                        }
                        .note {
                            font-size: 0.9rem;
                            color: #888;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="cancel-icon">❌</div>
                        <h1>Thanh toán đã hủy</h1>
                        <p>Bạn đã hủy giao dịch thanh toán</p>
                        ${orderCode ? `<div class="order-code">Mã đơn hàng: ${orderCode}</div>` : ''}
                        <p class="note">Bạn có thể thử lại việc thanh toán bất cứ lúc nào.<br>Bạn có thể đóng trang này.</p>
                    </div>
                </body>
                </html>
            `);
        });

        // Payment status check endpoint
        this.app.get('/payment-status/:orderCode', async (req, res) => {
            try {
                const { orderCode } = req.params;
                const { paymentData } = global.db;

                const payment = await paymentData.findByTransactionId(orderCode);

                if (!payment) {
                    return res.status(404).json({
                        success: false,
                        message: 'Payment not found'
                    });
                }

                res.json({
                    success: true,
                    data: {
                        orderCode: payment.transactionId,
                        status: payment.status,
                        amount: payment.amount,
                        createdAt: payment.createdAt,
                        paymentTime: payment.paymentTime
                    }
                });

            } catch (error) {
                console.error('Payment status check error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });

        // API endpoint for manual payment verification
        this.app.post('/verify-payment', async (req, res) => {
            try {
                const { orderCode } = req.body;

                if (!orderCode) {
                    return res.status(400).json({
                        success: false,
                        message: 'Order code is required'
                    });
                }

                const { paymentData } = global.db;
                const payment = await paymentData.findByTransactionId(orderCode);

                if (!payment) {
                    return res.status(404).json({
                        success: false,
                        message: 'Payment not found'
                    });
                }

                // Try to get payment info from PayOS
                try {
                    const paymentInfo = await this.paymentHandler.checkPaymentStatus(payment.paymentLinkId);

                    if (paymentInfo.status === 'PAID' && payment.status !== 'PAID') {
                        // Update payment and activate group
                        await this.paymentHandler.processSuccessfulPayment(orderCode, paymentInfo);

                        return res.json({
                            success: true,
                            message: 'Payment verified and processed',
                            status: 'PAID'
                        });
                    }

                    res.json({
                        success: true,
                        message: 'Payment status checked',
                        status: paymentInfo.status
                    });

                } catch (payosError) {
                    console.error('PayOS API error:', payosError);
                    res.json({
                        success: true,
                        message: 'Payment status unchanged',
                        status: payment.status
                    });
                }

            } catch (error) {
                console.error('Verify payment error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint not found'
            });
        });

        // Error handler
        this.app.use((error, req, res, next) => {
            console.error('Server error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });
    }

    async start(port = 3001) {
        try {
            // Start Express server
            this.server = this.app.listen(port, () => {
                console.log(`🚀 Payment webhook server started on port ${port}`);
            });

            // Setup ngrok tunnel for development/webhook testing
            if (process.env.NODE_ENV !== 'production') {
                try {
                    this.ngrokUrl = await ngrok.connect({
                        addr: port,
                        authtoken: process.env.NGROK_AUTH_TOKEN // Optional
                    });

                    console.log(`🌐 Public webhook URL: ${this.ngrokUrl}`);
                    console.log(`📝 Update your PayOS webhook URL to: ${this.ngrokUrl}/payos-webhook`);

                    // Update config với URL mới
                    if (global.GoatBot.config.payos) {
                        global.GoatBot.config.payos.webhookUrl = this.ngrokUrl;
                    }

                } catch (ngrokError) {
                    console.warn('⚠️ Ngrok failed to start:', ngrokError.message);
                    console.log(`💡 Manual webhook URL: http://localhost:${port}/payos-webhook`);
                }
            }

            return {
                server: this.server,
                url: this.ngrokUrl || `http://localhost:${port}`,
                webhookUrl: (this.ngrokUrl || `http://localhost:${port}`) + '/payos-webhook'
            };

        } catch (error) {
            console.error('❌ Failed to start webhook server:', error);
            throw error;
        }
    }

    async stop() {
        try {
            if (this.server) {
                this.server.close();
                console.log('🛑 Payment webhook server stopped');
            }

            if (this.ngrokUrl) {
                await ngrok.disconnect();
                console.log('🛑 Ngrok tunnel closed');
            }
        } catch (error) {
            console.error('Error stopping webhook server:', error);
        }
    }

    // Method to update webhook URL in PayOS (if needed)
    async updatePayOSWebhook(webhookUrl) {
        try {
            // PayOS doesn't have API to update webhook URL programmatically
            // This would need to be done manually in PayOS dashboard
            console.log(`📝 Please update PayOS webhook URL to: ${webhookUrl}/payos-webhook`);
            return true;
        } catch (error) {
            console.error('Error updating PayOS webhook:', error);
            return false;
        }
    }
}

module.exports = PaymentWebhookServer;