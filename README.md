# SubDownload

YouTube data for AI agents — transcripts, search, channels, playlists.

## Install

```bash
npx @subdown/skill@latest
```

One command. Detects every agent on your machine (Claude Code, Cursor, Codex, Windsurf, Gemini CLI, OpenCode, Warp, Cline, Continue, and 35+ more), installs the skill into each, signs you in, configures MCP. Done.

## Try it

Open any detected agent and ask:

```
Summarize this video: https://youtu.be/dQw4w9WgXcQ
```

```
Search YouTube for Rust async tutorials
```

```
What are @mkbhd's latest videos?
```

If the agent fetches real YouTube data, you're all set.

## Supported agents (45)

Adal · Amp · Antigravity · Augment · Bob · Claude Code · Cline · CodeBuddy · Codex · Command Code · Continue · Cortex · Crush · Cursor · DeepAgents · Droid · Firebender · Gemini CLI · GitHub Copilot · Goose · iFlow CLI · Junie · Kilo Code · Kimi CLI · Kiro CLI · Kode · MCPJam · Mistral Vibe · Mux · Neovate · OpenClaw · OpenCode · OpenHands · Pi · Pochi · Qoder · Qwen Code · Replit · Roo Code · Trae · Trae CN · Warp · Windsurf · Zencoder · Universal (`.agents/skills`).

Run `npx @subdown/skill@latest list` to see which are detected on your machine. Target a specific one with `--client cursor` (repeatable) or install everywhere with `--all-clients`.

## Other install methods

<details>
<summary>Claude.ai / Claude Desktop</summary>

Settings → Connectors → **Add custom connector** → paste `https://api.subdownload.com/mcp` → sign in with Google

</details>

<details>
<summary>Manual .mcp.json</summary>

```json
{
  "mcpServers": {
    "subdownload": {
      "url": "https://api.subdownload.com/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

Get a key at [subdownload.com/account](https://subdownload.com/account) — 1,000 free credits, no card.

</details>

## Links

[Website](https://subdownload.com) · [Dashboard](https://subdownload.com/account) · [API Docs](https://api.subdownload.com/docs) · [Pricing](https://subdownload.com/#pricing) · [Full Documentation](https://api.subdownload.com/docs/llms-full.txt)
