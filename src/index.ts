export interface Env {
  NOTES: KVNamespace;
  DB: D1Database;
  DEFAULT_TTL_SECONDS: number;
  MAX_BYTES: number;
  WRITE_RATE_LIMITER: RateLimit;
  AUTH_RATE_LIMITER: RateLimit;
  TRAFFIC: AnalyticsEngineDataset;
  AUTH_COOKIE_SECRET?: string;
  RESEND_API_KEY?: string;
  ENVIRONMENT?: string;
}

const AUTH_COOKIE = 'zanile_auth';
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const AUTH_TTL_SEC = 60 * 60 * 24 * 30;
const THEME_DEFAULT = 'dark';

const THEME_BOOT = `
  <meta name="color-scheme" content="dark light" />
  <script>
    (function () {
      try {
        var t = localStorage.getItem('tt-theme');
        if (t !== 'light' && t !== 'dark') {
          if (window.matchMedia('(prefers-color-scheme: light)').matches) t = 'light';
          else if (window.matchMedia('(prefers-color-scheme: dark)').matches) t = 'dark';
          else t = '${THEME_DEFAULT}';
        }
        document.documentElement.setAttribute('data-theme', t);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', '${THEME_DEFAULT}');
      }
    })();
  </script>
`;

const THEME_CSS = `
  html { color-scheme: light; }
  html[data-theme='dark'] { color-scheme: dark; }
  [data-theme='dark'] {
    --tt-paper: #152538;
    --tt-ink: #FBFAF7;
    --tt-line: #2f4a6b;
    --tt-muted: #9aabbf;
    --tt-blue: #E8D9BC;
    --tt-slate: #9AABBF;
  }
  .theme-toggle {
    appearance: none;
    margin: 0;
    padding: 0.4rem 0.7rem;
    border: 1px solid var(--tt-line);
    border-radius: var(--tt-radius);
    background: transparent;
    color: var(--tt-muted);
    font-family: var(--tt-font-mono);
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .theme-toggle:hover { color: var(--tt-blue); border-color: var(--tt-blue); }
  .theme-toggle:focus-visible { outline: 2px solid var(--tt-clay); outline-offset: 2px; }
`;

const THEME_JS = `
<script>
(function () {
  var root = document.documentElement;
  var storageKey = 'tt-theme';
  function currentTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  function labelFor(theme) { return theme === 'dark' ? 'Light' : 'Dark'; }
  function ariaFor(theme) {
    return theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  }
  function apply(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(storageKey, theme); } catch (e) {}
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-label', ariaFor(theme));
      var label = btn.querySelector('[data-theme-label]');
      if (label) label.textContent = labelFor(theme);
    });
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      apply(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });
  apply(currentTheme());
})();
</script>`;

const THEME_TOGGLE = `<button type="button" class="theme-toggle" data-theme-toggle aria-label="Switch to light theme"><span class="theme-toggle-label" data-theme-label>Light</span></button>`;

const BRAND_HEAD = `
  ${THEME_BOOT}
  <link rel="stylesheet" href="https://congtam.net/assets/tamta-tokens.css">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="icon" href="https://congtam.net/assets/mark-tile.svg">
`;

