const fs = require("fs-extra");
const { utils } = global;

module.exports = {
    config: {
        name: "pin",
        version: "1.4",
        author: "NTKhang",
        countDown: 5,
        role: 0,
        description: "Thay đổi dấu lệnh của bot trong box chat của bạn hoặc cả hệ thống bot (chỉ admin bot)",
        category: "config",
        guide: {
            vi: "   {pn} <new prefix>: thay đổi prefix mới trong box chat của bạn"
                + "\n   Ví dụ:"
                + "\n    {pn} #"
                + "\n\n   {pn} <new prefix> -g: thay đổi prefix mới trong hệ thống bot (chỉ admin bot)"
                + "\n   Ví dụ:"
                + "\n    {pn} # -g"
                + "\n\n   {pn} reset: thay đổi prefix trong box chat của bạn về mặc định",
            en: "   {pn} <new prefix>: change new prefix in your box chat"
                + "\n   Example:"
                + "\n    {pn} #"
                + "\n\n   {pn} <new prefix> -g: change new prefix in system bot (only admin bot)"
                + "\n   Example:"
                + "\n    {pn} # -g"
                + "\n\n   {pn} reset: change prefix in your box chat to default"
        }
    },

    langs: {
        vi: {
            reset: "Đã reset prefix của bạn về mặc định: %1",
            onlyAdmin: "Chỉ admin mới có thể thay đổi prefix hệ thống bot",
            confirmGlobal: "Vui lòng thả cảm xúc bất kỳ vào tin nhắn này để xác nhận thay đổi prefix của toàn bộ hệ thống bot",
            confirmThisThread: "Vui lòng thả cảm xúc bất kỳ vào tin nhắn này để xác nhận thay đổi prefix trong nhóm chat của bạn",
            successGlobal: "Đã thay đổi prefix hệ thống bot thành: %1",
            successThisThread: "Đã thay đổi prefix trong nhóm chat của bạn thành: %1",
            myPrefix: "🌐 Prefix của hệ thống: %1\n🛸 Prefix của nhóm bạn: %2"
        },
        en: {
            reset: "Your prefix has been reset to default: %1",
            onlyAdmin: "Only admin can change prefix of system bot",
            confirmGlobal: "Please react to this message to confirm change prefix of system bot",
            confirmThisThread: "Please react to this message to confirm change prefix in your box chat",
            successGlobal: "Changed prefix of system bot to: %1",
            successThisThread: "Changed prefix in your box chat to: %1",
            myPrefix: "🌐 System prefix: %1\n🛸 Your box chat prefix: %2"
        }
    },

    onStart: async function ({api, message, role, args, commandName, event, threadsData, getLang }) {
       api.pin("list", event.messageID, event.threadID).then((data) => {
           message.reply( data);
       });
    },

    onChat: async function ({ event, message, getLang }) {
      
    }
};