const bunyan = require('bunyan');
const bformat = require('bunyan-format');

const logLevel = process.env.LOG_LEVEL;
const isJsonLogs = process.env.IS_JSON_LOGS === 'true';

const outputMode = isJsonLogs ? 'bunyan' : 'short';

const formatOut = bformat({ outputMode: outputMode, levelInString: true });

function createLog(groupName, fileName) {
  return bunyan.createLogger({
    name: fileName,
    level: logLevel, // 'debug' < 'info' < 'warn' < 'error' < 'fatal'
    stream: formatOut,
    src: true,
    // Additional
    group: groupName,
  });
}

module.exports = { createLog };
