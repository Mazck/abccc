// set bash title
process.stdout.write("\x1b]2;ABC Bot\x1b\x5c");
const defaultRequire = require;

const gradient = defaultRequire("gradient-string");
const axios = defaultRequire("axios");
const path = defaultRequire("path");
const fs = defaultRequire("fs-extra");
const {login} = defaultRequire(`${process.cwd()}/facebook-chat-api`);
const qr = new (defaultRequire("qrcode-reader"));
const Canvas = defaultRequire("canvas");
const cheerio = require('cheerio');

async function getName(userID) {
	try {
		const response = await axios.get(`https://www.facebook.com/${userID}`, {
			headers: {
				'User-Agent': 'Mozilla/5.0',
				'Accept-Language': 'en-US,en;q=0.9'
			}
		});

		const html = response.data;
		const $ = cheerio.load(html);

		const title = $('title').text();

		const name = title.split('|')[0].trim();

		return name;

	} catch (error) {
		console.error('Lỗi:', error.message);
		return null;
	}
}

const { writeFileSync, readFileSync, existsSync, watch } = require("fs-extra");
//const handlerWhenListenHasError = require("./handlerWhenListenHasError.js");
const checkLiveCookie = require("./checkLiveCookie.js");
const { callbackListenTime, storage5Message } = global.GoatBot;
const { log, logColor, getPrefix, createOraDots, jsonStringifyColor, getText, convertTime, colors, randomString } = global.utils;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const currentVersion = require(`${process.cwd()}/package.json`).version;

function centerText(text, length) {
	const width = process.stdout.columns;
	const leftPadding = Math.floor((width - (length || text.length)) / 2);
	const rightPadding = width - leftPadding - (length || text.length);
	// Build the padded string using the calculated padding values
	const paddedString = ' '.repeat(leftPadding > 0 ? leftPadding : 0) + text + ' '.repeat(rightPadding > 0 ? rightPadding : 0);
	// Print the padded string to the terminal
	console.log(paddedString);
}


// logo
const titles = [
	[
		" █████╗ ██████╗  ██████╗    ██████╗  ██████╗ ████████╗",
		"██╔══██╗██╔══██╗██╔════╝    ██╔══██╗██╔═══██╗╚══██╔══╝",
		"███████║██████╔╝██║         ██████╔╝██║   ██║   ██║   ",
		"██╔══██║██╔══██╗██║         ██╔══██╗██║   ██║   ██║   ",
		"██║  ██║██████╔╝╚██████╗    ██████╔╝╚██████╔╝   ██║   ",
		"╚═╝  ╚═╝╚═════╝  ╚═════╝    ╚═════╝  ╚═════╝    ╚═╝   "
	],
	[
		"█▀█ █▄█ ▄▀█ █▄▄   █▀█ █▀█ ▄▀█ ▀█▀  █░█ ▀█",
		"█▀▄  █  █▀█ █▄█   █▄█ █▀▄ █▀█ ░█░  ▀▄▀ █▄"
	],
	[
		"A B C  B O T  V 2 @" + currentVersion
	],
	[
		"ABC BOT V2"
	]
];

const maxWidth = process.stdout.columns;
const title = maxWidth > 58 ?
	titles[0] :
	maxWidth > 36 ?
		titles[1] :
		maxWidth > 26 ?
			titles[2] :
			titles[3];

for (const text of title) {
	const textColor = gradient("#FA8BFF", "#2BD2FF", "#2BFF88")(text);
	centerText(textColor, text.length);
}
let subTitle = `ABC Bot@1.0.1 - A simple Bot chat messenger`;
const subTitleArray = [];
if (subTitle.length > maxWidth) {
	while (subTitle.length > maxWidth) {
		let lastSpace = subTitle.slice(0, maxWidth).lastIndexOf(' ');
		lastSpace = lastSpace == -1 ? maxWidth : lastSpace;
		subTitleArray.push(subTitle.slice(0, lastSpace).trim());
		subTitle = subTitle.slice(lastSpace).trim();
	}
	subTitle ? subTitleArray.push(subTitle) : '';
}
else {
	subTitleArray.push(subTitle);
}
for (const t of subTitleArray) {
	const textColor2 = gradient("#9F98E8", "#AFF6CF")(t);
	centerText(textColor2, t.length);
}

