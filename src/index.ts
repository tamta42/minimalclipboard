export interface Env {
  NOTES: KVNamespace;
  DEFAULT_TTL_SECONDS: number; // 0 for none
  MAX_BYTES: number; // payload size guard
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>zanile clipboard</title>
  <style>
    :root { color-scheme: light dark; }
    body { max-width: 800px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    h1 { margin: 0; font-size: 1.2rem; }
    textarea { width: 100%; min-height: 50vh; font: 14px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; padding: .75rem; border-radius: .5rem; border: 1px solid #8883; }
    .row { display: flex; gap: .5rem; margin-top: .75rem; }
    .row > * { flex: 1; }
    button { padding: .6rem .9rem; border-radius: .5rem; border: 1px solid #8885; background: #09f; color: white; cursor: pointer; }
    button.secondary { background: transparent; color: inherit; }
    .note { margin-top: .5rem; font-size: .9rem; opacity: .75; }
    input[type="text"] { width: 100%; padding: .6rem .7rem; border-radius: .5rem; border: 1px solid #8883; }
    .link { margin-top: .75rem; }
    .err { color: #c00; }
  </style>
  <meta name="description" content="Minimalist web text clipboard." />
</head>
<body>
  <header>
    <h1>zanile clipboard</h1>
    <nav><a href="/about">About</a></nav>
  </header>
  <form id="form">
    <textarea id="text" placeholder="Paste or type text..."></textarea>
    <div class="row">
      <button id="save" type="submit">Save</button>
      <button id="clear" class="secondary" type="button">Clear</button>
    </div>
    <div class="row">
      <input id="id" type="text" placeholder="Optional custom ID (a–z, 0–9, -), default random" />
    </div>
    <div class="note">Max 100 KB. Your note gets a shareable URL.</div>
    <div id="result" class="link"></div>
    <div id="error" class="err"></div>
  </form>
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

    if (request.method === 'GET' && (path === '/' || path === '/index.html')) {
      return new Response(HTML, { headers: { 'content-type': 'text/html; charset=UTF-8' } });
    }

    if (request.method === 'GET' && path === '/about') {
      const page = renderAboutPage();
      return new Response(page, { headers: { 'content-type': 'text/html; charset=UTF-8' } });
    }

    if (request.method === 'POST' && path === '/api/create') {
      try {
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
      if (value == null) return new Response('Not found', { status: 404 });
      return new Response(value, { headers: { 'content-type': 'text/plain; charset=UTF-8' } });
    }

    if (request.method === 'GET' && path !== '/') {
      const id = path.replace(/^\//, '');
      const value = await env.NOTES.get(id);
      if (value == null) return new Response('Not found', { status: 404 });
      const page = renderViewPage(id, value, request.url);
      return new Response(page, { headers: { 'content-type': 'text/html; charset=UTF-8' } });
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

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
  // Fallback to longer id if unlucky
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
  <title>${id} - zanile</title>
  <style>
    :root { color-scheme: light dark; }
    body { max-width: 800px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; }
    pre { white-space: pre-wrap; word-wrap: break-word; background: #00000008; padding: 1rem; border-radius: .5rem; border: 1px solid #8883; }
    .row { display: flex; gap: .5rem; margin-top: .75rem; }
    input { flex: 1; padding: .6rem .7rem; border-radius: .5rem; border: 1px solid #8883; }
    button { padding: .6rem .9rem; border-radius: .5rem; border: 1px solid #8885; background: #09f; color: white; cursor: pointer; }
    a.button { text-decoration: none; display: inline-block; }
  </style>
  <meta name="description" content="Shared note ${id}" />
</head>
<body>
  <h1>note ${id}</h1>
  <pre>${escaped}</pre>
  <div class="row">
    <input id="share" value="${shareUrl}" readonly />
    <button onclick="navigator.clipboard.writeText('${shareUrl}')">Copy URL</button>
    <a class="button" href="/">New</a>
    <a class="button" href="${rawUrl}">Raw</a>
  </div>
</body>
</html>`;
}

function renderAboutPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>About - zanile clipboard</title>
  <style>
    :root { color-scheme: light dark; }
    body { max-width: 800px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    h1 { margin: 0 0 1rem; font-size: 1.4rem; }
    p { line-height: 1.6; }
    ul { line-height: 1.6; }
    a.button { display: inline-block; margin-top: 1rem; padding: .6rem .9rem; border-radius: .5rem; border: 1px solid #8885; background: #09f; color: white; text-decoration: none; }
  </style>
  <meta name="description" content="About this minimalist clipboard app" />
  <link rel="canonical" href="/about" />
  </head>
  <body>
    <header>
      <h1>About</h1>
      <nav><a href="/">Home</a></nav>
    </header>
    <p>
      I often use simple paste-and-share apps like justpaste.it, but they are sometimes blocked or unavailable.
      So I decided to build a tiny, reliable version for myself.
    </p>
    <p>
      This entire site was created from a single prompt using Cursor and one of the best-available LLMs at the time.
    </p>
    <h2>Tech stack</h2>
    <ul>
      <li><strong>Cloudflare Workers</strong>: serverless runtime that serves the app globally</li>
      <li><strong>Cloudflare KV</strong>: key-value storage for notes</li>
      <li><strong>TypeScript</strong> with the Workers runtime types</li>
      <li><strong>Wrangler</strong> for local dev and deploy</li>
      <li><strong>Vanilla HTML/CSS/JS</strong> for a zero-dependency UI</li>
    </ul>
    <a class="button" href="/">Create a new note</a>
  </body>
  </html>`;
}


