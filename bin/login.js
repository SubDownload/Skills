/**
 * Browser-based Google login → API key → configure MCP for every
 * detected agent. Source (client id) and CLI version are sent with both
 * the auth request and every subsequent MCP request so the server can
 * attribute traffic to the originating agent.
 */

const http = require('http');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');

const { CLIENTS, getClient, detectInstalled } = require('./clients');
const pkg = require('../package.json');

const API_HOST = 'https://api.subdownload.com';
const VERSION = pkg.version;

function parseArgs(argv) {
  const out = { allClients: false, clients: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all-clients') out.allClients = true;
    else if (a === '--client') out.clients.push(argv[++i]);
    else if (a.startsWith('--client=')) out.clients.push(a.slice(9));
  }
  return out;
}

module.exports = function login() {
  const opts = parseArgs(process.argv.slice(2));

  // Explicit client selection short-circuits detection
  if (opts.clients.length) {
    const targets = opts.clients.map(id => {
      const c = getClient(id);
      if (!c) {
        console.error(`\n✗ Unknown client: ${id}`);
        console.error(`  Known: ${CLIENTS.map(c => c.id).join(', ')}\n`);
        process.exit(1);
      }
      return c;
    });
    startAuth(targets);
    return;
  }

  if (opts.allClients) {
    startAuth(CLIENTS);
    return;
  }

  const detected = detectInstalled();

  if (!process.stdin.isTTY || detected.length === 1) {
    const targets = detected.length ? detected : [getClient('claude-code')];
    startAuth(targets);
    return;
  }

  if (detected.length === 0) {
    console.log('\nNo supported clients detected. Configuring for Claude Code by default.');
    startAuth([getClient('claude-code')]);
    return;
  }

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
  // Tag the auth URL with the first target + version so server logs show origin
  const primaryClient = targets[0]?.id || 'unknown';
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

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Connection': 'close' });
    res.end(successHTML);

    settled = true;
    configureMCP(token, targets);
    server.closeAllConnections();
    server.close(() => process.exit(0));
  });

  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    const params = new URLSearchParams({
      port: String(port),
      state,
      client: primaryClient,
      version: VERSION,
      source: 'subdown-skill-cli',
    });
    const authURL = `${API_HOST}/cli/auth?${params.toString()}`;

    console.log('\nOpening browser for sign-in...');
    console.log(`If it doesn't open, visit: ${authURL}\n`);

    openBrowser(authURL);

    setTimeout(() => {
      if (!settled) {
        console.log('\n⚠  Login timed out (3 min). Run again: npx @subdown/skill@latest login\n');
        server.close();
        process.exit(0);
      }
    }, 180000);
  });

  server.on('error', (err) => {
    console.error(`\n✗ Could not start local server: ${err.message}`);
    console.log('  Run again: npx @subdown/skill@latest login\n');
    process.exit(1);
  });
}

function configureMCP(apiKey, targets) {
  console.log('✓ API key received!\n');

  const configured = [];
  const skipped = [];

  for (const client of targets) {
    if (!client.mcp) {
      skipped.push(client);
      continue;
    }
    try {
      writeMCPConfig(apiKey, client);
      configured.push(client);
    } catch (err) {
      console.log(`  ✗ ${client.name}: ${err.message}`);
    }
  }

  if (skipped.length) {
    console.log('\nThese clients need manual MCP setup (no standard config path yet):');
    for (const c of skipped) console.log(`  • ${c.name}`);
    console.log(`\n  MCP server URL: ${API_HOST}/mcp`);
    console.log(`  Header: Authorization: Bearer ${apiKey}`);
    console.log(`  Header: X-SubDownload-Client: <your-client-id>`);
    console.log(`  Header: X-SubDownload-Version: ${VERSION}`);
  }

  if (configured.length) {
    console.log(`\nYou're all set! Restart your client and try:`);
    console.log('  "Summarize https://youtu.be/dQw4w9WgXcQ"');
    console.log('  "Latest videos from MKBHD"\n');
  }
}

