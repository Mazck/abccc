const cron = require('node-cron');
const PaymentHandler = require('./paymentHandler.js');
const RedeemManager = require('./redeemManager.js');

class PaymentScheduler {
    constructor() {
        this.paymentHandler = new PaymentHandler();
        this.redeemManager = new RedeemManager();
        this.jobs = new Map();
    }

    // Khởi động tất cả các scheduled jobs
    start() {
        console.log('🕒 Starting payment scheduler...');

        // Kiểm tra nhóm sắp hết hạn (mỗi giờ)
        this.scheduleExpiryCheck();

        // Dọn dẹp mã redeem hết hạn (mỗi ngày lúc 2:00 AM)
        this.scheduleRedeemCleanup();

        // Kiểm tra thanh toán pending (mỗi 15 phút)
        this.schedulePendingPaymentCheck();

        // Thống kê hàng ngày (lúc 0:00)
        this.scheduleDailyStats();

        console.log('✅ Payment scheduler started successfully');
    }

    // Dừng tất cả các scheduled jobs
    stop() {
        console.log('🛑 Stopping payment scheduler...');

        for (const [name, job] of this.jobs) {
            if (job && typeof job.destroy === 'function') {
                job.destroy();
                console.log(`   Stopped job: ${name}`);
            }
        }

        this.jobs.clear();
        console.log('✅ Payment scheduler stopped');
    }

    // Kiểm tra nhóm sắp hết hạn
    scheduleExpiryCheck() {
        const job = cron.schedule('0 */1 * * *', async () => {
            console.log('🔍 Running expiry check...');
            try {
                await this.paymentHandler.checkExpiringGroups();
                console.log('✅ Expiry check completed');
            } catch (error) {
                console.error('❌ Error in expiry check:', error);
            }
        }, {
            scheduled: true,
            timezone: "Asia/Ho_Chi_Minh"
        });

        this.jobs.set('expiryCheck', job);
    }

    // Dọn dẹp mã redeem hết hạn
    scheduleRedeemCleanup() {
        const job = cron.schedule('0 2 * * *', async () => {
            console.log('🧹 Running redeem cleanup...');
            try {
                const deletedCount = await this.redeemManager.cleanupExpiredCodes();
                console.log(`✅ Redeem cleanup completed: ${deletedCount} codes removed`);
            } catch (error) {
                console.error('❌ Error in redeem cleanup:', error);
            }
        }, {
            scheduled: true,
            timezone: "Asia/Ho_Chi_Minh"
        });

        this.jobs.set('redeemCleanup', job);
    }

    // Kiểm tra thanh toán pending
    schedulePendingPaymentCheck() {
        const job = cron.schedule('*/15 * * * *', async () => {
            console.log('💳 Checking pending payments...');
            try {
                await this.checkPendingPayments();
                console.log('✅ Pending payment check completed');
            } catch (error) {
                console.error('❌ Error checking pending payments:', error);
            }
        }, {
            scheduled: true,
            timezone: "Asia/Ho_Chi_Minh"
        });

        this.jobs.set('pendingPaymentCheck', job);
    }

    // Thống kê hàng ngày
    scheduleDailyStats() {
        const job = cron.schedule('0 0 * * *', async () => {
            console.log('📊 Running daily stats...');
            try {
                await this.generateDailyStats();
                console.log('✅ Daily stats completed');
            } catch (error) {
                console.error('❌ Error generating daily stats:', error);
            }
        }, {
            scheduled: true,
            timezone: "Asia/Ho_Chi_Minh"
        });

        this.jobs.set('dailyStats', job);
    }

