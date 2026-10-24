const { spawn } = require('child_process');
const net = require('net');
const os = require('os');
const path = require('path');
const { appendDailyLog } = require('./daily-log.cjs');

const projectRoot = path.resolve(__dirname, '..');
const port = 8081;
let child;
let logFailed = false;

function writeLog(level, message) {
  if (logFailed) return false;

  let timestamp;

  try {
    timestamp = appendDailyLog(level, message);
  } catch (error) {
    logFailed = true;
    process.stderr.write(`Unable to write development log: ${error.message}${os.EOL}`);
    if (child && child.exitCode === null) child.kill();
    process.exitCode = 1;
    return false;
  }

  process.stdout.write(`${timestamp} [${level}] ${message}${os.EOL}`);
  return true;
}

function startServer() {
  writeLog('INFO', 'Starting Motor Web development server.');
  writeLog('INFO', 'Open https://localhost:8081/ (or https://motor.web:8081/).');
  writeLog('INFO', 'Press Ctrl+C to stop.');

  const portCheck = net.createServer();
  portCheck.once('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      writeLog('ERROR', `Port ${port} is already in use. Stop the process using it and try again.`);
    } else {
      writeLog('ERROR', `Unable to check port ${port}: ${error.message}`);
    }
    process.exitCode = 1;
  });

  portCheck.listen(port, () => {
    portCheck.close((error) => {
      if (error) {
        writeLog('ERROR', `Unable to release port ${port} after checking it: ${error.message}`);
        process.exitCode = 1;
        return;
      }

      child = spawn('npm', ['run', 'dev'], {
        cwd: projectRoot,
        shell: true,
        stdio: 'inherit',
      });

      child.once('error', (error) => {
        writeLog('ERROR', `Unable to start the development server: ${error.message}`);
        process.exitCode = 1;
      });

      child.once('close', (code, signal) => {
        if (code !== 0) {
          writeLog('ERROR', `Development server exited with code ${code === null ? signal : code}.`);
        } else {
          writeLog('INFO', 'Development server stopped.');
        }

        if (!logFailed) process.exitCode = code === null ? 1 : code;
      });
    });
  });
}

if (!writeLog('INFO', 'Development launcher started.')) {
  process.exit(1);
} else {
  startServer();
}
