# Instagram Feed View for Notion

Turns a Notion content calendar into a live Instagram-style feed embedded in Notion.
Drag tiles to reorder (saves back as Feed Order), clients tap Approve Post or Make A Change
(comments land date-stamped in a Client Comments column).

- index.html — setup wizard (Connect To Notion -> pick database -> copy embed link)
- embed.html — the widget for Notion embed blocks
- api/ — Vercel serverless functions; Notion tokens are AES-encrypted server-side, never readable from URLs

## Vercel environment variables
| Name | Value |
|---|---|
| NOTION_CLIENT_ID | from the Notion public integration |
| NOTION_CLIENT_SECRET | from the Notion public integration |
| ENCRYPTION_KEY | long random phrase; changing it breaks existing embed links |

Notion integration (notion.so/profile/integrations): type Public,
redirect URI https://YOUR-APP.vercel.app/api/callback, capabilities read+update+insert.

Embed URL options: &title=@name (header), &readonly=1 (view only), &dates=0 (hide date chips).