const AUTH_CSS = `
  .app-shell { min-height: 100vh; display: flex; flex-direction: column; }
  .top-bar {
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    padding: 0.75rem 1.25rem; border-bottom: 1px solid var(--tt-line); flex-shrink: 0;
  }
  .brand {
    display: inline-flex; align-items: center; gap: 0.55rem;
    text-decoration: none; color: var(--tt-blue); min-width: 0;
  }
  .brand img { width: 28px; height: 28px; border-radius: var(--tt-radius); flex-shrink: 0; }
  .brand-text { display: flex; flex-direction: column; gap: 0.05rem; min-width: 0; }
  .brand-name { font-size: 1.05rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; }
  .brand-tag { font-size: 0.72rem; font-weight: 500; color: var(--tt-muted); letter-spacing: 0.01em; }
  .top-bar-actions { display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap; justify-content: flex-end; }
  .top-bar-actions a { font-size: 0.85rem; color: var(--tt-muted); text-decoration: none; }
  .top-bar-actions a:hover { color: var(--tt-blue); }
  .header-account-btn { display: none; }
  .app-body { flex: 1; display: flex; min-height: 0; min-width: 0; position: relative; }
  .account-sidebar {
    --sidebar-w: 260px;
    width: var(--sidebar-w); flex-shrink: 0; display: flex; position: relative;
    border-right: 1px solid var(--tt-line); background: var(--tt-paper); z-index: 30;
    transition: width 0.18s ease;
  }
  .account-sidebar.is-collapsed { width: 40px; }
  .sidebar-rail {
    display: none; width: 40px; flex-shrink: 0; flex-direction: column; align-items: center;
    padding: 0.75rem 0; gap: 0.5rem;
  }
  .account-sidebar.is-collapsed .sidebar-rail { display: flex; }
  .account-sidebar.is-collapsed .sidebar-panel { display: none; }
  .account-sidebar.is-collapsed .sidebar-resizer { display: none; }
  .rail-btn {
    appearance: none; width: 28px; height: 28px; padding: 0; border: none; background: transparent;
    color: var(--tt-muted); cursor: pointer; border-radius: var(--tt-radius);
    display: inline-flex; align-items: center; justify-content: center;
  }
  .rail-btn:hover { color: var(--tt-blue); background: color-mix(in srgb, var(--tt-blue) 10%, transparent); }
  .rail-btn:focus-visible { outline: 2px solid var(--tt-clay); outline-offset: 2px; }
  .rail-btn svg { width: 16px; height: 16px; display: block; }
  .sidebar-panel {
    flex: 1; min-width: 0; padding: 0.85rem 0.9rem 1rem; display: flex; flex-direction: column;
    gap: 0.85rem; overflow: auto;
  }
  .sidebar-panel-head {
    display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  }
  .sidebar-panel-head .label { margin: 0; }
  .sidebar-collapse {
    appearance: none; width: 22px; height: 22px; padding: 0; border: 1px solid transparent;
    background: transparent; color: var(--tt-muted); cursor: pointer; border-radius: 4px;
    display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem; line-height: 1;
  }
  .sidebar-collapse:hover { color: var(--tt-blue); border-color: var(--tt-line); }
  .sidebar-resizer {
    position: absolute; top: 0; right: -3px; width: 6px; height: 100%; cursor: col-resize; z-index: 2;
  }
  .sidebar-resizer::after {
    content: ''; position: absolute; top: 0; bottom: 0; left: 2px; width: 1px;
    background: transparent; transition: background 0.15s ease;
  }
  .sidebar-resizer:hover::after, .account-sidebar.is-resizing .sidebar-resizer::after {
    background: var(--tt-blue); opacity: 0.55;
  }
  .sidebar-overlay {
    display: none; position: fixed; inset: 0; background: rgba(20, 30, 40, 0.35); z-index: 25;
  }
  .sidebar-overlay.show { display: block; }
  .main-area { flex: 1; min-width: 0; overflow: auto; display: flex; flex-direction: column; }
  .page-inner {
    max-width: 800px; width: 100%; margin: 0 auto;
    padding: 1.5rem 1.25rem 2.5rem; flex: 1; display: flex; flex-direction: column;
  }
  .auth-box { display: flex; flex-direction: column; gap: 0.35rem; }
  .auth-box .label {
    font-family: var(--tt-font-mono); font-size: 0.65rem; font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.1em; color: var(--tt-muted); margin: 0;
  }
  .auth-box input {
    width: 100%; padding: 0.4rem 0.55rem; border: 1px solid var(--tt-line);
    border-radius: var(--tt-radius); background: var(--tt-paper); color: var(--tt-ink);
    font-family: inherit; font-size: 0.8rem;
  }
  .auth-box .btn {
    width: 100%; padding: 0.4rem 0.55rem; border-radius: var(--tt-radius);
    border: 1px solid var(--tt-blue); background: var(--tt-blue); color: var(--tt-paper);
    font-family: inherit; font-size: 0.75rem; font-weight: 600; cursor: pointer;
  }
  .auth-box .btn.secondary { background: transparent; color: var(--tt-blue); border-color: var(--tt-line); }
  .auth-box .err { color: var(--tt-clay); font-size: 0.75rem; margin: 0; min-height: 0; }
  .auth-box .signed-email { font-size: 0.8rem; margin: 0; word-break: break-all; color: var(--tt-ink); }
  .saved-panel { display: none; padding-top: 0.75rem; border-top: 1px solid var(--tt-line); }
  .saved-panel.visible { display: block; }
  .saved-panel h2 {
    margin: 0 0 0.75rem; font-size: 0.75rem; font-family: var(--tt-font-mono);
    text-transform: uppercase; letter-spacing: 0.08em; color: var(--tt-muted); font-weight: 500;
  }
  .saved-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
  .saved-list a { color: var(--tt-blue); text-decoration: none; font-size: 0.85rem; }
  .saved-list a:hover { color: var(--tt-clay); }
  .saved-empty { color: var(--tt-muted); font-size: 0.8rem; margin: 0; }
  @media (max-width: 800px) {
    .header-account-btn { display: inline-flex; }
    .account-sidebar {
      position: fixed; top: 0; left: 0; height: 100vh; width: min(var(--sidebar-w), 86vw);
      transform: translateX(-105%); transition: transform 0.2s ease; border-right: 1px solid var(--tt-line);
    }
    .account-sidebar.is-open { transform: translateX(0); }
    .account-sidebar.is-collapsed { width: min(var(--sidebar-w), 86vw); }
    .account-sidebar.is-collapsed .sidebar-rail { display: none; }
    .account-sidebar.is-collapsed .sidebar-panel { display: flex; }
    .sidebar-resizer { display: none; }
  }
`;

