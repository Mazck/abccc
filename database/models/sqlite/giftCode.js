module.exports = function (sequelize) {
    const { Model, DataTypes } = require("sequelize");

    class gifcodeModel extends Model { }

    gifcodeModel.init({
        code: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            unique: true,
            comment: 'Mã code duy nhất'
        },
        rewardType: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Loại phần thưởng (e.g., "DAYS", "MONEY")'
        },
        rewardValue: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Giá trị của phần thưởng (số ngày, số tiền)'
        },
        notes: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Ghi chú của admin khi tạo code'
        },
        usedByThreadID: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'ID của nhóm đã sử dụng code này'
        },
        usedByUserID: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'ID của người dùng đã sử dụng code này'
        },
        usedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Thời điểm code được sử dụng'
        }
    }, {
        sequelize,
        modelName: 'gift_codes',
        timestamps: true
    });

    return gifcodeModel;
};