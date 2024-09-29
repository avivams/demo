const fs = require('fs');
const path = require('path');

const isTest = process.env.NODE_ENV === 'test';

(() => {
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)){
        fs.mkdirSync(logsDir, { recursive: true });
    }
})();

const logFilePath = path.join(__dirname, 'logs', 'error.log');
const successLogFilePath = path.join(__dirname, 'logs', 'success.log');

const logError = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ERROR: ${message}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) console.error('Failed to write to error log file', err);
    });
};

const logSuccess = (message, data) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - SUCCESS: ${message || ""} - ${JSON.stringify(data)}\n`;
    fs.appendFile(successLogFilePath, logMessage, (err) => {
        if (err) console.error('Failed to write to success log file', err);
    });
};

module.exports = isTest ? {
    logError: () => {},
    logSuccess: () => {}
} : {
    logError,
    logSuccess
};
