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

const { creatingPaymentData } = global.client.database;

module.exports = async function (databaseType, paymentModel, api, fakeGraphql) {
    let Payments = [];
    const pathPaymentsData = path.join(__dirname, "..", "data/paymentsData.json");

    switch (databaseType) {
        case "mongodb": {
            // delete keys '_id' and '__v' in all payments
            Payments = (await paymentModel.find({}).lean()).map(payment => _.omit(payment, ["_id", "__v"]));
            break;
        }
        case "sqlite": {
            Payments = (await paymentModel.findAll()).map(payment => payment.get({ plain: true }));
            break;
        }
        case "json": {
            if (!existsSync(pathPaymentsData))
                writeJsonSync(pathPaymentsData, [], optionsWriteJSON);
            Payments = readJSONSync(pathPaymentsData);
            break;
        }
    }

    global.db.allPaymentData = Payments;

    async function save(transactionId, paymentData, mode, path) {
        try {
            console.log(`Saving payment data for transactionId: ${transactionId}, mode: ${mode}`);
            let index = _.findIndex(global.db.allPaymentData, { transactionId });
            if (index === -1 && mode === "update") {
                throw new CustomError({
                    name: "PAYMENT_NOT_EXIST",
                    message: `Can't find payment with transactionId: ${transactionId} in database`
                });
            }

            switch (mode) {
                case "create": {
                    switch (databaseType) {
                        case "mongodb":
                        case "sqlite": {
                            let dataCreated = await paymentModel.create(paymentData);
                            dataCreated = databaseType == "mongodb" ?
                                _.omit(dataCreated._doc, ["_id", "__v"]) :
                                dataCreated.get({ plain: true });
                            global.db.allPaymentData.push(dataCreated);
                            return _.cloneDeep(dataCreated);
                        }
                        case "json": {
                            const timeCreate = moment.tz().format();
                            paymentData.createdAt = timeCreate;
                            paymentData.updatedAt = timeCreate;
                            global.db.allPaymentData.push(paymentData);
                            writeJsonSync(pathPaymentsData, global.db.allPaymentData, optionsWriteJSON);
                            return _.cloneDeep(paymentData);
                        }
                        default: {
                            break;
                        }
                    }
                    break;
                }
                case "update": {
                    const oldPaymentData = global.db.allPaymentData[index];
                    const dataWillChange = {};

                    if (Array.isArray(path) && Array.isArray(paymentData)) {
                        path.forEach((p, index) => {
                            const key = p.split(".")[0];
                            dataWillChange[key] = oldPaymentData[key];
                            _.set(dataWillChange, p, paymentData[index]);
                        });
                    }
                    else
                        if (path && typeof path === "string" || Array.isArray(path)) {
                            const key = Array.isArray(path) ? path[0] : path.split(".")[0];
                            dataWillChange[key] = oldPaymentData[key];
                            _.set(dataWillChange, path, paymentData);
                        }
                        else
                            for (const key in paymentData)
                                dataWillChange[key] = paymentData[key];

                    switch (databaseType) {
                        case "mongodb": {
                            let dataUpdated = await paymentModel.findOneAndUpdate({ transactionId }, dataWillChange, { returnDocument: 'after' });
                            dataUpdated = _.omit(dataUpdated._doc, ["_id", "__v"]);
                            global.db.allPaymentData[index] = dataUpdated;
                            return _.cloneDeep(dataUpdated);
                        }
                        case "sqlite": {
                            const payment = await paymentModel.findOne({ where: { transactionId } });
                            const dataUpdated = (await payment.update(dataWillChange)).get({ plain: true });
                            global.db.allPaymentData[index] = dataUpdated;
                            return _.cloneDeep(dataUpdated);
                        }
                        case "json": {
                            dataWillChange.updatedAt = moment.tz().format();
                            global.db.allPaymentData[index] = {
                                ...oldPaymentData,
                                ...dataWillChange
                            };
                            writeJsonSync(pathPaymentsData, global.db.allPaymentData, optionsWriteJSON);
                            return _.cloneDeep(global.db.allPaymentData[index]);
                        }
                        default:
                            break;
                    }
                    break;
                }
                case "delete": {
                    if (index != -1) {
                        global.db.allPaymentData.splice(index, 1);
                        switch (databaseType) {
                            case "mongodb":
                                await paymentModel.deleteOne({ transactionId });
                                break;
                            case "sqlite":
                                await paymentModel.destroy({ where: { transactionId } });
                                break;
                            case "json":
                                writeJsonSync(pathPaymentsData, global.db.allPaymentData, optionsWriteJSON);
                                break;
                            default:
                                break;
                        }
                    }
                    break;
                }
                default: {
                    break;
                }
            }
            return null;
        }
        catch (err) {
            throw err;
        }
    }

    async function create_(paymentInfo) {
        const { transactionId, threadID, amount, paymentLinkId, description = null, rawData } = paymentInfo;

        if (!transactionId || typeof transactionId !== "string" || !transactionId.trim()) {
            throw new CustomError({
                name: "INVALID_TRANSACTION_ID",
                message: `transactionId must be a non-empty string`
            });
        }

        const findInCreatingData = creatingPaymentData.find(p => p.transactionId === transactionId);
        if (findInCreatingData)
            return findInCreatingData.promise;

        const queue = new Promise(async function (resolve_, reject_) {
            try {
                if (global.db.allPaymentData.some(p => p.transactionId === transactionId)) {
                    throw new CustomError({
                        name: "DATA_ALREADY_EXISTS",
                        message: `Payment with transactionId "${transactionId}" already exists in the data`
                    });
                }

                if (!threadID || !amount || !paymentLinkId) {
                    throw new CustomError({
                        name: "MISSING_REQUIRED_FIELDS",
                        message: `Missing required fields: threadID, amount, paymentLinkId`
                    });
                }

                let paymentData = {
                    transactionId: transactionId,
                    threadID: threadID.toString(),
                    amount: parseInt(amount),
                    status: 'PENDING',
                    paymentLinkId,
                    paymentTime: null,
                    description,
                    rawData
                };

                paymentData = await save(transactionId, paymentData, "create");
                resolve_(_.cloneDeep(paymentData));
            } catch (err) {
                reject_(err);
            } finally {
                const idx = creatingPaymentData.findIndex(p => p.transactionId === transactionId);
                if (idx !== -1) creatingPaymentData.splice(idx, 1);
            }
        });

        creatingPaymentData.push({
            transactionId,
            promise: queue
        });

        return queue;
    }


    async function create(paymentInfo) {
        return new Promise(function (resolve, reject) {
            taskQueue.push(async function () {
                create_(paymentInfo)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    async function updatePaymentStatus(transactionId, status, paymentTime = null, rawData = null) {
        return new Promise(function (resolve, reject) {
            taskQueue.push(async function () {
                try {
                    if (typeof transactionId !== "string" || !transactionId.trim()) {
                        throw new CustomError({
                            name: "INVALID_TRANSACTION_ID",
                            message: `The first argument (transactionId) must be a non-empty string, not a ${typeof transactionId}`
                        });
                    }

                    const validStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
                    if (!validStatuses.includes(status)) {
                        throw new CustomError({
                            name: "INVALID_STATUS",
                            message: `Status must be one of: ${validStatuses.join(', ')}`
                        });
                    }

                    const updateData = { status };
                    if (paymentTime) updateData.paymentTime = paymentTime;
                    if (rawData) updateData.rawData = rawData;

                    const paymentData = await save(transactionId, updateData, "update");
                    return resolve(_.cloneDeep(paymentData));
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }

    function getAll(path, defaultValue, query) {
        return new Promise(async function (resolve, reject) {
            taskQueue.push(async function () {
                try {
                    let dataReturn = _.cloneDeep(global.db.allPaymentData);

                    if (query)
                        if (typeof query !== "string")
                            throw new CustomError({
                                name: "INVALID_QUERY",
                                message: `The third argument (query) must be a string, not a ${typeof query}`
                            });
                        else
                            dataReturn = dataReturn.map(pData => fakeGraphql(query, pData));

                    if (path)
                        if (!["string", "object"].includes(typeof path))
                            throw new CustomError({
                                name: "INVALID_PATH",
                                message: `The first argument (path) must be a string or an object, not a ${typeof path}`
                            });
                        else
                            if (typeof path === "string")
                                return resolve(dataReturn.map(pData => _.get(pData, path, defaultValue)));
                            else
                                return resolve(dataReturn.map(pData => _.times(path.length, i => _.get(pData, path[i], defaultValue[i]))));

                    return resolve(dataReturn);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }

    async function get_(transactionId,paymentInfo, path, defaultValue, query) {
        console.log(transactionId)
        if (typeof transactionId !== "string" || !transactionId.trim()) {
            throw new CustomError({
                name: "INVALID_TRANSACTION_ID",
                message: `The first argument (transactionId) must be a non-empty string, not a ${typeof transactionId}`
            });
        }

        const index = global.db.allPaymentData.findIndex(p => p.transactionId == transactionId);
        if (index === -1) {
            throw new CustomError({
                name: "PAYMENT_NOT_FOUND",
                message: `Payment with transactionId "${transactionId.transactionId}" not found`
            });
        }

        let paymentData = global.db.allPaymentData[index];

        if (query)
            if (typeof query != "string")
                throw new CustomError({
                    name: "INVALID_QUERY",
                    message: `The fourth argument (query) must be a string, not a ${typeof query}`
                });
            else
                paymentData = fakeGraphql(query, paymentData);

        if (path)
            if (!["string", "object"].includes(typeof path))
                throw new CustomError({
                    name: "INVALID_PATH",
                    message: `The second argument (path) must be a string or an object, not a ${typeof path}`
                });
            else
                if (typeof path === "string")
                    return _.cloneDeep(_.get(paymentData, path, defaultValue));
                else
                    return _.cloneDeep(_.times(path.length, i => _.get(paymentData, path[i], defaultValue[i])));

        return _.cloneDeep(paymentData);
    }

    async function get(transactionId, paymentInfo, path, defaultValue, query) {
        return new Promise(async function (resolve, reject) {
            taskQueue.push(function () {
                get_(transactionId, paymentInfo, path, defaultValue, query)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    async function getByThreadID(threadID, query) {
        return new Promise(async function (resolve, reject) {
            taskQueue.push(async function () {
                try {
                    if (!threadID) {
                        throw new CustomError({
                            name: "INVALID_THREAD_ID",
                            message: `The first argument (threadID) must be provided`
                        });
                    }

                    let dataReturn = _.cloneDeep(global.db.allPaymentData.filter(p => p.threadID == threadID.toString()));

                    if (query)
                        if (typeof query !== "string")
                            throw new CustomError({
                                name: "INVALID_QUERY",
                                message: `The second argument (query) must be a string, not a ${typeof query}`
                            });
                        else
                            dataReturn = dataReturn.map(pData => fakeGraphql(query, pData));

                    return resolve(dataReturn);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }

    async function set(transactionId, updateData, path, query) {
        return new Promise(async function (resolve, reject) {
            taskQueue.push(async function () {
                try {
                    if (typeof transactionId !== "string" || !transactionId.trim()) {
                        throw new CustomError({
                            name: "INVALID_TRANSACTION_ID",
                            message: `The first argument (transactionId) must be a non-empty string, not a ${typeof transactionId}`
                        });
                    }
                    if (!path && (typeof updateData != "object" || Array.isArray(updateData)))
                        throw new CustomError({
                            name: "INVALID_UPDATE_DATA",
                            message: `The second argument (updateData) must be an object, not a ${typeof updateData}`
                        });
                    const paymentData = await save(transactionId, updateData, "update", path);
                    if (query)
                        if (typeof query !== "string")
                            throw new CustomError({
                                name: "INVALID_QUERY",
                                message: `The fourth argument (query) must be a string, not a ${typeof query}`
                            });
                        else
                            return resolve(_.cloneDeep(fakeGraphql(query, paymentData)));
                    return resolve(_.cloneDeep(paymentData));
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }

    async function deleteKey(transactionId, path, query) {
        return new Promise(async function (resolve, reject) {
            taskQueue.push(async function () {
                try {
                    if (typeof transactionId !== "string" || !transactionId.trim()) {
                        throw new CustomError({
                            name: "INVALID_TRANSACTION_ID",
                            message: `The first argument (transactionId) must be a non-empty string, not a ${typeof transactionId}`
                        });
                    }
                    if (typeof path !== "string")
                        throw new CustomError({
                            name: "INVALID_PATH",
                            message: `The second argument (path) must be a string, not a ${typeof path}`
                        });
                    const spitPath = path.split(".");
                    if (spitPath.length == 1)
                        throw new CustomError({
                            name: "INVALID_PATH",
                            message: `Can't delete key "${path}" because it's a root key`
                        });
                    const parent = spitPath.slice(0, spitPath.length - 1).join(".");
                    const parentData = await get_(transactionId, parent);
                    if (!parentData)
                        throw new CustomError({
                            name: "KEY_NOT_FOUND",
                            message: `Can't find key "${parent}" in payment with transactionId: ${transactionId}`
                        });

                    _.unset(parentData, spitPath[spitPath.length - 1]);
                    const setData = await save(transactionId, parentData, "update", parent);
                    if (query)
                        if (typeof query !== "string")
                            throw new CustomError({
                                name: "INVALID_QUERY",
                                message: `The fourth argument (query) must be a string, not a ${typeof query}`
                            });
                        else
                            return resolve(_.cloneDeep(fakeGraphql(query, setData)));
                    return resolve(_.cloneDeep(setData));
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }

    async function remove(transactionId) {
        return new Promise(async function (resolve, reject) {
            taskQueue.push(async function () {
                try {
                    if (typeof transactionId !== "string" || !transactionId.trim()) {
                        throw new CustomError({
                            name: "INVALID_TRANSACTION_ID",
                            message: `The first argument (transactionId) must be a non-empty string, not a ${typeof transactionId}`
                        });
                    }
                    await save(transactionId, { transactionId }, "delete");
                    return resolve(true);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }

    return {
        existsSync: function existsSync(transactionId) {
            return global.db.allPaymentData.some(p => p.transactionId == transactionId);
        },
        create,
        updatePaymentStatus,
        getAll,
        get,
        getByThreadID,
        set,
        deleteKey,
        remove,
        findByTransactionId: function (transactionId) {
            if (typeof transactionId !== "string" || !transactionId.trim()) {
                throw new CustomError({
                    name: "INVALID_TRANSACTION_ID",
                    message: `The argument (transactionId) must be a non-empty string, not a ${typeof transactionId}`
                });
            }
            const payment = global.db.allPaymentData.find(p => p.transactionId === transactionId);
            return payment ? _.cloneDeep(payment) : null;
        }

    };
};