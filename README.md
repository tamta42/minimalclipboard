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
npx wrangler d1 execute zanile-auth --remote --file=schema.abuse.sql
npx wrangler deploy
```

`wrangler.toml` has the production KV, D1, rate limit, cron, Analytics Engine, and `EMAIL` (`[[send_email]]`) bindings. After deploy, verify create/read on the live URL. Use `npx wrangler rollback` if production misbehaves.

Secrets: shared `AUTH_COOKIE_SECRET` via account Secrets Store (`[[secrets_store_secrets]]`; `await env.AUTH_COOKIE_SECRET.get()`). OTP from `auth@zanile.com` via Cloudflare Email Sending — onboard `zanile.com` under **Compute → Email Service → Email Sending**. Confirm in Workers Observability (`POST /auth/request`) and Email Service logs.

First-time KV (only if recreating): `npx wrangler kv namespace create NOTES`, then put the IDs into `wrangler.toml` and redeploy.

## Fair-use / abuse protection

| Layer | Mechanism | Threshold |
| --- | --- | --- |
| Anon create burst | `WRITE_RATE_LIMITER` | 10 / 60s per IP hash |
| Auth create burst | `USER_WRITE_RATE_LIMITER` | 30 / 60s per email |
| Anon hourly / daily | D1 `ip_counters` | **10 / hour · 30 / day** per IP → soft `401` + `login_required` |
| Auth hourly / daily | D1 `ip_counters` | **40 / hour · 120 / day** per email → `429` + `fair_use_limit` |
| Auth IP safety | D1 `ip_counters` | **60 / hour · 200 / day** per IP → `429` + `fair_use_limit` |
| Paste reads | `READ_RATE_LIMITER` | 120 / 60s per IP (`/{id}`, `/raw/{id}`) |
| OTP request | `AUTH_RATE_LIMITER` | 5 / 60s per email **and** per IP |
| OTP verify | `AUTH_RATE_LIMITER` | 5 / 60s per email |

Anon over-limit responses nudge sign-in (`code: "login_required"`). Apply `schema.abuse.sql` for the `ip_counters` table.

## Behaviour

- Plain text only. Max 100 KB per paste (`MAX_BYTES`). Empty / whitespace-only rejected.
- Default TTL 7 days (`DEFAULT_TTL_SECONDS`); optional 1 hour / 1 day. No forever.
- Hourly cron cleans expired D1 paste metadata (KV TTL deletes content).
- Paste IDs are random (≥128 bits). No public listing; optional signed-in “your pastes” (email OTP).
- Paste pages: `noindex` meta + `X-Robots-Tag`. Homepage stays indexable.
- Abuse reports: `mailto:abuse@zanile.com`.
- Raw text: `/raw/{id}`. Pages: `/`, `/about`, `/privacy`, `/robots.txt`.
