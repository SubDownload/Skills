#!/usr/bin/env node
/**
 * SubDownload MCP stdio <-> HTTP bridge.
 *
 * Exists because Claude Code 2.x HTTP MCP transport silently drops custom
 * headers (anthropics/claude-code#14977), so Authorization never reaches
 * our server. This proxy runs as a stdio MCP server inside Claude Code,
 * reads the Bearer token from ~/.subdownload/config.json, and forwards
 * every JSON-RPC message over HTTPS to api.subdownload.com/mcp with the
 * Authorization header set client-side (outside Claude Code's header
 * pipeline).
 *
 * Protocol:
 *   stdin  - newline-delimited JSON-RPC 2.0 (MCP stdio transport)
 *   stdout - same, responses replayed from server
 *   stderr - diagnostic logs (Claude Code surfaces these in /mcp output)
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const CONFIG_PATH = path.join(os.homedir(), '.subdownload', 'config.json');

let apiKey = process.env.SUBDOWNLOAD_API_KEY || '';
let apiHost = process.env.SUBDOWNLOAD_API_HOST || 'https://api.subdownload.com';
let clientId = 'claude-code-stdio-proxy';
let clientVersion = '0.0.0';

try {
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  apiKey = apiKey || cfg.apiKey || '';
  apiHost = cfg.apiHost || apiHost;
  clientId = cfg.client ? `${cfg.client}-stdio-proxy` : clientId;
  clientVersion = cfg.version || clientVersion;
} catch (_) { /* no config file yet — handled per-request below */ }

const TARGET = new URL(apiHost + '/mcp');
const httpLib = TARGET.protocol === 'http:' ? http : https;
let sessionId = null;

function writeMessage(obj) {
  try {
    process.stdout.write(JSON.stringify(obj) + '\n');
  } catch (err) {
    process.stderr.write(`proxy: failed to write stdout: ${err.message}\n`);
  }
}

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id: id === undefined ? null : id, error: { code, message } };
}

function extractJsonFromSSE(body) {
  // Server-sent events frames look like `event: message\ndata: {...}\n\n`.
  // Return the first parseable `data:` payload, or null.
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;
      try { return JSON.parse(payload); } catch (_) { /* keep scanning */ }
    }
  }
  return null;
}

function forward(message) {
  if (!apiKey) {
    if (message.id !== undefined) {
      writeMessage(rpcError(
        message.id,
        -32001,
        'SubDownload: not authenticated. Run `npx @subdown/skill@latest` to sign in.'
      ));
    }
    return;
  }

  const body = Buffer.from(JSON.stringify(message), 'utf8');
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'Content-Length': body.length,
    'X-SubDownload-Client': clientId,
    'X-SubDownload-Version': clientVersion,
  };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;

  const req = httpLib.request({
    method: 'POST',
    hostname: TARGET.hostname,
    port: TARGET.port || (TARGET.protocol === 'http:' ? 80 : 443),
    path: TARGET.pathname + TARGET.search,
    headers,
  }, (res) => {
    const sid = res.headers['mcp-session-id'];
    if (sid) sessionId = sid;

    const chunks = [];
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => {
      const respBody = Buffer.concat(chunks).toString('utf8');

      // Notification with no body / 204 — nothing to write back.
      if (res.statusCode === 204 || !respBody.trim()) return;

      const contentType = (res.headers['content-type'] || '').toLowerCase();

      // JSON response
      if (contentType.includes('application/json')) {
        try {
          writeMessage(JSON.parse(respBody));
        } catch (e) {
          if (message.id !== undefined) {
            writeMessage(rpcError(message.id, -32603,
              `SubDownload proxy: malformed JSON from server (HTTP ${res.statusCode}): ${e.message}`));
          }
        }
        return;
      }

      // SSE response (mcp-go sometimes wraps single responses in SSE)
      if (contentType.includes('text/event-stream')) {
        const parsed = extractJsonFromSSE(respBody);
        if (parsed) { writeMessage(parsed); return; }
        if (message.id !== undefined) {
          writeMessage(rpcError(message.id, -32603,
            `SubDownload proxy: empty SSE stream (HTTP ${res.statusCode})`));
        }
        return;
      }

      // 401 / 403 / other text
      if (res.statusCode === 401 || res.statusCode === 403) {
        if (message.id !== undefined) {
          writeMessage(rpcError(message.id, -32001,
            `SubDownload: authentication failed (HTTP ${res.statusCode}). Re-run \`npx @subdown/skill@latest\`.`));
        }
        return;
      }
      if (message.id !== undefined) {
        writeMessage(rpcError(message.id, -32603,
          `SubDownload proxy: HTTP ${res.statusCode} ${respBody.slice(0, 200)}`));
      }
    });
  });

  req.on('error', (err) => {
    if (message.id !== undefined) {
      writeMessage(rpcError(message.id, -32603, `SubDownload proxy: transport error ${err.message}`));
    }
  });

  req.write(body);
  req.end();
}

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch (e) {
    writeMessage(rpcError(null, -32700, `Parse error: ${e.message}`));
    return;
  }
  try {
    forward(msg);
  } catch (err) {
    if (msg && msg.id !== undefined) {
      writeMessage(rpcError(msg.id, -32603, `SubDownload proxy: ${err.message}`));
    }
  }
});

rl.on('close', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