const SHARED_CSS = `
  ${THEME_CSS}
  ${AUTH_CSS}
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: var(--tt-font-display);
    background: var(--tt-paper);
    color: var(--tt-ink);
    line-height: 1.5;
    min-height: 100vh;
  }
  main { flex: 1; }
  h1 {
    margin: 0 0 1rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--tt-blue);
  }
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
  textarea:focus, input[type="text"]:focus, .auth-box input:focus {
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

const BRAND = `
<a class="brand" href="/">
  <img src="https://congtam.net/assets/mark-tile.svg" alt="" width="28" height="28" />
  <span class="brand-text">
    <span class="brand-name">zanile.com</span>
    <span class="brand-tag">Web clipboard</span>
  </span>
</a>`;

const HEADER_ACTIONS = `
<div class="top-bar-actions">
  <button type="button" class="rail-btn header-account-btn" id="headerAccountBtn" aria-label="Open account sidebar" title="Account">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <circle cx="8" cy="5.5" r="2.5"/>
      <path d="M3 13.5c0-2.5 2.2-4 5-4s5 1.5 5 4"/>
    </svg>
  </button>
  <a href="/about">About</a>
  <a href="/privacy">Privacy</a>
  ${THEME_TOGGLE}
</div>`;

const AUTH_BOX = `
<div class="auth-box" id="authBox">
  <div id="authSignedOut">
    <input type="email" id="authEmail" placeholder="you@example.com" autocomplete="email" />
    <button type="button" class="btn" id="requestCode">Send code</button>
    <div id="codeRow" style="display:none">
      <input type="text" id="authCode" placeholder="6-digit code" maxlength="6" inputmode="numeric" autocomplete="one-time-code" />
      <button type="button" class="btn" id="verifyCode" style="margin-top:0.35rem">Verify</button>
    </div>
    <p class="err" id="authErr"></p>
  </div>
  <div id="authSignedIn" style="display:none">
    <p class="signed-email" id="signedEmail"></p>
    <button type="button" class="btn secondary" id="logout">Sign out</button>
  </div>
