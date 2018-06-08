const bunyan = require('bunyan');
const bformat = require('bunyan-format');

const logLevel = process.env.LOG_LEVEL;
const isJsonLogs = process.env.IS_JSON_LOGS === 'true';

const outputMode = isJsonLogs ? 'bunyan' : 'short';

const formatOut = bformat({ outputMode: outputMode, levelInString: true });

function createLog(name, filename) {
  return bunyan.createLogger({
    name: name,
    filename: filename,
    level: logLevel, // 'debug' < 'info' < 'warn' < 'error' < 'fatal'
    stream: formatOut
  });
}

module.exports = { createLog };
