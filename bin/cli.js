#!/usr/bin/env node
/**
 * SubDownload CLI
 *
 * Usage:
 *   npx @subdown/skill@latest                        install to every detected agent + sign in
 *   npx @subdown/skill@latest login                  re-auth / reconfigure MCP
 *   npx @subdown/skill@latest list                   list supported agents
 *   npx @subdown/skill@latest --project              install to ./.  instead of ~/
 *   npx @subdown/skill@latest --client cursor        restrict to one agent (repeatable)
 *   npx @subdown/skill@latest --all-clients          install to every known agent
 *   npx @subdown/skill@latest --skip-auth            install skill only, no sign-in
 */

const cmd = process.argv[2];

if (cmd === 'login') {
  require('./login')();
} else if (cmd === 'list' || cmd === 'ls') {
  const { CLIENTS, detectInstalled } = require('./clients');
  const detected = new Set(detectInstalled().map(c => c.id));
  console.log('\nSupported agents (✓ = detected on this machine):\n');
  for (const c of CLIENTS) {
    const mark = detected.has(c.id) ? '✓' : ' ';
    console.log(`  ${mark} ${c.id.padEnd(16)} ${c.name}`);
  }
  console.log('');
} else if (cmd === '--help' || cmd === '-h') {
  console.log(`
Usage: npx @subdown/skill@latest [command] [options]

Commands:
  (default)   Install skill into every detected agent + sign in + configure MCP
  login       Sign in only (re-auth or reconfigure MCP)
  list        List supported agents and show which are detected

Options:
  --project              Install to current project instead of user scope
  --client <id>          Restrict to a single client (repeatable)
  --all-clients          Install to every known client, not just detected
  --skip-auth            Skip browser sign-in
  --help                 Show this help
`);
} else {
  require('./install')();
}