</div>`;

const ACCOUNT_SIDEBAR = `
<aside class="account-sidebar" id="accountSidebar" aria-label="Account">
  <div class="sidebar-rail">
    <button type="button" class="rail-btn" id="sidebarExpand" aria-label="Open account sidebar" title="Account">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <circle cx="8" cy="5.5" r="2.5"/>
        <path d="M3 13.5c0-2.5 2.2-4 5-4s5 1.5 5 4"/>
      </svg>
    </button>
  </div>
  <div class="sidebar-panel">
    <div class="sidebar-panel-head">
      <p class="label">Account</p>
      <button type="button" class="sidebar-collapse" id="sidebarCollapse" aria-label="Collapse sidebar" title="Collapse">‹</button>
    </div>
    ${AUTH_BOX}
    <div class="saved-panel" id="savedPanel">
      <h2>Your saved pastes</h2>
      <div id="savedList"></div>
    </div>
  </div>
  <div class="sidebar-resizer" id="sidebarResizer" role="separator" aria-orientation="vertical" aria-label="Resize sidebar"></div>
</aside>
<div class="sidebar-overlay" id="sidebarOverlay"></div>`;

const SIDEBAR_JS = `
<script>
(function () {
  var sidebar = document.getElementById('accountSidebar');
  var overlay = document.getElementById('sidebarOverlay');
  if (!sidebar) return;
  var KEY_C = 'tt-sidebar-collapsed';
  var KEY_W = 'tt-sidebar-width';
  var COLLAPSE_AT = 72;
  var MIN_W = 200;
  var MAX_W = 360;
  var DEFAULT_W = 260;
  var mobileMq = window.matchMedia('(max-width: 800px)');

  function isMobile() { return mobileMq.matches; }

  function savedWidth() {
    try {
      var w = parseInt(localStorage.getItem(KEY_W) || '', 10);
      if (w >= MIN_W && w <= MAX_W) return w;
    } catch (e) {}
    return DEFAULT_W;
  }

  function savedCollapsed() {
    try { return localStorage.getItem(KEY_C) === '1'; } catch (e) { return false; }
  }

  function setWidth(px) {
    sidebar.style.setProperty('--sidebar-w', px + 'px');
    try { localStorage.setItem(KEY_W, String(px)); } catch (e) {}
  }

  function setCollapsed(collapsed) {
    sidebar.classList.toggle('is-collapsed', collapsed && !isMobile());
    try { localStorage.setItem(KEY_C, collapsed ? '1' : '0'); } catch (e) {}
    if (isMobile()) {
      sidebar.classList.toggle('is-open', !collapsed);
      if (overlay) overlay.classList.toggle('show', !collapsed);
    } else {
      sidebar.classList.remove('is-open');
      if (overlay) overlay.classList.remove('show');
    }
  }

  function expand() { setCollapsed(false); }
  function collapse() { setCollapsed(true); }

  function init() {
    setWidth(savedWidth());
    if (isMobile()) setCollapsed(true);
    else setCollapsed(savedCollapsed());
  }

  var expandBtn = document.getElementById('sidebarExpand');
  var collapseBtn = document.getElementById('sidebarCollapse');
  var headerBtn = document.getElementById('headerAccountBtn');
  if (expandBtn) expandBtn.addEventListener('click', expand);
  if (collapseBtn) collapseBtn.addEventListener('click', collapse);
  if (headerBtn) headerBtn.addEventListener('click', expand);
  if (overlay) overlay.addEventListener('click', collapse);

  var resizer = document.getElementById('sidebarResizer');
  if (resizer) {
    var dragging = false;
    resizer.addEventListener('pointerdown', function (e) {
      if (isMobile() || sidebar.classList.contains('is-collapsed')) return;
      dragging = true;
      sidebar.classList.add('is-resizing');
      resizer.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    resizer.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var rect = sidebar.getBoundingClientRect();
      var w = Math.round(e.clientX - rect.left);
      if (w < COLLAPSE_AT) {
        collapse();
        dragging = false;
        sidebar.classList.remove('is-resizing');
        return;
      }
      w = Math.max(MIN_W, Math.min(MAX_W, w));
      setWidth(w);
      setCollapsed(false);
    });
    function endDrag() {
      dragging = false;
      sidebar.classList.remove('is-resizing');
    }
    resizer.addEventListener('pointerup', endDrag);
    resizer.addEventListener('pointercancel', endDrag);
  }

  mobileMq.addEventListener('change', init);
  init();
})();
</script>`;

const AUTH_CLIENT_JS = `
<script>
(function () {
  const authErr = document.getElementById('authErr');
  const codeRow = document.getElementById('codeRow');
  const signedOut = document.getElementById('authSignedOut');
  const signedIn = document.getElementById('authSignedIn');
  const signedEmail = document.getElementById('signedEmail');
  const savedPanel = document.getElementById('savedPanel');
  const savedList = document.getElementById('savedList');
  if (!authErr) return;

  async function refreshMe() {
    const res = await fetch('/api/me');
    const data = await res.json();
    const ok = !!data.signedIn;
    signedOut.style.display = ok ? 'none' : 'block';
    signedIn.style.display = ok ? 'block' : 'none';
    if (ok) {
      signedEmail.textContent = data.email;
      await loadSaved();
    } else if (savedPanel) {
      savedPanel.classList.remove('visible');
    }
  }

  async function loadSaved() {
    if (!savedPanel || !savedList) return;
    const res = await fetch('/api/pastes');
    const data = await res.json();
    const items = data.pastes || [];
    savedPanel.classList.add('visible');
    if (!items.length) {
      savedList.innerHTML = '<p class="saved-empty">No saved pastes yet. Sign in and save to keep a list here.</p>';
      return;
    }
    savedList.innerHTML = '<ul class="saved-list">' + items.map(function (p) {
      const label = (p.preview || p.id).replace(/</g, '&lt;');
      return '<li><a href="/' + encodeURIComponent(p.id) + '">' + label + '</a></li>';
    }).join('') + '</ul>';
  }

  document.getElementById('requestCode').onclick = async function () {
    authErr.textContent = '';
    const email = document.getElementById('authEmail').value.trim();
    const res = await fetch('/auth/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) { authErr.textContent = data.error || 'Failed'; return; }
    codeRow.style.display = 'block';
    if (data.dev) authErr.textContent = 'Local/dev: check wrangler logs for the code.';
  };

  document.getElementById('verifyCode').onclick = async function () {
    authErr.textContent = '';
    const email = document.getElementById('authEmail').value.trim();
    const code = document.getElementById('authCode').value.trim();
    const res = await fetch('/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (!res.ok) { authErr.textContent = data.error || 'Failed'; return; }
    await refreshMe();
  };

  document.getElementById('logout').onclick = async function () {
    await fetch('/auth/logout', { method: 'POST' });
    await refreshMe();
  };

  refreshMe();
})();
</script>`;

const HTML = `<!DOCTYPE html>
<html lang="en" data-theme="${THEME_DEFAULT}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>zanile.com — Web clipboard</title>
  ${BRAND_HEAD}
  <style>${SHARED_CSS}</style>
  <meta name="description" content="Minimal web text clipboard." />
</head>
<body>
  <div class="app-shell">
    <header class="top-bar">
      ${BRAND}
      ${HEADER_ACTIONS}
    </header>
    <div class="app-body">
      ${ACCOUNT_SIDEBAR}
      <div class="main-area">
        <div class="page-inner">
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
            <div class="note">Max 100 KB. Your note gets a shareable URL. Sign in to keep a list of your pastes.</div>
            <div id="result" class="link"></div>
            <div id="error" class="err"></div>
          </form>
          </main>
          ${FOOTER}
        </div>
      </div>
    </div>
  </div>
  ${SIDEBAR_JS}
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
        if (typeof window.__reloadPastes === 'function') window.__reloadPastes();
      } catch (err) {
        error.textContent = String(err.message || err);
      }
    };
  </script>
  ${AUTH_CLIENT_JS}
  ${THEME_JS}
