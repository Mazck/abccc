const axios = require('axios');
const url = 'https://apigami.viettel.vn/mvt-api/myviettel.php/getDataRemain?lang=vi&token=33613b64-7f9d-4d75-9756-53764d2918b9-d2ViXzg0MzYzMTU2MjYz';

async function getDataRemain() {
    try {
        const res = await axios.post(url); // POST không có body
        const data = res.data;

        if (data?.errorCode !== 0 || !Array.isArray(data?.data)) {
            console.error('❌ API trả về lỗi hoặc không có dữ liệu hợp lệ.');
            return;
        }

        const message = data.data.map((item, index) =>
            `${index + 1}. 📛 Tên gói: ${item.pack_name}\n` +
            `   📅 Hết hạn: ${item.expireDate}\n` +
            `   📉 Dung lượng còn lại: ${item.remain}`
        ).join('\n\n');

        return message || 'Không có dữ liệu gói cước nào.';
    } catch (err) {
        console.error('❌ Lỗi khi gọi API:', err.message);
    }
}

module.exports = {
    config: {
        name: "vt",
        version: "1.6",
        author: "a",
        countDown: 5,
        role: 2,
        description: {
            vi: "Test code nhanh",
            en: "Test code quickly"
        },
        category: "owner",
        guide: {
            vi: "{pn} <đoạn code cần test>",
            en: "{pn} <code to test>"
        }
    },

    langs: {
        vi: {
            error: "❌ Đã có lỗi xảy ra:"
        },
        en: {
            error: "❌ An error occurred:"
        }
    },

    onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
        message.reply("Đang lấy dữ liệu gói cước...");
        const dataRemain = await getDataRemain();
        if (!dataRemain) {
            return message.reply("❌ Không thể lấy dữ liệu gói cước.");
        }

        message.reply(dataRemain);
    }
};