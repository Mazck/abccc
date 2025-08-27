module.exports = {
	config: {
		name: "count",
		version: "1.3.1",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem số lượng tin nhắn của tất cả thành viên hoặc bản thân (tính từ lúc bot vào nhóm)",
			en: "View the number of messages of all members or yourself (since the bot joined the group)"
		},
		category: "box chat",
		guide: {
			vi: "   {pn}: dùng để xem số lượng tin nhắn của bạn"
				+ "\n   {pn} @tag: dùng để xem số lượng tin nhắn của những người được tag"
				+ "\n   {pn} all: dùng để xem số lượng tin nhắn của tất cả thành viên",
			en: "   {pn}: used to view the number of messages of you"
				+ "\n   {pn} @tag: used to view the number of messages of those tagged"
				+ "\n   {pn} all: used to view the number of messages of all members"
		}
	},

	langs: {
		vi: {
			count: "Số tin nhắn của các thành viên:",
			endMessage: "Những người không có tên trong danh sách là chưa gửi tin nhắn nào.",
			page: "Trang [%1/%2]",
			reply: "Phản hồi tin nhắn này kèm số trang để xem tiếp",
			result: "%1 hạng %2 với %3 tin nhắn",
			yourResult: "Bạn đứng hạng %1 và đã gửi %2 tin nhắn trong nhóm này",
			invalidPage: "Số trang không hợp lệ"
		},
		en: {
			count: "Number of messages of members:",
			endMessage: "Those who do not have a name in the list have not sent any messages.",
			page: "Page [%1/%2]",
			reply: "Reply to this message with the page number to view more",
			result: "%1 rank %2 with %3 messages",
			yourResult: "You are ranked %1 and have sent %2 messages in this group",
			invalidPage: "Invalid page number"
		}
	},

	onStart: async function ({ args, threadsData, message, event, api, commandName, getLang }) {
		const { threadID, senderID } = event;
		try {
			const threadData = await threadsData.get(threadID);
			let { members } = threadData;

			// Đảm bảo members là một array
			if (!members || !Array.isArray(members)) {
				members = [];
			}

			const usersInGroup = (await api.getThreadInfo(threadID)).participantIDs;
			let arraySort = [];

			for (const user of members) {
				// Kiểm tra user có tồn tại và có các thuộc tính cần thiết
				if (!user || !user.userID) continue;

				if (!usersInGroup.includes(user.userID))
					continue;

				const charac = "️️️️️️️️️️️️️️️️️"; // This character is banned from facebook chat
				arraySort.push({
					name: user.name && user.name.includes(charac) ? `Uid: ${user.userID}` : (user.name || `Uid: ${user.userID}`),
					count: user.count || 0,
					uid: user.userID
				});
			}

			let stt = 1;
			arraySort.sort((a, b) => b.count - a.count);
			arraySort.map(item => item.stt = stt++);

			if (args[0]) {
				if (args[0].toLowerCase() == "all") {
					let msg = getLang("count");
					const endMessage = getLang("endMessage");
					for (const item of arraySort) {
						if (item.count > 0)
							msg += `\n${item.stt}/ ${item.name}: ${item.count}`;
					}

					if ((msg + endMessage).length > 19999) {
						msg = "";
						let page = parseInt(args[1]);
						if (isNaN(page))
							page = 1;
						const splitPage = global.utils.splitPage(arraySort, 50);
						arraySort = splitPage.allPage[page - 1];
						for (const item of arraySort) {
							if (item.count > 0)
								msg += `\n${item.stt}/ ${item.name}: ${item.count}`;
						}
						msg += getLang("page", page, splitPage.totalPage)
							+ `\n${getLang("reply")}`
							+ `\n\n${endMessage}`;

						return message.reply(msg, (err, info) => {
							if (err)
								return message.err(err);
							global.GoatBot.onReply.set(info.messageID, {
								commandName,
								messageID: info.messageID,
								splitPage,
								author: senderID
							});
						});
					}
					message.reply(msg + `\n\n${endMessage}`);
				}
				else if (event.mentions) {
					let msg = "";
					for (const id in event.mentions) {
						const findUser = arraySort.find(item => item.uid == id);
						if (findUser) {
							msg += `\n${getLang("result", findUser.name, findUser.stt, findUser.count)}`;
						} else {
							msg += `\n${event.mentions[id]} chưa gửi tin nhắn nào`;
						}
					}
					message.reply(msg);
				}
			}
			else {
				const findUser = arraySort.find(item => item.uid == senderID);
				if (findUser) {
					return message.reply(getLang("yourResult", findUser.stt, findUser.count));
				} else {
					return message.reply("Bạn chưa gửi tin nhắn nào trong nhóm này");
				}
			}
		} catch (error) {
			console.error("Error in count command:", error);
			return message.reply("Có lỗi xảy ra khi lấy dữ liệu tin nhắn");
		}
	},

	onReply: ({ message, event, Reply, commandName, getLang }) => {
		const { senderID, body } = event;
		const { author, splitPage } = Reply;
		if (author != senderID)
			return;
		const page = parseInt(body);
		if (isNaN(page) || page < 1 || page > splitPage.totalPage)
			return message.reply(getLang("invalidPage"));
		let msg = getLang("count");
		const endMessage = getLang("endMessage");
		const arraySort = splitPage.allPage[page - 1];
		for (const item of arraySort) {
			if (item.count > 0)
				msg += `\n${item.stt}/ ${item.name}: ${item.count}`;
		}
		msg += getLang("page", page, splitPage.totalPage)
			+ "\n" + getLang("reply")
			+ "\n\n" + endMessage;
		message.reply(msg, (err, info) => {
			if (err)
				return message.err(err);
			message.unsend(Reply.messageID);
			global.GoatBot.onReply.set(info.messageID, {
				commandName,
				messageID: info.messageID,
				splitPage,
				author: senderID
			});
		});
	},

	onChat: async ({ usersData, threadsData, event }) => {
		try {
			const { senderID, threadID } = event;

			// Kiểm tra nếu là tin nhắn từ bot thì không đếm
			if (event.isGroup === false) return;

			let members = await threadsData.get(threadID, "members");

			// Đảm bảo members là một array
			if (!members || !Array.isArray(members)) {
				members = [];
			}

			const findMemberIndex = members.findIndex(user => user.userID == senderID);

			if (findMemberIndex === -1) {
				// Thêm thành viên mới
				const userName = await usersData.getName(senderID);
				members.push({
					userID: senderID,
					name: userName,
					nickname: null,
					inGroup: true,
					count: 1
				});
			}
			else {
				// Cộng count cho thành viên đã tồn tại
				members[findMemberIndex].count = (members[findMemberIndex].count || 0) + 1;
			}

			// Lưu lại dữ liệu
			await threadsData.set(threadID, members, "members");
		} catch (error) {
			console.error("Error in onChat count:", error);
		}
	}
};