</body>
</html>`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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

  if (request.method === 'GET' && path === '/api/me') {
    const user = await getAuthUser(request, env);
    return json({ email: user?.email || null, signedIn: Boolean(user) });
  }

  if (request.method === 'GET' && path === '/api/pastes') {
    return handleListPastes(request, env);
  }

  if (request.method === 'POST' && path === '/auth/request') {
    return handleAuthRequest(request, env);
  }
  if (request.method === 'POST' && path === '/auth/verify') {
    return handleAuthVerify(request, env);
  }
  if (request.method === 'POST' && path === '/auth/logout') {
    return handleAuthLogout();
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

      const user = await getAuthUser(request, env);
      if (user) {
        const userId = await ensureUser(env, user.email);
        const preview = text.replace(/\s+/g, ' ').trim().slice(0, 80);
        await env.DB.prepare(
          `INSERT INTO pastes (id, user_id, preview, created_at) VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id, preview=excluded.preview, created_at=excluded.created_at`,
        )
          .bind(id, userId, preview, new Date().toISOString())
          .run();
      }

      const shareUrl = new URL('/' + id, request.url).toString();
      return json({ id, url: shareUrl }, 201);
    } catch {
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
    const id = path.slice(1);
    if (id === 'about' || id === 'privacy' || id === 'auth' || id.startsWith('api')) {
      return html(renderNotFoundPage(), 404);
    }
    const value = await env.NOTES.get(id);
    if (value == null) return html(renderNotFoundPage(), 404);
    return html(renderViewPage(id, value, request.url));
  }

  return html(renderNotFoundPage(), 404);
}

async function handleListPastes(request: Request, env: Env): Promise<Response> {
  const user = await getAuthUser(request, env);
  if (!user) return json({ pastes: [] });
  const row = await env.DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(user.email).first<{ id: number }>();
  if (!row) return json({ pastes: [] });
  const { results } = await env.DB.prepare(
    `SELECT id, preview, created_at FROM pastes WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
  )
    .bind(row.id)
    .all();
  return json({ pastes: results || [] });
}

