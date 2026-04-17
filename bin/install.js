/**
 * Install skill files + optional browser auth + MCP configuration.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SRC = path.join(__dirname, '..', 'subdownload');

const projectMode = process.argv.includes('--project');
const skipAuth = process.argv.includes('--skip-auth');
const baseDir = projectMode ? process.cwd() : os.homedir();
const destDir = path.join(baseDir, '.claude', 'skills');
const dest = path.join(destDir, 'subdownload');

module.exports = function install() {
  // ── Step 1: Install skill files ──────────────────────────────────
  try {
    fs.mkdirSync(destDir, { recursive: true });
    // Remove existing symlink or directory before copying
    try {
      const stat = fs.lstatSync(dest);
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(dest);
      }
    } catch (_) {}
    fs.cpSync(SRC, dest, { recursive: true, force: true });
  } catch (err) {
    console.error(`\n\u2717 Failed to install skill: ${err.message}\n`);
    process.exit(1);
  }

  const scope = projectMode ? 'this project' : 'your user account';
  console.log(`\n\u2713 SubDownload skill installed for ${scope}`);
  console.log(`  \u2192 ${dest}`);

  // ── Step 2: Auth ─────────────────────────────────────────────────
  if (skipAuth) {
    printManualSetup();
    return;
  }

  if (!process.stdin.isTTY) {
    printManualSetup();
    return;
  }

  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  rl.question('\nSign in with Google to get your API key? (Y/n) ', (answer) => {
    rl.close();
    if (answer.toLowerCase() === 'n') {
      printManualSetup();
      return;
    }
    require('./login')();
  });
};

function printManualSetup() {
  console.log(`
Next steps — add the MCP server:

  claude mcp add --transport http subdownload \\
    https://api.subdownload.com/mcp \\
    --header "Authorization: Bearer sk_live_xxx"

  Get an API key at https://subdownload.com/account (1,000 free credits).

Or run:  npx @subdown/skill login
`);
}
