#!/usr/bin/env node
/**
 * One-command installer for the SubDownload Claude Skill.
 *
 * Usage:
 *   npx @subdown/skill            # install to ~/.claude/skills/subdownload
 *   npx @subdown/skill --project  # install to ./.claude/skills/subdownload
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SRC = path.join(__dirname, '..', 'subdownload');

const projectMode = process.argv.includes('--project');
const baseDir = projectMode ? process.cwd() : os.homedir();
const destDir = path.join(baseDir, '.claude', 'skills');
const dest = path.join(destDir, 'subdownload');

try {
  fs.mkdirSync(destDir, { recursive: true });
  fs.cpSync(SRC, dest, { recursive: true, force: true });
} catch (err) {
  console.error(`\n✗ Failed to install skill: ${err.message}\n`);
  process.exit(1);
}

const scope = projectMode ? 'this project' : 'your user account';

console.log(`
✓ SubDownload skill installed for ${scope}
  → ${dest}

Next steps:

  1. Add the MCP server (one-time):

       claude mcp add --transport http subdownload \\
         https://api.subdownload.com/mcp \\
         --header "Authorization: Bearer sk_live_xxx"

     Get an API key at https://subdownload.com/account (150 free credits).

     Or — in Claude.ai / Claude Desktop — add a Custom Connector pointing
     to https://api.subdownload.com/mcp and sign in with Google.

  2. Restart Claude Code. Skills load at session start.

Try it:
  "Summarize https://youtu.be/dQw4w9WgXcQ"
  "Latest videos from @mkbhd"
`);
