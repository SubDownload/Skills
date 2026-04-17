/**
 * Browser-based Google login → API key → configure MCP server.
 * Supports: Claude Code, Claude Desktop, Cursor, Windsurf, Codex, Gemini CLI, etc.
 */

const http = require('http');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');

const API_HOST = 'https://api.subdownload.com';
const home = os.homedir();

// ── Client definitions ─────────────────────────────────────────────
const CLIENTS = [
  {
    name: 'Claude Code',
    configPath: () => path.join(home, '.claude', '.mcp.json'),
    detect: () => {
      try { execSync('which claude', { stdio: 'pipe' }); return true; } catch (_) { return false; }
    },
  },
  {
    name: 'Cursor',
    configPath: () => path.join(home, '.cursor', 'mcp.json'),
    detect: () => fs.existsSync(path.join(home, '.cursor')),
  },
  {
    name: 'Windsurf',
    configPath: () => path.join(home, '.codeium', 'windsurf', 'mcp_config.json'),
    detect: () => fs.existsSync(path.join(home, '.codeium', 'windsurf')),
  },
  {
    name: 'Codex',
    configPath: () => path.join(home, '.codex', 'mcp.json'),
    detect: () => fs.existsSync(path.join(home, '.codex')),
  },
  {
    name: 'Gemini CLI',
    configPath: () => path.join(home, '.gemini', 'settings.json'),
    detect: () => {
      try { execSync('which gemini', { stdio: 'pipe' }); return true; } catch (_) { return false; }
    },
    // Gemini CLI uses a different config format
    writeConfig: (apiKey, configPath) => {
      let config = {};
      try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (_) {}
      if (!config.mcpServers) config.mcpServers = {};
      config.mcpServers.subdownload = {
        httpUrl: `${API_HOST}/mcp`,
        headers: { Authorization: `Bearer ${apiKey}` },
      };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    },
  },
];

module.exports = function login() {
  // Detect installed clients
  const detected = CLIENTS.filter(c => c.detect());

  if (!process.stdin.isTTY || detected.length === 1) {
    // Non-interactive or only one client — auto-select
    const targets = detected.length > 0 ? detected : [CLIENTS[0]];
    startAuth(targets);
    return;
  }

  if (detected.length === 0) {
    console.log('\nNo supported clients detected. Configuring for Claude Code by default.');
    startAuth([CLIENTS[0]]);
    return;
  }

  // Interactive: let user choose
  console.log('\nDetected clients:');
  detected.forEach((c, i) => console.log(`  ${i + 1}) ${c.name}`));
  console.log(`  a) All of the above`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('\nConfigure MCP for which client? [a] ', (answer) => {
    rl.close();
    answer = answer.trim().toLowerCase() || 'a';
    if (answer === 'a') {
      startAuth(detected);
    } else {
      const idx = parseInt(answer, 10) - 1;
      if (idx >= 0 && idx < detected.length) {
        startAuth([detected[idx]]);
      } else {
        console.log('Invalid choice, configuring all.');
        startAuth(detected);
      }
    }
  });
};

function startAuth(targets) {
  const state = crypto.randomBytes(16).toString('hex');
  let settled = false;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname !== '/callback') {
      res.writeHead(404);
      res.end();
      return;
    }

    const token = url.searchParams.get('token');
    const returnedState = url.searchParams.get('state');

    if (returnedState !== state) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h2>State mismatch. Please try again.</h2>');
      return;
    }

    if (!token) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h2>No token received. Please try again.</h2>');
      return;
    }

    // Success page
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Connection': 'close' });
    res.end(successHTML);

    settled = true;
    configureMCP(token, targets);
    server.closeAllConnections();
    server.close(() => process.exit(0));
  });

  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    const authURL = `${API_HOST}/cli/auth?port=${port}&state=${state}`;

    console.log('\nOpening browser for sign-in...');
    console.log(`If it doesn't open, visit: ${authURL}\n`);

    openBrowser(authURL);

    setTimeout(() => {
      if (!settled) {
        console.log('\n\u26A0  Login timed out (3 min). Run again: npx @subdown/skill@latest login\n');
        server.close();
        process.exit(0);
      }
    }, 180000);
  });

  server.on('error', (err) => {
    console.error(`\n\u2717 Could not start local server: ${err.message}`);
    console.log('  Run again: npx @subdown/skill@latest login\n');
    process.exit(1);
  });
}

function configureMCP(apiKey, targets) {
  console.log('\u2713 API key received!\n');

  for (const client of targets) {
    writeMCPConfig(apiKey, client);
  }

  const names = targets.map(t => t.name).join(', ');
  console.log(`\nYou're all set! Restart your client and try:`);
  console.log('  "Summarize https://youtu.be/dQw4w9WgXcQ"');
  console.log('  "Latest videos from @mkbhd"\n');
}

function writeMCPConfig(apiKey, client) {
  const configPath = client.configPath();
  const dir = path.dirname(configPath);

  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}

  if (client.writeConfig) {
    // Client has custom write logic
    client.writeConfig(apiKey, configPath);
  } else {
    // Standard mcpServers format
    let config = {};
    try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (_) {}
    if (!config.mcpServers) config.mcpServers = {};
    config.mcpServers.subdownload = {
      url: `${API_HOST}/mcp`,
      headers: { Authorization: `Bearer ${apiKey}` },
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  }

  console.log(`  \u2713 ${client.name} \u2192 ${configPath}`);
}

function openBrowser(url) {
  try {
    if (process.platform === 'darwin') {
      execSync(`open "${url}"`, { stdio: 'ignore' });
    } else if (process.platform === 'win32') {
      execSync(`start "" "${url}"`, { stdio: 'ignore' });
    } else {
      execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
    }
  } catch (_) {}
}

const successHTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>SubDownload - Success</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e0e0e0;display:flex;justify-content:center;align-items:center;min-height:100vh}
.card{background:#141414;border:1px solid #222;border-radius:16px;padding:40px;max-width:420px;width:90%;text-align:center}
.logo{font-size:48px;margin-bottom:16px}
h1{font-size:22px;color:#4ade80;margin-bottom:12px}
p{color:#888;font-size:14px;line-height:1.6}
</style></head><body>
<div class="card">
<div class="logo">\u2705</div>
<h1>You're all set!</h1>
<p>API key configured. You can close this tab<br>and return to your terminal.</p>
</div></body></html>`;
