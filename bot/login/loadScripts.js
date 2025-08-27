const { readdirSync, readFileSync, writeFileSync, existsSync } = require("fs-extra");
const path = require("path");
const { Worker } = require("worker_threads");
const cluster = require("cluster");

// Promisify exec để sử dụng async/await
const exec = (cmd, options) => new Promise((resolve, reject) => {
	require("child_process").exec(cmd, options, (err, stdout) => {
		if (err) return reject(err);
		resolve(stdout);
	});
});

// Import global utilities
const { log, loading, getText, colors, removeHomeDir } = global.utils;
const { GoatBot } = global;
const { configCommands } = GoatBot;

// Constants và regex patterns
const regExpCheckPackage = /require(\s+|)\((\s+|)[`'"]([^`'"]+)[`'"](\s+|)\)/g;
const packageAlready = new Set();
const MAX_CONCURRENT_INSTALLS = 3;
const PACKAGE_INSTALL_TIMEOUT = 30000;

// Enhanced spinner animations
const spinners = {
	dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
	pulse: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
	bounce: ['⠁', '⠂', '⠄', '⠂'],
	wave: ['▁', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃']
};

// Loading state management
let animationFrame = 0;
let loadingStats = {
	total: 0,
	loaded: 0,
	errors: 0,
	startTime: Date.now(),
	currentFile: ''
};

/**
 * Tạo thanh progress bar với gradient colors
 * @param {number} current - Số lượng hiện tại
 * @param {number} total - Tổng số lượng
 * @param {number} width - Độ rộng thanh progress
 * @returns {string} Progress bar string
 */
const createProgressBar = (current, total, width = 35) => {
	const percentage = Math.min(Math.floor((current / total) * 100), 100);
	const filled = Math.floor((current / total) * width);
	const empty = width - filled;

	const progressChar = '█';
	const emptyChar = '░';

	const filledBar = colors.cyan(progressChar.repeat(filled));
	const emptyBar = colors.gray(emptyChar.repeat(empty));

	return `${filledBar}${emptyBar} ${colors.yellow(`${percentage}`.padStart(3))}% ${colors.white(`[${current}/${total}]`)}`;
};

/**
 * Hiển thị trạng thái loading với animation
 * @param {string} message - Thông điệp hiển thị
 * @param {string} type - Loại trạng thái (info, success, error, warning)
 */
const displayLoadingProgress = (message, type = 'info') => {
	const spinner = spinners.pulse[animationFrame % spinners.pulse.length];
	const elapsed = ((Date.now() - loadingStats.startTime) / 1000).toFixed(1);

	const statusColors = {
		info: colors.cyan,
		success: colors.green,
		error: colors.red,
		warning: colors.yellow
	};

	const coloredSpinner = statusColors[type](spinner);
	const progressBar = createProgressBar(loadingStats.loaded, loadingStats.total);
	const timeDisplay = colors.gray(`${elapsed}s`);

	// Clear line và hiển thị progress
	process.stdout.write('\r\x1b[K');
	process.stdout.write(`${coloredSpinner} ${message} │ ${progressBar} │ ${timeDisplay}`);
	animationFrame++;
};

/**
 * Cài đặt packages song song với giới hạn concurrent
 * @param {Array} packages - Danh sách packages cần cài
 */
const installPackagesParallel = async (packages) => {
	if (packages.length === 0) return;

	console.log(`\n${colors.yellow('📦')} Installing ${colors.white(packages.length)} missing packages...`);

	// Chia packages thành chunks để cài song song
	const chunks = [];
	for (let i = 0; i < packages.length; i += MAX_CONCURRENT_INSTALLS) {
		chunks.push(packages.slice(i, i + MAX_CONCURRENT_INSTALLS));
	}

	let installedCount = 0;
	let failedCount = 0;

	for (const chunk of chunks) {
		const promises = chunk.map(async (packageName) => {
			let animationInterval;

			try {
				// Bắt đầu animation cho package này
				animationInterval = setInterval(() => {
					displayLoadingProgress(`Installing ${colors.yellow(packageName)}`, 'info');
				}, 100);

				await exec(`npm install ${packageName} --save --silent`, {
					timeout: PACKAGE_INSTALL_TIMEOUT
				});

				clearInterval(animationInterval);
				process.stdout.write('\r\x1b[K');

				console.log(`${colors.green('✓')} ${colors.white(packageName)} ${colors.gray('installed successfully')}`);
				installedCount++;

				return { packageName, success: true };
			} catch (error) {
				if (animationInterval) clearInterval(animationInterval);
				process.stdout.write('\r\x1b[K');

				console.log(`${colors.red('✗')} ${colors.white(packageName)} ${colors.red('installation failed')}`);
				failedCount++;

				return { packageName, success: false, error };
			}
		});

		await Promise.allSettled(promises);
	}

	// Summary của việc cài đặt packages
	console.log(`\n${colors.cyan('Package installation summary:')}`);
	console.log(`${colors.green('✓')} Installed: ${colors.white(installedCount)}`);
	if (failedCount > 0) {
		console.log(`${colors.red('✗')} Failed: ${colors.white(failedCount)}`);
	}
	console.log('');
};

/**
 * Phân tích và lấy danh sách packages từ file
 * @param {string} contentFile - Nội dung file
 * @returns {Array} Danh sách packages cần cài
 */
const extractRequiredPackages = (contentFile) => {
	let allPackage = contentFile.match(regExpCheckPackage);
	const packagesToInstall = [];

	if (allPackage) {
		allPackage = allPackage
			.map(p => p.match(/[`'"]([^`'"]+)[`'"]/)[1])
			.filter(p => !p.startsWith('/') && !p.startsWith('./') && !p.startsWith('../') && !p.includes(__dirname));

		for (let packageName of allPackage) {
			// Xử lý scoped packages (@scope/package)  
			if (packageName.startsWith('@')) {
				packageName = packageName.split('/').slice(0, 2).join('/');
			} else {
				packageName = packageName.split('/')[0];
			}

			if (!packageAlready.has(packageName)) {
				packageAlready.add(packageName);
				if (!existsSync(`${process.cwd()}/node_modules/${packageName}`)) {
					packagesToInstall.push(packageName);
				}
			}
		}
	}

	return packagesToInstall;
};

/**
 * Validate cấu hình command
 * @param {Object} command - Command object
 * @param {string} text - Loại command (command/event command)
 * @param {string} commandName - Tên command
 */
const validateCommand = (command, text, commandName) => {
	const configCommand = command.config;

	if (!configCommand) throw new Error(`Missing config in ${text}`);
	if (!configCommand.category) throw new Error(`Missing category in ${text}`);
	if (!commandName) throw new Error(`Missing name in ${text}`);
	if (!command.onStart) throw new Error(`Missing onStart in ${text}`);
	if (typeof command.onStart !== "function") throw new Error(`onStart must be a function in ${text}`);

	if (GoatBot.commands.has(commandName) || GoatBot.eventCommands.has(commandName)) {
		const existingLocation = GoatBot.commands.get(commandName)?.location || GoatBot.eventCommands.get(commandName)?.location;
		throw new Error(`${text} "${commandName}" already exists in "${removeHomeDir(existingLocation || "")}"`);
	}
};

/**
 * Xử lý aliases của command
 * @param {Object} configCommand - Config của command
 * @param {string} commandName - Tên command
 * @param {string} text - Loại command
 * @returns {Array} Danh sách aliases hợp lệ
 */
const processAliases = (configCommand, commandName, text) => {
	const validAliases = [];

	if (configCommand.aliases) {
		if (!Array.isArray(configCommand.aliases)) {
			throw new Error("config.aliases must be an array");
		}

		// Check duplicate aliases trong cùng command
		const aliasSet = new Set();
		for (const alias of configCommand.aliases) {
			if (aliasSet.has(alias)) {
				throw new Error(`Duplicate alias "${alias}" in ${text} "${commandName}"`);
			}
			aliasSet.add(alias);

			if (GoatBot.aliases.has(alias)) {
				throw new Error(`Alias "${alias}" already exists in command "${GoatBot.aliases.get(alias)}"`);
			}
			validAliases.push(alias);
		}

		// Đăng ký aliases
		for (const alias of validAliases) {
			GoatBot.aliases.set(alias, commandName);
		}
	}

	return validAliases;
};

/**
 * Xử lý environment configs
 * @param {Object} configCommand - Config của command
 * @param {string} pathCommand - Đường dẫn file command
 * @param {string} commandName - Tên command
 * @param {string} typeEnvCommand - Loại env command
 */
const processEnvironmentConfig = (configCommand, pathCommand, commandName, typeEnvCommand) => {
	const { envGlobal, envConfig } = configCommand;

	// Xử lý envGlobal
	if (envGlobal) {
		if (typeof envGlobal !== "object" || Array.isArray(envGlobal)) {
			throw new Error("envGlobal must be an object");
		}

		for (const [key, value] of Object.entries(envGlobal)) {
			if (!configCommands.envGlobal[key]) {
				configCommands.envGlobal[key] = value;
			} else {
				// Update file với giá trị từ config
				const fileContent = readFileSync(pathCommand, "utf-8");
				const updatedContent = fileContent.replace(value, configCommands.envGlobal[key]);
				writeFileSync(pathCommand, updatedContent);
			}
		}
	}

	// Xử lý envConfig
	if (envConfig) {
		if (typeof envConfig !== "object" || Array.isArray(envConfig)) {
			throw new Error("envConfig must be an object");
		}

		if (!configCommands[typeEnvCommand]) configCommands[typeEnvCommand] = {};
		if (!configCommands[typeEnvCommand][commandName]) configCommands[typeEnvCommand][commandName] = {};

		for (const [key, value] of Object.entries(envConfig)) {
			if (!configCommands[typeEnvCommand][commandName][key]) {
				configCommands[typeEnvCommand][commandName][key] = value;
			} else {
				// Update file với giá trị từ config
				const fileContent = readFileSync(pathCommand, "utf-8");
				const updatedContent = fileContent.replace(value, configCommands[typeEnvCommand][commandName][key]);
				writeFileSync(pathCommand, updatedContent);
			}
		}
	}
};

/**
 * Load và xử lý một script file
 * @param {string} pathCommand - Đường dẫn file
 * @param {string} file - Tên file
 * @param {string} text - Loại command
 * @param {string} setMap - Map để set command
 * @param {string} typeEnvCommand - Loại env command
 * @param {string} folderModules - Thư mục chứa module
 */
const loadScriptFile = async (pathCommand, file, text, setMap, typeEnvCommand, folderModules) => {
	try {
		loadingStats.currentFile = file;

		// Đọc nội dung file và phân tích packages
		const contentFile = readFileSync(pathCommand, "utf8");
		const packagesToInstall = extractRequiredPackages(contentFile);

		// Cài đặt packages thiếu
		if (packagesToInstall.length > 0) {
			await installPackagesParallel(packagesToInstall);
		}

		// Load command và validate
		delete require.cache[require.resolve(pathCommand)];
		global.temp.contentScripts = global.temp.contentScripts || {};
		global.temp.contentScripts[folderModules] = global.temp.contentScripts[folderModules] || {};
		global.temp.contentScripts[folderModules][file] = contentFile;

		const command = require(pathCommand);
		command.location = pathCommand;

		const configCommand = command.config;
		const commandName = configCommand?.name;

		// Validate command
		validateCommand(command, text, commandName);

		// Xử lý aliases
		const validAliases = processAliases(configCommand, commandName, text);

		// Xử lý environment configs
		processEnvironmentConfig(configCommand, pathCommand, commandName, typeEnvCommand);

		// Execute onLoad function nếu có
		if (configCommand.onLoad && typeof configCommand.onLoad === "function") {
			await configCommand.onLoad({
				api, threadModel, userModel, dashBoardModel, globalModel,
				threadsData, usersData, dashBoardData, globalData
			});
		}

		// Đăng ký event handlers
		const { onChat, onFirstChat, onEvent, onAnyEvent } = configCommand;
		if (onChat) GoatBot.onChat.push(commandName);
		if (onFirstChat) GoatBot.onFirstChat.push({ commandName, threadIDsChattedFirstTime: [] });
		if (onEvent) GoatBot.onEvent.push(commandName);
		if (onAnyEvent) GoatBot.onAnyEvent.push(commandName);

		// Đăng ký command vào GoatBot
		GoatBot[setMap].set(commandName.toLowerCase(), command);

		// Lưu thông tin file path
		const filePathInfo = {
			filePath: path.normalize(pathCommand),
			commandName: [commandName, ...validAliases]
		};

		const pathArrayKey = folderModules === "cmds" ? "commandFilesPath" : "eventCommandsFilesPath";
		global.GoatBot[pathArrayKey] = global.GoatBot[pathArrayKey] || [];
		global.GoatBot[pathArrayKey].push(filePathInfo);

		return {
			success: true,
			name: file,
			commandName,
			aliases: validAliases,
			category: configCommand.category
		};

	} catch (error) {
		return {
			success: false,
			name: file,
			error: {
				message: error.message,
				stack: error.stack
			}
		};
	}
};

/**
 * Hiển thị header với style đẹp
 */
const displayHeader = () => {
	const headerLines = [
		'┌─────────────────────────────────────────────────────────┐',
		'│                  🚀 GOAT SCRIPT LOADER 🚀               │',
		'│                    Loading Commands...                  │',
		'└─────────────────────────────────────────────────────────┘'
	];

	console.log('');
	headerLines.forEach(line => console.log(colors.cyan(line)));
	console.log('');
};

/**
 * Hiển thị summary kết quả load
 * @param {string} folderType - Loại folder (commands/events)
 * @param {number} successCount - Số lượng thành công
 * @param {number} errorCount - Số lượng lỗi
 * @param {number} elapsed - Thời gian thực hiện
 */
const displaySummary = (folderType, successCount, errorCount, elapsed) => {
	console.log(colors.cyan('='.repeat(60)));
	console.log(`${colors.green('✓ Successfully loaded:')} ${colors.white(successCount)} files`);
	if (errorCount > 0) {
		console.log(`${colors.red('✗ Failed to load:')} ${colors.white(errorCount)} files`);
	}
	console.log(`${colors.blue('Total time:')} ${colors.white(elapsed)}s`);
	console.log(`${colors.yellow('Success rate:')} ${colors.white(Math.round((successCount / (successCount + errorCount)) * 100))}%`);
	console.log(colors.cyan('═'.repeat(60)));
};

/**
 * Hiển thị chi tiết lỗi
 * @param {Array} errors - Danh sách lỗi
 * @param {string} type - Loại command
 */
const displayErrors = (errors, type) => {
	if (errors.length === 0) return;

	console.log(`\n${colors.red('🚨 LOADING ERRORS:')}`);
	console.log(colors.red('─'.repeat(50)));

	errors.forEach((item, index) => {
		console.log(`\n${colors.red(`${index + 1}.`)} ${colors.yellow(item.name)}`);
		console.log(`   ${colors.red('└─')} ${colors.white(item.error.message)}`);

		if (process.env.NODE_ENV === 'development' && item.error.stack) {
			const stackLines = item.error.stack.split('\n').slice(1, 4);
			stackLines.forEach(line => {
				console.log(`      ${colors.gray(line.trim())}`);
			});
		}
	});
	console.log('');
};

/**
 * Main function - Load tất cả scripts
 */
module.exports = async function (api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData) {
	displayHeader();

	// Xử lý aliases từ database
	try {
		const aliasesData = await globalData.get('setalias', 'data', []);
		if (aliasesData && Array.isArray(aliasesData)) {
			for (const data of aliasesData) {
				const { aliases, commandName } = data;
				if (aliases && Array.isArray(aliases)) {
					for (const alias of aliases) {
						if (GoatBot.aliases.has(alias)) {
							console.log(`${colors.yellow('⚠️')} Alias "${alias}" already exists, skipping...`);
							continue;
						}
						GoatBot.aliases.set(alias, commandName);
					}
				}
			}
		}
	} catch (error) {
		console.log(`${colors.red('⚠️')} Error loading aliases: ${error.message}`);
	}

	const folders = ["cmds", "events"];
	let totalSuccess = 0;
	let totalErrors = 0;

	for (const folderModules of folders) {
		const folderConfig = {
			cmds: {
				text: "command",
				typeEnvCommand: "envCommands",
				setMap: "commands",
				displayName: "Commands"
			},
			events: {
				text: "event command",
				typeEnvCommand: "envEvents",
				setMap: "eventCommands",
				displayName: "Events"
			}
		};

		const { text, typeEnvCommand, setMap, displayName } = folderConfig[folderModules];
		const fullPathModules = path.normalize(`${process.cwd()}/scripts/${folderModules}`);

		// Filter files cần load
		const allFiles = readdirSync(fullPathModules);
		const validFiles = allFiles.filter(file => {
			const isJsFile = file.endsWith(".js");
			const isNotExample = !file.endsWith("eg.js");
			const isNotDev = process.env.NODE_ENV === "development" || !file.match(/(dev)\.js$/g);
			const isNotUnloaded = !configCommands[folderModules === "cmds" ? "commandUnload" : "commandEventUnload"]?.includes(file);

			return isJsFile && isNotExample && isNotDev && isNotUnloaded;
		});

		if (validFiles.length === 0) {
			console.log(`${colors.yellow('⚠️')} No ${text}s found in ${folderModules} folder\n`);
			continue;
		}

		// Reset loading stats
		loadingStats = {
			total: validFiles.length,
			loaded: 0,
			errors: 0,
			startTime: Date.now(),
			currentFile: ''
		};

		console.log(`${colors.blue('📁')} Loading ${colors.white(displayName)} from ${colors.cyan(folderModules)} folder`);
		console.log(`${colors.gray('Found')} ${colors.white(validFiles.length)} ${colors.gray('files to process')}\n`);

		const commandErrors = [];
		let commandLoadSuccess = 0;

		// Start loading animation
		const loadingInterval = setInterval(() => {
			if (loadingStats.currentFile) {
				displayLoadingProgress(`Loading ${colors.white(loadingStats.currentFile)}`, 'info');
			}
		}, 100);

		// Load files với Promise.allSettled để xử lý tốt hơn
		const results = await Promise.allSettled(
			validFiles.map(async (file) => {
				const pathCommand = path.normalize(`${fullPathModules}/${file}`);
				return await loadScriptFile(pathCommand, file, text, setMap, typeEnvCommand, folderModules);
			})
		);

		// Clear loading animation
		clearInterval(loadingInterval);
		process.stdout.write('\r\x1b[K');

		// Process results
		for (const result of results) {
			loadingStats.loaded++;

			if (result.status === 'fulfilled') {
				const { success, name, error, commandName, aliases, category } = result.value;

				if (success) {
					commandLoadSuccess++;
					const aliasText = aliases && aliases.length > 0 ? ` ${colors.gray(`[${aliases.join(', ')}]`)}` : '';
					console.log(`${colors.green('✓')} ${colors.white(name)} ${colors.gray('→')} ${colors.cyan(commandName)}${aliasText} ${colors.gray(`(${category})`)}`);
				} else {
					commandErrors.push({ name, error });
					console.log(`${colors.red('✗')} ${colors.white(name)} ${colors.red('failed to load')}`);
				}
			} else {
				commandErrors.push({ name: 'unknown', error: { message: result.reason?.message || 'Unknown error', stack: result.reason?.stack } });
				console.log(`${colors.red('✗')} ${colors.white('unknown')} ${colors.red('failed to load')}`);
			}
		}

		// Calculate statistics
		const elapsed = ((Date.now() - loadingStats.startTime) / 1000).toFixed(2);
		totalSuccess += commandLoadSuccess;
		totalErrors += commandErrors.length;

		// Display summary for this folder
		displaySummary(displayName, commandLoadSuccess, commandErrors.length, elapsed);

		// Display errors if any
		if (commandErrors.length > 0) {
			displayErrors(commandErrors, text);
		}
	}

	// Final summary
	console.log(`\n${colors.green('  SCRIPT LOADING COMPLETED!')}`);
	console.log(`${colors.white('Total loaded:')} ${colors.green(totalSuccess)} ${colors.gray('|')} ${colors.white('Total errors:')} ${colors.red(totalErrors)}`);
	console.log(`${colors.white('Overall success rate:')} ${colors.cyan(Math.round((totalSuccess / (totalSuccess + totalErrors)) * 100))}%\n`);
};