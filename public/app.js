const API = '/api/v1/urls';

const form = document.getElementById('shorten-form');
const urlInput = document.getElementById('url-input');
const ttlInput = document.getElementById('ttl-input');
const resultBox = document.getElementById('result');
const linksBox = document.getElementById('links');
const statusEl = document.getElementById('status');
const refreshBtn = document.getElementById('refresh-btn');
const template = document.getElementById('link-template');

function setStatus(message, kind) {
  statusEl.textContent = message || '';
  statusEl.className = 'status' + (kind ? ' ' + kind : '');
}

async function request(path, options) {
  const res = await fetch(path, options);
  let body = null;
  if (res.status !== 204) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  }
  if (!res.ok) {
    const code = body && body.error ? body.error : 'request_failed';
    const err = new Error(code);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

function showResult(entry, duplicate) {
  resultBox.hidden = false;
  resultBox.innerHTML = '';

  const link = document.createElement('a');
  link.href = entry.shortUrl;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = entry.shortUrl;

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'ghost';
  copy.textContent = 'Copy';
  copy.addEventListener('click', () => copyText(entry.shortUrl));

  resultBox.append(link, copy);
  if (duplicate) {
    const note = document.createElement('span');
    note.className = 'meta';
    note.textContent = 'Already existed';
    resultBox.append(note);
  }
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    setStatus('Copied to clipboard', 'ok');
  } catch {
    setStatus('Could not copy', 'error');
  }
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

function renderLink(entry) {
  const node = template.content.cloneNode(true);

  const short = node.querySelector('.short');
  short.href = entry.shortUrl;
  short.textContent = entry.shortUrl;

  node.querySelector('.long').textContent = entry.longUrl;

  const meta = node.querySelector('.meta');
  let text = 'Created ' + (formatDate(entry.createdAt) || 'unknown');
  if (entry.expiresAt) text += ' · Expires ' + (formatDate(entry.expiresAt) || 'unknown');
  meta.textContent = text;

  node.querySelector('.copy').addEventListener('click', () => copyText(entry.shortUrl));
  node.querySelector('.delete').addEventListener('click', () => removeLink(entry.code, short));

  return node;
}

async function loadLinks() {
  try {
    const data = await request(API + '?limit=100');
    linksBox.innerHTML = '';
    if (!data.items.length) {
      const p = document.createElement('p');
      p.className = 'empty';
      p.textContent = 'No links yet. Create one above.';
      linksBox.append(p);
      return;
    }
    for (const item of data.items) {
      linksBox.append(renderLink(item));
    }
  } catch (err) {
    linksBox.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'Failed to load links (' + err.message + ').';
    linksBox.append(p);
  }
}

async function removeLink(code, shortEl) {
  try {
    await request(API + '/' + encodeURIComponent(code), { method: 'DELETE' });
    shortEl.closest('.link').remove();
    setStatus('Link deleted', 'ok');
    if (!linksBox.querySelector('.link')) loadLinks();
  } catch (err) {
    setStatus('Delete failed: ' + err.message, 'error');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const url = urlInput.value.trim();
  if (!url) return;

  const payload = { url };
  if (ttlInput.value) payload.ttl = Number(ttlInput.value);

  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  setStatus('Creating…');

  try {
    const entry = await request(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    showResult(entry, false);
    urlInput.value = '';
    ttlInput.value = '';
    setStatus('Short URL created', 'ok');
    loadLinks();
  } catch (err) {
    if (err.status === 409 && err.body && err.body.shortUrl) {
      showResult(err.body, true);
      setStatus('That URL was already shortened', 'ok');
    } else {
      setStatus('Failed: ' + err.message, 'error');
    }
  } finally {
    submit.disabled = false;
  }
});

refreshBtn.addEventListener('click', loadLinks);

loadLinks();
