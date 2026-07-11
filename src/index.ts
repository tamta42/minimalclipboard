export interface Env {
  NOTES: KVNamespace;
  DEFAULT_TTL_SECONDS: number; // 0 for none
  MAX_BYTES: number; // payload size guard
  WRITE_RATE_LIMITER: RateLimit;
  TRAFFIC: AnalyticsEngineDataset;
}

const BRAND_HEAD = `
  <link rel="stylesheet" href="https://congtam.net/assets/tamta-tokens.css">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="icon" href="https://congtam.net/assets/mark-tile.svg">
`;

const SHARED_CSS = `
  * { box-sizing: border-box; }
  body {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem 4rem;
    font-family: var(--tt-font-display);
    background: var(--tt-paper);
    color: var(--tt-ink);
    line-height: 1.5;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  main { flex: 1; }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--tt-line);
  }
  h1 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--tt-blue);
  }
  nav { display: flex; gap: 1rem; }
  nav a {
    color: var(--tt-muted);
    text-decoration: none;
    font-size: 0.9rem;
  }
  nav a:hover { color: var(--tt-blue); }
  label.label {
    display: block;
    font-family: var(--tt-font-mono);
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--tt-muted);
    margin-bottom: 0.4rem;
  }
  textarea, input[type="text"] {
    width: 100%;
    padding: 0.75rem;
    border-radius: var(--tt-radius);
    border: 1px solid var(--tt-line);
    background: var(--tt-paper);
    color: var(--tt-ink);
    font-family: var(--tt-font-mono);
    font-size: 0.875rem;
  }
  textarea {
    min-height: 50vh;
    resize: vertical;
  }
  textarea:focus, input[type="text"]:focus {
    outline: 2px solid var(--tt-blue);
    outline-offset: 1px;
  }
  .row {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
    flex-wrap: wrap;
  }
  .row > * { flex: 1; min-width: 0; }
  button, a.button {
    display: inline-block;
    padding: 0.6rem 0.9rem;
    border-radius: var(--tt-radius);
    border: 1px solid var(--tt-blue);
    background: var(--tt-blue);
    color: var(--tt-paper);
    font-family: var(--tt-font-display);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    text-align: center;
  }
  button.primary, a.button.primary {
    background: var(--tt-clay);
    border-color: var(--tt-clay);
    color: var(--tt-paper);
  }
  button.secondary, a.button.secondary {
    background: transparent;
    color: var(--tt-blue);
    border-color: var(--tt-line);
  }
  button.secondary:hover, a.button.secondary:hover {
    border-color: var(--tt-blue);
  }
  .note {
    margin-top: 0.75rem;
    font-size: 0.875rem;
    color: var(--tt-muted);
  }
  .link { margin-top: 0.75rem; }
  .link a { color: var(--tt-blue); }
  .err { color: var(--tt-clay); margin-top: 0.5rem; font-size: 0.9rem; }
  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    padding: 1rem;
    border-radius: var(--tt-radius);
    border: 1px solid var(--tt-line);
    background: var(--tt-paper);
    font-family: var(--tt-font-mono);
    font-size: 0.875rem;
    color: var(--tt-ink);
  }
  p { color: var(--tt-ink); max-width: 40rem; }
  a { color: var(--tt-blue); }
  a:hover { color: var(--tt-clay); }
  footer {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid var(--tt-line);
    font-size: 0.8rem;
  }
  footer a {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--tt-muted);
    text-decoration: none;
  }
  footer a:hover { color: var(--tt-blue); }
  footer img { width: 16px; height: 16px; border-radius: 3px; }
`;

const FOOTER = `
<footer>
  <a href="https://congtam.net">
    <img src="https://congtam.net/assets/mark-tile.svg" alt="" width="16" height="16" />
    congtam.net
  </a>
</footer>`;

const NAV = `
<nav>
  <a href="/about">About</a>
  <a href="/privacy">Privacy</a>
</nav>`;

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Clipboard</title>
  ${BRAND_HEAD}
  <style>${SHARED_CSS}</style>
  <meta name="description" content="Minimal web text clipboard." />
