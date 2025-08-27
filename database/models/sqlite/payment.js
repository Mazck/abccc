module.exports = function (sequelize) {
    const { Model, DataTypes } = require("sequelize");
    class paymentModel extends Model { }
    paymentModel.init({
        transactionId: {
            type: DataTypes.STRING,
            primaryKey: true,
            comment: 'Mã giao dịch PayOS'
        },
        threadID: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'ID nhóm liên quan đến giao dịch'
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Số tiền giao dịch (đơn vị: VND)'
        },
        status: {
            type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
            allowNull: false,
            defaultValue: 'PENDING',
            comment: 'Trạng thái giao dịch'
        },
        paymentLinkId: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'ID của link thanh toán PayOS'
        },
        paymentTime: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Thời điểm thanh toán thành công'
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Ghi chú thêm hoặc mô tả nội dung giao dịch'
        },
        rawData: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Dữ liệu thô từ PayOS webhook'
        }
    }, {
        sequelize,
        modelName: 'transactions',
        timestamps: true // tạo createdAt và updatedAt tự động
    });

    return paymentModel;
};