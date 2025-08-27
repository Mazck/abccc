const PaymentHandler = require('./paymentHandler.js');
const PaymentWebhookServer = require('./webhook/paymentWebhook.js');
const PaymentScheduler = require('./paymentScheduler.js');

class PaymentIntegration {
    constructor() {
        this.paymentHandler = new PaymentHandler();
        this.webhookServer = new PaymentWebhookServer();
        this.scheduler = new PaymentScheduler();
        this.isInitialized = false;
    }

    // Khởi tạo hệ thống thanh toán
    async initialize() {
        if (this.isInitialized) {
            console.log('⚠️ Payment system already initialized');
            return;
        }

        console.log('🚀 Initializing payment system...');

        try {
            // 1. Kiểm tra cấu hình PayOS
            await this.validatePayOSConfig();

            // 2. Khởi động webhook server
            const serverInfo = await this.webhookServer.start();
            console.log(`✅ Webhook server started: ${serverInfo.webhookUrl}`);

            // 3. Khởi động scheduler
            this.scheduler.start();

            // 4. Tích hợp với handlerEvents để kiểm tra trạng thái nhóm
            await this.integrateWithBot();

            // 5. Thiết lập cleanup khi tắt bot
            this.setupCleanupHandlers();

            this.isInitialized = true;
            console.log('🎉 Payment system initialized successfully!');

            return {
                webhookUrl: serverInfo.webhookUrl,
                publicUrl: serverInfo.url
            };

        } catch (error) {
            console.error('❌ Failed to initialize payment system:', error);
            throw error;
        }
    }

    // Xác thực cấu hình PayOS
    async validatePayOSConfig() {
        const config = global.GoatBot.config.payos;

        if (!config || !config.enable) {
            throw new Error('PayOS is not enabled in config');
        }

        const required = ['clientId', 'apiKey', 'checksumKey'];
        for (const field of required) {
            if (!config[field]) {
                throw new Error(`PayOS ${field} is not configured`);
            }
        }

        if (!config.package || Object.keys(config.package).length === 0) {
            throw new Error('No payment packages configured');
        }

        console.log('✅ PayOS configuration validated');
    }

    // Tích hợp với bot để kiểm tra quyền sử dụng lệnh
    async integrateWithBot() {
        // Lưu reference để có thể hook vào handlerEvents
        global.paymentIntegration = this;

        // Hook vào handlerEvents để kiểm tra trạng thái nhóm trước khi thực thi lệnh
        this.injectPaymentCheck();

        console.log('✅ Integrated with bot event handler');
    }

    // Inject payment check vào handlerEvents
    injectPaymentCheck() {
        // Thêm logic kiểm tra vào handlerEvents.js
        const originalHandlerEvents = global.GoatBot.handlerEvents;

        // Override handlerEvents để thêm payment check
        global.GoatBot.handlerEvents = async function (event, message) {
            // Chỉ kiểm tra cho lệnh không phải payment/redeem
            if (event.body && event.body.startsWith(global.utils.getPrefix(event.threadID))) {
                const command = event.body.split(' ')[0].toLowerCase().substring(global.utils.getPrefix(event.threadID).length);

                // Các lệnh được phép sử dụng mà không cần kích hoạt
                const allowedCommands = ['payment', 'pay', 'thanhtoan', 'redeem', 'code', 'giftcode', 'help', 'info'];

                if (!allowedCommands.includes(command)) {
                    const hasAccess = await global.paymentIntegration.checkGroupAccess(event.threadID, event.senderID);
                    if (!hasAccess.allowed) {
                        return await message.reply(hasAccess.message);
                    }
                }
            }

            // Gọi handler gốc nếu có quyền truy cập
            if (originalHandlerEvents) {
                return await originalHandlerEvents(event, message);
            }
        };
    }

    // Kiểm tra quyền truy cập của nhóm
    async checkGroupAccess(threadID, senderID) {
        try {
            const { threadsData } = global.db;
            const threadData = await threadsData.get(threadID);
            const config = global.GoatBot.config;

            // Admin bot luôn có quyền truy cập
            if (config.adminBot && config.adminBot.includes(senderID)) {
                return { allowed: true };
            }

            // Kiểm tra trạng thái nhóm
            const groupStatus = threadData.data?.status;
            const expiresAt = threadData.data?.expiresAt;
            const isPermanent = threadData.data?.isPermanent;

            // Nhóm chưa kích hoạt hoặc hết hạn
            if (!groupStatus || groupStatus !== 'active') {
                return {
                    allowed: false,
                    message: await this.generateActivationMessage(threadID, threadData)
                };
            }

            // Kiểm tra hết hạn (trừ permanent)
            if (!isPermanent && expiresAt) {
                const moment = require('moment-timezone');
                const now = moment();
                const expiry = moment(expiresAt);

                if (now.isAfter(expiry)) {
                    // Cập nhật trạng thái hết hạn
                    await threadsData.set(threadID, {
                        status: 'expired',
                        expiredAt: new Date().toISOString()
                    }, 'data');

                    return {
                        allowed: false,
                        message: await this.generateActivationMessage(threadID, threadData, true)
                    };
                }
            }

            return { allowed: true };

        } catch (error) {
            console.error('Error checking group access:', error);
            return { allowed: true }; // Cho phép sử dụng nếu có lỗi
        }
    }

