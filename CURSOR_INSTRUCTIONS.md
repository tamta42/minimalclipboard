Status: COMPLETE 2026-07-11
# Rework instructions — minimalclipboard
Verdict: **REFACTOR (light).** 261 lines of clean TypeScript on KV. Nothing structural changes; this is a re-skin plus hardening. This file is the source of truth — it overrides any other .md in this repo.

## Scope, in order

1. **Restyle to the Tam Ta brand** (see conventions below). Replace all current fonts/colours in the inline HTML/CSS with the tokens. Keep the layout minimal — it already fits the brand.
2. **Required pages.** Add `/about`, `/privacy`, and a branded 404 (specs below). Footer on every page.
3. **Abuse hardening.** Default paste TTL is currently 0 (forever). Change `DEFAULT_TTL_SECONDS` to 2592000 (30 days) in wrangler.toml and state the retention on /privacy. Keep `MAX_BYTES` enforcement. Existing pastes must keep resolving — do not change the KV key or value format.
4. **Rate limit** the paste-creation endpoint (config below).
5. **Traffic logging** via Analytics Engine (config below).
6. **Docs.** Rewrite README (what it does in 3 lines, setup, deploy); fold DEPLOYMENT.md into it and delete DEPLOYMENT.md.

## Do not
- Change the KV namespace, binding name, or stored data format.
- Add accounts or auth — anonymous by design.
- Add runtime dependencies, frameworks, or a build step.

## House conventions

**Stack.** Single-file Cloudflare Worker (`src/index.ts`), zero runtime dependencies. devDependencies only. Deploy with `npx wrangler deploy` once smoke tests pass; verify the live site straight after and use `npx wrangler rollback` if production misbehaves.

**Brand.** In every HTML page:
```html
<link rel="stylesheet" href="https://congtam.net/assets/tamta-tokens.css">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="icon" href="https://congtam.net/assets/mark-tile.svg">
```
First verify the tokens URL returns 200; if unreachable, vendor a local copy built from the values below and leave a `TODO: switch to hosted tokens`.

Tokens: `--tt-blue #1F3A5F` primary/links · `--tt-slate #3D5A7E` secondary on blue · `--tt-clay #C2703D` accent, **exactly one clay element per screen** · `--tt-sand #E8D9BC` highlight on blue · `--tt-paper #FBFAF7` background · `--tt-ink #17150F` text · `--tt-line #DDD8CF` hairline borders · `--tt-muted #6B675F` secondary text · `--tt-radius 10px`.

Space Grotesk for headings/UI/body; IBM Plex Mono for data, codes, timestamps, labels (labels uppercase, 0.1em tracking). No gradients, no shadows, no colours outside the tokens. Footer: small mark + "congtam.net" linking to https://congtam.net.

**Copy voice.** Conclusion first. Short sentences, plain and dry, Australian spelling, no exclamation marks.

**Pages.** `/about`: 3–5 sentences — what the app does, part of the congtam.net portfolio, no tracking, link home. `/privacy`: no third-party trackers or ads; runs entirely on Cloudflare; pastes stored in KV for 30 days by default then auto-deleted; no IP retention beyond Cloudflare's own.

**Analytics Engine** (wrangler.toml):
```toml
[[analytics_engine_datasets]]
binding = "TRAFFIC"
dataset = "clipboard_traffic"
```
Per request write: blobs `[pathname, country, method]`, doubles `[status]`, indexes `["clipboard"]`. Never log paste content, full IPs, or query strings.

**Rate limit** (wrangler.toml):
```toml
[[ratelimits]]
name = "WRITE_RATE_LIMITER"
namespace_id = "1001"
[ratelimits.simple]
limit = 10
period = 60
```
Key by client IP on the create endpoint; respond 429 with a plain branded message.

**Observability.** Add `[observability.logs] enabled = true`.

**Secrets.** None expected here; never hardcode or commit any.

## Definition of done
`npm run check` passes; smoke-tested with `npx wrangler dev` (create paste, read paste, 404, about, privacy, 429 on hammering create); README rewritten; DEPLOYMENT.md gone; deployed and verified live (create and read a paste in production, existing pastes still resolve); commits pushed to GitHub; final summary lists any remaining manual dashboard steps.
