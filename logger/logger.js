var moment = require("moment-timezone");
var chalk = require("chalk");
var readline = require("readline");
var process = require("process");

var loadingID;
var prevLoadingData = '';
var prevUpdatableData = '';

function defaultLog(data, option) {
    var time = moment().utcOffset('+07:00').format('DD/MM HH:mm');
    console.log((prevUpdatableData ? '\n' : '') +
        "[ " + (option == 0 ? chalk.cyan.bold('INFO') : chalk.redBright.bold('ERRO')) +
        " ] <" + chalk.yellow.underline(time) + "> » " + data);
}
module.exports = defaultLog;

function updatableLog(data, option) {
    var clearMode = data.length > prevUpdatableData.length ? 1 : 0;
    prevUpdatableData = data;
    var time = moment().utcOffset('+07:00').format('DD/MM HH:mm');
    readline.clearLine(process.stdout, clearMode);
    readline.cursorTo(process.stdout, 0);
    return process.stdout.write("[ " + (option == 0 ? chalk.cyan.bold('INFO') : chalk.redBright.bold('ERRO')) +
        " ] <" + chalk.yellow.underline(time) + "> » " + data);
}
module.exports.updatableLog = updatableLog;

function loadingLog(data, option) {
    if (option == 'load') {
        var i = 0;
        var frames = [
            "LOAD",
            "OADI",
            "ADIN",
            "DING",
            "INGL",
            "NGLO",
            "GLOA"
        ];
        loadingID = setInterval(function () {
            var frame = frames[i = ++i % frames.length];
            readline.clearLine(process.stdout, 1);
            readline.cursorTo(process.stdout, 0);
            process.stdout.write("[ " + chalk.blue.bold(frame) + " ] " + data);
        }, 150);
    } else if (option == 'done' || option == 'fail') {
        var clearMode = data.length > prevLoadingData.length ? 1 : 0;
        prevLoadingData = data;
        clearInterval(loadingID);
        readline.clearLine(process.stdout, clearMode);
        readline.cursorTo(process.stdout, 0);
        return process.stdout.write("[ " + (option == 'done' ? chalk.green.bold('DONE') : chalk.red.bold('FAIL')) + " ] " + data + "\n");
    }
}
module.exports.loadingLog = loadingLog;