    // Tạo thông điệp kích hoạt
    async generateActivationMessage(threadID, threadData, isExpired = false) {
        const config = global.GoatBot.config.payos;
        const selectedPackage = config.package["test"]; // Gói mặc định
        const prefix = global.utils.getPrefix(threadID);

        const renewalCount = threadData.data?.renewalCount || 0;
        const discountPercent = this.paymentHandler.calculateRenewalDiscount(renewalCount);

        let message = isExpired ?
            `❌ NHÓM ĐÃ HẾT HẠN\n\n` :
            `🔒 NHÓM CHƯA ĐƯỢC KÍCH HOẠT\n\n`;

        message += `🎁 Gói dùng thử: ${selectedPackage.name}\n` +
            `💰 Giá: ${selectedPackage.price.toLocaleString()}đ`;

        if (renewalCount > 0) {
            message += `\n🎊 Giảm giá gia hạn: ${discountPercent}%`;
        }

        message += `\n⏰ Thời hạn: ${selectedPackage.days} ngày\n\n` +
            `💳 Sử dụng lệnh "${prefix}payment buy test" để kích hoạt\n` +
            `🎁 Hoặc "${prefix}redeem <mã>" nếu bạn có mã redeem`;

        return message;
    }

    // Thiết lập cleanup handlers
    setupCleanupHandlers() {
        const cleanup = async () => {
            console.log('🧹 Cleaning up payment system...');
            try {
                this.scheduler.stop();
                await this.webhookServer.stop();
                console.log('✅ Payment system cleanup completed');
            } catch (error) {
                console.error('❌ Error during cleanup:', error);
            }
        };

        // Cleanup khi tắt bot
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        process.on('exit', cleanup);
    }

    // Tạo thanh toán nhanh
    async createQuickPayment(threadID, packageName, userID) {
        const orderCode = this.paymentHandler.generateOrderCode();
        const config = global.GoatBot.config.payos;
        const selectedPackage = config.package[packageName];

        if (!selectedPackage) {
            throw new Error('Package not found');
        }

        const { threadsData } = global.db;
        const threadData = await threadsData.get(threadID);
        const renewalCount = threadData.data?.renewalCount || 0;
        const discountPercent = this.paymentHandler.calculateRenewalDiscount(renewalCount);

        const paymentInfo = {
            orderCode: orderCode,
            amount: selectedPackage.price,
            description: `Thanh toán ${selectedPackage.name} - Group ${threadID}`,
            threadID: threadID,
            userID: userID,
            packageType: packageName,
            discountPercent: renewalCount > 0 ? discountPercent : 0
        };

        const paymentResult = await this.paymentHandler.createPaymentLink(paymentInfo);

        // Lưu vào database
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

        return {
            ...paymentResult,
            orderCode: orderCode,
            package: selectedPackage,
            discount: {
                percent: discountPercent,
                amount: paymentResult.discountAmount
            }
        };
    }

    // Kích hoạt nhóm thủ công (Admin only)
    async manualActivateGroup(threadID, packageType = 'basic', days = null) {
        try {
            const { threadsData } = global.db;
            const config = global.GoatBot.config.payos;
            const packageInfo = config.package[packageType];

            if (!packageInfo && !days) {
                throw new Error('Invalid package type');
            }

            const activationDays = days || packageInfo.days;
            const moment = require('moment-timezone');
            const expiresAt = activationDays > 0 ?
                moment().add(activationDays, 'days').toISOString() :
                null; // null = permanent

            await threadsData.set(threadID, {
                status: 'active',
                activatedAt: new Date().toISOString(),
                expiresAt: expiresAt,
                packageType: packageType,
                manualActivation: true,
                renewalCount: 0
            }, 'data');

            return {
                success: true,
                expiresAt: expiresAt,
                packageType: packageType,
                days: activationDays
            };

        } catch (error) {
            console.error('Manual activation error:', error);
            throw error;
        }
    }

