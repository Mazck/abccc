const moment = require('moment-timezone');
const crypto = require('crypto');

class RedeemManager {
    constructor() {
        this.config = global.GoatBot.config.payos;
    }

    // Tạo mã redeem ngẫu nhiên
    generateRedeemCode(prefix = 'BOT', length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = prefix + '-';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Tạo mã redeem với thông tin cụ thể
    async createRedeemCode(options) {
        const {
            rewardType,     // 'DAYS', 'MONEY', 'PERMANENT'
            rewardValue,    // Số ngày, số tiền, hoặc 0 cho vĩnh viễn
            notes = '',     // Ghi chú của admin
            quantity = 1,   // Số lượng mã tạo
            expiresIn = null // Thời hạn sử dụng mã (phút), null = vĩnh viễn
        } = options;

        const { GifcodeData } = global.db;
        const codes = [];

        for (let i = 0; i < quantity; i++) {
            const code = this.generateRedeemCode();

            const codeData = {
                code: code,
                rewardType: rewardType,
                rewardValue: rewardValue,
                notes: notes,
                usedByThreadID: null,
                usedByUserID: null,
                usedAt: null,
                expiresAt: expiresIn ? moment().add(expiresIn, 'minutes').toISOString() : null,
                createdAt: new Date().toISOString()
            };

            await GifcodeData.create(codeData);
            codes.push(code);
        }

        return codes;
    }

    // Sử dụng mã redeem
    async useRedeemCode(code, threadID, userID) {
        const { GifcodeData, threadsData } = global.db;

        try {
            // Tìm mã redeem
            const redeemCode = await GifcodeData.findOne(code);
            if (!redeemCode) {
                return {
                    success: false,
                    message: '❌ Mã redeem không tồn tại hoặc đã được sử dụng'
                };
            }

            // Kiểm tra mã đã được sử dụng chưa
            if (redeemCode.usedByThreadID) {
                return {
                    success: false,
                    message: '❌ Mã redeem này đã được sử dụng'
                };
            }

            // Kiểm tra mã có hết hạn không
            if (redeemCode.expiresAt && moment().isAfter(moment(redeemCode.expiresAt))) {
                return {
                    success: false,
                    message: '❌ Mã redeem đã hết hạn sử dụng'
                };
            }

            // Xử lý theo loại phần thưởng
            let message = '';
            let activationResult = null;

            switch (redeemCode.rewardType) {
                case 'DAYS':
                    activationResult = await this.activateGroupWithDays(threadID, redeemCode.rewardValue);
                    message = `🎉 Kích hoạt thành công!\n✨ Nhóm được gia hạn ${redeemCode.rewardValue} ngày`;
                    break;

                case 'PERMANENT':
                    activationResult = await this.activateGroupPermanent(threadID);
                    message = `🎉 Kích hoạt thành công!\n👑 Nhóm được kích hoạt VĨNH VIỄN`;
                    break;

                case 'MONEY':
                    // Logic thêm tiền vào tài khoản user (nếu có hệ thống tiền)
                    const { usersData } = global.db;
                    await usersData.addMoney(userID, redeemCode.rewardValue);
                    message = `🎉 Nhận thưởng thành công!\n💰 +${redeemCode.rewardValue.toLocaleString()}đ`;
                    break;

                default:
                    return {
                        success: false,
                        message: '❌ Loại mã redeem không hợp lệ'
                    };
            }

            // Đánh dấu mã đã được sử dụng
            await GifcodeData.set(code, {
                usedByThreadID: threadID,
                usedByUserID: userID,
                usedAt: new Date().toISOString()
            });

            return {
                success: true,
                message: message,
                rewardType: redeemCode.rewardType,
                rewardValue: redeemCode.rewardValue,
                activationResult: activationResult
            };

        } catch (error) {
            console.error('Error using redeem code:', error);
            return {
                success: false,
                message: '❌ Có lỗi xảy ra khi sử dụng mã redeem'
            };
        }
    }

    // Kích hoạt nhóm với số ngày cụ thể
    async activateGroupWithDays(threadID, days) {
        const { threadsData } = global.db;

        const currentThread = await threadsData.get(threadID);
        const now = moment();
        let expiresAt;

        // Nếu nhóm đang active, cộng thêm thời gian
        if (currentThread.data?.status === 'active' && currentThread.data?.expiresAt) {
            const currentExpires = moment(currentThread.data.expiresAt);
            if (currentExpires.isAfter(now)) {
                expiresAt = currentExpires.add(days, 'days');
            } else {
                expiresAt = now.add(days, 'days');
            }
        } else {
            expiresAt = now.add(days, 'days');
        }

        await threadsData.set(threadID, {
            status: 'active',
            activatedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            packageType: 'redeem',
            redeemActivated: true
        }, 'data');

        return {
            expiresAt: expiresAt.toISOString(),
            daysAdded: days
        };
    }

    // Kích hoạt nhóm vĩnh viễn
    async activateGroupPermanent(threadID) {
        const { threadsData } = global.db;

        await threadsData.set(threadID, {
            status: 'active',
            activatedAt: new Date().toISOString(),
            expiresAt: null, // null = vĩnh viễn
            packageType: 'permanent',
            redeemActivated: true,
            isPermanent: true
        }, 'data');

        return {
            isPermanent: true
        };
    }

    // Lấy danh sách mã redeem (cho admin)
    async getRedeemCodes(options = {}) {
        const {
            limit = 50,
            offset = 0,
            onlyUnused = false,
            rewardType = null
        } = options;

        const { GifcodeData } = global.db;

        try {
            // Lấy tất cả mã redeem (cần implement query với filter trong database controller)
            const allCodes = await GifcodeData.get(); // Cần sửa để support filter
            let filteredCodes = allCodes;

            if (onlyUnused) {
                filteredCodes = filteredCodes.filter(code => !code.usedByThreadID);
            }

            if (rewardType) {
                filteredCodes = filteredCodes.filter(code => code.rewardType === rewardType);
            }

            // Sort by creation date
            filteredCodes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Pagination
            const total = filteredCodes.length;
            const codes = filteredCodes.slice(offset, offset + limit);

            return {
                codes: codes,
                total: total,
                limit: limit,
                offset: offset
            };
        } catch (error) {
            console.error('Error getting redeem codes:', error);
            throw error;
        }
    }

    // Xóa mã redeem hết hạn (chạy định kỳ)
    async cleanupExpiredCodes() {
        const { GifcodeData } = global.db;

        try {
            const allCodes = await GifcodeData.getAll();
            const now = moment();
            let deletedCount = 0;

            for (const code of allCodes) {
                if (code.expiresAt && moment(code.expiresAt).isBefore(now) && !code.usedByThreadID) {
                    await GifcodeData.remove(code.code);
                    deletedCount++;
                }
            }

            console.log(`🧹 Cleaned up ${deletedCount} expired redeem codes`);
            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up expired codes:', error);
            throw error;
        }
    }

    // Thống kê mã redeem
    async getRedeemStats() {
        const { GifcodeData } = global.db;

        try {
            const allCodes = await GifcodeData.getAll();

            const stats = {
                total: allCodes.length,
                used: allCodes.filter(code => code.usedByThreadID).length,
                unused: allCodes.filter(code => !code.usedByThreadID).length,
                expired: allCodes.filter(code =>
                    code.expiresAt && moment(code.expiresAt).isBefore(moment()) && !code.usedByThreadID
                ).length,
                byType: {}
            };

            // Thống kê theo loại
            allCodes.forEach(code => {
                if (!stats.byType[code.rewardType]) {
                    stats.byType[code.rewardType] = { total: 0, used: 0, unused: 0 };
                }
                stats.byType[code.rewardType].total++;
                if (code.usedByThreadID) {
                    stats.byType[code.rewardType].used++;
                } else {
                    stats.byType[code.rewardType].unused++;
                }
            });

            return stats;
        } catch (error) {
            console.error('Error getting redeem stats:', error);
            throw error;
        }
    }

    // Validate mã redeem format
    validateRedeemCode(code) {
        if (!code || typeof code !== 'string') {
            return false;
        }

        // Format chuẩn: PREFIX-XXXXXXXX
        const regex = /^[A-Z]+-[A-Z0-9]{6,12}$/;
        return regex.test(code.toUpperCase());
    }

    // Tạo mã redeem batch
    async createBatchRedeemCodes(options, batchSize = 100) {
        const batches = Math.ceil(options.quantity / batchSize);
        const allCodes = [];

        for (let i = 0; i < batches; i++) {
            const currentBatchSize = Math.min(batchSize, options.quantity - i * batchSize);
            const batchOptions = { ...options, quantity: currentBatchSize };

            const codes = await this.createRedeemCode(batchOptions);
            allCodes.push(...codes);

            // Delay nhỏ giữa các batch để tránh overload
            if (i < batches - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return allCodes;
    }
}

module.exports = RedeemManager;