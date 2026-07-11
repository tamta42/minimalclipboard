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

`wrangler.toml` already has the production KV namespace, rate limit, and Analytics Engine bindings. After deploy, verify create/read on the live URL. Use `npx wrangler rollback` if production misbehaves.

First-time KV (only if recreating): `npx wrangler kv namespace create NOTES`, then put the IDs into `wrangler.toml` and redeploy.

## Behaviour

- Max 100 KB per paste (`MAX_BYTES`).
- Default TTL 30 days (`DEFAULT_TTL_SECONDS`).
- Create endpoint rate-limited to 10/min per IP.
- Custom IDs: `a–z`, `0–9`, `-`, max 64 chars.
- Raw text: `/raw/{id}`. Pages: `/`, `/about`, `/privacy`.
