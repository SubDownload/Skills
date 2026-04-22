/**
 * Install the SubDownload skill into every supported agent's skill dir,
 * then optionally run browser auth to configure MCP.
 *
 * Flags:
 *   --project              install to current project instead of user scope
 *   --skip-auth            skip browser sign-in
 *   --client <id>          restrict to one client (repeatable)
 *   --all-clients          install to every known client, not just detected
 */

const fs = require('fs');
const path = require('path');
const { CLIENTS, getClient, detectInstalled } = require('./clients');

const SRC = path.join(__dirname, '..', 'subdownload');

function parseArgs(argv) {
  const out = { project: false, skipAuth: false, allClients: false, clients: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--project') out.project = true;
    else if (a === '--skip-auth') out.skipAuth = true;
    else if (a === '--all-clients') out.allClients = true;
    else if (a === '--client') out.clients.push(argv[++i]);
    else if (a.startsWith('--client=')) out.clients.push(a.slice(9));
  }
  return out;
}

module.exports = function install() {
  const opts = parseArgs(process.argv.slice(2));

  // ── Resolve target clients ───────────────────────────────────────
  let targets;
  if (opts.clients.length) {
    targets = opts.clients.map(id => {
      const c = getClient(id);
      if (!c) {
        console.error(`\n✗ Unknown client: ${id}`);
        console.error(`  Known: ${CLIENTS.map(c => c.id).join(', ')}\n`);
        process.exit(1);
      }
      return c;
    });
  } else if (opts.allClients) {
    targets = CLIENTS;
  } else {
    const detected = detectInstalled();
    targets = detected.length ? detected : [getClient('claude-code')];
  }

  // ── Install skill files ──────────────────────────────────────────
  const installed = [];
  for (const client of targets) {
    const dir = opts.project ? client.skillDir.project : client.skillDir.global;
    const dest = path.join(dir, 'subdownload');
    try {
      fs.mkdirSync(dir, { recursive: true });
      try {
        const stat = fs.lstatSync(dest);
        if (stat.isSymbolicLink()) fs.unlinkSync(dest);
      } catch (_) {}
      fs.cpSync(SRC, dest, { recursive: true, force: true });
      installed.push({ client, dest });
    } catch (err) {
      console.error(`  ✗ ${client.name}: ${err.message}`);
    }
  }

  if (!installed.length) {
    console.error('\n✗ Failed to install skill to any client.\n');
    process.exit(1);
  }

  const scope = opts.project ? 'this project' : 'your user account';
  console.log(`\n✓ SubDownload skill installed for ${scope}:`);
  for (const { client, dest } of installed) {
    console.log(`  → ${client.name}: ${dest}`);
  }

  // ── Auth ─────────────────────────────────────────────────────────
  if (opts.skipAuth) {
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

Or run:  npx @subdown/skill@latest login
`);
}
