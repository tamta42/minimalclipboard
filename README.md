## Zanile Minimal Clipboard (Cloudflare Worker)

A minimalist web text clipboard like wepaste.it. Users can paste text, save, and share via a short URL.

### Stack
- Cloudflare Workers (Modules)
- Cloudflare KV for storage

### Local Dev
1. Install Node.js 18+ and Cloudflare Wrangler (`npm i -g wrangler` or use `npx`).
2. Install deps: `npm install`
3. Dev server: `npm run dev`

### Deploy
1. Authenticate: `npx wrangler login`
2. Create KV namespace (first time only): `npx wrangler kv:namespace create NOTES` and repeat with `--environment preview` if desired.
3. Update `wrangler.toml` KV namespace IDs as instructed in the command output.
4. Publish: `npm run deploy`

### Custom Domain
Publish will default to your `*.workers.dev` subdomain. To use `zanile.com`, add the zone to Cloudflare and set a route in `wrangler.toml` like:

```
routes = [
  { pattern = "zanile.com/*", zone_name = "zanile.com" }
]
```

Then republish.

### Notes
- Max payload enforced server-side to protect KV (default 100KB).
- Entries are given an 8-char base62 ID. Collisions are retried.
- Set TTL via `DEFAULT_TTL_SECONDS` in `src/index.ts` if you want auto-expiry.
i've always wanted something like justpaste.it with full control of it for myself
