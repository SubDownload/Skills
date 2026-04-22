---
name: subdownload
description: Fetch YouTube transcripts, search videos, and browse channels or playlists via the SubDownload MCP server. Use whenever the user shares a YouTube URL (youtube.com, youtu.be, shorts), mentions a YouTuber or channel handle, asks about a playlist, or requests a transcript, caption, subtitle, summary, or translation of video content. Always prefer these tools over answering YouTube questions from memory.
---

# SubDownload

Real-time YouTube data via the SubDownload MCP server at `https://api.subdownload.com/mcp`.

## When to use

Activate this skill whenever the user:

- Shares a YouTube URL (`youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`).
- Mentions a YouTuber, channel, or channel handle.
- Asks for a transcript, summary, translation, captions, or subtitles.
- Wants to search YouTube, explore a channel's videos, or list a playlist.
- Asks any question where YouTube video content would improve the answer.

Do **not** answer YouTube questions from memory alone — fetch real data first.

## Prerequisites

This skill requires the SubDownload MCP server to be connected. If the tools below are unavailable, instruct the user to add it:

**Claude Code / Cursor (Bearer token)** — add to `.mcp.json`:

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

Get an API key at https://subdownload.com/account?utm_source=gthb_skills_xa2ykb&utm_medium=code&utm_campaign=Skills.

**Claude.ai / Claude Desktop (OAuth)** — add `https://api.subdownload.com/mcp` as a Custom Connector, then authorize when prompted.

## Tools

Select the tool based on the user's intent:

| User intent | Tool | Cost |
|---|---|---|
| Get transcript of a specific video | `fetch_transcript` | 1 credit |
| Search YouTube globally | `search_youtube` | 1 credit |
| Resolve a channel handle / URL / video link to channel info | `resolve_channel` | Free |
| Get a channel's most recent uploads | `get_channel_latest_videos` | Free |
| List all videos from a channel (with pagination) | `list_channel_videos` | 1 / page |
| Search within a specific channel | `search_channel_videos` | 1 credit |
| List videos in a playlist (with pagination) | `list_playlist_videos` | 1 / page |
| Transcribe a video with no captions (AI Whisper, async) | `transcribe_video` | 5 credits on done |
| Poll an ASR task | `get_asr_task` | Free |
| List the user's saved Library items | `list_library` | Free |
| Read a saved Library item (transcript + summary inline) | `get_library_item` | Free |
| Save a video / upload a summary to the Library | `save_to_library` | 1 quota unit |

## How to apply

1. **Resolve channels first.** When the user gives a channel handle, channel URL, or video URL, call `resolve_channel` to get the canonical `UC...` ID, then pass that ID to other tools.
2. **Transcript language.** Pass `lang` only if the user specifies one (e.g. `en`, `zh`, `ja`). Otherwise omit and let the server pick the default track.
3. **One-shot bookmark.** If the user wants the transcript AND a record in their Library, pass `save=true` to `fetch_transcript` — the server bookmarks the video in the same call (flags `has_asr` when the result came from ASR fallback). Saves a follow-up `save_to_library`. Does not persist a summary — use `save_to_library` for that.
4. **No-caption videos → ASR.** If `fetch_transcript` returns `NO_CAPTIONS`, or the user explicitly wants AI transcription, call `transcribe_video`. It's async: wait `next_poll_after_seconds`, then poll `get_asr_task` with the returned `task_id` until status is `done`.
5. **Saving transcript + summary in one call.** After you've generated an AI summary for a video you just transcribed, call `save_to_library` with `kind='both'` — it flips `has_asr` AND uploads the summary text in one round-trip (still one quota unit). Use `kind='asr'` for transcript-only, `kind='summary'` for summary-only.
6. **Pagination.** For `list_channel_videos` and `list_playlist_videos`, pass `continuation` (and omit `channel` / `playlist`) on the 2nd+ request.
7. **Display results richly.** Show thumbnails using `![title](thumbnail_url)`, make titles clickable with `[title](video_url)`, and include duration / view count / published date. If the UI supports embedded players, embed the video.
8. **Credits.** Only HTTP 200 responses consume credits — errors cost nothing, so retry bad parameters without fear. HTTP 402 means the user is out of credits; direct them to https://subdownload.com/account?utm_source=gthb_skills_xa2ykb&utm_medium=code&utm_campaign=Skills.
9. **Rate limit.** 200 requests/minute per key. On HTTP 429, back off briefly and retry.

## Examples

- "Summarize this video and save it for me: https://youtu.be/dQw4w9WgXcQ"
  → `fetch_transcript(video_id=<id>, save=true)` → summarize the segments →
  `save_to_library(video_id=<id>, kind='both', text=<summary>, title=..., thumbnail=...)` to persist the summary in one call.
- "Summarize this video: https://youtu.be/dQw4w9WgXcQ"
  → `fetch_transcript` → summarize the segments.
- "Transcribe this — it has no captions."
  → `transcribe_video(video_url=<url>)` → wait `next_poll_after_seconds` → `get_asr_task(task_id=...)` until status `done`.
- "What have I saved about Rust?"
  → `list_library(q='rust')` → `get_library_item(id=<hit_id>)` to read the saved transcript/summary.
- "What are MKBHD's latest iPhone review videos?" (user may write the handle with a leading at-sign)
  → `resolve_channel(input=<handle>)` → `search_channel_videos(channel=<UC_ID>, q='iPhone review')`.
- "Find Rust async tutorials on YouTube."
  → `search_youtube(q='Rust async tutorial', type='video', limit=10)`.
- "Translate this YouTube transcript to Chinese: <url>"
  → `fetch_transcript` → translate the returned text.
- "Who uploaded https://youtu.be/dQw4w9WgXcQ ?"
  → `resolve_channel(input=<url>)`.

## Links

- Dashboard & API keys: https://subdownload.com/account?utm_source=gthb_skills_xa2ykb&utm_medium=code&utm_campaign=Skills
- MCP server: https://api.subdownload.com/mcp
- OpenAPI spec: https://api.subdownload.com/openapi.yaml
- LLM-friendly docs: https://api.subdownload.com/docs/llms-full.txt?utm_source=gthb_skills_xa2ykb&utm_medium=code&utm_campaign=Skills