async function handleAuthRequest(request: Request, env: Env): Promise<Response> {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) return json({ error: 'Valid email required' }, 400);

  if (env.AUTH_RATE_LIMITER) {
    const { success } = await env.AUTH_RATE_LIMITER.limit({ key: email });
    if (!success) return json({ error: 'Too many requests. Wait a minute and try again.' }, 429);
  }

  if (!env.AUTH_COOKIE_SECRET) {
    return json({ error: 'Auth is not configured (AUTH_COOKIE_SECRET).' }, 500);
  }

  const code = generateOtp();
  const codeHash = await sha256Hex(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  await env.DB.prepare(
    `INSERT INTO otp_codes (email, code_hash, expires_at, attempts)
     VALUES (?, ?, ?, 0)
     ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at, attempts=0`,
  )
    .bind(email, codeHash, expiresAt)
    .run();

  const sent = await sendOtpEmail(env, email, code);
  if (!sent.ok) {
    if (!env.RESEND_API_KEY && env.ENVIRONMENT !== 'production') {
      console.log(`[otp-dev] ${email} ${code}`);
      return json({ success: true, message: 'Code generated. Check worker logs (local/dev without Resend).', dev: true });
    }
    return json({ error: sent.error || 'Failed to send email' }, 502);
  }
  return json({ success: true, message: 'Code sent. Check your inbox.' });
}