let widthConsole = process.stdout.columns;
if (widthConsole > 50)
	widthConsole = 50;

qr.readQrCode = async function (filePath) {
	const image = await Canvas.loadImage(filePath);
	const canvas = Canvas.createCanvas(image.width, image.height);
	const ctx = canvas.getContext("2d");
	ctx.drawImage(image, 0, 0);
	const data = ctx.getImageData(0, 0, image.width, image.height);
	let value;
	qr.callback = function (error, result) {
		if (error)
			throw error;
		value = result;
	};
	qr.decode(data);
	return value.result;
};

const { dirAccount } = global.client;
const { config, configCommands } = global.GoatBot;
const { facebookAccount } = global.GoatBot.config;

function responseUptimeSuccess(req, res) {
	res.type('json').send({
		status: "success",
		uptime: process.uptime(),
		unit: "seconds"
	});
}

function responseUptimeError(req, res) {
	res.status(500).type('json').send({
		status: "error",
		uptime: process.uptime(),
		statusAccountBot: global.statusAccountBot
	});
}

function filterKeysAppState(appState) {
	return appState.filter(item => ["c_user", "xs", "datr", "fr", "sb", "i_user"].includes(item.key));
}

global.responseUptimeCurrent = responseUptimeSuccess;
global.responseUptimeSuccess = responseUptimeSuccess;
global.responseUptimeError = responseUptimeError;

global.statusAccountBot = 'good';
let changeFbStateByCode = false;
let dashBoardIsRunning = false;


function stopListening(keyListen) {
	keyListen = keyListen || Object.keys(callbackListenTime).pop();
	return new Promise((resolve) => {
		global.GoatBot.fcaApi.stopListening?.(() => {
			if (callbackListenTime[keyListen]) {
				// callbackListenTime[keyListen || Object.keys(callbackListenTime).pop()]("Connection closed by user.");
				callbackListenTime[keyListen] = () => { };
			}
			resolve();
		}) || resolve();
	});
}

