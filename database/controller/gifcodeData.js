const { existsSync, writeJsonSync, readJSONSync } = require("fs-extra");
const moment = require("moment-timezone");
const path = require("path");
const _ = require("lodash");
const { CustomError, TaskQueue, getType } = global.utils;

const optionsWriteJSON = {
	spaces: 2,
	EOL: "\n"
};

const taskQueue = new TaskQueue(function (task, callback) {
	if (getType(task) === "AsyncFunction") {
		task()
			.then(result => callback(null, result))
			.catch(err => callback(err));
	}
	else {
		try {
			const result = task();
			callback(null, result);
		}
		catch (err) {
			callback(err);
		}
	}
});

// Sử dụng một mảng riêng để quản lý việc tạo gift code
const { creatingGiftCodeData } = global.client.database;

module.exports = async function (databaseType, giftCodeModel, fakeGraphql) {
	let GiftCodesData = [];
	const pathGiftCodesData = path.join(__dirname, "..", "data/giftCodesData.json");

	switch (databaseType) {
		case "mongodb":
			GiftCodesData = (await giftCodeModel.find({}).lean()).map(item => _.omit(item, ["_id", "__v"]));
			break;
		case "sqlite":
			GiftCodesData = (await giftCodeModel.findAll()).map(item => item.get({ plain: true }));
			break;
		case "json":
			if (!existsSync(pathGiftCodesData))
				writeJsonSync(pathGiftCodesData, [], optionsWriteJSON);
			GiftCodesData = readJSONSync(pathGiftCodesData);
			break;
	}
	global.db.allGiftCodeData = GiftCodesData;

	async function save(code, data, mode, path) {
		try {
			const index = _.findIndex(global.db.allGiftCodeData, { code });
			if (index === -1 && mode === "update") {
				throw new CustomError({
					name: "CODE_NOT_FOUND",
					message: `Can't find data with code: "${code}" in database`
				});
			}

			switch (mode) {
				case "create": {
					switch (databaseType) {
						case "mongodb":
						case "sqlite": {
							let dataCreated = await giftCodeModel.create(data);
							dataCreated = databaseType == "mongodb" ?
								_.omit(dataCreated._doc, ["_id", "__v"]) :
								dataCreated.get({ plain: true });
							global.db.allGiftCodeData.push(dataCreated);
							return _.cloneDeep(dataCreated);
						}
						case "json": {
							const timeCreate = moment.tz().format();
							data.createdAt = timeCreate;
							data.updatedAt = timeCreate;
							global.db.allGiftCodeData.push(data);
							writeJsonSync(pathGiftCodesData, global.db.allGiftCodeData, optionsWriteJSON);
							return _.cloneDeep(data);
						}
					}
					break;
				}
				case "update": {
					const oldGiftCodeData = global.db.allGiftCodeData[index];
					const dataWillChange = {};

					if (Array.isArray(path) && Array.isArray(data)) {
						path.forEach((p, index) => {
							const _key = p.split(".")[0];
							dataWillChange[_key] = oldGiftCodeData[_key];
							_.set(oldGiftCodeData, p, data[index]);
						});
					}
					else if (path && (typeof path === "string" || Array.isArray(path))) {
						const _key = Array.isArray(path) ? path[0] : path.split(".")[0];
						dataWillChange[_key] = oldGiftCodeData[_key];
						_.set(dataWillChange, path, data);
					}
					else {
						for (const key in data) {
							dataWillChange[key] = data[key];
                        }
                    }

					switch (databaseType) {
						case "mongodb": {
							let dataUpdated = await giftCodeModel.findOneAndUpdate({ code }, dataWillChange, { returnDocument: 'after' });
							dataUpdated = _.omit(dataUpdated._doc, ["_id", "__v"]);
							global.db.allGiftCodeData[index] = dataUpdated;
							return _.cloneDeep(dataUpdated);
						}
						case "sqlite": {
							const getData = await giftCodeModel.findOne({ where: { code } });
							const dataUpdated = (await getData.update(dataWillChange)).get({ plain: true });
							global.db.allGiftCodeData[index] = dataUpdated;
							return _.cloneDeep(dataUpdated);
						}
						case "json": {
							dataWillChange.updatedAt = moment.tz().format();
							global.db.allGiftCodeData[index] = {
								...oldGiftCodeData,
								...dataWillChange
							};
							writeJsonSync(pathGiftCodesData, global.db.allGiftCodeData, optionsWriteJSON);
							return _.cloneDeep(global.db.allGiftCodeData[index]);
						}
					}
					break;
				}
				case "remove": {
					if (index != -1) {
						global.db.allGiftCodeData.splice(index, 1);
						if (databaseType == "mongodb")
							await giftCodeModel.deleteOne({ code });
						else if (databaseType == "sqlite")
							await giftCodeModel.destroy({ where: { code } });
						else
							writeJsonSync(pathGiftCodesData, global.db.allGiftCodeData, optionsWriteJSON);
					}
					break;
				}
			}
			return null;
		}
		catch (err) {
			throw err;
		}
	}

	async function create_(codeData) {
		const { code, rewardType, rewardValue } = codeData;

		if (!code || typeof code !== "string") {
			throw new CustomError({ name: "INVALID_CODE", message: "Code must be a non-empty string." });
		}
		if (!rewardType || typeof rewardType !== "string") {
			throw new CustomError({ name: "INVALID_REWARD_TYPE", message: "rewardType must be a non-empty string." });
		}
		if (rewardValue === undefined || typeof rewardValue !== "number") {
			throw new CustomError({ name: "INVALID_REWARD_VALUE", message: "rewardValue must be a number." });
		}

		const findInCreatingData = creatingGiftCodeData.find(u => u.code == code);
		if (findInCreatingData) {
			return findInCreatingData.promise;
		}

		const queue = new Promise(async function (resolve_, reject_) {
			try {
				if (global.db.allGiftCodeData.some(u => u.code == code)) {
					throw new CustomError({
						name: "CODE_EXISTS",
						message: `Data with code "${code}" already exists in the data`
					});
				}

				const createData = await save(code, codeData, "create");
				resolve_(_.cloneDeep(createData));
			} catch (err) {
				reject_(err);
			} finally {
				const findIndex = creatingGiftCodeData.findIndex(u => u.code == code);
				if (findIndex != -1) {
					creatingGiftCodeData.splice(findIndex, 1);
				}
			}
		});

		creatingGiftCodeData.push({
			code,
			promise: queue
		});
		return queue;
	}

	async function create(codeData) {
		return new Promise((resolve, reject) => {
			taskQueue.push(function () {
				create_(codeData)
					.then(resolve)
					.catch(reject);
			});
		});
	}
    
    // Hàm findOne để tiện sử dụng trong lệnh redeem
	async function findOne(code) {
		return new Promise((resolve, reject) => {
			taskQueue.push(function () {
				try {
					const codeData = global.db.allGiftCodeData.find(u => u.code === code);
					resolve(_.cloneDeep(codeData));
				} catch (err) {
					reject(err);
				}
			});
		});
	}

	async function get(code, path, defaultValue, query) {
		return new Promise((resolve, reject) => {
			taskQueue.push(async function() {
				try {
					if (!code || typeof code != "string") {
						throw new CustomError({
							name: "INVALID_CODE",
							message: `The first argument (code) must be a string, not a ${typeof code}`
						});
                    }
                    
					let dataReturn = global.db.allGiftCodeData.find(u => u.code == code);
					if (!dataReturn) {
						return resolve(undefined); // Gift code không tồn tại thì trả về undefined
					}

					if (query) {
						dataReturn = fakeGraphql(query, dataReturn);
                    }

					if (path) {
						if (!["string", "object"].includes(typeof path)) {
							throw new CustomError({ name: "INVALID_PATH" });
						}
						if (typeof path === "string") {
							return resolve(_.cloneDeep(_.get(dataReturn, path, defaultValue)));
						} else {
							return resolve(_.cloneDeep(path.map(p => _.get(dataReturn, p, defaultValue))));
						}
					}

					return resolve(_.cloneDeep(dataReturn));
				} catch(err) {
					reject(err);
				}
			});
		});
	}

	async function set(code, updateData, path, query) {
		return new Promise((resolve, reject) => {
			taskQueue.push(async function () {
				try {
					if (!path && (typeof updateData != "object" || Array.isArray(updateData))) {
						throw new CustomError({
							name: "INVALID_UPDATE_DATA",
							message: `The second argument (updateData) must be an object.`
						});
					}
					if (!global.db.allGiftCodeData.some(u => u.code == code)) {
						throw new CustomError({
							name: "CODE_NOT_FOUND",
							message: `Data with code "${code}" does not exist in the data`
						});
					}
					const setData = await save(code, updateData, "update", path);
					if (query) {
						return resolve(_.cloneDeep(fakeGraphql(query, setData)));
                    }
					return resolve(_.cloneDeep(setData));
				}
				catch (err) {
					reject(err);
				}
			});
		});
	}
    
	async function remove(code) {
		return new Promise((resolve, reject) => {
			taskQueue.push(async function () {
				try {
					if (typeof code != "string") {
						throw new CustomError({
							name: "INVALID_CODE",
							message: `The first argument (code) must be a string.`
						});
					}
					await save(code, { code }, "remove");
					return resolve(true);
				}
				catch (err) {
					reject(err);
				}
			});
		});
	}

	return {
		existsSync: function existsSync(code) {
			return global.db.allGiftCodeData.some(u => u.code == code);
		},
		create,
        findOne, // Thêm hàm này để tiện dùng
		get,
		set,
		remove
	};
};