async function handleAuthVerify(request: Request, env: Env): Promise<Response> {
  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const email = normalizeEmail(body.email);
  const code = String(body.code || '').trim();
  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return json({ error: 'Email and 6-digit code required' }, 400);
  }
  if (!env.AUTH_COOKIE_SECRET) {
    return json({ error: 'Auth is not configured.' }, 500);
  }

  const row = await env.DB.prepare(
    `SELECT code_hash, expires_at, attempts FROM otp_codes WHERE email = ?`,
  )
    .bind(email)
    .first<{ code_hash: string; expires_at: string; attempts: number }>();

  if (!row) return json({ error: 'Code expired or not found. Request a new code.' }, 401);
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.DB.prepare(`DELETE FROM otp_codes WHERE email = ?`).bind(email).run();
    return json({ error: 'Code expired. Request a new code.' }, 401);
  }
  if ((row.attempts || 0) >= OTP_MAX_ATTEMPTS) {
    await env.DB.prepare(`DELETE FROM otp_codes WHERE email = ?`).bind(email).run();
    return json({ error: 'Too many failed attempts. Request a new code.' }, 401);
  }

  const hash = await sha256Hex(code);
  if (!timingSafeEqual(hash, row.code_hash)) {
    await env.DB.prepare(`UPDATE otp_codes SET attempts = attempts + 1 WHERE email = ?`).bind(email).run();
    return json({ error: 'Invalid code. Please try again.' }, 401);
  }

  await env.DB.prepare(`DELETE FROM otp_codes WHERE email = ?`).bind(email).run();
  await ensureUser(env, email);

  const token = await createJwt({ email, exp: Math.floor(Date.now() / 1000) + AUTH_TTL_SEC }, env.AUTH_COOKIE_SECRET);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const secure = env.ENVIRONMENT === 'production' ? '; Secure' : '';
  headers.set('Set-Cookie', `${AUTH_COOKIE}=${token}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${AUTH_TTL_SEC}`);
  return new Response(JSON.stringify({ success: true, email }), { status: 200, headers });
}

function handleAuthLogout(): Response {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.set('Set-Cookie', `${AUTH_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
}

async function ensureUser(env: Env, email: string): Promise<number> {
  const existing = await env.DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first<{ id: number }>();
  if (existing) return existing.id;
  const result = await env.DB.prepare(`INSERT INTO users (email, created_at) VALUES (?, ?)`)
    .bind(email, new Date().toISOString())
    .run();
  return Number(result.meta.last_row_id);
}

async function sendOtpEmail(env: Env, email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  if (!env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not set' };
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'zanile <auth@zanile.com>',
      to: [email],
      subject: `Your login code: ${code}`,
      html: `<p>Your zanile.com sign-in code is <strong style="font-family:monospace;font-size:24px;letter-spacing:0.15em">${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    return { ok: false, error: `Resend ${response.status}: ${text.slice(0, 120)}` };
  }
  return { ok: true };
}

async function getAuthUser(request: Request, env: Env): Promise<{ email: string } | null> {
  const token = getCookie(request, AUTH_COOKIE);
  if (!token || !env.AUTH_COOKIE_SECRET) return null;
  return verifyJwt(token, env.AUTH_COOKIE_SECRET);
}

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}

function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateOtp(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + (buf[0] % 900000));
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function textToBase64Url(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

function base64UrlToText(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmacSign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(sig));
}

async function createJwt(payload: { email: string; exp: number }, secret: string): Promise<string> {
  const encoded = textToBase64Url(JSON.stringify(payload));
  const signature = await hmacSign(encoded, secret);
  return `${encoded}.${signature}`;
}

