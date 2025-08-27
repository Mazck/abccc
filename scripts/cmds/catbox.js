const fs = require('fs');
const path = require('path');
const { AdvancedCatboxClient, Litterbox } = require('./cache/scripts/catbox_upload');
const { at } = require('lodash');

const CATBOX_LINKS_FILE = path.join(__dirname, 'cache', 'catbox_links.json');

function loadCatboxLinks() {
    try {
        if (fs.existsSync(CATBOX_LINKS_FILE)) {
            const data = fs.readFileSync(CATBOX_LINKS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading catbox links:', error);
    }
    return [];
}

function saveCatboxLink(linkData) {
    try {
        const links = loadCatboxLinks();
        links.unshift(linkData);

        if (links.length > 1000) {
            links.splice(1000);
        }

        fs.writeFileSync(CATBOX_LINKS_FILE, JSON.stringify(links, null, 2));
    } catch (error) {
        console.error('Error saving catbox link:', error);
    }
}

module.exports = {
    config: {
        name: "catbox",
        version: "2.0",
        author: "Mazck",
        countDown: 5,
        role: 0,
        description: {
            vi: "Upload file lên Catbox và quản lý danh sách links",
            en: "Upload files to Catbox and manage links list"
        },
        category: "owner",
        guide: {
            vi: "{pn} upload - Upload file từ tin nhắn reply\n{pn} list [số] - Xem danh sách links đã upload\n{pn} search <từ khóa> - Tìm kiếm links theo tên file",
            en: "{pn} upload - Upload file from reply message\n{pn} list [number] - View uploaded links list\n{pn} search <keyword> - Search links by filename"
        }
    },

    langs: {
        vi: {
            error: "❌ Đã có lỗi xảy ra:",
            noAttachments: "❌ Không tìm thấy file đính kèm để upload.",
            noReply: "❌ Vui lòng reply tin nhắn có chứa file cần upload.",
            uploadSuccess: "✅ Upload thành công!\n📎 Link: {link}\n📁 Tên file: {filename}\n📊 Loại: {type}",
            uploadFailed: "❌ Upload thất bại: {error}",
            noLinks: "📋 Chưa có link nào được lưu.",
            linksList: "📋 Danh sách {count} links gần nhất:",
            searchResults: "🔍 Tìm thấy {count} kết quả cho '{keyword}':",
            noSearchResults: "🔍 Không tìm thấy kết quả nào cho '{keyword}'."
        },
        en: {
            error: "❌ An error occurred:",
            noAttachments: "❌ No attachments found to upload.",
            noReply: "❌ Please reply to a message containing files to upload.",
            uploadSuccess: "✅ Upload successful!\n📎 Link: {link}\n📁 Filename: {filename}\n📊 Type: {type}",
            uploadFailed: "❌ Upload failed: {error}",
            noLinks: "📋 No links saved yet.",
            linksList: "📋 Latest {count} links:",
            searchResults: "🔍 Found {count} results for '{keyword}':",
            noSearchResults: "🔍 No results found for '{keyword}'."
        }
    },

    onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
        try {
            const key = args[0];

            switch (key) {
                case 'upload':
                    if (!event.messageReply) {
                        return message.reply(getLang("noReply"));
                    }

                    if (!event.messageReply.attachments || event.messageReply.attachments.length === 0) {
                        return message.reply(getLang("noAttachments"));
                    }

                    const attachments = event.messageReply.attachments;

                    for (let i = 0; i < attachments.length; i++) {
                        const attachment = attachments[i];
                        await this.uploadAttachment(attachment, message, getLang);
                    }
                    break;

                case 'list':
                    const limit = parseInt(args[1]) || 10;
                    const links = loadCatboxLinks();

                    if (links.length === 0) {
                        return message.reply(getLang("noLinks"));
                    }

                    const displayLinks = links.slice(0, limit);
                    let listMessage = getLang("linksList").replace("{count}", displayLinks.length) + "\n\n";

                    displayLinks.forEach((link, index) => {
                        const date = new Date(link.uploadTime).toLocaleString();
                        listMessage += `${index + 1}. 📎 ${link.filename}\n🔗 ${link.url}\n📅 ${date}\n📊 ${link.type}\n\n`;
                    });

                    return message.reply(listMessage);

                case 'search':
                    const keyword = args.slice(1).join(' ').toLowerCase();
                    if (!keyword) {
                        return message.reply("❌ Vui lòng nhập từ khóa để tìm kiếm.");
                    }

                    const allLinks = loadCatboxLinks();
                    const searchResults = allLinks.filter(link =>
                        link.filename.toLowerCase().includes(keyword) ||
                        link.type.toLowerCase().includes(keyword)
                    );

                    if (searchResults.length === 0) {
                        return message.reply(getLang("noSearchResults").replace("{keyword}", keyword));
                    }

                    let searchMessage = getLang("searchResults").replace("{count}", searchResults.length).replace("{keyword}", keyword) + "\n\n";

                    searchResults.slice(0, 10).forEach((link, index) => {
                        const date = new Date(link.uploadTime).toLocaleString();
                        searchMessage += `${index + 1}. 📎 ${link.filename}\n🔗 ${link.url}\n📅 ${date}\n📊 ${link.type}\n\n`;
                    });

                    return message.reply(searchMessage);

                case 'create':
                    const newLink = await new AdvancedCatboxClient().createAlbum("test", "test", []);
                    console.log(newLink);
                    return message.reply(newLink);

                default:
                    return message.reply("❌ Lệnh không hợp lệ. Sử dụng: upload, list, search");
            }
        } catch (error) {
            console.error('Catbox command error:', error);
            message.reply(getLang("error") + " " + error.message);
        }
    },

    uploadAttachment: async function (attachment, message, getLang) {
        try {
            let url, filename, type;

            switch (attachment.type) {
                case 'photo':
                    url = attachment.largePreviewUrl || attachment.url;
                    filename = `photo_${Date.now()}.jpg`;
                    type = 'Photo';
                    break;

                case 'video':
                    url = attachment.url;
                    filename = attachment.filename || `video_${Date.now()}.mp4`;
                    type = 'Video';
                    break;

                case 'audio':
                    url = attachment.url;
                    filename = attachment.filename || `audio_${Date.now()}.mp3`;
                    type = 'Audio';
                    break;

                case 'file':
                    url = attachment.url;
                    filename = attachment.filename || `file_${Date.now()}`;
                    type = 'File';
                    break;

                default:
                    url = attachment.url;
                    filename = attachment.filename || `unknown_${Date.now()}`;
                    type = 'Unknown';
                    break;
            }

            console.log(`Uploading ${type}: ${url}`);

            try {
                const data = await new AdvancedCatboxClient().uploadURL(url, { forceDownload: true });

                const linkData = {
                    url: data.catboxUrl,
                    filename: filename,
                    type: type,
                    uploadTime: new Date().toISOString(),
                    originalUrl: url
                };

                saveCatboxLink(linkData);

                message.reply(
                    getLang("uploadSuccess")
                        .replace("{link}", data.catboxUrl)
                        .replace("{filename}", filename)
                        .replace("{type}", type)
                );

            } catch (err) {
                console.log("Retrying without forceDownload...");
                const data = await new AdvancedCatboxClient().uploadURL(url);

                const linkData = {
                    url: data.catboxUrl,
                    filename: filename,
                    type: type,
                    uploadTime: new Date().toISOString(),
                    originalUrl: url
                };

                saveCatboxLink(linkData);

                message.reply(
                    getLang("uploadSuccess")
                        .replace("{link}", data.catboxUrl)
                        .replace("{filename}", filename)
                        .replace("{type}", type)
                );
            }

        } catch (error) {
            console.error(`Upload failed for ${attachment.type}:`, error);
            message.reply(getLang("uploadFailed").replace("{error}", error.message));
        }
    }
};