## Zanile Minimal Clipboard (Cloudflare Worker)

A minimalist web text clipboard like justpaste.it. Users can paste text, save, and share via a short URL.

### Stack
- Cloudflare Workers (TypeScript/ES Modules)
- Cloudflare KV for storage
- Vanilla HTML/CSS/JS (zero dependencies)

### Local Dev
1. Install Node.js 18+ and Cloudflare Wrangler (`npm i -g wrangler` or use `npx`).
2. Install deps: `npm install`
3. Dev server: `npm run dev`
4. Type check: `npm run check`

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
- Entries are given an 8-char random ID (a-z, 0-9). Collisions are retried with longer IDs.
- Set TTL via `DEFAULT_TTL_SECONDS` in `wrangler.toml` if you want auto-expiry (0 = no expiry).
- Custom IDs supported: alphanumeric + hyphens, max 64 chars.
- Raw text access via `/raw/{id}` endpoint.
- About page available at `/about`.

Built because I've always wanted something like justpaste.it with full control.