async function verifyJwt(token: string, secret: string): Promise<{ email: string } | null> {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = await hmacSign(encoded, secret);
  if (!timingSafeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(base64UrlToText(encoded)) as { email?: string; exp?: number };
    if (!payload.email || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
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
<html lang="en" data-theme="${THEME_DEFAULT}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(id)} — zanile.com</title>
  ${BRAND_HEAD}
  <style>${SHARED_CSS}</style>
  <meta name="description" content="Shared note ${escapeHtml(id)}" />
</head>
<body>
  <div class="app-shell">
    <header class="top-bar">
      ${BRAND}
      ${HEADER_ACTIONS}
    </header>
    <div class="app-body">
      ${ACCOUNT_SIDEBAR}
      <div class="main-area">
        <div class="page-inner">
          <main>
          <h1 style="font-size:1rem;margin-bottom:1rem">Note <span style="font-family:var(--tt-font-mono);font-weight:400;font-size:0.9em">${escapeHtml(id)}</span></h1>
          <pre>${escaped}</pre>
          <div class="row">
            <input id="share" value="${escapeHtml(shareUrl)}" readonly />
            <button class="primary" type="button" onclick="navigator.clipboard.writeText(document.getElementById('share').value)">Copy URL</button>
            <a class="button secondary" href="/">New</a>
            <a class="button secondary" href="${escapeHtml(rawUrl)}">Raw</a>
          </div>
          </main>
          ${FOOTER}
        </div>
      </div>
    </div>
  </div>
  ${SIDEBAR_JS}
  ${AUTH_CLIENT_JS}
  ${THEME_JS}
</body>
</html>`;
}

function renderAboutPage(): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="${THEME_DEFAULT}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>About — zanile.com</title>
  ${BRAND_HEAD}
  <style>${SHARED_CSS}</style>
  <meta name="description" content="About Clipboard, a minimal paste-and-share tool." />
  <link rel="canonical" href="/about" />
</head>
<body>
  <div class="app-shell">
    <header class="top-bar">
      ${BRAND}
      ${HEADER_ACTIONS}
    </header>
    <div class="app-body">
      ${ACCOUNT_SIDEBAR}
      <div class="main-area">
        <div class="page-inner">
          <main>
          <h1>About</h1>
          <p>zanile.com is a minimal paste-and-share tool. Paste text, get a URL, send the link.</p>
          <p>It is part of the <a href="https://congtam.net">congtam.net</a> portfolio. Optional email sign-in keeps a list of your pastes. No tracking pixels or ads.</p>
          <p>Notes live in Cloudflare KV and expire after 30 days by default. See <a href="/privacy">Privacy</a> for retention detail.</p>
          <p><a class="button primary" href="/">Create a note</a></p>
          </main>
          ${FOOTER}
        </div>
      </div>
    </div>
  </div>
  ${SIDEBAR_JS}
  ${AUTH_CLIENT_JS}
  ${THEME_JS}
</body>
</html>`;
}

function renderPrivacyPage(): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="${THEME_DEFAULT}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Privacy — zanile.com</title>
  ${BRAND_HEAD}
  <style>${SHARED_CSS}</style>
  <meta name="description" content="Privacy policy for Clipboard." />
  <link rel="canonical" href="/privacy" />
</head>
<body>
  <div class="app-shell">
    <header class="top-bar">
      ${BRAND}
      ${HEADER_ACTIONS}
    </header>
    <div class="app-body">
      ${ACCOUNT_SIDEBAR}
      <div class="main-area">
        <div class="page-inner">
          <main>
          <h1>Privacy</h1>
          <p>No third-party trackers or ads. The app runs entirely on Cloudflare.</p>
          <p>Pastes are stored in Cloudflare KV for 30 days by default, then auto-deleted. If you sign in, ownership metadata is stored in D1 so you can list your pastes.</p>
          <p>Sign-in uses a one-time email code. Session cookies are HttpOnly. Paste content is never written to analytics.</p>
          <p><a class="button primary" href="/">Home</a></p>
          </main>
          ${FOOTER}
        </div>
      </div>
    </div>
  </div>
  ${SIDEBAR_JS}
  ${AUTH_CLIENT_JS}
  ${THEME_JS}
</body>
</html>`;
}

function renderNotFoundPage(): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="${THEME_DEFAULT}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Not found — zanile.com</title>
  ${BRAND_HEAD}
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="app-shell">
    <header class="top-bar">
      ${BRAND}
      ${HEADER_ACTIONS}
    </header>
    <div class="app-body">
      ${ACCOUNT_SIDEBAR}
      <div class="main-area">
        <div class="page-inner">
          <main>
          <h1>Not found</h1>
          <p>No note exists at this URL. It may have expired or never been created.</p>
          <p><a class="button primary" href="/">Create a note</a></p>
          </main>
          ${FOOTER}
        </div>
      </div>
    </div>
  </div>
  ${SIDEBAR_JS}
  ${AUTH_CLIENT_JS}
  ${THEME_JS}
</body>
</html>`;
}
