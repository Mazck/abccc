const { spawn } = require("child_process");
const log = require("./logger/log.js");

let child;
let isExiting = false;

function startProject() {
	child = spawn("node", ["Goat.js"], {
		cwd: __dirname,
		stdio: "inherit",
	});

	child.on("close", (code) => {
		if (!isExiting) {
			log.warn(`Goat.js đã dừng với mã thoát: ${code}.`);
			if (code === 2) {
				log.info("Đang khởi động lại Goat.js...");
				startProject();
			} else {
				log.error("Goat.js đã dừng. Sẽ không tự khởi động lại.");
			}
		}
	});

	child.on('error', (error) => {
		log.error(`Không thể khởi động Goat.js: ${error.message}`);
	});
}

startProject();