    // Lấy thống kê tổng quan
    async getOverallStats() {
        try {
            const { paymentData, threadsData } = global.db;
            const moment = require('moment-timezone');

            // Thống kê thanh toán
            const allPayments = await paymentData.getAll();
            const today = moment().startOf('day');
            const thisMonth = moment().startOf('month');

            const paymentStats = {
                total: allPayments.length,
                successful: allPayments.filter(p => p.status === 'PAID').length,
                pending: allPayments.filter(p => p.status === 'PENDING').length,
                failed: allPayments.filter(p => p.status === 'FAILED').length,
                totalRevenue: allPayments
                    .filter(p => p.status === 'PAID')
                    .reduce((sum, p) => sum + p.amount, 0),
                todayRevenue: allPayments
                    .filter(p => p.status === 'PAID' && moment(p.createdAt).isAfter(today))
                    .reduce((sum, p) => sum + p.amount, 0),
                monthlyRevenue: allPayments
                    .filter(p => p.status === 'PAID' && moment(p.createdAt).isAfter(thisMonth))
                    .reduce((sum, p) => sum + p.amount, 0)
            };

            // Thống kê nhóm
            const allThreads = await threadsData.getAll();
            const groupStats = {
                total: allThreads.length,
                active: allThreads.filter(t => t.data?.status === 'active').length,
                expired: allThreads.filter(t => t.data?.status === 'expired').length,
                inactive: allThreads.filter(t => !t.data?.status || t.data.status === 'inactive').length,
                permanent: allThreads.filter(t => t.data?.isPermanent).length
            };

            // Thống kê redeem
            const redeemStats = await this.scheduler.redeemManager.getRedeemStats();

            return {
                payments: paymentStats,
                groups: groupStats,
                redeemCodes: redeemStats,
                generatedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error getting overall stats:', error);
            throw error;
        }
    }

    // Xuất báo cáo
    async generateReport(startDate, endDate, format = 'text') {
        try {
            const stats = await this.scheduler.getStatsForPeriod(startDate, endDate);
            const overallStats = await this.getOverallStats();

            if (format === 'json') {
                return {
                    period: stats?.period || { from: startDate, to: endDate },
                    periodStats: stats,
                    currentStats: overallStats
                };
            }

            // Format text
            const moment = require('moment-timezone');
            let report = `📊 BÁO CÁO HỆ THỐNG THANH TOÁN\n`;
            report += `📅 Từ ${moment(startDate).format('DD/MM/YYYY')} đến ${moment(endDate).format('DD/MM/YYYY')}\n\n`;

            if (stats) {
                report += `💳 THANH TOÁN TRONG KỲ:\n`;
                report += `• Tổng giao dịch: ${stats.payments.total}\n`;
                report += `• Thành công: ${stats.payments.successful}\n`;
                report += `• Thất bại: ${stats.payments.failed}\n`;
                report += `• Doanh thu: ${stats.payments.revenue.toLocaleString()}đ\n\n`;
            }

            report += `🏠 TÌNH TRẠNG NHÓM HIỆN TẠI:\n`;
            report += `• Tổng nhóm: ${overallStats.groups.total}\n`;
            report += `• Đang hoạt động: ${overallStats.groups.active}\n`;
            report += `• Đã hết hạn: ${overallStats.groups.expired}\n`;
            report += `• Chưa kích hoạt: ${overallStats.groups.inactive}\n`;
            report += `• Vĩnh viễn: ${overallStats.groups.permanent}\n\n`;

            report += `💰 DOANH THU TỔNG:\n`;
            report += `• Tổng cộng: ${overallStats.payments.totalRevenue.toLocaleString()}đ\n`;
            report += `• Hôm nay: ${overallStats.payments.todayRevenue.toLocaleString()}đ\n`;
            report += `• Tháng này: ${overallStats.payments.monthlyRevenue.toLocaleString()}đ\n\n`;

            report += `🎁 MÃ REDEEM:\n`;
            report += `• Tổng: ${overallStats.redeemCodes.total}\n`;
            report += `• Đã dùng: ${overallStats.redeemCodes.used}\n`;
            report += `• Chưa dùng: ${overallStats.redeemCodes.unused}`;

            return report;

        } catch (error) {
            console.error('Error generating report:', error);
            throw error;
        }
    }

    // Getter methods
    getPaymentHandler() {
        return this.paymentHandler;
    }

    getWebhookServer() {
        return this.webhookServer;
    }

    getScheduler() {
        return this.scheduler;
    }

    isSystemInitialized() {
        return this.isInitialized;
    }
}

module.exports = PaymentIntegration;