    // Kiểm tra các thanh toán pending và cập nhật trạng thái
    async checkPendingPayments() {
        const { paymentData } = global.db;
        const moment = require('moment-timezone');

        try {
            const allPayments = await paymentData.getAll();
            const pendingPayments = allPayments.filter(p =>
                p.status === 'PENDING' &&
                moment().diff(moment(p.createdAt), 'minutes') > 5 // Chỉ check những payment cũ hơn 5 phút
            );

            console.log(`Found ${pendingPayments.length} pending payments to check`);

            for (const payment of pendingPayments) {
                try {
                    // Kiểm tra trạng thái từ PayOS
                    const paymentInfo = await this.paymentHandler.checkPaymentStatus(payment.paymentLinkId);

                    if (paymentInfo.status !== payment.status) {
                        if (paymentInfo.status === 'PAID') {
                            console.log(`Payment ${payment.transactionId} is now PAID, processing...`);
                            await this.paymentHandler.processSuccessfulPayment(payment.transactionId, paymentInfo);
                        } else if (paymentInfo.status === 'CANCELLED' || paymentInfo.status === 'EXPIRED') {
                            console.log(`Payment ${payment.transactionId} is ${paymentInfo.status}, updating status...`);
                            await paymentData.updatePaymentStatus(
                                payment.transactionId,
                                'FAILED',
                                new Date().toISOString(),
                                { reason: paymentInfo.status }
                            );
                        }
                    }
                } catch (paymentError) {
                    // Nếu payment link không tìm thấy hoặc hết hạn
                    if (paymentError.message?.includes('not found') ||
                        paymentError.message?.includes('expired')) {

                        // Kiểm tra nếu payment quá cũ (hơn 24h) thì đánh dấu failed
                        if (moment().diff(moment(payment.createdAt), 'hours') > 24) {
                            await paymentData.updatePaymentStatus(
                                payment.transactionId,
                                'FAILED',
                                new Date().toISOString(),
                                { reason: 'Payment expired' }
                            );
                            console.log(`Marked expired payment ${payment.transactionId} as FAILED`);
                        }
                    } else {
                        console.error(`Error checking payment ${payment.transactionId}:`, paymentError.message);
                    }
                }

                // Delay nhỏ giữa các request để tránh rate limit
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error('Error in checkPendingPayments:', error);
        }
    }

    // Tạo thống kê hàng ngày
    async generateDailyStats() {
        const { paymentData, threadsData } = global.db;
        const moment = require('moment-timezone');

        try {
            const yesterday = moment().subtract(1, 'day');
            const startOfDay = yesterday.startOf('day').toISOString();
            const endOfDay = yesterday.endOf('day').toISOString();

            // Lấy tất cả thanh toán trong ngày hôm qua
            const allPayments = await paymentData.getAll();
            const yesterdayPayments = allPayments.filter(p => {
                const paymentDate = moment(p.createdAt);
                return paymentDate.isBetween(startOfDay, endOfDay, null, '[]');
            });

            // Thống kê thanh toán
            const totalPayments = yesterdayPayments.length;
            const successfulPayments = yesterdayPayments.filter(p => p.status === 'PAID').length;
            const failedPayments = yesterdayPayments.filter(p => p.status === 'FAILED').length;
            const totalRevenue = yesterdayPayments
                .filter(p => p.status === 'PAID')
                .reduce((sum, p) => sum + p.amount, 0);

            // Thống kê nhóm active
            const allThreads = await threadsData.getAll();
            const activeGroups = allThreads.filter(t => t.data?.status === 'active').length;
            const expiredGroups = allThreads.filter(t => t.data?.status === 'expired').length;
            const permanentGroups = allThreads.filter(t => t.data?.isPermanent).length;

            // Thống kê redeem codes
            const redeemStats = await this.redeemManager.getRedeemStats();

            const statsMessage = `📊 THỐNG KÊ NGÀY ${yesterday.format('DD/MM/YYYY')}\n\n` +
                `💳 THANH TOÁN:\n` +
                `• Tổng giao dịch: ${totalPayments}\n` +
                `• Thành công: ${successfulPayments}\n` +
                `• Thất bại: ${failedPayments}\n` +
                `• Doanh thu: ${totalRevenue.toLocaleString()}đ\n\n` +
                `👥 NHÓM:\n` +
                `• Đang hoạt động: ${activeGroups}\n` +
                `• Đã hết hạn: ${expiredGroups}\n` +
                `• Vĩnh viễn: ${permanentGroups}\n\n` +
                `🎁 MÃ REDEEM:\n` +
                `• Tổng: ${redeemStats.total}\n` +
                `• Đã dùng: ${redeemStats.used}\n` +
                `• Chưa dùng: ${redeemStats.unused}`;

            console.log('Daily Stats Generated:\n', statsMessage);

            // Gửi thống kê cho admin bot (nếu có)
            await this.sendStatsToAdmin(statsMessage);

            // Lưu thống kê vào database (optional)
            await this.saveStatsToDatabase({
                date: yesterday.format('YYYY-MM-DD'),
                payments: {
                    total: totalPayments,
                    successful: successfulPayments,
                    failed: failedPayments,
                    revenue: totalRevenue
                },
                groups: {
                    active: activeGroups,
                    expired: expiredGroups,
                    permanent: permanentGroups
                },
                redeemCodes: redeemStats
            });

        } catch (error) {
            console.error('Error generating daily stats:', error);
        }
    }

    // Gửi thống kê cho admin
    async sendStatsToAdmin(statsMessage) {
        const api = global.GoatBot.fcaApi;
        const adminBot = global.GoatBot.config.adminBot;

        if (!api || !adminBot || adminBot.length === 0) return;

        try {
            // Gửi cho admin đầu tiên
            await api.sendMessage(statsMessage, adminBot[0]);
            console.log('📤 Daily stats sent to admin');
        } catch (error) {
            console.error('Error sending stats to admin:', error);
        }
    }

    // Lưu thống kê vào database
    async saveStatsToDatabase(stats) {
        try {
            const { globalData } = global.db;
            const statsKey = `daily_stats_${stats.date}`;

            await globalData.set(statsKey, {
                data: {
                    ...stats,
                    generatedAt: new Date().toISOString()
                }
            });

            console.log(`💾 Stats saved to database with key: ${statsKey}`);
        } catch (error) {
            console.error('Error saving stats to database:', error);
        }
    }

    // Lấy thống kê theo khoảng thời gian
    async getStatsForPeriod(startDate, endDate) {
        try {
            const { globalData } = global.db;
            const moment = require('moment-timezone');

            const start = moment(startDate).startOf('day');
            const end = moment(endDate).endOf('day');
            const days = end.diff(start, 'days') + 1;

            const statsKeys = [];
            for (let i = 0; i < days; i++) {
                const date = start.clone().add(i, 'days').format('YYYY-MM-DD');
                statsKeys.push(`daily_stats_${date}`);
            }

            const allStats = [];
            for (const key of statsKeys) {
                try {
                    const stats = await globalData.get(key, 'data');
                    if (stats) {
                        allStats.push(stats);
                    }
                } catch (error) {
                    // Stats for this day not found, skip
                    continue;
                }
            }

            return this.aggregateStats(allStats);
        } catch (error) {
            console.error('Error getting stats for period:', error);
            throw error;
        }
    }

    // Tổng hợp thống kê
    aggregateStats(statsArray) {
        if (statsArray.length === 0) {
            return null;
        }

        const aggregated = {
            period: {
                from: statsArray[0].date,
                to: statsArray[statsArray.length - 1].date,
                days: statsArray.length
            },
            payments: {
                total: 0,
                successful: 0,
                failed: 0,
                revenue: 0
            },
            groups: {
                active: 0,
                expired: 0,
                permanent: 0
            }
        };

        statsArray.forEach(stat => {
            aggregated.payments.total += stat.payments?.total || 0;
            aggregated.payments.successful += stat.payments?.successful || 0;
            aggregated.payments.failed += stat.payments?.failed || 0;
            aggregated.payments.revenue += stat.payments?.revenue || 0;

            // Lấy giá trị cuối cùng cho groups (snapshot)
            if (stat.groups) {
                aggregated.groups = { ...stat.groups };
            }
        });

        return aggregated;
    }

    // Thêm job tùy chỉnh
    addCustomJob(name, cronExpression, jobFunction, options = {}) {
        if (this.jobs.has(name)) {
            console.warn(`Job ${name} already exists, skipping...`);
            return false;
        }

        const job = cron.schedule(cronExpression, async () => {
            console.log(`🔄 Running custom job: ${name}`);
            try {
                await jobFunction();
                console.log(`✅ Custom job completed: ${name}`);
            } catch (error) {
                console.error(`❌ Error in custom job ${name}:`, error);
            }
        }, {
            scheduled: true,
            timezone: options.timezone || "Asia/Ho_Chi_Minh",
            ...options
        });

        this.jobs.set(name, job);
        console.log(`➕ Added custom job: ${name}`);
        return true;
    }

    // Xóa job
    removeJob(name) {
        const job = this.jobs.get(name);
        if (job) {
            job.destroy();
            this.jobs.delete(name);
            console.log(`➖ Removed job: ${name}`);
            return true;
        }
        return false;
    }

    // Lấy trạng thái các jobs
    getJobsStatus() {
        const status = {};
        for (const [name, job] of this.jobs) {
            status[name] = {
                running: job.running || false,
                lastDate: job.lastDate,
                nextDate: job.nextDate
            };
        }
        return status;
    }
}

module.exports = PaymentScheduler;