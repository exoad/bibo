#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PID_FILE = join(process.env.HOME || '/tmp', '.pi', 'dashboard.pid');

function ensurePiDir() {
  const piDir = join(process.env.HOME || '/tmp', '.pi');
  if (!existsSync(piDir)) {
    require('node:fs').mkdirSync(piDir, { recursive: true });
  }
}

function getPid() {
  try {
    const pid = readFileSync(PID_FILE, 'utf8').trim();
    return pid;
  } catch {
    return null;
  }
}

function isRunning(pid) {
  try {
    require('node:os').type(); // just to verify node:os works
    const { execSync } = require('node:child_process');
    try {
      execSync(`kill -0 ${pid}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  } catch {
    // Fallback: try on different platforms
    try {
      const { execSync } = require('node:child_process');
      execSync(`ps -p ${pid}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

function stop(pid) {
  if (pid && isRunning(pid)) {
    console.log(`Stopping dashboard (PID ${pid})...`);
    try {
      require('node:child_process').execSync(`kill ${pid}`, { stdio: 'ignore' });
    } catch (e) {
      console.error(`Failed to kill: ${e.message}`);
    }
  }
  if (existsSync(PID_FILE)) {
    unlinkSync(PID_FILE);
  }
  console.log('Dashboard stopped.');
}

function main() {
  const cmd = process.argv[2];

  if (cmd === 'stop') {
    const pid = getPid();
    if (!pid) {
      console.log('Dashboard is not running.');
      process.exit(0);
    }
    stop(pid);
    process.exit(0);
  }

  if (cmd === 'status') {
    const pid = getPid();
    if (!pid) {
      console.log('Dashboard is not running.');
      process.exit(0);
    }
    if (isRunning(pid)) {
      console.log(`Dashboard is running (PID ${pid}) on http://localhost:3000`);
    } else {
      console.log('Dashboard process not found. Stale PID file.');
      unlinkSync(PID_FILE);
    }
    process.exit(0);
  }

  if (cmd === 'launch') {
    ensurePiDir();
    const existingPid = getPid();
    if (existingPid && isRunning(existingPid)) {
      console.log(`Dashboard is already running (PID ${existingPid}).`);
      console.log('Run `bibo-dashboard stop` first, or use `--force`.');
      process.exit(1);
    }

    // Kill stale process if any
    if (existingPid) {
      stop(existingPid);
    }

    console.log('Starting Bibo Dashboard...');
    const server = spawn('node', [join(ROOT, 'src', 'server.js')], {
      cwd: ROOT,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    server.on('spawn', () => {
      writeFileSync(PID_FILE, String(server.pid));
      console.log(`Dashboard started (PID ${server.pid}) on http://localhost:3000`);

      // Open browser after a short delay
      setTimeout(() => {
        const { execSync } = require('node:child_process');
        const os = require('node:os');
        const platform = os.platform();
        try {
          if (platform === 'darwin') {
            execSync('open http://localhost:3000', { stdio: 'ignore' });
          } else if (platform === 'linux') {
            execSync('xdg-open http://localhost:3000', { stdio: 'ignore' });
          } else {
            execSync('start http://localhost:3000', { stdio: 'ignore' });
          }
        } catch (e) {
          console.log(`Browser not opened automatically. Visit: http://localhost:3000`);
        }
      }, 500);
    });

    server.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    process.on('SIGINT', () => {
      stop(String(server.pid));
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      stop(String(server.pid));
      process.exit(0);
    });
  } else {
    console.log('Usage: node bin/cli.js <launch|stop|status>');
    process.exit(1);
  }
}

main();
