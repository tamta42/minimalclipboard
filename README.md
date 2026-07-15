# Clipboard

Paste text, get a shareable URL. Anonymous notes on Cloudflare Workers + KV.
Part of the [congtam.net](https://congtam.net) portfolio. Live at [zanile.com](https://zanile.com).

## Setup

```bash
npm install
npm run check   # TypeScript
npm run dev     # Local: http://127.0.0.1:8787
```

Requires Node 18+ and a Cloudflare account (`npx wrangler login`).

## Deploy

```bash
npx wrangler deploy
```

`wrangler.toml` has the production KV, D1, rate limit, cron, Analytics Engine, and `EMAIL` (`[[send_email]]`) bindings. After deploy, verify create/read on the live URL. Use `npx wrangler rollback` if production misbehaves.

Secrets: `AUTH_COOKIE_SECRET` via `npx wrangler secret put AUTH_COOKIE_SECRET`. OTP from `auth@zanile.com` via Cloudflare Email Sending — onboard `zanile.com` under **Compute → Email Service → Email Sending**. Confirm in Workers Observability (`POST /auth/request`) and Email Service logs. After a successful production OTP send, delete obsolete `RESEND_API_KEY` if present.

First-time KV (only if recreating): `npx wrangler kv namespace create NOTES`, then put the IDs into `wrangler.toml` and redeploy.

## Behaviour

- Plain text only. Max 100 KB per paste (`MAX_BYTES`).
- Default TTL 7 days (`DEFAULT_TTL_SECONDS`); optional 1 hour / 1 day. No forever.
- Hourly cron cleans expired D1 paste metadata (KV TTL deletes content).
- Create limited to 10/IP/hour (KV counter) plus native 10/60s burst (`WRITE_RATE_LIMITER`).
- Paste IDs are random (≥128 bits). No public listing; optional signed-in “your pastes” (email OTP).
- Paste pages: `noindex` meta + `X-Robots-Tag`. Homepage stays indexable.
- Raw text: `/raw/{id}`. Pages: `/`, `/about`, `/privacy`, `/robots.txt`.
