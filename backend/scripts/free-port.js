const { execSync } = require('child_process');

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  } catch {
    return '';
  }
}

function getPidsOnWindows(port) {
  const out = run(`netstat -ano -p tcp | findstr :${port}`);
  if (!out) return [];

  const pids = new Set();
  const lines = out.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    // Typical format: TCP    0.0.0.0:5000   0.0.0.0:0   LISTENING   12345
    if (!line.toUpperCase().includes('LISTENING')) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (/^\d+$/.test(pid)) pids.add(pid);
  }
  return [...pids];
}

function getPidsOnUnix(port) {
  const out = run(`lsof -ti tcp:${port}`);
  if (!out) return [];
  return out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s));
}

function killPid(pid) {
  if (process.platform === 'win32') {
    run(`taskkill /PID ${pid} /F`);
  } else {
    run(`kill -9 ${pid}`);
  }
}

function main() {
  const port = process.argv[2] || process.env.PORT || '5000';
  const pids = process.platform === 'win32' ? getPidsOnWindows(port) : getPidsOnUnix(port);

  if (pids.length === 0) {
    console.log(`[predev] port ${port} is free`);
    return;
  }

  for (const pid of pids) {
    killPid(pid);
    console.log(`[predev] killed pid ${pid} on port ${port}`);
  }
}

main();