</head>
<body>
  <header>
    <h1>Clipboard</h1>
    ${NAV}
  </header>
  <main>
  <form id="form">
    <label class="label" for="text">Text</label>
    <textarea id="text" placeholder="Paste or type text…"></textarea>
    <div class="row">
      <button id="save" class="primary" type="submit">Save</button>
      <button id="clear" class="secondary" type="button">Clear</button>
    </div>
    <div class="row">
      <div>
        <label class="label" for="id">Custom ID</label>
        <input id="id" type="text" placeholder="Optional (a–z, 0–9, -), default random" />
      </div>
    </div>
    <div class="note">Max 100 KB. Your note gets a shareable URL.</div>
    <div id="result" class="link"></div>
    <div id="error" class="err"></div>
  </form>
  </main>
  ${FOOTER}
  <script>
    const form = document.getElementById('form');
    const text = document.getElementById('text');
    const idInput = document.getElementById('id');
    const result = document.getElementById('result');
    const error = document.getElementById('error');
    const clearBtn = document.getElementById('clear');
    clearBtn.onclick = () => { text.value=''; idInput.value=''; result.textContent=''; error.textContent=''; };
    form.onsubmit = async (e) => {
      e.preventDefault();
      result.textContent=''; error.textContent='';
      const payload = { text: text.value, id: idInput.value || undefined };
      try {
        const res = await fetch('/api/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        const url = data.url;
        result.innerHTML = '<a href="'+url+'">'+url+'</a>';
        history.replaceState(null, '', '/'+data.id);
      } catch (err) {
        error.textContent = String(err.message || err);
      }
    };
  </script>
</body>
</html>`;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const response = await handleRequest(request, env, path);
    logTraffic(env, request, path, response.status);
    return response;
  },
} satisfies ExportedHandler<Env>;

async function handleRequest(request: Request, env: Env, path: string): Promise<Response> {
    if (request.method === 'GET' && (path === '/' || path === '/index.html')) {
      return html(HTML);
    }

    if (request.method === 'GET' && path === '/about') {
      return html(renderAboutPage());
    }

    if (request.method === 'GET' && path === '/privacy') {
      return html(renderPrivacyPage());
    }

    if (request.method === 'POST' && path === '/api/create') {
      try {
        if (env.WRITE_RATE_LIMITER) {
          const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
          const { success } = await env.WRITE_RATE_LIMITER.limit({ key: ip });
          if (!success) {
            return json({ error: 'Too many requests. Paste creation is limited to 10 per minute.' }, 429);
          }
        }

        const body = await request.json<any>();
        const text: string = typeof body?.text === 'string' ? body.text : '';
        let id: string | undefined = typeof body?.id === 'string' ? body.id : undefined;
        if (!text) return json({ error: 'Text is required' }, 400);
        const maxBytes = env.MAX_BYTES ?? 100000;
        const size = new TextEncoder().encode(text).byteLength;
        if (size > maxBytes) return json({ error: `Too large. Limit ${maxBytes} bytes` }, 413);

        if (id) {
          id = normalizeId(id);
          if (!/^[a-z0-9-]{1,64}$/.test(id)) return json({ error: 'Invalid id' }, 400);
          const exists = await env.NOTES.get(id);
          if (exists) return json({ error: 'ID already exists' }, 409);
        } else {
          id = await generateUniqueId(env.NOTES);
        }

        const ttlSeconds = env.DEFAULT_TTL_SECONDS && env.DEFAULT_TTL_SECONDS > 0 ? env.DEFAULT_TTL_SECONDS : undefined;
        await env.NOTES.put(id, text, ttlSeconds ? { expirationTtl: ttlSeconds } : undefined);

        const shareUrl = new URL('/' + id, request.url).toString();
        return json({ id, url: shareUrl }, 201);
      } catch (err: any) {
        return json({ error: 'Bad Request' }, 400);
      }
    }

    if (request.method === 'GET' && path.startsWith('/raw/')) {
      const id = path.slice('/raw/'.length);
      const value = await env.NOTES.get(id);
      if (value == null) return html(renderNotFoundPage(), 404);
      return new Response(value, { headers: { 'content-type': 'text/plain; charset=UTF-8' } });
    }

    if (request.method === 'GET' && path !== '/') {
      const id = path.replace(/^\//, '');
      if (id === 'about' || id === 'privacy') {
        return html(renderNotFoundPage(), 404);
      }
      const value = await env.NOTES.get(id);
      if (value == null) return html(renderNotFoundPage(), 404);
      return html(renderViewPage(id, value, request.url));
    }

    return html(renderNotFoundPage(), 404);
}

function logTraffic(env: Env, request: Request, pathname: string, status: number): void {
  if (!env.TRAFFIC) return;
  const country = (request.cf?.country as string | undefined) || 'XX';
  env.TRAFFIC.writeDataPoint({
    blobs: [pathname, country, request.method],
    doubles: [status],
    indexes: ['clipboard'],
  });
}

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=UTF-8' },
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=UTF-8' },
  });
}

async function generateUniqueId(kv: KVNamespace): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = randomId(8);
    const exists = await kv.get(id);
    if (!exists) return id;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = randomId(12);
    const exists = await kv.get(id);
    if (!exists) return id;
  }
  throw new Error('Could not generate unique id');
}

function randomId(length: number): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  const rand = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    out += alphabet[rand[i] % alphabet.length];
  }
  return out;
}

function normalizeId(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderViewPage(id: string, text: string, reqUrl: string): string {
  const escaped = escapeHtml(text);
  const rawUrl = new URL('/raw/' + id, reqUrl).toString();
  const shareUrl = new URL('/' + id, reqUrl).toString();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(id)} — Clipboard</title>
  ${BRAND_HEAD}
  <style>${SHARED_CSS}</style>
  <meta name="description" content="Shared note ${escapeHtml(id)}" />
</head>
<body>
  <header>
    <h1>Note <span style="font-family:var(--tt-font-mono);font-weight:400;font-size:0.9em">${escapeHtml(id)}</span></h1>
    ${NAV}
  </header>
  <main>
  <pre>${escaped}</pre>
  <div class="row">
    <input id="share" value="${escapeHtml(shareUrl)}" readonly />
    <button class="primary" type="button" onclick="navigator.clipboard.writeText(document.getElementById('share').value)">Copy URL</button>
    <a class="button secondary" href="/">New</a>
    <a class="button secondary" href="${escapeHtml(rawUrl)}">Raw</a>
  </div>
  </main>
  ${FOOTER}
</body>
</html>`;
}

function renderAboutPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>About — Clipboard</title>
  ${BRAND_HEAD}
  <style>${SHARED_CSS}</style>
  <meta name="description" content="About Clipboard, a minimal paste-and-share tool." />
  <link rel="canonical" href="/about" />
</head>
<body>
  <header>
    <h1>About</h1>
    ${NAV}
  </header>
  <main>
  <p>Clipboard is a minimal paste-and-share tool. Paste text, get a URL, send the link.</p>
  <p>It is part of the <a href="https://congtam.net">congtam.net</a> portfolio. No accounts, no tracking pixels, no ads.</p>
  <p>Notes live in Cloudflare KV and expire after 30 days by default. See <a href="/privacy">Privacy</a> for retention detail.</p>
  <p><a class="button primary" href="/">Create a note</a></p>
  </main>
  ${FOOTER}
</body>
</html>`;
}

function renderPrivacyPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Privacy — Clipboard</title>
  ${BRAND_HEAD}
  <style>${SHARED_CSS}</style>
  <meta name="description" content="Privacy policy for Clipboard." />
  <link rel="canonical" href="/privacy" />
</head>
<body>
  <header>
    <h1>Privacy</h1>
    ${NAV}
  </header>
  <main>
  <p>No third-party trackers or ads. The app runs entirely on Cloudflare.</p>
  <p>Pastes are stored in Cloudflare KV for 30 days by default, then auto-deleted. Custom IDs follow the same retention.</p>
  <p>This app does not retain IP addresses beyond Cloudflare’s own edge logs. Paste content is never written to analytics.</p>
  <p><a class="button primary" href="/">Home</a></p>
  </main>
  ${FOOTER}
</body>
</html>`;
}

function renderNotFoundPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Not found — Clipboard</title>
  ${BRAND_HEAD}
  <style>${SHARED_CSS}</style>
</head>
<body>
  <header>
    <h1>Not found</h1>
    ${NAV}
  </header>
  <main>
  <p>No note exists at this URL. It may have expired or never been created.</p>
  <p><a class="button primary" href="/">Create a note</a></p>
  </main>
  ${FOOTER}
</body>
</html>`;
}