async function startBot() {
	const currentVersion = require("../../package.json").version;

	if (global.GoatBot.Listening)
		await stopListening();

	log.info("LOGIN FACEBOOK", getText('login', 'currentlyLogged'));


	// ——————————————————— LOGIN ———————————————————— //
	(function loginBot() {
		global.GoatBot.commands = new Map();
		global.GoatBot.eventCommands = new Map();
		global.GoatBot.aliases = new Map();
		global.GoatBot.onChat = [];
		global.GoatBot.onEvent = [];
		global.GoatBot.onReply = new Map();
		global.GoatBot.onReaction = new Map();
		clearInterval(global.intervalRestartListenMqtt);
		delete global.intervalRestartListenMqtt;

		let isSendNotiErrorMessage = false;
		login({ appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8')) }, global.GoatBot.config.optionsFca, async function (error, api) {

			// Handle error
			if (error) {
				log.err("LOGIN FACEBOOK", getText('login', 'loginError'));

				global.statusAccountBot = 'can\'t login';


				if (facebookAccount.email && facebookAccount.password) {
					return startBot(true);
				}
				// —————————— CHECK DASHBOARD —————————— //
				if (global.GoatBot.config.dashBoard?.enable == true) {
					try {
						//await require("../../dashboard/app.js")(api);
						//log.info("DASHBOARD", getText('login', 'openDashboardSuccess'));
					}
					catch (err) {
						log.err("DASHBOARD", getText('login', 'openDashboardError'), err);
					}
					return;
				}
				else {
					process.exit();
				}
			}

			global.GoatBot.fcaApi = api;
			global.GoatBot.botID = api.getCurrentUserID();
			log.info("LOGIN FACEBOOK", getText('login', 'loginSuccess'));
			global.botID = api.getCurrentUserID();
			log.info("NODE VERSION", process.version);
			log.info("PROJECT VERSION", currentVersion);
			log.info("BOT ID", `${global.botID} - ${await getName(global.botID)}`);
			log.info("PREFIX", global.GoatBot.config.prefix);
			log.info("LANGUAGE", global.GoatBot.config.language);
			let hasBanned = false;
			let dataGban;

			try {
				// convert to promise
				const item = await axios.get("https://raw.githubusercontent.com/Mazck/bot_zalo/refs/heads/main/gban.json");
				dataGban = item.data;

				// ————————————————— CHECK BOT ————————————————— //
				const botID = api.getCurrentUserID();
				if (dataGban.hasOwnProperty(botID)) {
					if (!dataGban[botID].toDate) {
						log.err('GBAN', getText('login', 'gbanMessage', dataGban[botID].date, dataGban[botID].reason, dataGban[botID].date));
						hasBanned = true;
					}
					else {
						const currentDate = (new Date((await axios.get("http://worldtimeapi.org/api/timezone/UTC")).data.utc_datetime)).getTime();
						if (currentDate < (new Date(dataGban[botID].date)).getTime()) {
							log.err('GBAN', getText('login', 'gbanMessage', dataGban[botID].date, dataGban[botID].reason, dataGban[botID].date, dataGban[botID].toDate));
							hasBanned = true;
						}
					}
				}
				// ———————————————— CHECK ADMIN ———————————————— //
				for (const idad of global.GoatBot.config.adminBot) {
					if (dataGban.hasOwnProperty(idad)) {
						if (!dataGban[idad].toDate) {
							log.err('GBAN', getText('login', 'gbanMessage', dataGban[idad].date, dataGban[idad].reason, dataGban[idad].date));
							hasBanned = true;
						}
						else {
							const currentDate = (new Date((await axios.get("http://worldtimeapi.org/api/timezone/UTC")).data.utc_datetime)).getTime();
							if (currentDate < (new Date(dataGban[idad].date)).getTime()) {
								log.err('GBAN', getText('login', 'gbanMessage', dataGban[idad].date, dataGban[idad].reason, dataGban[idad].date, dataGban[idad].toDate));
								hasBanned = true;
							}
						}
					}
				}
				if (hasBanned == true)
					process.exit();
			}
			catch (e) {
				console.log(e);
				log.err('GBAN', getText('login', 'checkGbanError'));
				process.exit();
			}

			// ———————————————— NOTIFICATIONS ———————————————— //
			let notification;
			try {
				const getNoti = await axios.get("https://raw.githubusercontent.com/Mazck/bot_zalo/refs/heads/main/notification.txt");
				notification = getNoti.data;
			}
			catch (err) {
				log.err("ERROR", "Can't get notifications data");
				process.exit();
			}
			if (global.GoatBot.config.autoRefreshFbstate == true) {
				changeFbStateByCode = true;
				try {
					writeFileSync(dirAccount, JSON.stringify(filterKeysAppState(api.getAppState()), null, 2));
					//log.info("REFRESH FBSTATE", getText('login', 'refreshFbstateSuccess', path.basename(dirAccount)));
				}
				catch (err) {
					log.warn("REFRESH FBSTATE", getText('login', 'refreshFbstateError', path.basename(dirAccount)), err);
				}
				setTimeout(() => changeFbStateByCode = false, 1000);
			}

			// ——————————————————— LOAD DATA ——————————————————— //
			const { threadModel, userModel, dashBoardModel, globalModel, paymentModel, threadsData, usersData, dashBoardData, globalData, paymentData, sequelize } = await require("./loadData.js")(api);
			// ————————————————— CUSTOM SCRIPTS ————————————————— //
			await require("../custom.js")({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getText });
			// —————————————————— LOAD SCRIPTS —————————————————— //
			await require("./loadScripts.js")(api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData);
			// ———————————— CHECK AUTO LOAD SCRIPTS ———————————— //
			if (global.GoatBot.config.autoLoadScripts?.enable == true) {
				const ignoreCmds = global.GoatBot.config.autoLoadScripts.ignoreCmds?.replace(/[ ,]+/g, ' ').trim().split(' ') || [];
				const ignoreEvents = global.GoatBot.config.autoLoadScripts.ignoreEvents?.replace(/[ ,]+/g, ' ').trim().split(' ') || [];

				watch(`${process.cwd()}/scripts/cmds`, async (event, filename) => {
					if (filename.endsWith('.js')) {
						if (ignoreCmds.includes(filename) || filename.endsWith('.eg.js'))
							return;
						if ((event == 'change' || event == 'rename') && existsSync(`${process.cwd()}/scripts/cmds/${filename}`)) {
							try {
								const contentCommand = global.temp.contentScripts.cmds[filename] || "";
								const currentContent = readFileSync(`${process.cwd()}/scripts/cmds/${filename}`, 'utf-8');
								if (contentCommand == currentContent)
									return;
								global.temp.contentScripts.cmds[filename] = currentContent;
								filename = filename.replace('.js', '');

								const infoLoad = global.utils.loadScripts("cmds", filename, log, global.GoatBot.configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData);
								if (infoLoad.status == "success")
									log.master("AUTO LOAD SCRIPTS", `Command ${filename}.js (${infoLoad.command.config.name}) has been reloaded`);
								else
									log.err("AUTO LOAD SCRIPTS", `Error when reload command ${filename}.js`, infoLoad.error);
							}
							catch (err) {
								log.err("AUTO LOAD SCRIPTS", `Error when reload command ${filename}.js`, err);
							}
						}
					}
				});

				watch(`${process.cwd()}/scripts/events`, async (event, filename) => {
					if (filename.endsWith('.js')) {
						if (ignoreEvents.includes(filename) || filename.endsWith('.eg.js'))
							return;
						if ((event == 'change' || event == 'rename') && existsSync(`${process.cwd()}/scripts/events/${filename}`)) {
							try {
								const contentEvent = global.temp.contentScripts.events[filename] || "";
								const currentContent = readFileSync(`${process.cwd()}/scripts/events/${filename}`, 'utf-8');
								if (contentEvent == currentContent)
									return;
								global.temp.contentScripts.events[filename] = currentContent;
								filename = filename.replace('.js', '');

								const infoLoad = global.utils.loadScripts("events", filename, log, global.GoatBot.configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData);
								if (infoLoad.status == "success")
									log.master("AUTO LOAD SCRIPTS", `Event ${filename}.js (${infoLoad.command.config.name}) has been reloaded`);
								else
									log.err("AUTO LOAD SCRIPTS", `Error when reload event ${filename}.js`, infoLoad.error);
							}
							catch (err) {
								log.err("AUTO LOAD SCRIPTS", `Error when reload event ${filename}.js`, err);
							}
						}
					}
				});

			}

			// ——————————————————— DASHBOARD ——————————————————— //
			if (global.GoatBot.config.dashBoard?.enable == true && dashBoardIsRunning == false) {

				try {
					// const connectToDashboard = require("../handler/webhook/dashBoard/server.js");

					// connectToDashboard({
					// 	serverURL: global.GoatBot.config.dashBoard.serverURL,
					// 	api: global.GoatBot.fcaApi,
					// 	threadsData, 
					// 	usersData
					// });
				}
				catch (err) {
					log.err("DASHBOARD", getText('login', 'openDashboardError'), err);
				}
			}
			let i = 0;
			const adminBot = global.GoatBot.config.adminBot
				.filter(item => !isNaN(item))
				.map(item => item = item.toString());
			for (const uid of adminBot) {
				try {
					const userName = await usersData.getName(uid);
					log.master("ADMINBOT", `[${++i}] ${uid} | ${userName}`);
				}
				catch (e) {
					log.master("ADMINBOT", `[${++i}] ${uid}`);
				}
			}
			log.master("NOTIFICATION", (notification || "").trim());
			log.master("SUCCESS", getText('login', 'runBot'));
			log.master("LOAD TIME", `${convertTime(Date.now() - global.GoatBot.startTime)}`);

			global.GoatBot.config.adminBot = adminBot;
			writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			writeFileSync(global.client.dirConfigCommands, JSON.stringify(global.GoatBot.configCommands, null, 2));

			// ——————————————————————————————————————————————————— //
			const { restartListenMqtt } = global.GoatBot.config;
			let intervalCheckLiveCookieAndRelogin = false;
			// —————————————————— CALLBACK LISTEN —————————————————— //
			async function callBackListen(error, event) {
				if (error) {
					global.responseUptimeCurrent = responseUptimeError;
					if (
						error.error == "Not logged in" ||
						error.error == "Not logged in." ||
						error.error == "Connection refused: Server unavailable"
					) {
						log.err("NOT LOGGEG IN", getText('login', 'notLoggedIn'), error);
						global.responseUptimeCurrent = responseUptimeError;
						global.statusAccountBot = 'can\'t login';
						if (!isSendNotiErrorMessage) {
							//await handlerWhenListenHasError({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, error });
							isSendNotiErrorMessage = true;
						}

						if (global.GoatBot.config.autoRestartWhenListenMqttError)
							process.exit(2);
						else {
							const keyListen = Object.keys(callbackListenTime).pop();
							if (callbackListenTime[keyListen])
								callbackListenTime[keyListen] = () => { };
							const cookieString = appState.map(i => i.key + "=" + i.value).join("; ");

							let times = 5;

							const spin = createOraDots(getText('login', 'retryCheckLiveCookie', times));
							const countTimes = setInterval(() => {
								times--;
								if (times == 0)
									times = 5;
								spin.text = getText('login', 'retryCheckLiveCookie', times);
							}, 1000);

							if (intervalCheckLiveCookieAndRelogin == false) {
								intervalCheckLiveCookieAndRelogin = true;
								const interval = setInterval(async () => {
									const cookieIsLive = await checkLiveCookie(cookieString, facebookAccount.userAgent);
									if (cookieIsLive) {
										clearInterval(interval);
										clearInterval(countTimes);
										intervalCheckLiveCookieAndRelogin = false;
										const keyListen = Date.now();
										isSendNotiErrorMessage = false;
										global.GoatBot.Listening = api.listenMqtt(createCallBackListen(keyListen));
									}
								}, 5000);
							}
						}
						return;
					}
					else if (error == "Connection closed." || error == "Connection closed by user.") /* by stopListening; */ {
						return;
					}
					else {
						//await handlerWhenListenHasError({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, error });
						return log.err("LISTEN_MQTT", getText('login', 'callBackError'), error);
					}
				}
				global.responseUptimeCurrent = responseUptimeSuccess;
				global.statusAccountBot = 'good';
				const configLog = global.GoatBot.config.logEvents;
				if (isSendNotiErrorMessage == true)
					isSendNotiErrorMessage = false;

				if (
					global.GoatBot.config.whiteListMode?.enable == true
					&& global.GoatBot.config.whiteListModeThread?.enable == true
					// admin
					&& !global.GoatBot.config.adminBot.includes(event.senderID)
				) {
					if (
						!global.GoatBot.config.whiteListMode.whiteListIds.includes(event.senderID)
						&& !global.GoatBot.config.whiteListModeThread.whiteListThreadIds.includes(event.threadID)
						// admin
						&& !global.GoatBot.config.adminBot.includes(event.senderID)
					)
						return;
				}
				else if (
					global.GoatBot.config.whiteListMode?.enable == true
					&& !global.GoatBot.config.whiteListMode.whiteListIds.includes(event.senderID)
					// admin
					&& !global.GoatBot.config.adminBot.includes(event.senderID)
				)
					return;
				else if (
					global.GoatBot.config.whiteListModeThread?.enable == true
					&& !global.GoatBot.config.whiteListModeThread.whiteListThreadIds.includes(event.threadID)
					// admin
					&& !global.GoatBot.config.adminBot.includes(event.senderID)
				)
					return;

				// check if listenMqtt loop
				if (event.messageID && event.type == "message") {
					if (storage5Message.includes(event.messageID))
						Object.keys(callbackListenTime).slice(0, -1).forEach(key => {
							callbackListenTime[key] = () => { };
						});
					else
						storage5Message.push(event.messageID);
					if (storage5Message.length > 5)
						storage5Message.shift();
				}

				if (configLog.disableAll === false && configLog[event.type] !== false) {
					// hide participantIDs (it is array too long)
					const participantIDs_ = [...event.participantIDs || []];
					if (event.participantIDs)
						event.participantIDs = 'Array(' + event.participantIDs.length + ')';

					console.log(colors.green((event.type || "").toUpperCase() + ":"), jsonStringifyColor(event, null, 2));

					if (event.participantIDs)
						event.participantIDs = participantIDs_;
				}

				if ((event.senderID && dataGban[event.senderID] || event.userID && dataGban[event.userID])) {
					if (event.body && event.threadID) {
						const prefix = getPrefix(event.threadID);
						if (event.body.startsWith(prefix))
							return api.sendMessage(getText('login', 'userBanned'), event.threadID);

					}
					else
						return;
				}

				const handlerAction = require("../handler/handlerAction.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);
				if (hasBanned === false) {
					handlerAction(event)
				}
				else
					return log.err('GBAN', getText('login', 'youAreBanned'));
			}
			// ————————————————— CREATE CALLBACK ————————————————— //
			function createCallBackListen(key) {
				key = randomString(10) + (key || Date.now());
				callbackListenTime[key] = callBackListen;
				return function (error, event) {
					callbackListenTime[key](error, event);
				};
			}
			// ———————————————————— START BOT ———————————————————— //
			await stopListening();
			global.GoatBot.Listening = api.listenMqtt(createCallBackListen());
			global.GoatBot.callBackListen = callBackListen;

			// ———————————————————— RESTART LISTEN ———————————————————— //
			if (restartListenMqtt.enable == true) {
				if (restartListenMqtt.logNoti == true) {
					log.info("LISTEN_MQTT", getText('login', 'restartListenMessage', convertTime(restartListenMqtt.timeRestart, true)));
					log.info("BOT_STARTED", getText('login', 'startBotSuccess'));

				}
				const restart = setInterval(async function () {
					if (restartListenMqtt.enable == false) {
						clearInterval(restart);
						return log.warn("LISTEN_MQTT", getText('login', 'stopRestartListenMessage'));
					}
					try {
						await stopListening();
						await sleep(1000);
						global.GoatBot.Listening = api.listenMqtt(createCallBackListen());
						log.info("LISTEN_MQTT", getText('login', 'restartListenMessage2'));
					}
					catch (e) {
						log.err("LISTEN_MQTT", getText('login', 'restartListenMessageError'), e);
					}
				}, restartListenMqtt.timeRestart);
				global.intervalRestartListenMqtt = restart;
			}
		});
	})();

	if (global.GoatBot.config.autoReloginWhenChangeAccount) {
		setTimeout(function () {
			watch(dirAccount, async (type) => {
				if (type == 'change' && changeFbStateByCode == false) {
					clearInterval(global.intervalRestartListenMqtt);
					global.compulsoryStopLisening = true;
					// await stopListening();
					latestChangeContentAccount = fs.statSync(dirAccount).mtimeMs;
					// process.exit(2);
					startBot();
				}
			});
		}, 10000);
	}
}

global.GoatBot.reLoginBot = startBot;
startBot();
