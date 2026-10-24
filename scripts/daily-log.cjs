const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

function localDateTime(date) {
  const pad = (value, length = 2) => String(value).padStart(length, '0');
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const zone = `${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;

  return { date: datePart, timestamp: `${datePart}T${timePart}${zone}` };
}

function appendDailyLog(level, message) {
  const now = localDateTime(new Date());
  const logDirectory = path.join(projectRoot, 'logs');
  const filename = path.join(logDirectory, `motor_web-${now.date}.log`);

  fs.mkdirSync(logDirectory, { recursive: true });
  fs.appendFileSync(filename, `${now.timestamp} [${level}] ${message}${os.EOL}`, 'utf8');
  return now.timestamp;
}

module.exports = { appendDailyLog };
