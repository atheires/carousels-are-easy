// Carousel app page logic. Hash routes, one state object from /api/state, redraw on change.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const enc = encodeURIComponent;
async function api(path, method = 'GET', body) {
  const r = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Something went wrong');
  return j;
}
const store = { get: k => { try { return localStorage.getItem(k) || ''; } catch { return ''; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

let S = null, detail = null, drawn = '', viewer = null, menu = '', editing = '', postedOnly = '';
const draft = { client: '', brand: '', goal: '', dump: '', bucket: '', files: [] };
const ob = { name: '', sells: '', helps: '', handle: '', competitor: false, bucket: '', files: 0 };
const nk = { client: '', name: '', handle: '', note: '', bucket: '', files: [] };
const kn = { id: '', note: '', notes: {} };   // the brand kit review in progress
const lib = { client: '', brand: '', status: '', q: '' };
const rv = { id: '', pane: 'note', text: '', stars: 0, notes: {} };   // the copy review in progress
const seen = {}, lastLine = {}, openDocs = new Set(), pics = {};
const pipelineProgress = {}, carouselOrigins = {};
let previousHash = location.hash || '#/', mention = null;
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${{ tick: '<path d="m5 12 4 4L19 6"/>', bin: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/>', download: '<path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/>' }[name]}</svg>`;
const cardActions = c => `<button class="icon-btn ${c.posted ? 'posted' : ''}" data-act="posted" data-id="${c.id}" aria-label="${c.posted ? 'Mark not posted' : 'Mark posted'}" title="${c.posted ? 'Mark not posted' : 'Mark posted'}">${icon('tick')}</button><button class="icon-btn" data-act="delete" data-id="${c.id}" aria-label="Delete carousel" title="Delete carousel">${icon('bin')}</button>`;

const route = () => location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
const go = h => { location.hash = h; };
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const moving = c => ['Writing', 'Designing'].includes(c.status);
const statusOf = c => (c.posted ? 'Posted' : { 'Copy ready': 'Needs your review', 'Cover ready': 'Needs your review', 'Slides ready': 'Designed', Done: 'Designed' }[c.status] || c.status);
const dot = c => (moving(c) ? 'wait live' : c.posted ? 'good' : ['Copy ready', 'Cover ready', 'Failed'].includes(c.status) ? 'red' : '');
const kit = id => S.brands.find(b => b.id === id);
const kitsFor = client => S.brands.filter(b => b.ready && b.client === client);
const usable = client => (kitsFor(client).length ? kitsFor(client) : S.brands.filter(b => b.ready));   // a client with no kit may borrow any
const newest = (a, b) => (b.created || 0) - (a.created || 0);
const when = t => (t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');
const jobFor = pred => S.jobs.filter(pred).pop();
const hueOf = name => [...name].reduce((a, ch) => a + ch.charCodeAt(0) * 7, 0) % 360;
const tip = text => `<span class="tip" tabindex="0" data-tip="${esc(text)}">?</span>`;
const dots = b => `<span class="dots">${b.colors.slice(0, 5).map(c => `<i style="background:${c}"></i>`).join('')}</span>`;

// ---------- pieces
function thumb(c) {
  const inner = c.cover ? `<img src="${esc(c.cover)}" alt="" loading="lazy">` : `<span class="words">${esc(c.headline || c.title)}</span>`;
  return `<div><div class="card-cover"><a class="frame" href="#/c/${c.id}">${inner}</a><div class="card-actions">${cardActions(c)}</div></div>
    <div class="cap"><b>${esc(c.title)}</b><span class="soft small"><i class="dot ${dot(c)}"></i>${esc([c.client, statusOf(c)].filter(Boolean).join(' · '))}</span>
    </div></div>`;
}
const sheet = list => `<div class="sheet">${list.map(thumb).join('')}</div>`;
function kitCard(k) {
  const n = S.carousels.filter(c => c.brand === k.id).length;
  return `<a class="kit" href="#/kit/${enc(k.id)}"><span class="kit-pics">${k.pics.map(p => `<img src="${esc(p)}" alt="" loading="lazy">`).join('') || `<i class="soft small"><i class="dot wait live"></i>${k.error ? 'Stopped early' : 'Being built'}</i>`}</span>
    <span class="kit-meta"><b>${esc(k.name)}</b><small>${esc(k.client || 'No account yet')} · ${plural(n, 'carousel')}${k.rules ? ` · ${plural(k.rules, 'rule')} from me` : ''}${k.stage ? ' · <b class="draft">Draft, needs my review</b>' : ''}</small>${dots(k)}</span></a>`;
}
const newCard = (href, title, sub) => `<a class="kit add" href="${href}"><span class="plus">+</span><b>${title}</b><small>${sub}</small></a>`;
// The dotted portrait: any picture redrawn as a grid of dots in the client's colour.
function halftones() {
  for (const cv of $$('canvas[data-src]')) {
    const src = cv.dataset.src, hue = +cv.dataset.hue;
    const paint = img => {
      const w = cv.width = cv.clientWidth * 2, h = cv.height = cv.clientHeight * 2;
      if (!w || !h) return;
      const cols = Math.max(18, Math.round(cv.clientWidth / 7)), step = w / cols, rows = Math.ceil(h / step);
      const o = Object.assign(document.createElement('canvas'), { width: cols, height: rows }), ox = o.getContext('2d');
      const s = Math.max(cols / img.naturalWidth, rows / img.naturalHeight), dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      ox.drawImage(img, (cols - dw) / 2, (rows - dh) * (+cv.dataset.at || .5), dw, dh);
      const px = ox.getImageData(0, 0, cols, rows).data, g = cv.getContext('2d');
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4, lum = (px[i] * .3 + px[i + 1] * .59 + px[i + 2] * .11) / 255;
        g.fillStyle = `hsl(${hue + (lum - .5) * 50} ${25 + lum * 45}% ${28 + lum * 58}%)`;
        g.beginPath(); g.arc(x * step + step / 2, y * step + step / 2, step * .48 * (.18 + lum * .82), 0, 7); g.fill();
      }
    };
    const im = pics[src] || (pics[src] = Object.assign(new Image(), { src }));
    im.complete && im.naturalWidth ? paint(im) : im.addEventListener('load', () => paint(im), { once: true });
  }
}

// ---------- documents: shown as formatted text, edited as formatted text, saved as markdown
function split(text) {
  text = String(text).replace(/\r/g, '');
  const head = (/^---\n[\s\S]*?\n---\n/.exec(text) || [''])[0];
  let body = text.slice(head.length);
  const at = body.search(/\n---\s*\n+## Connected Notes/), tail = at < 0 ? '' : body.slice(at);
  return { head, body: at < 0 ? body : body.slice(0, at), tail };
}
function md(text, edit) {
  const inline = s => {
    if (!edit) s = s.replace(/\bclients\b/gi, 'accounts').replace(/\bclient\b/gi, 'account').replace(/—/g, ', ');
    const h = esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/~~(.+?)~~/g, '<del>$1</del>').replace(/(^|[\s(])\*(\S.*?)\*/g, '$1<i>$2</i>');
    return edit ? h : h.replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/`/g, '');
  };
  let out = '', list = '', rows = [];
  const flush = () => {
    if (list) { out += `</${list}>`; list = ''; }
    if (rows.length) { out += `<table>${rows.map((r, i) => `<tr>${r.map(c => `<${i ? 'td' : 'th'}>${inline(c)}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</table>`; rows = []; }
  };
  for (const raw of split(text).body.split('\n')) {
    const l = raw.trim(), li = /^([-*]|\d+\.)\s+(.*)/.exec(l), h = /^(#{1,4})\s+(.*)/.exec(l);
    if (l.startsWith('|')) { if (list) flush(); if (!/^\|[\s|:-]+\|$/.test(l)) rows.push(l.replace(/^\||\|$/g, '').split(/\|(?![^[]*\]\])/).map(c => c.trim())); continue; }
    if (li) { const tag = /\d/.test(li[1]) ? 'ol' : 'ul'; if (list !== tag) { flush(); out += `<${tag}>`; list = tag; } out += `<li>${inline(li[2])}</li>`; continue; }
    if (!l) continue;   // a blank line does not end a list, so numbering survives
    flush();
    if (l === '---') { if (edit) out += '<hr>'; continue; }
    if (h) { if (edit || h[1].length > 1) out += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; continue; }
    out += l.startsWith('>') ? `<blockquote>${inline(l.replace(/^>\s?/, ''))}</blockquote>` : `<p>${inline(l)}</p>`;
  }
  flush();
  return out || (edit ? '<p><br></p>' : '<p class="soft">Nothing here yet.</p>');
}
// ponytail: nested lists come back flat; add indentation handling if a client file ever needs it.
function toMd(root) {
  const inl = n => [...n.childNodes].map(c => {
    if (c.nodeType === 3) return c.textContent;
    if (c.nodeName === 'BR') return '\n';
    const w = inl(c), t = c.nodeName;
    return !w.trim() ? w : /^(B|STRONG)$/.test(t) ? `**${w}**` : /^(I|EM)$/.test(t) ? `*${w}*` : /^(DEL|S|STRIKE)$/.test(t) ? `~~${w}~~` : w;
  }).join('');
  const out = [];
  for (const el of root.childNodes) {
    const t = el.nodeName, s = (el.nodeType === 3 ? el.textContent : inl(el)).trim();
    if (/^H[1-4]$/.test(t)) out.push('#'.repeat(+t[1]) + ' ' + s);
    else if (t === 'UL' || t === 'OL') out.push([...el.children].map((li, i) => (t === 'OL' ? `${i + 1}. ` : '- ') + inl(li).trim()).join('\n'));
    else if (t === 'TABLE') {
      const rows = [...el.rows].map(r => '| ' + [...r.cells].map(c => inl(c).trim()).join(' | ') + ' |');
      if (rows.length) rows.splice(1, 0, '|' + [...el.rows[0].cells].map(() => '---').join('|') + '|');
      out.push(rows.join('\n'));
    } else if (t === 'HR') out.push('---');
    else if (t === 'BLOCKQUOTE') out.push('> ' + s);
    else if (s) out.push(s);
  }
  return out.join('\n\n') + '\n';
}
const FMT = [['h2', 'Heading'], ['h3', 'Small heading'], ['p', 'Text'], ['bold', '<b>Bold</b>'], ['italic', '<i>Italic</i>'], ['insertUnorderedList', 'Bullets'], ['insertOrderedList', 'Numbers']];
function docBlock(title, root, doc, sub = '') {
  const key = root + doc.path, open = openDocs.has(key) || editing === key;
  if (editing === key) return `<section class="docsec open"><div class="doc-head"><h3>${title}</h3></div>
    <div class="fmt">${FMT.map(([c, t]) => `<button data-fmt="${c}" tabindex="-1">${t}</button>`).join('')}</div>
    <div class="doc editor" id="doc-edit" contenteditable="true" spellcheck="true">${md(doc.text, true)}</div>
    <div class="row gap16"><button class="btn solid" data-act="doc-save" data-root="${root}" data-path="${esc(doc.path)}">Save</button><button class="link" data-act="doc-cancel">Cancel</button></div></section>`;
  return `<section class="docsec ${open ? 'open' : ''}"><div class="doc-head"><button class="doc-toggle" data-act="doc-toggle" data-key="${esc(key)}"><i class="caret"></i><h3>${title}</h3></button>
    ${sub ? `<span class="soft small">${sub}</span>` : ''}<button class="link small" data-act="doc-edit" data-key="${esc(key)}">Edit</button></div>${open ? `<div class="doc">${md(doc.text)}</div>` : ''}</section>`;
}
const field = (attr, label, ph, val) => `<label class="field"><span class="label">${label}</span><input type="text" ${attr} value="${esc(val)}" placeholder="${ph}"></label>`;
const readingText = text => split(text).body.split('\n').filter(l => !/^(?:#+\s*)?(?:last\s+)?(?:added|updated|created|date)\s*[: ]\s*\d|^\s*\d{4}-\d{2}-\d{2}\s*$/i.test(l.trim())).join('\n');
const dropZone = (part, count, words) => `<div class="drop" data-drop="${part}"><svg class="drop-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m0 0L7 8m5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg><span class="drop-copy">${count ? `${plural(count, 'file')} added. Drop more or click.` : words}</span><input type="file" multiple accept="image/*" hidden></div>`;
async function upload(bucket, part, file, name) {
  const r = await fetch(`/api/upload?bucket=${enc(bucket)}&part=${enc(part)}&name=${enc(name || file.name)}`, { method: 'POST', body: file });
  if (!r.ok) throw new Error((await r.json()).error || 'Upload failed');
}

// ---------- home
function homePage() {
  if (!S.clients.some(c => c.name === draft.client)) draft.client = (S.clients.find(c => c.name === S.last.client) || S.clients[0] || {}).name || '';
  const kits = usable(draft.client), own = kitsFor(draft.client).length;
  if (!kits.some(k => k.id === draft.brand)) draft.brand = (kits[0] || {}).id || '';
  const k = kit(draft.brand), sw = k && k.cover ? `<img class="sw" src="${esc(k.cover)}" alt="">` : '';
  const opt = (key, v, on, pic, title, sub) => `<button class="opt ${on ? 'on' : ''}" data-act="pick" data-k="${key}" data-v="${esc(v)}">${pic}<span><b>${esc(title)}</b><small>${sub}</small></span></button>`;
  const add = (href, title, sub) => `<a class="opt" href="${href}"><span class="pic plus">+</span><span><b>${title}</b><small>${sub}</small></span></a>`;
  const pops = {
    client: () => `<div class="pop"><span class="pop-label">Account</span>${S.clients.map(c => opt('client', c.name, c.name === draft.client, `<span class="pic letter">${esc(c.name[0])}</span>`, c.name,
        c.status === 'onboarding' ? 'Being set up' : (kitsFor(c.name).map(x => esc(x.name)).join(', ') || 'No brand kit yet'))).join('')}
      ${add('#/new-client', 'New account', 'Learn my writing and look from my posts')}</div>`,
    brand: () => `<div class="pop"><span class="pop-label">${own ? esc(draft.client) + '’s brand kits' : 'Brand kit'}</span>${kits.map(x => opt('brand', x.id, x.id === draft.brand,
        x.cover ? `<img class="pic" src="${esc(x.cover)}" alt="" loading="lazy">` : '<span class="pic"></span>', x.name, dots(x))).join('')}
      ${add('#/new-kit/' + enc(draft.client), 'New brand kit', 'Another look for my account')}</div>`,
  };
  const pick = (key, label, value, pic = '') => `<div class="pick"><button class="pill ${menu === key ? 'open' : ''}" data-act="menu" data-v="${key}">${pic}<small>${label}</small><span class="v">${esc(value)}</span><i class="caret"></i></button>${menu === key ? pops[key]() : ''}</div>`;
  const brandPill = own === 1 ? `<span class="pill locked" title="${esc(draft.client)} has one brand kit, so it is always used">${sw}<small>Brand kit</small><span class="v">${esc(k.name)}</span><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>`
    : pick('brand', 'Brand kit', k ? k.name : 'None yet', sw);
  const recent = [...S.carousels].sort(newest);
  return `<div class="home"><h1>Carousels in your own voice and look, <span>not AI's.</span></h1>
    <div class="box">
      <textarea id="d-dump" placeholder="Dump the idea however it comes out. Leave it empty and Claude picks the topic.">${esc(draft.dump)}</textarea>
      <div class="sub">
        <input type="text" id="d-goal" value="${esc(draft.goal)}" placeholder="Goal of this post, or the link it should send people to (optional)">
        ${tip('Say what this post is for in your own words: more views, sales calls, sign-ups for a launch. Or paste the link you want viewers to end up on. Claude opens the link, reads what it offers and builds the last slide and the comment word around sending people there.')}</div>
      <div id="image-mentions" class="image-mentions" hidden></div>
      ${draft.files.length ? `<div class="chips">${draft.files.map((f, i) => `<span class="chip ref-chip"><img src="${esc(f.url)}" alt="">img ${i + 1}<button data-act="ref-remove" data-i="${i}" aria-label="Remove img ${i + 1}">×</button></span>`).join('')}</div>` : ''}
      <div class="tools">${pick('client', 'Account', draft.client || 'None yet')}${brandPill}
        <span class="pill clip" data-drop="References">+ Reference<input type="file" multiple accept="image/*" hidden></span>
        ${tip('Attach up to 10 images. Type @ in the brain dump, then choose an image with the arrow keys and Enter, or click it. Use @img 1 to say what to take from that image, such as its type or layout. Ask to update my brand kit if the change should stay.')}
        <button class="gen" data-act="d-submit">↑ Generate</button></div></div>
    <p class="small error" id="err"></p>
    ${recent.length ? `<section class="recent"><div class="row"><h3>Recent</h3><a class="ghost push" href="#/library">View all ${S.carousels.length} ›</a></div><div class="recent-slider gap24"><button class="slider-arrow left" data-act="recent-scroll" data-v="-1" aria-label="Previous carousels">‹</button><div class="recent-track">${recent.map(thumb).join('')}</div><button class="slider-arrow right" data-act="recent-scroll" data-v="1" aria-label="Next carousels">›</button></div></section>` : ''}</div>`;
}

// ---------- new client, new brand kit
function newClientPage() {
  return `<a class="back" href="#/clients">← Accounts</a><h2 class="gap16">New account</h2>
    <p class="soft gap8">Either source is enough. Both is better.</p>
    <div class="duo gap32">
      <section class="pane"><h3>Upload posts from an account</h3>
        <p class="soft small gap8">Screenshots of posts from this account, or posts with a voice and look I want to learn from.</p>
        ${field('data-ob="name"', 'Account name', 'Name this account', ob.name)}
        <div class="gap24">${dropZone('Client', ob.files, 'Drop carousel or inspiration screenshots here, or click to choose')}</div></section>
      <section class="pane"><h3>Or add an Instagram account</h3>
        <p class="soft small gap8">I read the last 15 to 20 carousels from the account to learn its voice and look.</p>
        ${field('data-ob="name"', 'Account name', 'Name this account', ob.name)}${field('data-ob="handle"', 'Instagram account', '@handle or the profile link', ob.handle)}
        ${field('data-ob="sells"', 'What this account sells', 'In your own words', ob.sells)}${field('data-ob="helps"', 'Who this account helps', 'In your own words', ob.helps)}
        <label class="check gap16"><input type="checkbox" data-ob="competitor" ${ob.competitor ? 'checked' : ''}> This is another account’s posts, not its own</label></section>
    </div>
    <p class="soft small gap24">Next, Claude learns this account’s writing style and builds a matching brand kit, cover first. I review both before anything is saved.</p>
    <p class="error small gap8" id="err"></p>
    <div class="gap16"><button class="btn solid" data-act="new-client">Study and set up</button></div>`;
}
function newKitPage(client) {
  if (client && !nk.client) nk.client = client;
  return `<a class="back" href="#/kits">← Brand kits</a><h2 class="gap16">New brand kit</h2>
    <p class="soft gap8">Drop reference slides and say what I like in each one, or name an account whose look to follow. Claude writes the brief, writes a sample carousel and makes its cover. I review the cover before anything else is made.</p>
    <section class="pane narrow gap32">
      <label class="field"><span class="label">For which account</span><select data-nk="client"><option value="">No account yet</option>${S.clients.map(c => `<option ${c.name === nk.client ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      ${field('data-nk="name"', 'Name', 'One word is best. Leave empty and Claude names it', nk.name)}
      ${field('data-nk="handle"', 'Instagram account to take the look from', '@handle or the profile link (optional)', nk.handle)}
      <div class="gap24">${dropZone('Kit', nk.files.length, 'Drop reference slides here, or click to choose')}</div>
      ${nk.files.length ? `<div class="chips gap16">${nk.files.map((f, i) => `<span class="chip ref-chip"><img src="${esc(f.url)}" alt="">img ${i + 1}<button data-act="nk-remove" data-i="${i}" aria-label="Remove img ${i + 1}">×</button></span>`).join('')}</div>` : ''}
      <label class="field mention-wrap"><span class="label">What I like in each reference, and what this kit must do ${tip('Type @ to tag a reference, then say what to take from it: “@img 1 keep the way the characters are cropped by the bottom edge. @img 2 only the headline font.” Anything I do not mention is left to Claude.')}</span>
        <textarea id="nk-note" data-nk="note" rows="5" placeholder="@img 1 I like the spacing between the headline and the characters. Replace the people with mascots…">${esc(nk.note)}</textarea>
        <div id="image-mentions" class="image-mentions" hidden></div></label>
      <p class="error small gap16" id="err"></p>
      <div class="gap16"><button class="btn solid" data-act="new-kit">Build brand kit</button></div></section>`;
}

// ---------- clients
async function clientsPage(name, tab = 'carousels', subtab = 'about') {
  if (!S.clients.length) return `<h2>Accounts</h2><p class="soft gap16">No accounts yet.</p><div class="gap24"><a class="btn solid" href="#/new-client">New account</a></div>`;
  const c = S.clients.find(x => x.name === name) || S.clients[0], at = S.clients.indexOf(c), n = S.clients.length;
  const kits = S.brands.filter(b => b.client === c.name), link = (x, t = '') => `#/clients/${enc(x.name)}${t ? '/' + t : ''}`;
  const face = x => { const src = x.image || (S.brands.find(b => b.client === x.name && b.cover) || {}).cover;
    return src ? `<canvas data-src="${esc(src)}" data-hue="${hueOf(x.name)}" data-at="${x.image ? .4 : .9}"></canvas>` : `<span class="initial">${esc(x.name[0])}</span>`; };
  const setup = c.status === 'onboarding';
  const hero = `<section class="hero" style="--h:${hueOf(c.name)}"><div class="hero-text">
      <h1>${esc(c.name)}<em class="chip">${setup ? 'Being set up' : plural(c.count, 'carousel')}</em></h1>
      <p class="role">${esc([c.handle && '@' + c.handle, kits.map(k => k.name).join(', ') || 'No brand kit yet'].filter(Boolean).join(' · '))}</p>
      <p class="blurb">${esc(c.blurb || c.sells || (setup ? 'I’m reading posts from this account. The description will appear when the study finishes.' : 'No description yet.'))}</p>
      <div class="row gap24"><button class="btn solid" data-act="write-for" data-v="${esc(c.name)}">✦ Write a carousel</button><a class="btn" href="${link(c, 'writer')}/about">How I write</a><a class="btn" href="${link(c, 'designer')}">Brand kit</a><span class="ghost" data-drop="Face" data-client="${esc(c.name)}">Change picture<input type="file" accept="image/*" hidden></span></div></div>
    ${face(c)}${n > 1 ? `<div class="arrows"><a href="${link(S.clients[(at + n - 1) % n])}" aria-label="Previous account">‹</a><a href="${link(S.clients[(at + 1) % n])}" aria-label="Next account">›</a></div>` : ''}</section>`;
  const strip = `<div class="faces">${S.clients.map(x => `<a class="face ${x === c ? 'on' : ''}" href="${link(x)}" style="--h:${hueOf(x.name)}">${face(x)}<span><b>${esc(x.name)}</b><small>${x.status === 'onboarding' ? 'Being set up' : plural(x.count, 'carousel')}</small></span></a>`).join('')}
    <a class="face add" href="#/new-client"><span class="plus">+</span><span><b>New account</b><small>From posts I like</small></span></a></div>`;
  const tabs = [['carousels', 'Carousels'], ['writer', 'How I write'], ['designer', 'Designer']];
  let body = '';
  if (setup) {
    const js = S.jobs.filter(j => j.client === c.name && (j.kind === 'onboard' || j.kind === 'brand')), busy = js.some(j => j.status === 'running' || j.status === 'queued');
    body += `<section class="notice">${js.map(j => `<p class="small"><i class="dot ${j.status === 'done' ? 'good' : j.status === 'failed' ? 'red' : 'wait live'}"></i>${esc(j.label)}${j.status === 'failed' ? `<span class="error"> · ${esc(j.error)}</span>` : j.status === 'done' ? ' · done' : j.status === 'queued' ? ' · waiting in line' : ' · working'}</p>`).join('')}
      <p class="soft small gap8">${busy ? 'You can leave this page; it carries on.' : 'Check the Writer and Designer tabs, fix anything that is wrong, then approve.'}</p>
      <div class="gap16"><button class="btn solid" data-act="approve" data-client="${esc(c.name)}" ${busy ? 'disabled' : ''}>Approve ${esc(c.name)}</button></div></section>`;
  }
  if (tab === 'carousels') {
    const mine = S.carousels.filter(x => x.client === c.name && (!postedOnly || (postedOnly === 'yes') === !!x.posted)).sort(newest);
    body += `<div class="seg">${[['', 'All'], ['yes', 'Posted'], ['no', 'Not posted']].map(([v, t]) => `<button class="${postedOnly === v ? 'on' : ''}" data-act="posted-filter" data-v="${v}">${t}</button>`).join('')}</div>
      <div class="gap24">${mine.length ? sheet(mine) : '<p class="soft">Nothing here yet.</p>'}</div>`;
  }
  if (tab === 'writer') {
    const d = await api(`/api/clients/${enc(c.name)}`), selected = ['about', 'how-i-write', 'burning-questions', 'feedback'].includes(subtab) ? subtab : 'about';
    const writerTabs = [['about', 'About'], ['how-i-write', 'How I write'], ['burning-questions', 'Burning questions'], ['feedback', 'Feedback']];
    const full = { about: d.about, 'how-i-write': d.dna.text ? d.dna : d.voice, 'burning-questions': d.questions };
    const summary = d.summary || {}, short = { about: summary.about, 'how-i-write': summary.howIWrite, 'burning-questions': summary.burningQuestions };
    const feedbackRules = d.feedback.map(f => {
      const rules = split(f.text).body.split(/\r?\n/).map(line => line.trim()).filter(line => /^(?:[-*]|\d+\.)\s+/.test(line))
        .map(line => line.replace(/^(?:[-*]|\d+\.)\s+/, '').replace(/^(?:added\s+)?(?:\d{4}-\d{2}-\d{2}|\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})\s*[:,-]?\s*/i, '').trim()).filter(Boolean);
      return rules;
    });
    let content = '';
    if (selected === 'feedback') {
      content = `${feedbackRules.map(rules => rules.length ? `<ul class="feedback-rules">${rules.map(rule => `<li>${esc(rule)}</li>`).join('')}</ul>` : '').join('') || '<p class="soft">No feedback rules yet.</p>'}
        <section class="say"><h3>Tell the writer something</h3><p class="soft small gap8">I’ll save this as a rule for future carousels from this account.</p>
          <textarea id="fb-text" class="gap16" rows="3" placeholder="Too many short choppy lines. Never say “game-changer”. Open with the story…"></textarea>
          <div class="row gap16"><select id="fb-file"><option value="Writing">About the writing</option><option value="Slide 1">About cover lines</option><option value="Strategy">About topics and angles</option></select>
            <button class="btn solid" data-act="fb-writer" data-client="${esc(c.name)}">Remember this</button><span class="soft small" id="fb-done"></span></div></section>`;
    } else {
      const doc = full[selected] || d.about, brief = short[selected];
      const key = 'W' + doc.path;
      content = editing === key ? docBlock('Full file', 'W', doc) : `<article class="reading">${md(readingText(brief && brief.text.trim() ? brief.text : doc.text))}<button class="link small summary-link" data-act="doc-edit" data-key="${esc(key)}">See or edit the full file</button></article>`;
    }
    body += `<nav class="subtabs writer-subtabs">${writerTabs.map(([k, label]) => `<a href="${link(c, 'writer')}/${k}" class="${selected === k ? 'on' : ''}">${label}</a>`).join('')}</nav><div class="reading-wrap">${content}</div>`;
  }
  if (tab === 'designer') {
    body += `<p class="soft">${esc(c.name)}’s designer. A brand kit is the brief I use for every slide, along with the rules I have saved.</p>
      <div class="kits gap24">${kits.map(kitCard).join('')}${newCard('#/new-kit/' + enc(c.name), 'New brand kit', 'A second look for ' + esc(c.name))}</div>`;
  }
  return `<div class="row"><h2>Accounts</h2><a class="btn push" href="#/new-client">+ New account</a></div>${hero}${strip}
    <div class="subtabs">${tabs.map(([k, t]) => `<a href="${link(c, k)}" class="${k === tab ? 'on' : ''}">${t}</a>`).join('')}</div><div class="tabbody">${body}</div>`;
}

// ---------- brand kits
function kitsPage() {
  return `<div class="row"><div><h2>Brand kits</h2><p class="soft gap8">The looks for my accounts. Pick an account on Home to use its kit.</p></div><a class="btn solid push" href="#/new-kit">+ New kit</a></div>
    <div class="kits gap32">${S.brands.map(kitCard).join('')}${newCard('#/new-kit', 'New brand kit', 'For my account or another look')}</div>`;
}
async function kitPage(id) {
  const k = kit(id);
  if (!k) return `<a class="back" href="#/kits">← Brand kits</a><p class="gap24">No such brand kit.</p>`;
  if (kn.id !== id) Object.assign(kn, { id, note: '', notes: {} });
  const get = async f => ({ path: `${id}/${f}`, text: (await api(`/api/doc?root=D&path=${enc(id + '/' + f)}`)).text });
  const [brief, fb, summary] = await Promise.all([get('Branding.md'), get('Feedback.md'), get('App Summary.md')]);
  const job = jobFor(j => j.kit === id && (j.status === 'running' || j.status === 'queued'));
  const used = S.carousels.filter(c => c.brand === id).sort(newest), last = job && job.log.length ? job.log[job.log.length - 1] : '';
  const status = job ? `<p class="small gap16"><i class="dot wait live"></i>${esc(job.label)}${last ? ` <span class="soft">· ${esc(last.slice(0, 110))}</span>` : ''} <button class="link small" data-act="stop" data-id="${job.id}">Stop</button></p>`
    : k.error ? `<p class="error small gap16">${esc(k.error)} <button class="link small" data-act="kit-retry">Try again</button></p>` : '';
  const hasBrief = brief.text.trim(), cover = k.sample.find(s => s.n === 1);
  const slide = s => `<figure><a class="frame" href="${esc(s.url)}" target="_blank" rel="noopener"><i class="num">${s.n}</i><img src="${esc(s.url)}" alt="Sample slide ${s.n}" loading="lazy"></a>
    <textarea data-knote="${s.n}" rows="2" placeholder="What to change on slide ${s.n}" ${job ? 'disabled' : ''}>${esc(kn.notes[s.n] || '')}</textarea></figure>`;
  // Step 1: only the cover exists. Step 2 and after approval: every slide, each with its own note.
  const review = k.stage === 'cover' ? `<section class="say kit-review"><h3>Step 1 of 2 · The cover</h3>
      <p class="soft small gap8">Only the cover is made first. Approve it and I make the rest of the sample carousel in this look. Otherwise say what is wrong and I make a new one.</p>
      <div class="kit-cover-row gap24">${cover ? `<a class="frame" href="${esc(cover.url)}" target="_blank" rel="noopener"><img src="${esc(cover.url)}" alt="Sample cover"></a>` : `<span class="frame ${job ? 'making' : 'empty'}"></span>`}
        <div><textarea id="kit-note" data-kn="note" rows="6" placeholder="What I don’t like and how I want it instead. Leave this empty and Claude rethinks the cover on its own." ${job || !cover ? 'disabled' : ''}>${esc(kn.note)}</textarea>
          ${cover && !job ? `<div class="row gap16"><button class="btn solid" data-act="kit-cover-ok">I like it, make the rest</button><button class="btn" data-act="kit-cover-redo">Redo the cover</button></div>` : ''}${status}</div></div></section>`
    : k.sample.length > 1 || k.stage ? `<section class="say kit-review"><h3>${k.stage ? 'Step 2 of 2 · Every slide' : 'Sample carousel'}</h3>
      <p class="soft small gap8">${k.stage ? 'Write under any slide what I don’t like and how to redo it. Only the slides I note are remade, and every note becomes a rule of this kit. The kit is saved for use once I approve it.' : 'This is the look every carousel in this kit follows. Note any slide to remake it; each note becomes a rule of this kit.'}</p>
      <div class="sheet four gap24">${k.sample.map(slide).join('')}</div>
      <textarea id="kit-note" data-kn="note" class="gap24" rows="2" placeholder="A note for every slide (optional)" ${job ? 'disabled' : ''}>${esc(kn.note)}</textarea>
      ${job ? '' : `<div class="row gap16"><button class="btn ${k.stage ? '' : 'solid'}" data-act="kit-slides-redo">Redo the slides I noted</button>${k.stage ? '<button class="btn solid" data-act="kit-approve">Approve and save this kit</button>' : ''}</div>`}${status}</section>` : status;
  return `<a class="back" href="#/kits">← Brand kits</a>
    <div class="row gap16"><input type="text" class="title-input" id="kit-name" value="${esc(k.name)}" aria-label="Kit name">${k.stage ? '<em class="chip">Draft</em>' : ''}
      <select id="kit-client" class="push" aria-label="Account"><option value="">No account yet</option>${S.clients.map(c => `<option ${c.name === k.client ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
    <p class="soft small gap8">Changing anything here changes this kit. It never becomes a new one.</p>
    <p class="error small" id="err"></p>
    ${review}
    <div class="two kit-layout gap32"><div>
        ${hasBrief ? (editing === 'D' + brief.path ? docBlock('Full brief', 'D', brief) : `<article class="reading">${md(readingText(summary.text.trim() ? summary.text : brief.text))}<button class="link small summary-link" data-act="doc-edit" data-key="D${esc(brief.path)}">See or edit the full brief</button></article>`) : '<p class="soft"><i class="dot wait live"></i>Claude is still writing the brief.</p>'}
        <section class="say"><h3>Tell the designer something</h3><p class="soft small gap8">Each line is a rule the designer reads before every carousel in this kit.</p>
          <textarea id="fb-text" class="gap16" rows="3" placeholder="Headlines bigger. Less empty space at the bottom…"></textarea>
          <div class="row gap16"><input type="hidden" id="fb-kit" value="${esc(id)}"><button class="btn solid" data-act="fb-kit">Remember this</button><span class="soft small" id="fb-done"></span></div>
          ${fb.text.trim() ? `<div class="doc gap24">${md(fb.text)}</div>` : ''}</section>
        ${used.length ? `<section class="gap48"><h3>Made with this kit</h3><div class="sheet four gap24">${used.slice(0, 8).map(thumb).join('')}</div></section>` : ''}</div>
      <div class="side">${k.colors.length ? `<div class="swatches">${k.colors.map(x => `<i style="background:${x}" title="${x}"></i>`).join('')}</div>` : ''}
        ${k.refs.length ? `<p class="soft small">My references</p><div class="refs">${k.refs.map(p => `<img src="${esc(p)}" alt="" loading="lazy">`).join('')}</div>` : ''}
        <button class="btn" data-act="kit-delete">Delete this kit</button></div></div>`;
}

// ---------- saved
function libraryPage() {
  const sel = (key, any, opts) => `<div class="pick"><button class="pill ${menu === 'lib-' + key ? 'open' : ''}" data-act="menu" data-v="lib-${key}"><span class="v">${esc((opts.find(([v]) => v === lib[key]) || ['', any])[1])}</span><i class="caret"></i></button>${menu === 'lib-' + key ? `<div class="pop">${[['', any], ...opts].map(([v, t]) => `<button class="opt ${lib[key] === v ? 'on' : ''}" data-act="lib-pick" data-k="${key}" data-v="${esc(v)}">${esc(t)}</button>`).join('')}</div>` : ''}</div>`;
  return `<h2>Saved</h2>
    <div class="row gap24">${sel('client', 'All accounts', S.clients.map(c => [c.name, c.name]))}${sel('brand', 'All brand kits', S.brands.map(b => [b.id, b.name]))}
      ${sel('status', 'Any status', ['Writing', 'Needs your review', 'Designing', 'Designed', 'Posted', 'Failed'].map(s => [s, s]))}
      ${lib.client || lib.brand || lib.status || lib.q ? `<button class="ghost" data-act="lib-clear">Clear filters</button>` : ''}</div>
    <div id="lib-grid" class="gap32">${libraryGrid()}</div>`;
}
function libraryGrid() {
  const list = S.carousels.filter(c => (!lib.client || c.client === lib.client) && (!lib.brand || c.brand === lib.brand) && (!lib.status || statusOf(c) === lib.status) && (!lib.q || c.search.includes(lib.q.toLowerCase()))).sort(newest);
  return list.length ? `<p class="soft small">${plural(list.length, 'carousel')}${lib.q ? ` matching “${esc(lib.q)}”` : ''}</p><div class="gap16">${sheet(list)}</div>` : '<p class="soft">Nothing matches these filters.</p>';
}

// ---------- one carousel
const WSTEPS = ['reading', 'topic', 'headline', 'draft', 'review', 'revise', 'save'], DSTEPS = ['brand', 'generate', 'zip'];
function pipeline(d) {
  if (d.posted || !['Writing', 'Copy ready', 'Cover ready', 'Designing'].includes(d.status)) return '';
  const run = S.jobs.filter(j => j.carouselId === d.id).pop(), token = run ? run.id : d.id;
  const old = pipelineProgress[d.id];
  const w = Math.max(WSTEPS.indexOf(d.step), old && old.token === token ? old.w : 0);
  const phase = d.status === 'Writing' ? (w >= 4 ? 1 : 0) : d.status === 'Copy ready' ? 2 : 3;
  const current = Math.max(phase, old && old.token === token ? old.phase : 0);
  pipelineProgress[d.id] = { token, w, phase: current };
  const ds = DSTEPS.indexOf(d.step), total = d.slides.length, made = d.images.length;
  const steps = [
    ['Draft', [['Reading my account files', 0 - w], ['Picking the topic', 1 - w], ['Writing the cover line', 2 - w], ['Writing the slides', 3 - w]]],
    ['Review', [['Checking the writing rules', 4 - w], ['Making revisions', 5 - w], ['Saving the copy', 6 - w]]],
    ['Your review', [['Read, edit or approve the copy', 0]]],
    ['Design', [['Reading my brand kit', 0 - ds], [made + ' of ' + total + ' slides ready', made >= total ? -1 : 0], ['Packing the ZIP', 2 - ds]]],
    ['Delivered', []]
  ];
  return '<div class="timeline"><div class="timeline-track"></div><div class="timeline-fill" style="width:calc((100% + 14px) * ' + current + ' / 5)"></div>' + steps.map(([label, subs], i) => {
    const state = i < current ? 'done' : i === current ? 'current' : 'future';
    return '<div class="timeline-node ' + state + '"><span class="timeline-dot"></span><b>' + label + '</b>' + (i === current ? '<ul class="timeline-sub">' + subs.map(([text, rel]) => '<li class="' + (rel < 0 ? 'done' : rel === 0 ? 'current' : 'future') + '">' + text + '</li>').join('') + '</ul>' : '') + '</div>';
  }).join('') + '</div>';
}
async function carouselPage(id) {
  const d = detail = await api(`/api/carousels/${id}`), k = kit(d.brand);
  const origin = carouselOrigins[id] || '#/library', parts = origin.replace(/^#\/?/, '').split('/');
  const backLabel = parts[0] === 'clients' ? decodeURIComponent(parts[1] || d.client || 'Accounts') : parts[0] === 'library' ? 'Saved' : 'Home';
  const finished = d.posted || ['Slides ready', 'Done'].includes(d.status);
  const head = `<a class="back" href="${esc(origin)}">← ${esc(backLabel)}</a>
    <div class="row gap16"><h2>${esc(d.title)}</h2><button class="posted-pill ${d.posted ? 'posted' : ''}" data-act="posted" data-id="${id}">${d.posted ? 'Posted' : 'Not posted'}</button>
      <div class="row push"><button class="link small" data-act="open" ${d.designDir || d.copyPath ? "" : "disabled"}>Open on this PC</button>${cardActions(d)}${d.zip ? `<a class="icon-btn" href="${esc(d.zip)}" download title="Download ZIP" aria-label="Download ZIP">${icon('download')}</a>` : ''}</div></div>
    ${finished ? '<p class="soft small gap8">Written, reviewed and designed</p>' : ''}
    <p class="soft small gap8">${esc(['Goal: ' + (d.goal || 'views first, then leads'), d.client, k && k.name, d.slides.length > 1 && d.slides.length + ' slides'].filter(Boolean).join(' · '))}</p>${pipeline(d)}`;
  const away = `<p class="away">You can leave this page and do anything else. It carries on in the background, and “Runs” in the sidebar shows it.</p>`;
  if (d.status === 'Failed') return `${head}<div class="col gap32"><p class="error">${esc(d.error || 'This run failed.')}</p><div class="row gap24"><button class="btn solid" data-act="retry">Try again</button><button class="link" data-act="drawer">See the run</button></div></div>`;
  if (d.status === 'Writing') return `${head}${away}${d.dump ? `<section class="quote gap24"><span class="label">Your brain dump</span><p class="gap8">${esc(d.dump)}</p></section>` : ''}`;
  if (d.status === 'Copy ready') {
    if (rv.id !== d.id) Object.assign(rv, { id: d.id, pane: 'note', text: '', stars: d.rating || 0, notes: {} });
    const r = d.report || {}, kits = usable(d.client), noted = Object.values(rv.notes).filter(v => v.trim()).length;
    return `${head}<div class="review gap32"><div><p class="hint">Edit any slide right here. To tell the writer what is off, add a note under that slide or write on the right.</p><div id="slides">${slideCards(d.slides)}</div></div>
      <aside class="desk"><div class="seg full"><button class="${rv.pane === 'note' ? 'on' : ''}" data-act="pane" data-v="note">Feedback to the writer</button><button class="${rv.pane === 'why' ? 'on' : ''}" data-act="pane" data-v="why">What Claude chose</button></div>
        ${rv.pane === 'note' ? `<div class="stars" role="group" aria-label="Rate this draft">${[1, 2, 3, 4, 5].map(n => `<button class="${n <= rv.stars ? 'on' : ''}" data-act="star" data-v="${n}" aria-label="${plural(n, 'star')}">★</button>`).join('')}<span class="soft small">Rate this draft</span></div>
          <textarea id="rv-text" rows="6" placeholder="What is off, in your own words. The more blunt the better.">${esc(rv.text)}</textarea>
          <p class="soft small">${noted ? plural(noted, 'slide note') + ' will go with it. ' : ''}Every note is kept in ${esc(d.client)}’s writing feedback, so the next carousel starts from it.</p>
          <button class="btn" data-act="rewrite">Rewrite with this feedback</button>`
        : `${r.topic ? `<p class="small"><span class="label">Topic</span>${esc(r.topic)}</p><p class="small"><span class="label">Angle</span>${esc(r.angle)}</p><p class="small"><span class="label">Comment word</span><b>${esc(r.commentWord)}</b></p>` : '<p class="soft small">No notes came back with this draft.</p>'}
          ${(r.inferred || []).length ? `<div><span class="label">Supplied by Claude, not me</span><ul>${r.inferred.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}`}
        <hr class="rule">
        ${kits.length > 1 && kitsFor(d.client).length !== 1 ? `<label class="small soft">Brand kit <select id="c-brand">${kits.map(b => `<option value="${esc(b.id)}" ${b.id === d.brand ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>` : `<p class="small soft">Brand kit: <b>${esc(k ? k.name : 'none yet')}</b></p>`}
        <button class="gen" data-act="design">Approve and design →</button>
        <p class="soft small" id="saved"></p><p class="error small" id="err"></p></aside></div>`;
  }
  // Designing, Cover ready, Slides ready, Done
  const known = seen[id] || (seen[id] = new Set(d.images.map(i => i.url))), making = d.status === 'Designing';
  const frames = d.slides.map((s, i) => {
    const img = d.images.find(x => x.n === i + 1), num = `<span class="num">${String(i + 1).padStart(2, '0')}</span>`;
    if (!img) return `<div><span class="frame ${making ? 'making' : 'empty'}">${num}${making ? `<span class="words">${esc(s.replace(/^[#*\s]+/, '').split('\n')[0].replace(/\*+/g, '').slice(0, 90))}</span>` : ''}</span></div>`;
    known.add(img.url);
    return `<div><button class="frame" data-act="view" data-n="${img.n}"><img src="${esc(img.url)}" alt="Slide ${img.n}">${num}</button>
      ${img.versions.length > 1 ? `<span class="label gap8">${img.versions.length} versions</span>` : ''}</div>`;
  }).join('');
  if (making) return `${head}${away}<div class="sheet gap32">${frames}</div>`;
  return `${head}${d.status === 'Cover ready' ? '<div class="gap24"><button class="btn solid" data-act="rest">Cover approved, make the rest</button></div>' : ''}<div class="sheet gap32">${frames}</div>`;

}
const slideCards = slides => slides.map((s, i) => `<article class="slide"><header><span class="label">Slide ${i + 1}${i === 0 ? ' · Cover' : i === slides.length - 1 ? ' · Closing' : ''}</span>
  <span class="tools"><button data-act="s-up" data-i="${i}">↑</button><button data-act="s-down" data-i="${i}">↓</button><button data-act="s-add" data-i="${i}">Add below</button><button data-act="s-del" data-i="${i}">Delete</button></span></header>
  <textarea data-slide="${i}" rows="1">${esc(s)}</textarea>
  <input type="text" class="snote" data-snote="${i}" value="${esc(rv.notes[i] || '')}" placeholder="+ Note for the writer about this slide"></article>`).join('');
const grow = t => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; };
const fullNote = () => [rv.text.trim(), ...Object.entries(rv.notes).filter(([, v]) => v.trim()).map(([i, v]) => `Slide ${+i + 1}: ${v.trim()}`)].filter(Boolean).join('\n');
let saveTimer;
function saveCopy(now) {
  clearTimeout(saveTimer);
  const run = async () => { detail.slides = $$('[data-slide]').map(t => t.value); await api(`/api/carousels/${detail.id}/copy`, 'PUT', { slides: detail.slides }); const s = $('#saved'); if (s) s.textContent = 'Your edits are saved.'; };
  return now ? run() : (saveTimer = setTimeout(run, 700));
}

// ---------- chrome: sidebar, drawer, viewer
function chrome() {
  const r = route()[0] || 'desk', tab = { desk: 'desk', clients: 'clients', 'new-client': 'clients', library: 'library', c: 'library', kits: 'kits', kit: 'kits', 'new-kit': 'kits', connect: 'connect' }[r];
  $('#title').textContent = { desk: 'Home', clients: 'Accounts', library: 'Saved', kits: 'Brand kits', connect: 'Connect accounts' }[tab] || '';
  $$('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  const active = S.jobs.filter(j => j.status === 'running' || j.status === 'queued'), run = $('#running');
  run.hidden = !S.jobs.length;
  run.innerHTML = `<i class="dot ${active.length ? 'red live' : ''}"></i><span>${active.length ? active.length + ' running' : 'Runs'}</span>`;
  $('#newmenu').hidden = menu !== 'new';
  $('.sidebar .new').setAttribute('aria-expanded', String(menu === 'new'));
  if (!$('#drawer').hidden) drawDrawer();
}
function drawDrawer() {
  const mins = j => (j.started ? Math.max(1, Math.round(((j.ended || Date.now()) - j.started) / 60000)) + ' min' : 'in line');
  const open = $$('#drawer details[open] pre').map(p => p.dataset.log);
  $('#drawer').innerHTML = `<div class="row"><h3>Runs</h3><button class="link push" data-act="drawer">Close</button></div>
    <p class="soft small gap8">One Claude run and one Codex run at a time. The rest wait in line.</p>
    ${[...S.jobs].reverse().map(j => `<div class="job"><div class="row"><span><i class="dot ${j.status === 'running' ? 'wait live' : j.status === 'done' ? 'good' : j.status === 'queued' ? '' : 'red'}"></i>${esc(j.label)}</span>
      <span class="soft small push">${j.engine} · ${mins(j)}</span>${j.status === 'running' || j.status === 'queued' ? `<button class="link small" data-act="stop" data-id="${j.id}">Stop</button>` : ''}</div>
      ${j.error ? `<p class="error small gap8">${esc(j.error)}</p>` : ''}<details ${open.includes(j.id) ? 'open' : ''}><summary class="soft small">Raw log</summary><pre data-log="${j.id}">${esc(j.log.join('\n'))}</pre></details></div>`).join('') || '<p class="soft gap24">Nothing has run yet.</p>'}`;
}
function drawViewer() {
  const el = $('#viewer');
  if (!viewer || !detail) { el.hidden = true; return; }
  const img = detail.images.find(i => i.n === viewer.n);
  if (!img) { viewer = null; el.hidden = true; return; }
  const all = [...img.versions, img.url], v = viewer.v ?? all.length - 1;
  el.hidden = false;
  const html = `<button class="nav" data-act="v-prev" aria-label="Previous slide">‹</button><div class="viewer-stage"><img src="${esc(all[v])}" alt="Slide ${img.n}">
    <div class="viewer-bar"><span class="small">${img.n} of ${detail.slides.length}${v < all.length - 1 ? ' · v' + (v + 1) : ''}</span>
      ${all.length > 1 ? `<span class="vdots">${all.map((_, i) => `<button class="${i === v ? 'on' : ''}" data-act="v-ver" data-v="${i}" aria-label="Version ${i + 1}"></button>`).join('')}</span>` : ''}
      <button class="redo-open" data-act="v-redo">Redo</button><button class="link small" data-act="v-close">Close</button></div>
    ${viewer.redo ? `<div class="redo-panel"><textarea id="redo-note" rows="3" placeholder="What should change on this slide?">${esc(viewer.note || '')}</textarea><div class="row gap16"><button class="btn" data-act="redo">Save and redo this slide</button><button class="btn" data-act="redo-rule">Save for next time</button></div><p class="soft small gap8" id="redo-done"></p></div>` : ''}
    </div><button class="nav" data-act="v-next" aria-label="Next slide">›</button>`;
  if (el.dataset.html !== html) {
    const template = document.createElement('template'); template.innerHTML = html;
    patchChildren(el, template.content); el.dataset.html = html;
  }
}

// ---------- connect: the viewer's own Claude and ChatGPT subscriptions
let conn = null;
const loadConn = async () => { conn = await api('/api/connect'); return conn; };
const TOOLS = [
  { k: 'claude', name: 'Claude', does: 'Writes the carousels and learns each account', plan: 'Claude Pro or Max', install: 'npm install -g @anthropic-ai/claude-code' },
  { k: 'codex', name: 'ChatGPT', does: 'Designs the slides and makes the images, through Codex', plan: 'ChatGPT Plus or Pro', install: 'npm install -g @openai/codex' },
];
async function connectPage() {
  if (!conn) await loadConn();
  return `<section class="gap24"><h2>Connect your accounts</h2><p class="soft gap8">The app runs on your computer and uses your own subscriptions. Nothing is sent to anyone else, and no API credits are needed.</p>
    ${TOOLS.map(t => { const s = conn[t.k];
      return `<div class="job gap24"><div class="row"><span><i class="dot ${s.connected ? 'good' : 'red'}"></i><b>${t.name}</b></span><span class="soft small push">${esc(t.plan)}</span></div>
        <p class="soft small gap8">${esc(t.does)}.</p>
        ${!s.installed ? `<p class="small gap8">Not installed yet. Run this once in a terminal, then press Check again:</p><pre>${esc(t.install)}</pre>`
          : s.connected ? `<p class="small gap8">${esc(s.how)}</p>`
          : `<p class="small gap8">Installed, not signed in. A terminal window opens; sign in with your ${t.name} account in the browser, then come back.</p><div class="row gap16"><button class="btn" data-act="connect" data-v="${t.k}">Sign in to ${t.name}</button></div>`}
      </div>`; }).join('')}
    <div class="row gap24"><button class="btn" data-act="connect-check">Check again</button></div></section>`;
}
function connectBanner() {
  if (!conn || (conn.claude.connected && conn.codex.connected)) return '';
  return `<p class="gap8"><a href="#/connect"><b>Connect your Claude and ChatGPT accounts</b></a> <span class="soft">before your first carousel.</span></p>`;
}

// ---------- draw
async function render(force) {
  if (!S) return;
  chrome();
  const [r, a, b, c] = route(), key = location.hash, el = document.activeElement;
  const typing = el && el.closest('#page, #viewer') && (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable);
  if (!force && key === drawn && (typing || editing)) return;
  let html;
  try {
    html = r === 'clients' ? await clientsPage(a, b, c) : r === 'library' ? libraryPage() : r === 'kits' ? kitsPage() : r === 'kit' ? await kitPage(a)
      : r === 'new-client' ? newClientPage() : r === 'new-kit' ? newKitPage(a) : r === 'c' ? await carouselPage(a) : r === 'connect' ? await connectPage() : connectBanner() + homePage();
  } catch (e) { html = `<p class="error">${esc(e.message)}</p>`; }
  if (key !== location.hash) return;
  const y = key === drawn ? scrollY : 0;
  const page = $('#page');
  if (key === drawn && page.dataset.html === html) return;
  if (key === drawn && r === 'c' && detail.status !== 'Copy ready') {
    const template = document.createElement('template'); template.innerHTML = html;
    patchChildren(page, template.content);
  } else page.innerHTML = html;
  page.dataset.html = html;
  $$('[data-slide]').forEach(grow);
  halftones(); drawViewer();
  const track = $('.recent-track'); if (track) { track.addEventListener('scroll', recentArrows); recentArrows(); }
  scrollTo(0, y); drawn = key;
}
async function refresh(force) { S = await api('/api/state'); if (!conn) await loadConn().catch(() => {}); await render(force); }
// Keep landed image elements in place while neighbouring progress text changes.
function patchChildren(target, source) {
  const next = [...source.childNodes];
  next.forEach((n, i) => {
    let o = target.childNodes[i];
    if (n.nodeType === 1 && n.classList.contains('sheet')) {
      const existing = [...target.children].find(el => el.classList.contains('sheet'));
      if (existing && existing !== o) { target.insertBefore(existing, o || null); o = existing; }
    }
    if (!o) return target.appendChild(n.cloneNode(true));
    if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) return o.replaceWith(n.cloneNode(true));
    if (n.nodeType === 3) { if (o.textContent !== n.textContent) o.textContent = n.textContent; return; }
    if (n.nodeType !== 1) return;
    for (const a of [...o.attributes]) if (!n.hasAttribute(a.name)) o.removeAttribute(a.name);
    for (const a of [...n.attributes]) if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
    patchChildren(o, n);
  });
  while (target.childNodes.length > next.length) target.lastChild.remove();
}
function recentArrows() {
  const track = $('.recent-track'); if (!track) return;
  const buttons = $$('.slider-arrow');
  buttons[0].disabled = track.scrollLeft <= 1;
  buttons[1].disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
}
const fail = e => { const el = $('#err'); el ? (el.textContent = e.message) : alert(e.message); };
const remembered = () => { $('#fb-text').value = ''; refresh(true).then(() => { const d = $('#fb-done'); if (d) d.textContent = 'Saved. It will be read before the next one.'; }); };
const mentionFiles = () => (route()[0] === 'new-kit' ? nk.files : draft.files);
function showMentions(t) {
  const match = /@(?:img\s*)?(\d*)$/.exec(t.value.slice(0, t.selectionStart));
  const list = mentionFiles().map((_, i) => i).filter(i => !match || !match[1] || String(i + 1).startsWith(match[1]));
  mention = match && list.length ? { el: t, start: t.selectionStart - match[0].trimStart().length, end: t.selectionStart, list, at: 0 } : null;
  paintMentions();
}
function paintMentions() {
  const pop = $('#image-mentions'); if (!pop) return; pop.hidden = !mention;
  if (mention) pop.innerHTML = mention.list.map((i, at) => `<button class="opt ${at === mention.at ? 'on' : ''}" data-act="mention-pick" data-i="${i}"><img src="${esc(mentionFiles()[i].url)}" alt=""><span>img ${i + 1}</span></button>`).join('');
}
function insertMention(i) {
  if (!mention) return;
  const t = mention.el, tag = `@img ${i + 1} `;
  t.setRangeText(tag, mention.start, mention.end, 'end'); if (t.id === 'nk-note') nk.note = t.value; else draft.dump = t.value; mention = null; paintMentions(); t.focus();
}

// ---------- actions
const acts = {
  'recent-scroll': t => { $('.recent-track').scrollBy({ left: +t.dataset.v * $('.recent-track').clientWidth, behavior: 'smooth' }); },
  'lib-pick': t => { lib[t.dataset.k] = t.dataset.v; menu = ''; render(true); },
  'ref-remove': t => {
    const i = +t.dataset.i; URL.revokeObjectURL(draft.files[i].url); draft.files.splice(i, 1);
    draft.dump = draft.dump.replace(/@img (\d+)\b/g, (tag, n) => +n === i + 1 ? '' : +n > i + 1 ? `@img ${+n - 1}` : tag);
    mention = null; render(true);
  },
  'mention-pick': t => insertMention(+t.dataset.i),
  posted: async t => { const c = S.carousels.find(c => c.id === t.dataset.id) || detail; await api(`/api/carousels/${c.id}/posted`, 'POST', { undo: !!c.posted }); await refresh(true); },
  delete: t => {
    const c = S.carousels.find(c => c.id === t.dataset.id) || detail;
    const shade = document.createElement('div'); shade.className = 'confirm-shade'; shade.id = 'delete-confirm';
    shade.innerHTML = `<div class="confirm-box" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h3 id="delete-title">Delete this carousel?</h3><p>${esc(c.title)}</p><div class="row gap24"><button class="btn" data-act="delete-confirm" data-id="${c.id}">Delete</button><button class="btn" data-act="delete-keep">Keep it</button></div><p class="error small" id="delete-error"></p></div>`;
    document.body.appendChild(shade); $('[data-act="delete-keep"]', shade).focus();
  },
  'delete-keep': () => $('#delete-confirm')?.remove(),
  'delete-confirm': async t => {
    try { await api(`/api/carousels/${t.dataset.id}`, 'DELETE'); $('#delete-confirm').remove(); if (route()[0] === 'c' && route()[1] === t.dataset.id) go(carouselOrigins[t.dataset.id] || '#/library'); await refresh(true); }
    catch (e) { $('#delete-error').textContent = e.message; }
  },
  menu: t => { menu = menu === t.dataset.v ? '' : t.dataset.v; render(true); },
  pick: t => { draft[t.dataset.k] = t.dataset.v; if (t.dataset.k === 'client') draft.brand = ''; menu = ''; render(true); },
  fold: () => { store.set('folded', document.body.classList.toggle('folded') ? '1' : ''); },
  'new-client': async () => {
    const { name } = await api('/api/clients', 'POST', ob);
    Object.assign(ob, { name: '', sells: '', helps: '', handle: '', competitor: false, bucket: '', files: 0 });
    await refresh(); go(`#/clients/${enc(name)}`);
  },
  'new-kit': async () => {
    if (nk.files.length) {
      nk.bucket = 'Brand Kit ' + Date.now().toString(36);
      for (const [i, f] of nk.files.entries()) await upload(nk.bucket, 'Writing', f.file, `img ${i + 1}${(/\.\w+$/.exec(f.file.name) || ['.png'])[0].toLowerCase()}`);
    }
    const { id } = await api('/api/brands', 'POST', { ...nk, files: undefined });
    nk.files.forEach(f => URL.revokeObjectURL(f.url));
    Object.assign(nk, { client: '', name: '', handle: '', note: '', bucket: '', files: [] });
    await refresh(); go(`#/kit/${enc(id)}`);
  },
  'nk-remove': t => {
    const i = +t.dataset.i; URL.revokeObjectURL(nk.files[i].url); nk.files.splice(i, 1);
    nk.note = nk.note.replace(/@img (\d+)\b/g, (tag, n) => +n === i + 1 ? '' : +n > i + 1 ? `@img ${+n - 1}` : tag);
    mention = null; render(true);
  },
  'kit-cover-ok': () => kitAct('cover-ok', { note: kn.note }),
  'kit-cover-redo': () => kitAct('cover-redo', { note: kn.note }),
  'kit-slides-redo': () => kitAct('slides-redo', { note: kn.note, notes: kn.notes }),
  'kit-approve': () => kitAct('approve'),
  'kit-retry': () => kitAct('retry'),
  'kit-delete': () => {
    const k = kit(kn.id), shade = document.createElement('div'); shade.className = 'confirm-shade'; shade.id = 'delete-confirm';
    shade.innerHTML = `<div class="confirm-box" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h3 id="delete-title">Delete this brand kit?</h3><p>${esc(k.name)}. Its files move to the Removed folder, and carousels already designed with it stay as they are.</p><div class="row gap24"><button class="btn" data-act="kit-delete-confirm">Delete</button><button class="btn" data-act="delete-keep">Keep it</button></div><p class="error small" id="delete-error"></p></div>`;
    document.body.appendChild(shade); $('[data-act="delete-keep"]', shade).focus();
  },
  'kit-delete-confirm': async () => {
    try { await api('/api/brands/delete', 'POST', { id: kn.id }); $('#delete-confirm').remove(); await refresh(); go('#/kits'); }
    catch (e) { $('#delete-error').textContent = e.message; }
  },
  'd-submit': async () => {
    if (draft.files.length) {
      draft.bucket = 'Carousel ' + Date.now().toString(36);
      for (const [i, f] of draft.files.entries()) await upload(draft.bucket, '', f.file, `img ${i + 1}${(/\.\w+$/.exec(f.file.name) || ['.png'])[0].toLowerCase()}`);
    }
    const { id } = await api('/api/carousels', 'POST', { ...draft, files: undefined });
    draft.files.forEach(f => URL.revokeObjectURL(f.url));
    Object.assign(draft, { dump: '', goal: '', bucket: '', files: [] }); go(`#/c/${id}`);
  },
  approve: async t => { await api(`/api/clients/${enc(t.dataset.client)}/approve`, 'POST', {}); refresh(true); },
  'write-for': async t => { draft.client = t.dataset.v; draft.brand = ''; acts['new-carousel'](); },
  connect: async t => { await api(`/api/connect/${t.dataset.v}`, 'POST'); },
  'connect-check': async () => { await loadConn(); render(true); },
  'new-carousel': async () => { menu = ''; if (route()[0]) go('#/'); await render(true); const t = $('#d-dump'); if (t) t.focus(); },
  'lib-clear': () => { Object.assign(lib, { client: '', brand: '', status: '', q: '' }); $('#find').value = ''; render(true); },
  'posted-filter': t => { postedOnly = t.dataset.v; render(true); },
  'deck-note': async () => { const note = $('#deck-note').value.trim(); if (!note) return; await api(`/api/carousels/${detail.id}/redo`, 'POST', { slide: 0, note }); refresh(true); },
  'fb-writer': async t => { await api(`/api/clients/${enc(t.dataset.client)}/feedback`, 'POST', { file: $('#fb-file').value, text: $('#fb-text').value }); remembered(); },
  'fb-kit': async () => { await api('/api/brands/feedback', 'POST', { id: $('#fb-kit').value, text: $('#fb-text').value }); remembered(); },
  sample: async t => { await api('/api/brands/sample', 'POST', { id: t.dataset.id, note: $('#sample-note').value }); refresh(true); },
  'doc-toggle': t => { const k = t.dataset.key; openDocs.has(k) ? openDocs.delete(k) : openDocs.add(k); render(true); },
  'doc-edit': t => { editing = t.dataset.key; render(true); },
  'doc-cancel': () => { editing = ''; render(true); },
  'doc-save': async t => {
    const { root, path } = t.dataset, { head, tail } = split((await api(`/api/doc?root=${root}&path=${enc(path)}`)).text);
    await api('/api/doc', 'PUT', { root, path, text: head + toMd($('#doc-edit')) + tail });
    openDocs.add(editing); editing = ''; refresh(true);
  },
  pane: t => { rv.pane = t.dataset.v; render(true); },
  star: t => { rv.stars = rv.stars === +t.dataset.v ? 0 : +t.dataset.v; render(true); },
  's-up': t => moveSlide(+t.dataset.i, -1), 's-down': t => moveSlide(+t.dataset.i, 1),
  's-add': t => editSlides(s => s.splice(+t.dataset.i + 1, 0, '')),
  's-del': t => { if (detail.slides.length > 1) editSlides(s => s.splice(+t.dataset.i, 1)); },
  rewrite: async () => {
    const note = fullNote(); if (!note) throw new Error('Write what should change first.');
    await saveCopy(true); await api(`/api/carousels/${detail.id}/rewrite`, 'POST', { note, rating: rv.stars }); rv.id = ''; refresh(true);
  },
  design: async () => {
    await saveCopy(true);
    await api(`/api/carousels/${detail.id}/design`, 'POST', { brand: ($('#c-brand') || {}).value || detail.brand, note: fullNote(), rating: rv.stars }); rv.id = ''; refresh(true);
  },
  rest: async () => { await api(`/api/carousels/${detail.id}/rest`, 'POST', {}); refresh(true); },
  retry: async () => { await api(`/api/carousels/${detail.id}/retry`, 'POST', {}); refresh(true); },
  open: () => api(`/api/carousels/${detail.id}/open`, 'POST', {}),
  view: t => { viewer = { n: +t.dataset.n }; drawViewer(); },
  'v-close': () => { viewer = null; drawViewer(); },
  'v-prev': () => stepViewer(-1), 'v-next': () => stepViewer(1),
  'v-ver': t => { viewer.v = +t.dataset.v; drawViewer(); },
  'v-redo': () => { viewer.redo = !viewer.redo; drawViewer(); if (viewer.redo) $('#redo-note').focus(); },
  'redo-rule': async () => {
    const note = $('#redo-note').value.trim(); if (!note) return;
    await api('/api/brands/feedback', 'POST', { id: detail.brand || detail.designDir, text: `Slide ${viewer.n} of "${detail.title}": ${note}` });
    $('#redo-done').textContent = 'Saved for next time.';
  },
  redo: async () => { const note = $('#redo-note').value.trim(); if (!note) return; const n = viewer.n; viewer = null; await api(`/api/carousels/${detail.id}/redo`, 'POST', { slide: n, note }); refresh(true); },
  drawer: () => { const d = $('#drawer'); d.hidden = !d.hidden; if (!d.hidden) drawDrawer(); },
  stop: async t => { await api(`/api/jobs/${t.dataset.id}/stop`, 'POST', {}); refresh(); },
};
async function kitAct(what, more = {}) { await api(`/api/brands/${what}`, 'POST', { id: kn.id, ...more }); Object.assign(kn, { note: '', notes: {} }); $$('[data-knote], #kit-note').forEach(x => { x.value = ''; }); refresh(true); }
function editSlides(fn) { detail.slides = $$('[data-slide]').map(t => t.value); fn(detail.slides); rv.notes = {}; $('#slides').innerHTML = slideCards(detail.slides); $$('[data-slide]').forEach(grow); saveCopy(true); }
function moveSlide(i, d) { if (i + d >= 0 && i + d < detail.slides.length) editSlides(s => s.splice(i + d, 0, s.splice(i, 1)[0])); }
function stepViewer(d) { const ns = detail.images.map(i => i.n), at = ns.indexOf(viewer.n) + d; if (ns[at]) { viewer = { n: ns[at] }; drawViewer(); } }

document.addEventListener('mousedown', e => {
  const b = e.target.closest('[data-fmt]');
  if (!b) return;
  e.preventDefault();   // keep the selection inside the editor
  const c = b.dataset.fmt;
  /^(h2|h3|p)$/.test(c) ? document.execCommand('formatBlock', false, c) : document.execCommand(c);
});
document.addEventListener('click', e => {
  const drop = e.target.closest('[data-drop]');
  if (drop && e.target.tagName !== 'INPUT') return $('input', drop).click();
  const t = e.target.closest('[data-act]');
  if (menu && !e.target.closest('.pick')) { menu = ''; render(true); }
  if (t && acts[t.dataset.act]) Promise.resolve().then(() => acts[t.dataset.act](t)).catch(fail);
  else if (e.target.id === 'viewer') acts['v-close']();
});
document.addEventListener('input', e => {
  const t = e.target, d = t.dataset || {};
  if (d.slide) { grow(t); saveCopy(); }
  if (d.snote) rv.notes[d.snote] = t.value;
  if (t.id === 'rv-text') rv.text = t.value;
  if (d.ob) { ob[d.ob] = t.type === 'checkbox' ? t.checked : t.value; $$(`[data-ob="${d.ob}"]`).forEach(i => { if (i !== t) i.value = t.value; }); }
  if (d.nk) nk[d.nk] = t.value;
  if (t.id === 'd-dump') draft.dump = t.value;
  if (t.id === 'd-dump' || t.id === 'nk-note') showMentions(t);
  if (d.knote) kn.notes[d.knote] = t.value;
  if (d.kn) kn[d.kn] = t.value;
  if (t.id === 'redo-note' && viewer) viewer.note = t.value;
  if (t.id === 'd-goal') draft.goal = t.value;
  if (t.id === 'find') { lib.q = t.value; const g = $('#lib-grid'); if (g) g.innerHTML = libraryGrid(); }
});
document.addEventListener('change', async e => {
  const t = e.target, d = t.dataset || {};
  try {
    if (d.lib) { lib[d.lib] = t.value; render(true); }
    if (d.posted) { await api(`/api/carousels/${d.posted}/posted`, 'POST', { undo: !t.checked }); refresh(true); }
    if (t.id === 'kit-name' || t.id === 'kit-client') { await api('/api/brands/meta', 'POST', { id: route()[1], [t.id === 'kit-name' ? 'name' : 'client']: t.value }); refresh(true); }
    if (t.id === 'file-under' && t.value) { await api(`/api/carousels/${detail.id}/client`, 'POST', { client: t.value }); refresh(true); }
    if (t.type === 'file' && t.closest('[data-drop]')) await takeFiles(t.closest('[data-drop]'), [...t.files]);
  } catch (err) { fail(err); }
});
async function takeFiles(zone, files) {
  const part = zone.dataset.drop, stamp = () => Date.now().toString(36);
  if (part === 'Face') { await upload('Avatars', '', files[0], zone.dataset.client + (/\.\w+$/.exec(files[0].name) || ['.jpg'])[0].toLowerCase()); return refresh(true); }
  if (part === 'References') {
    for (const f of files.filter(f => f.type.startsWith('image/')).slice(0, 10 - draft.files.length)) draft.files.push({ file: f, url: URL.createObjectURL(f) });
  } else if (part === 'Kit') {
    for (const f of files.filter(f => f.type.startsWith('image/')).slice(0, 12 - nk.files.length)) nk.files.push({ file: f, url: URL.createObjectURL(f) });
  } else {
    ob.bucket = ob.bucket || 'Onboarding ' + stamp();
    for (const f of files) await upload(ob.bucket, 'Writing', f);
    ob.files += files.length;
  }
  render(true);
}
document.addEventListener('dragover', e => { const z = e.target.closest && e.target.closest('[data-drop]'); if (z) { e.preventDefault(); z.classList.add('over'); } });
document.addEventListener('dragleave', e => { const z = e.target.closest && e.target.closest('[data-drop]'); if (z) z.classList.remove('over'); });
document.addEventListener('drop', e => { const z = e.target.closest && e.target.closest('[data-drop]'); if (z) { e.preventDefault(); takeFiles(z, [...e.dataTransfer.files]).catch(fail); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#delete-confirm')) { acts['delete-keep'](); return; }
  if (mention && (e.target.id === 'd-dump' || e.target.id === 'nk-note')) {
    if (['ArrowUp', 'ArrowDown'].includes(e.key)) { e.preventDefault(); mention.at = (mention.at + (e.key === 'ArrowUp' ? -1 : 1) + mention.list.length) % mention.list.length; paintMentions(); return; }
    if (e.key === 'Enter') { e.preventDefault(); insertMention(mention.list[mention.at]); return; }
    if (e.key === 'Escape') { mention = null; $('#image-mentions').hidden = true; return; }
  }
  if (viewer && e.key === 'Escape') { if (viewer.redo) { viewer.redo = false; drawViewer(); } else acts['v-close'](); return; }
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !route()[0]) acts['d-submit']().catch(fail);
  if (e.key === 'Escape' && menu) { menu = ''; render(true); }
  if (e.key === 'Enter' && e.target.id === 'find') { lib.q = e.target.value; go('#/library'); render(true); }
  if (!viewer || /TEXTAREA|INPUT/.test(e.target.tagName)) return;
  if (e.key === 'Escape') acts['v-close']();
  if (e.key === 'ArrowLeft') stepViewer(-1);
  if (e.key === 'ArrowRight') stepViewer(1);
});
addEventListener('hashchange', () => {
  const [r, id] = route();
  if (r === 'c' && !previousHash.startsWith('#/c/')) carouselOrigins[id] = /^#\/(library|clients)(\/|$)/.test(previousHash) ? previousHash : '#/';
  previousHash = location.hash; viewer = null; editing = ''; menu = ''; mention = null; render(true);
});
addEventListener('resize', recentArrows);
document.body.classList.toggle('folded', !!store.get('folded'));
try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch {}

// Live updates. Skipped under automation so screenshots are not held open by the stream.
if (!navigator.webdriver) {
  let timer;
  new EventSource('/api/events').onmessage = m => {
    const ev = JSON.parse(m.data);
    if (ev.type === 'log') { const pre = $(`[data-log="${ev.job}"]`); if (pre) pre.textContent += '\n' + ev.line; }
    else { clearTimeout(timer); timer = setTimeout(() => refresh().catch(() => {}), 150); }
  };
}
refresh(true).catch(e => { $('#page').innerHTML = `<p class="error">${esc(e.message)}</p>`; });
