#!/usr/bin/env node
/**
 * SubDownload CLI
 *
 * Usage:
 *   npx @subdown/skill@latest              # install skill + login + configure MCP
 *   npx @subdown/skill@latest login        # login only (re-auth / switch account)
 *   npx @subdown/skill@latest --skip-auth  # install skill without login
 *   npx @subdown/skill@latest --project    # install to project instead of global
 */

const cmd = process.argv[2];

if (cmd === 'login') {
  // Login only — for users who already installed the skill
  require('./login')();
} else if (cmd === '--help' || cmd === '-h') {
  console.log(`
Usage: npx @subdown/skill@latest [command] [options]

Commands:
  (default)   Install skill + sign in + configure MCP
  login       Sign in only (re-auth or switch account)

Options:
  --project     Install skill to current project instead of global
  --skip-auth   Skip browser sign-in
  --help        Show this help

Also works with the skills ecosystem:
  npx skills add SubDownload/Skills
`);
} else {
  // Default: install + auth
  require('./install')();
}
