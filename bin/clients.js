/**
 * Shared catalog of supported agent clients.
 *
 * Each client describes:
 *   - id           stable identifier passed via --client
 *   - name         human-readable name shown in CLI output
 *   - detect()     returns true if the client appears to be installed
 *   - skillDir     { global, project } absolute/relative skill dirs
 *   - mcp          { path, format } — where + how to write MCP config
 *                    formats: 'standard' (url+headers), 'gemini' (httpUrl+headers),
 *                             null (no auto-config, print manual instructions)
 *
 * Paths mirror vercel-labs/skills wherever possible so skills installed by
 * our CLI land in the same place as the skills ecosystem.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const home = os.homedir();
const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(home, '.config');

const hasBin = (name) => {
  try { execSync(`command -v ${name}`, { stdio: 'pipe' }); return true; }
  catch (_) { return false; }
};
const hasDir = (...p) => fs.existsSync(path.join(home, ...p));
const hasCfg = (...p) => fs.existsSync(path.join(xdgConfig, ...p));

// Helper to build a "universal" agent that stores project skills in .agents/skills
const agentsDir = path.join('.agents', 'skills');

// ── Client catalog (45 agents, ordered alphabetically where possible) ─
const CLIENTS = [
  {
    id: 'adal',
    name: 'Adal',
    detect: () => hasDir('.adal'),
    skillDir: { global: path.join(home, '.adal', 'skills'), project: path.join('.adal', 'skills') },
    mcp: null,
  },
  {
    id: 'amp',
    name: 'Amp',
    detect: () => hasBin('amp') || hasCfg('amp'),
    skillDir: { global: path.join(xdgConfig, 'agents', 'skills'), project: agentsDir },
    mcp: null,
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    detect: () => hasDir('.gemini', 'antigravity') || hasBin('antigravity'),
    skillDir: { global: path.join(home, '.gemini', 'antigravity', 'skills'), project: agentsDir },
    mcp: null,
  },
  {
    id: 'augment',
    name: 'Augment',
    detect: () => hasDir('.augment'),
    skillDir: { global: path.join(home, '.augment', 'skills'), project: path.join('.augment', 'skills') },
    mcp: null,
  },
  {
    id: 'bob',
    name: 'Bob',
    detect: () => hasDir('.bob'),
    skillDir: { global: path.join(home, '.bob', 'skills'), project: path.join('.bob', 'skills') },
    mcp: null,
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    detect: () => hasBin('claude') || hasDir('.claude'),
    skillDir: { global: path.join(home, '.claude', 'skills'), project: path.join('.claude', 'skills') },
    mcp: { path: path.join(home, '.claude', '.mcp.json'), format: 'standard' },
  },
  {
    id: 'cline',
    name: 'Cline',
    detect: () => hasDir('.cline') || hasBin('cline'),
    skillDir: { global: path.join(home, '.agents', 'skills'), project: agentsDir },
    mcp: null,
  },
  {
    id: 'codebuddy',
    name: 'CodeBuddy',
    detect: () => hasDir('.codebuddy'),
    skillDir: { global: path.join(home, '.codebuddy', 'skills'), project: path.join('.codebuddy', 'skills') },
    mcp: null,
  },
  {
    id: 'codex',
    name: 'Codex',
    detect: () => hasDir('.codex') || hasBin('codex'),
    skillDir: { global: path.join(home, '.codex', 'skills'), project: agentsDir },
    mcp: { path: path.join(home, '.codex', 'mcp.json'), format: 'standard' },
  },
  {
    id: 'command-code',
    name: 'Command Code',
    detect: () => hasDir('.commandcode') || hasBin('commandcode'),
    skillDir: { global: path.join(home, '.commandcode', 'skills'), project: path.join('.commandcode', 'skills') },
    mcp: null,
  },
  {
    id: 'continue',
    name: 'Continue',
    detect: () => hasDir('.continue'),
    skillDir: { global: path.join(home, '.continue', 'skills'), project: path.join('.continue', 'skills') },
    mcp: null,
  },
  {
    id: 'cortex',
    name: 'Cortex',
    detect: () => hasDir('.snowflake', 'cortex') || hasBin('cortex'),
    skillDir: { global: path.join(home, '.snowflake', 'cortex', 'skills'), project: path.join('.cortex', 'skills') },
    mcp: null,
  },
  {
    id: 'crush',
    name: 'Crush',
    detect: () => hasCfg('crush') || hasBin('crush'),
    skillDir: { global: path.join(xdgConfig, 'crush', 'skills'), project: path.join('.crush', 'skills') },
    mcp: null,
  },
  {
    id: 'cursor',
    name: 'Cursor',
    detect: () => hasDir('.cursor'),
    skillDir: { global: path.join(home, '.cursor', 'skills'), project: agentsDir },
    mcp: { path: path.join(home, '.cursor', 'mcp.json'), format: 'standard' },
  },
  {
    id: 'deepagents',
    name: 'DeepAgents',
    detect: () => hasDir('.deepagents'),
    skillDir: { global: path.join(home, '.deepagents', 'agent', 'skills'), project: agentsDir },
    mcp: null,
  },
  {
    id: 'droid',
    name: 'Droid',
    detect: () => hasBin('droid') || hasDir('.factory'),
    skillDir: { global: path.join(home, '.factory', 'skills'), project: path.join('.factory', 'skills') },
    mcp: null,
  },
  {
    id: 'firebender',
    name: 'Firebender',
    detect: () => hasDir('.firebender'),
    skillDir: { global: path.join(home, '.firebender', 'skills'), project: agentsDir },
    mcp: null,
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    detect: () => hasBin('gemini') || hasDir('.gemini'),
    skillDir: { global: path.join(home, '.gemini', 'skills'), project: agentsDir },
    mcp: { path: path.join(home, '.gemini', 'settings.json'), format: 'gemini' },
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    detect: () => hasDir('.copilot'),
    skillDir: { global: path.join(home, '.copilot', 'skills'), project: agentsDir },
    mcp: null,
  },
  {
    id: 'goose',
    name: 'Goose',
    detect: () => hasBin('goose') || hasCfg('goose'),
    skillDir: { global: path.join(xdgConfig, 'goose', 'skills'), project: path.join('.goose', 'skills') },
    mcp: null,
  },
  {
    id: 'iflow-cli',
    name: 'iFlow CLI',
    detect: () => hasDir('.iflow') || hasBin('iflow'),
    skillDir: { global: path.join(home, '.iflow', 'skills'), project: path.join('.iflow', 'skills') },
    mcp: null,
  },
  {
    id: 'junie',
    name: 'Junie',
    detect: () => hasDir('.junie'),
    skillDir: { global: path.join(home, '.junie', 'skills'), project: path.join('.junie', 'skills') },
    mcp: null,
  },
  {
    id: 'kilo',
    name: 'Kilo Code',
    detect: () => hasDir('.kilocode'),
    skillDir: { global: path.join(home, '.kilocode', 'skills'), project: path.join('.kilocode', 'skills') },
    mcp: null,
  },
  {
    id: 'kimi-cli',
    name: 'Kimi CLI',
    detect: () => hasBin('kimi') || hasCfg('agents'),
    skillDir: { global: path.join(xdgConfig, 'agents', 'skills'), project: agentsDir },
    mcp: null,
  },
  {
    id: 'kiro-cli',
    name: 'Kiro CLI',
    detect: () => hasBin('kiro') || hasDir('.kiro'),
    skillDir: { global: path.join(home, '.kiro', 'skills'), project: path.join('.kiro', 'skills') },
    mcp: null,
  },
  {
    id: 'kode',
    name: 'Kode',
    detect: () => hasDir('.kode'),
    skillDir: { global: path.join(home, '.kode', 'skills'), project: path.join('.kode', 'skills') },
    mcp: null,
  },
  {
    id: 'mcpjam',
    name: 'MCPJam',
    detect: () => hasDir('.mcpjam'),
    skillDir: { global: path.join(home, '.mcpjam', 'skills'), project: path.join('.mcpjam', 'skills') },
    mcp: null,
  },
  {
    id: 'mistral-vibe',
    name: 'Mistral Vibe',
    detect: () => hasDir('.vibe'),
    skillDir: { global: path.join(home, '.vibe', 'skills'), project: path.join('.vibe', 'skills') },
    mcp: null,
  },
  {
    id: 'mux',
    name: 'Mux',
    detect: () => hasDir('.mux'),
    skillDir: { global: path.join(home, '.mux', 'skills'), project: path.join('.mux', 'skills') },
    mcp: null,
  },
  {
    id: 'neovate',
    name: 'Neovate',
    detect: () => hasDir('.neovate'),
    skillDir: { global: path.join(home, '.neovate', 'skills'), project: path.join('.neovate', 'skills') },
    mcp: null,
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    detect: () => hasDir('.openclaw') || hasBin('openclaw'),
    skillDir: { global: path.join(home, '.openclaw', 'skills'), project: 'skills' },
    mcp: null,
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    detect: () => hasCfg('opencode') || hasBin('opencode'),
    skillDir: { global: path.join(xdgConfig, 'opencode', 'skills'), project: agentsDir },
    mcp: { path: path.join(xdgConfig, 'opencode', 'mcp.json'), format: 'standard' },
  },
  {
    id: 'openhands',
    name: 'OpenHands',
    detect: () => hasDir('.openhands'),
    skillDir: { global: path.join(home, '.openhands', 'skills'), project: path.join('.openhands', 'skills') },
    mcp: null,
  },
  {
    id: 'pi',
    name: 'Pi',
    detect: () => hasDir('.pi'),
    skillDir: { global: path.join(home, '.pi', 'agent', 'skills'), project: path.join('.pi', 'skills') },
    mcp: null,
  },
  {
    id: 'pochi',
    name: 'Pochi',
    detect: () => hasDir('.pochi'),
    skillDir: { global: path.join(home, '.pochi', 'skills'), project: path.join('.pochi', 'skills') },
    mcp: null,
  },
  {
    id: 'qoder',
    name: 'Qoder',
    detect: () => hasDir('.qoder'),
    skillDir: { global: path.join(home, '.qoder', 'skills'), project: path.join('.qoder', 'skills') },
    mcp: null,
  },
  {
    id: 'qwen-code',
    name: 'Qwen Code',
    detect: () => hasDir('.qwen') || hasBin('qwen'),
    skillDir: { global: path.join(home, '.qwen', 'skills'), project: path.join('.qwen', 'skills') },
    mcp: null,
  },
  {
    id: 'replit',
    name: 'Replit',
    detect: () => hasBin('replit') || hasCfg('agents'),
    skillDir: { global: path.join(xdgConfig, 'agents', 'skills'), project: agentsDir },
    mcp: null,
  },
  {
    id: 'roo',
    name: 'Roo Code',
    detect: () => hasDir('.roo'),
    skillDir: { global: path.join(home, '.roo', 'skills'), project: path.join('.roo', 'skills') },
    mcp: null,
  },
  {
    id: 'trae',
    name: 'Trae',
    detect: () => hasDir('.trae'),
    skillDir: { global: path.join(home, '.trae', 'skills'), project: path.join('.trae', 'skills') },
    mcp: null,
  },
  {
    id: 'trae-cn',
    name: 'Trae CN',
    detect: () => hasDir('.trae-cn'),
    skillDir: { global: path.join(home, '.trae-cn', 'skills'), project: path.join('.trae', 'skills') },
    mcp: null,
  },
  {
    id: 'warp',
    name: 'Warp',
    detect: () => hasBin('warp') || hasDir('.agents'),
    skillDir: { global: path.join(home, '.agents', 'skills'), project: agentsDir },
    mcp: null,
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    detect: () => fs.existsSync(path.join(home, '.codeium', 'windsurf')),
    skillDir: {
      global: path.join(home, '.codeium', 'windsurf', 'skills'),
      project: path.join('.windsurf', 'skills'),
    },
    mcp: { path: path.join(home, '.codeium', 'windsurf', 'mcp_config.json'), format: 'standard' },
  },
  {
    id: 'zencoder',
    name: 'Zencoder',
    detect: () => hasDir('.zencoder'),
    skillDir: { global: path.join(home, '.zencoder', 'skills'), project: path.join('.zencoder', 'skills') },
    mcp: null,
  },
  {
    id: 'universal',
    name: 'Universal (.agents/skills)',
    detect: () => fs.existsSync(path.join(process.cwd(), '.agents')),
    skillDir: { global: path.join(xdgConfig, 'agents', 'skills'), project: agentsDir },
    mcp: null,
  },
];

function getClient(id) {
  return CLIENTS.find(c => c.id === id);
}

function detectInstalled() {
  // Dedupe by skillDir.global so "universal bucket" agents don't all fire at once
  const seen = new Set();
  const out = [];
  for (const c of CLIENTS) {
    let ok = false;
    try { ok = c.detect(); } catch (_) {}
    if (!ok) continue;
    const key = c.skillDir.global;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

module.exports = { CLIENTS, getClient, detectInstalled };
