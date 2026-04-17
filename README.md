# SubDownload Skill for Claude

> Fetch YouTube transcripts, search videos, browse channels and playlists — instant YouTube data inside Claude.

Anthropic [Agent Skill](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) that teaches Claude when and how to use the [SubDownload MCP](https://api.subdownload.com/mcp) server.

---

## ⚡ Install in one command

### Skills CLI (recommended)

```bash
npx skills add SubDownload/Skills
```

Supports Claude Code, Cursor, Codex, Gemini CLI, GitHub Copilot, and [40+ agents](https://skills.sh/).

```bash
npx skills add SubDownload/Skills -g   # global (user-wide)
npx skills add SubDownload/Skills      # project-level
```

### npx (Claude Code / Cursor / Windsurf)

```bash
npx @subdown/skill
```

```bash
npx @subdown/skill            # user-wide   (~/.claude/skills/subdownload)
npx @subdown/skill --project  # this project (./.claude/skills/subdownload)
```

### Claude.ai (web) / Claude Desktop

1. Download: **[subdownload-skill.zip](https://github.com/SubDownload/Skills/archive/refs/heads/main.zip)**
2. Claude.ai → **Settings → Capabilities → Skills → + Create skill** → upload the zip
3. New chat — the skill activates whenever you mention YouTube

---

## 🔌 Add the MCP server (one-time, required)

The skill calls tools from our hosted MCP. Pick your client:

| Client | How |
|---|---|
| **Claude.ai / Claude Desktop** | Settings → Connectors → **Add custom connector** → paste `https://api.subdownload.com/mcp` → sign in with Google |
| **Claude Code / Cursor** | Add to `.mcp.json` — see below |
| **Gemini CLI** | `gemini extensions install https://github.com/SubDownload/Skills` (coming soon) or add `mcpServers` entry manually |
| **ChatGPT (Developer Mode)** | Settings → Developer Mode → Add MCP server → `https://api.subdownload.com/mcp` |

### `.mcp.json` (Bearer token)

```json
{
  "mcpServers": {
    "subdownload": {
      "url": "https://api.subdownload.com/mcp",
      "headers": { "Authorization": "Bearer sk_live_xxx" }
    }
  }
}
```

Get a key at **[subdownload.com/account](https://subdownload.com/account)** — 1,000 free credits, no card required.

---

## 🎯 What you can ask

- "Summarize this video: https://youtu.be/dQw4w9WgXcQ"
- "What are @mkbhd's latest iPhone review videos?"
- "Search YouTube for Rust async tutorials, top 10"
- "Translate this transcript to Chinese: <url>"
- "List all videos from the @veritasium channel"

## 🛠 Tools in this skill

| Tool | Purpose | Cost |
|---|---|---|
| `fetch_transcript` | Transcript / captions in any language | 1 credit |
| `search_youtube` | Global search (videos, channels, playlists) | 1 credit |
| `resolve_channel` | `@handle` / URL → channel info | Free |
| `get_channel_latest_videos` | Newest uploads from a channel | Free |
| `list_channel_videos` | Paginated channel video list | 1 / page |
| `search_channel_videos` | Search within one channel | 1 credit |
| `list_playlist_videos` | Paginated playlist contents | 1 / page |

Errors never consume credits — only HTTP 200 is charged.

---

## 💰 Pricing

- **Free**: 1,000 credits (Google sign-in, no card)
- **Pro**: 10,000 credits
- 2 endpoints always free (`resolve_channel`, `get_channel_latest_videos`)
- 200 req/min per key

## 🔗 Links

- Website — [subdownload.com](https://subdownload.com)
- Dashboard & API keys — [subdownload.com/account](https://subdownload.com/account)
- API docs — [api.subdownload.com/docs](https://api.subdownload.com/docs)
- OpenAPI spec — [api.subdownload.com/openapi.yaml](https://api.subdownload.com/openapi.yaml)
- LLM-friendly docs — [api.subdownload.com/docs/llms-full.txt](https://api.subdownload.com/docs/llms-full.txt)
- MCP server — [api.subdownload.com/mcp](https://api.subdownload.com/mcp)
