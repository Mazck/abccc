module.exports = async function () {
	const { Sequelize } = require("sequelize");
	const path = __dirname + "/../data/data.sqlite";
	const sequelize = new Sequelize({
		dialect: "sqlite",
		host: path,
		logging: false
	});

	const threadModel = require("../models/sqlite/thread.js")(sequelize);
	const userModel = require("../models/sqlite/user.js")(sequelize);
	const dashBoardModel = require("../models/sqlite/userDashBoard.js")(sequelize);
	const globalModel = require("../models/sqlite/global.js")(sequelize);
	const paymentModel = require("../models/sqlite/payment.js")(sequelize);
	const gifcodeModel = require("../models/sqlite/giftCode.js")(sequelize);

	await sequelize.sync({ force: false });

	return {
		threadModel,
		userModel,
		dashBoardModel,
		globalModel,
		paymentModel,
		gifcodeModel,
		sequelize
	};
};