function buildServerEntry(apiKey, client, format) {
  // Headers carry origin so the API can attribute each request
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'X-SubDownload-Client': client.id,
    'X-SubDownload-Version': VERSION,
  };
  if (format === 'gemini') {
    return { httpUrl: `${API_HOST}/mcp`, headers };
  }
  return { url: `${API_HOST}/mcp`, headers };
}

function writeMCPConfig(apiKey, client) {
  // Claude Code: route through a local stdio proxy that adds the Authorization
  // header on every HTTP call. The HTTP transport in Claude Code 2.x silently
  // drops custom headers (anthropics/claude-code#14977), so Bearer configured
  // in .mcp.json never reaches the server. stdio transport does not have this
  // bug — the proxy runs inside Claude Code, forwards JSON-RPC to our HTTPS
  // endpoint with Bearer baked in, and streams responses back.
  if (client.id === 'claude-code') {
    writeClaudeCodeStdioProxy(apiKey, client);
    return;
  }

  const { path: configPath, format } = client.mcp;
  const dir = path.dirname(configPath);
  fs.mkdirSync(dir, { recursive: true });

  let config = {};
  try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (_) {}
  if (!config.mcpServers) config.mcpServers = {};
  config.mcpServers.subdownload = buildServerEntry(apiKey, client, format);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

  console.log(`  ✓ ${client.name} → ${configPath}`);
}

// Claude Code stdio proxy installation.
//   1. Write token to ~/.subdownload/config.json (mode 0600)
//   2. Copy bin/proxy.js to ~/.subdownload/proxy.js
//   3. Clear any stale HTTP MCP registration across all scopes
//   4. Register stdio MCP: `claude mcp add subdownload -- node ~/.subdownload/proxy.js`
function writeClaudeCodeStdioProxy(apiKey, client) {
  const home = require('os').homedir();
  const stateDir = path.join(home, '.subdownload');
  fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });

  // 1. Token goes in a private config file the proxy reads at startup.
  const configPath = path.join(stateDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify({
    apiKey,
    apiHost: API_HOST,
    client: client.id,
    version: VERSION,
  }, null, 2));
  try { fs.chmodSync(configPath, 0o600); } catch (_) {}

  // 2. Copy the proxy script next to the config so it survives npm cache eviction.
  const proxySrc = path.join(__dirname, 'proxy.js');
  const proxyDst = path.join(stateDir, 'proxy.js');
  fs.copyFileSync(proxySrc, proxyDst);
  try { fs.chmodSync(proxyDst, 0o755); } catch (_) {}

  // 3. Purge any prior registration in any scope (old HTTP-transport entries, etc.)
  for (const scope of ['local', 'user', 'project']) {
    try {
      execSync(`claude mcp remove subdownload -s ${scope}`, { stdio: 'ignore' });
    } catch (_) { /* not registered in this scope — fine */ }
  }

  // 4. Register stdio MCP pointing at the proxy.
  try {
    execSync(`claude mcp add --scope user subdownload -- node "${proxyDst}"`, {
      stdio: 'ignore',
    });
    console.log(`  ✓ ${client.name} → stdio proxy (token in ${configPath})`);
  } catch (err) {
    // Fallback: direct JSON write if the claude CLI isn't on PATH.
    const mcpJsonPath = client.mcp.path;
    const dir = path.dirname(mcpJsonPath);
    fs.mkdirSync(dir, { recursive: true });
    let mcpConfig = {};
    try { mcpConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8')); } catch (_) {}
    if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {};
    mcpConfig.mcpServers.subdownload = {
      command: 'node',
      args: [proxyDst],
    };
    fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 2) + '\n');
    console.log(`  ✓ ${client.name} → ${mcpJsonPath} (stdio proxy, fallback write)`);
  }
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
<div class="logo">✅</div>
<h1>You're all set!</h1>
<p>API key configured. You can close this tab<br>and return to your terminal.</p>
</div></body></html>`;
