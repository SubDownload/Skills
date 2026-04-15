# SubDownload MCP Skills

Fetch YouTube transcripts, search videos, browse channels and playlists — instant YouTube data for your AI workflow.

## MCP Server

- **URL**: `https://api.subdownload.com/mcp`
- **Transport**: Streamable HTTP (stateless)
- **Auth**: OAuth 2.1 or Bearer Token

## Skills

### SubDownload

7 tools for accessing YouTube data:

| Tool | Description | Credits |
|------|-------------|---------|
| `fetch_transcript` | Fetch video transcript/captions in any language | 1 |
| `search_youtube` | Search YouTube for videos or channels | 1 |
| `resolve_channel` | Resolve @handle, URL, or video link to channel info | Free |
| `search_channel_videos` | Search videos within a specific channel | 1 |
| `get_channel_latest_videos` | Get latest videos from a channel | Free |
| `list_channel_videos` | List channel videos with pagination | 1/page |
| `list_playlist_videos` | List playlist videos with pagination | 1/page |

## Setup

### Claude Desktop / Claude.ai (OAuth)

1. Add MCP server URL: `https://api.subdownload.com/mcp`
2. Authorize via OAuth when prompted
3. Done

### Claude Code / Cursor (API Key)

Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "subdownload": {
      "url": "https://api.subdownload.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

Get your API key at [subdownload.com/account](https://subdownload.com/account).

## Example Prompts

- "Get the transcript of YouTube video dQw4w9WgXcQ"
- "Search YouTube for machine learning tutorials"
- "Show me the latest videos from @MrBeast"
- "Find all videos about 'iPhone review' from @mkbhd"
- "What channel uploaded this video? https://youtu.be/dQw4w9WgXcQ"

## Pricing

- Free tier: 150 credits (sign in with Google, no credit card)
- Pro: 10,000 credits
- 2 free endpoints (channel resolve & latest videos)
- Only successful requests consume credits — errors are never charged

## Links

- Website: [subdownload.com](https://subdownload.com)
- API Docs: [api.subdownload.com/docs](https://api.subdownload.com/docs)
- LLM Docs: [api.subdownload.com/docs/llms-full.txt](https://api.subdownload.com/docs/llms-full.txt)
- Skills Manifest: [api.subdownload.com/skills](https://api.subdownload.com/skills)
