// Carousels Are Easy, the carousel app. One file, no packages.
// Sends writing jobs to `claude -p` in Writer/ and design jobs to `codex exec` in Designer/.
// The vault files are the truth; Data/index.json only holds status, links and run ids.
const http = require('http'), fs = require('fs'), path = require('path');
const { spawn } = require('child_process');

const APP = __dirname;
const ROOT = process.env.CAROUSEL_ROOT || path.dirname(APP);
const WRITER = path.join(ROOT, 'Writer'), DESIGNER = path.join(ROOT, 'Designer');
const DATA = process.env.CAROUSEL_APP_DATA || path.join(APP, 'Data');
const INDEX = path.join(DATA, 'index.json'), UP = path.join(DATA, 'Uploads');
// The writing skill behind every write job, shipped in Skills/ next to the two vaults.
const SKILLS = path.join(ROOT, 'Skills');
const WIN = process.platform === 'win32';
const PORT = +process.env.PORT || 4330;
// Optional: your own Instagram cookies (Netscape format) make account downloads more reliable.
const IG_COOKIES = path.join(DATA, 'Instagram Cookies.txt');
const ROOTS = { W: WRITER, D: DESIGNER, A: APP, U: UP };

// ---------- small helpers
const exists = p => fs.existsSync(p);
const read = p => fs.readFileSync(p, 'utf8');
const ls = p => (exists(p) ? fs.readdirSync(p) : []);
const isDir = p => exists(p) && fs.statSync(p).isDirectory();
const cleanName = s => String(s || '').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
// Resolve a relative path inside one root; null when it escapes.
function inside(root, rel) {
  const p = path.resolve(root, rel || '');
  return p === root || p.startsWith(root + path.sep) ? p : null;
}

// ---------- copy files: "Slide N" blocks
function parseCopy(text) {
  const parts = String(text).replace(/\r/g, '').split(/^(?:#+\s*|\*\*)?Slide\s+\d+\s*:?(?:\*\*)?\s*$/im);
  const slides = parts.slice(1).map(s => s.trim());
  return slides.length ? slides : [String(text).trim()];
}
const serializeCopy = slides => slides.map((s, i) => `Slide ${i + 1}\n${String(s).trim()}\n`).join('\n');
// The last fenced json block of a run's final message.
function extractReport(text) {
  const m = [...String(text || '').matchAll(/```json\s*([\s\S]*?)```/g)].pop();
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

// ---------- index
let idx = { carousels: [], clients: {}, kits: {}, last: {}, removedCarousels: [] };
function loadIndex() {
  fs.mkdirSync(UP, { recursive: true });
  if (exists(INDEX)) idx = Object.assign(idx, JSON.parse(read(INDEX)));
  // Anything mid-run when the app last closed cannot still be running.
  for (const c of idx.carousels) if (c.status === 'Writing' || c.status === 'Designing') {
    c.error = 'The app was closed in the middle of this run.'; c.status = 'Failed';
  }
  for (const k of Object.values(idx.kits)) if (k.busy) { k.busy = false; k.error = 'The app was closed in the middle of this run. “Try again” picks it up with the same note.'; }
}
function save() {
  fs.writeFileSync(INDEX + '.tmp', JSON.stringify(idx, null, 1));
  fs.renameSync(INDEX + '.tmp', INDEX);
  broadcast({ type: 'state' });
}
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const carousel = id => idx.carousels.find(c => c.id === id);

// ---------- reading the vaults
function clientNames() {
  const dirs = ls(path.join(WRITER, 'Clients')).filter(n => isDir(path.join(WRITER, 'Clients', n)));
  return [...new Set([...dirs, ...Object.keys(idx.clients)])].sort();
}
// Register copy files and finished decks the app has not seen yet, so every carousel has one id.
function syncCarousels() {
  const n = idx.carousels.length;
  idx.carousels = idx.carousels.filter(c => !(c.legacy && c.designDir && !exists(path.join(DESIGNER, c.designDir))));
  let changed = idx.carousels.length !== n;
  for (const client of clientNames()) {
    const dir = path.join(WRITER, 'Clients', client, 'Written Carousels');
    for (const f of ls(dir).filter(f => f.endsWith('.md'))) {
      const rel = `Clients/${client}/Written Carousels/${f}`;
      if (idx.carousels.some(c => c.copyPath === rel) || idx.removedCarousels.includes(`copy:${rel}`)) continue;
      if (jobs.some(j => j.kind === 'write' && j.client === client && j.status === 'running')) continue;
      idx.carousels.push({ id: newId(), client, title: f.slice(0, -3), copyPath: rel, status: 'Copy ready',
        legacy: true, created: fs.statSync(path.join(dir, f)).mtimeMs });
      changed = true;
    }
  }
  for (const d of ls(path.join(DESIGNER, 'Carousels'))) {
    const rel = `Carousels/${d}`;
    if (!exists(path.join(DESIGNER, rel, 'Slide 1.png')) || idx.carousels.some(c => c.designDir === rel) || idx.removedCarousels.includes(`design:${rel}`)) continue;
    idx.carousels.push({ id: newId(), client: '', title: d, designDir: rel, status: 'Slides ready',
      legacy: true, created: fs.statSync(path.join(DESIGNER, rel)).mtimeMs });
    changed = true;
  }
  if (changed) fs.writeFileSync(INDEX, JSON.stringify(idx, null, 1));
}
function slideImages(c) {
  if (!c.designDir) return [];
  const dir = path.join(DESIGNER, c.designDir), drafts = ls(path.join(dir, 'Drafts'));
  const nums = new Set();
  for (const f of ls(dir)) { const m = /^Slide (\d+)\.png$/.exec(f); if (m) nums.add(+m[1]); }
  return [...nums].sort((a, b) => a - b).map(n => {
    const p = path.join(dir, `Slide ${n}.png`);
    return { n, url: `/file/D/${c.designDir}/Slide ${n}.png?t=${Math.round(fs.statSync(p).mtimeMs)}`,
      versions: drafts.filter(f => new RegExp(`^Slide ${n} v\\d+\\.png$`).test(f)).sort()
        .map(f => { const v = path.join(dir, 'Drafts', f); return `/file/D/${c.designDir}/Drafts/${f}?t=${Math.round(fs.statSync(v).mtimeMs)}`; }) };
  });
}
function copyOf(c) {
  if (c.copyPath && exists(path.join(WRITER, c.copyPath))) return read(path.join(WRITER, c.copyPath));
  if (c.designDir && exists(path.join(DESIGNER, c.designDir, 'Copy.md'))) return read(path.join(DESIGNER, c.designDir, 'Copy.md'));
  return '';
}
// Brand kits are the folders registered in idx.kits; a carousel folder with a Branding.md is not a kit by itself.
function brands() {
  const firstLine = (md, re) => (md.split('\n').find(l => re.test(l)) || '').replace(/^#+\s*/, '').trim();
  return Object.entries(idx.kits).map(([id, k]) => {
    const dir = path.join(DESIGNER, id), has = f => exists(path.join(dir, f));
    const url = f => `/file/D/${id}/${f}?t=${Math.round(fs.statSync(path.join(dir, f)).mtimeMs)}`;
    const md = has('Branding.md') ? read(path.join(dir, 'Branding.md')) : '';
    const sample = sampleSlides(id);
    const pics = sample.length ? sample.slice(0, 3).map(s => s.url) : ['Slide 1.png', 'Slide 2.png', 'Slide 3.png'].filter(has).map(url);
    return { id, client: k.client || '', ready: !!md && !k.stage, stage: k.stage || '', error: k.error || '', name: k.name || firstLine(md, /^#\s/) || path.basename(id),
      summary: firstLine(md, /^[^#\s>|-]/).slice(0, 180), colors: [...new Set(md.match(/#[0-9A-Fa-f]{6}\b/g) || [])].slice(0, 6),
      cover: pics[0] || '', pics, sample, total: sampleCopy(id).length,
      refs: ls(path.join(dir, 'References')).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).map(f => url('References/' + f)),
      rules: has('Feedback.md') ? (read(path.join(dir, 'Feedback.md')).match(/^- /gm) || []).length : 0 };
  });
}
// The sample carousel a kit is judged by: Sample cover.png is slide 1, Sample/Slide N.png the rest.
const sampleCopy = id => { const f = path.join(DESIGNER, id, 'Sample', 'Copy.md'); return exists(f) ? parseCopy(read(f)) : []; };
function sampleSlides(id) {
  const dir = path.join(DESIGNER, id), url = f => `/file/D/${id}/${f}?t=${Math.round(fs.statSync(path.join(dir, f)).mtimeMs)}`;
  const out = exists(path.join(dir, 'Sample cover.png')) ? [{ n: 1, url: url('Sample cover.png') }] : [];
  for (const f of ls(path.join(dir, 'Sample'))) { const m = /^Slide (\d+)\.png$/.exec(f); if (m && +m[1] > 1) out.push({ n: +m[1], url: url('Sample/' + f) }); }
  return out.sort((a, b) => a.n - b.n);
}
// One dated rule appended to a feedback file, above its Connected Notes footer when it has one.
function addRule(file, text) {
  const rule = `- ${today()}: ${String(text).replace(/\s+/g, ' ').trim()}\n`, old = exists(file) ? read(file) : '';
  const at = old.search(/\n---\s*\n+## Connected Notes/);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, at < 0 ? old + (old && !old.endsWith('\n') ? '\n' : '') + rule : old.slice(0, at).trimEnd() + '\n' + rule + old.slice(at));
}
function archiveMove(source, relative) {
  if (!exists(source)) return;
  const date = new Date(), day = date.getDate(), suffix = day % 100 >= 11 && day % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] || 'th');
  const spoken = `${day}${suffix} ${date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
  const folder = path.join(ROOT, `Removed on ${spoken}`), base = path.join(folder, relative);
  fs.mkdirSync(path.dirname(base), { recursive: true });
  let target = base, n = 2;
  while (exists(target)) target = `${base.replace(/(\.[^.]+)?$/, '')} (${n++})${path.extname(base)}`;
  fs.renameSync(source, target);
}
function renameReferences(bucket) {
  if (!bucket) return;
  const dir = inside(UP, bucket);
  if (!dir || dir === UP) return;
  for (const f of ls(dir)) {
    const m = /^Ref (\d+)(\.[^.]+)$/i.exec(f), target = m && path.join(dir, `img ${m[1]}${m[2]}`);
    if (target && !exists(target)) fs.renameSync(path.join(dir, f), target);
  }
}
function state() {
  syncCarousels();
  const carousels = idx.carousels.map(c => {
    const text = copyOf(c), slides = text ? parseCopy(text) : [], imgs = slideImages(c);
    return { ...c, headline: (slides[0] || '').replace(/^[#*\s]+/, '').split('\n')[0].replace(/\*+$/, '').slice(0, 140), slideCount: slides.length,
      made: imgs.length, cover: imgs[0] ? imgs[0].url : '', search: (c.title + ' ' + text).toLowerCase() };
  });
  const clients = clientNames().map(name => {
    const m = idx.clients[name] || {}, mine = carousels.filter(c => c.client === name);
    const pic = [name, m.handle].filter(Boolean).flatMap(n => ['jpg', 'jpeg', 'png', 'webp'].map(e => `${n}.${e}`)).find(f => exists(path.join(UP, 'Avatars', f)));
    return { name, ...m, status: m.status || 'ready', image: pic ? `/file/U/Avatars/${pic}?t=${Math.round(fs.statSync(path.join(UP, 'Avatars', pic)).mtimeMs)}` : '', count: mine.length,
      posted: mine.filter(c => c.posted).length, last: Math.max(0, ...mine.map(c => c.created || 0)) };
  });
  return { clients, brands: brands(), carousels, last: idx.last,
    jobs: jobs.map(({ proc, procs, fan, before, prompt, ...j }) => ({ ...j, log: j.log.slice(-200) })) };
}
function clientDocs(name) {
  const base = `Clients/${name}`, doc = rel => (exists(path.join(WRITER, rel)) ? { path: rel, text: read(path.join(WRITER, rel)) } : { path: rel, text: '' });
  return { about: doc(`${base}/About Client.md`), dna: doc(`${base}/Successful Posts/DNA.md`),
    voice: doc(`${base}/Voice DNA.md`), questions: doc(`${base}/Burning Questions.md`),
    summary: { about: doc(`${base}/App Summary/About.md`), howIWrite: doc(`${base}/App Summary/How I Write.md`), burningQuestions: doc(`${base}/App Summary/Burning Questions.md`) },
    feedback: ['Slide 1', 'Writing', 'Strategy'].map(n => ({ name: n, ...doc(`${base}/Feedback/${n}.md`) })) };
}

// ---------- jobs: one Claude run and one Codex run at a time
const jobs = [];
function claudeRun(job, on) {
  const args = ['-p', '--output-format', 'stream-json', '--verbose', '--permission-mode', 'acceptEdits',
    '--allowedTools', '"Read,Write,Edit,Glob,Grep,WebSearch,WebFetch,Bash(python:*),Bash(python3:*)"', '--add-dir', `"${UP}"`, `"${SKILLS}"`];
  if (job.resume) args.push('--resume', job.resume);
  if (job.model) args.push('--model', job.model);
  if (job.effort) args.push('--effort', job.effort);
  return pipeRun('claude', args, job.cwd || WRITER, job.prompt, ev => {
    if (ev.session_id) on.session(ev.session_id);
    if (ev.type === 'assistant') for (const b of ev.message.content || []) {
      if (b.type === 'text' && b.text.trim()) on.line(b.text.trim());
      if (b.type === 'tool_use') on.line(`· ${b.name} ${path.basename(String(b.input.file_path || b.input.pattern || b.input.query || ''))}`);
    }
    if (ev.type === 'result') on.result(ev.result || '', ev.is_error);
  }, on);
}
function codexRun(job, on) {
  const args = ['exec', ...(job.resume ? ['resume', job.resume] : []), '--json', '--skip-git-repo-check',
    '-c', 'sandbox_mode=workspace-write', ...(job.effort ? ['-c', `model_reasoning_effort=${job.effort}`] : []), ...(job.resume ? [] : ['--add-dir', `"${UP}"`]), '-'];
  let last = '';
  return pipeRun('codex', args, DESIGNER, job.prompt, ev => {
    if (ev.thread_id) on.session(ev.thread_id);
    const it = ev.item || {};
    if (ev.type === 'item.completed' && it.type === 'agent_message' && it.text) { last = it.text; on.line(it.text.trim()); }
    if (ev.type === 'item.started' && it.type === 'command_execution') on.line('· ' + String(it.command).slice(0, 120));
    if (ev.type === 'error') on.line('Error: ' + ev.message);
    if (ev.type === 'turn.completed') on.result(last, false);
    if (ev.type === 'turn.failed') on.result((ev.error && ev.error.message) || 'Codex stopped', true);
  }, on);
}
// Spawn a CLI, feed the prompt on stdin, hand each JSON line to onEvent.
// API keys are left out so both CLIs use the signed-in Claude and ChatGPT subscriptions.
const subscriptionEnv = () => { const e = { ...process.env }; delete e.ANTHROPIC_API_KEY; delete e.OPENAI_API_KEY; delete e.CODEX_API_KEY; return e; };
function pipeRun(cmd, args, cwd, prompt, onEvent, on) {
  const proc = spawn(cmd, args, { cwd, shell: true, windowsHide: true, env: subscriptionEnv() });
  let buf = '', err = '';
  proc.stdout.on('data', d => {
    buf += d; const lines = buf.split('\n'); buf = lines.pop();
    for (const l of lines) { if (!l.trim()) continue; try { onEvent(JSON.parse(l)); } catch { /* not a JSON line */ } }
  });
  proc.stderr.on('data', d => { err = (err + d).slice(-2000); });
  proc.on('error', e => on.exit(1, e.message));
  proc.on('close', code => on.exit(code, err.trim()));
  proc.stdin.end(prompt);
  return proc;
}
let runners = { claude: claudeRun, codex: codexRun };

const WSTEPS = ['reading', 'topic', 'headline', 'draft', 'review', 'revise', 'save'];
const STAGES = [[/^· Read Topic Virality Test/, 'topic'], [/^· Read (Headline Brain|Formulas)/, 'headline'], [/^· Read (Carousel Craft|Message Virality Test)/, 'draft']];
function queue(job) {
  Object.assign(job, { id: newId(), status: 'queued', log: [], queued: Date.now() });
  jobs.push(job);
  if (jobs.length > 60) jobs.splice(0, jobs.findIndex(j => j.status === 'queued' || j.status === 'running'));
  pump(job.engine);
  return job;
}
function pump(engine) {
  if (jobs.some(j => j.engine === engine && j.status === 'running')) return;
  const job = jobs.find(j => j.engine === engine && j.status === 'queued');
  if (job) start(job);
}
async function start(job) {
  job.status = 'running'; job.started = Date.now();
  broadcast({ type: 'state' });
  let result = '', failed = false, done = false;
  const line = t => {
    // Explicit progress and early guide reads can move writing forward. Review starts only after a fresh copy file exists.
    const c = job.carouselId && carousel(job.carouselId), said = /^STAGE:\s*([a-z]+)/im.exec(t);
    let step = said ? said[1].toLowerCase() : job.kind !== 'write' ? '' : (STAGES.find(([re]) => re.test(t)) || [])[1];
    if (c && job.kind === 'write') {
      const dir = path.join(WRITER, 'Clients', job.client, 'Written Carousels');
      const hasFreshCopy = ls(dir).some(f => f.endsWith('.md') && fs.statSync(path.join(dir, f)).mtimeMs >= job.started);
      if (!hasFreshCopy && WSTEPS.indexOf(step) >= WSTEPS.indexOf('review')) step = '';
      else if (hasFreshCopy && WSTEPS.indexOf(step) < WSTEPS.indexOf('review')) step = 'review';
    }
    if (c && step && WSTEPS.includes(step) && WSTEPS.indexOf(step) > WSTEPS.indexOf(c.step)) { c.step = step; broadcast({ type: 'state' }); }
    job.log.push(t); if (job.log.length > 400) job.log.shift(); broadcast({ type: 'log', job: job.id, line: t });
  };
  const finish = (ok, error) => {
    if (done) return; done = true;
    job.ended = Date.now(); job.proc = null;
    if (job.status !== 'stopped') { job.status = ok ? 'done' : 'failed'; job.error = ok ? '' : error; }
    try { job.after && job.after(job.status === 'done', result, job.error || 'Stopped'); } catch (e) { line('After-run step failed: ' + e.message); }
    save(); pump(job.engine);
  };
  try { if (job.before) await job.before(line); } catch (e) { return finish(false, e.message); }
  if (job.status === 'stopped') return finish(false, 'Stopped');
  job.proc = (job.fan ? fanRun : runners[job.engine])(job, {
    line, session: id => { job.session = id; job.onSession && job.onSession(id); },
    result: (text, isError) => { result = text; failed = !!isError; },
    exit: (code, err) => finish(code === 0 && !failed, failed ? result.slice(0, 600) : (err || `Exited with code ${code}`).slice(-600)),
  });
}
function stopJob(job) {
  if (job.status === 'queued') { job.status = 'stopped'; job.after && job.after(false, '', 'Stopped'); return save(); }
  if (job.status !== 'running') return;
  job.status = 'stopped';
  // ponytail: on Mac/Linux this stops the CLI the shell started, not grandchildren; use process groups if runs linger.
  for (const p of job.procs || [job.proc]) if (p && p.pid) WIN ? spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], { windowsHide: true }) : p.kill('SIGTERM');
}

// ---------- connect: each viewer signs their own Claude and ChatGPT subscriptions into the two CLIs
const cli = (cmd, args) => new Promise(resolve => {
  let out = '';
  const proc = spawn(cmd, args, { shell: true, windowsHide: true, env: subscriptionEnv() });
  const timer = setTimeout(() => proc.kill(), 20000);
  proc.stdout.on('data', d => { out += d; }); proc.stderr.on('data', d => { out += d; });
  proc.on('error', e => { clearTimeout(timer); resolve({ code: 127, out: e.message }); });
  proc.on('close', code => { clearTimeout(timer); resolve({ code, out: out.trim() }); });
});
const missing = r => r.code === 127 || /not recognized|not found|no such file/i.test(r.out);
async function connections() {
  const [c, x] = await Promise.all([cli('claude', ['auth', 'status', '--json']), cli('codex', ['login', 'status'])]);
  let cs = {}; try { cs = JSON.parse(c.out.slice(c.out.indexOf('{'))); } catch { /* old CLI or not installed */ }
  return {
    claude: { installed: !missing(c), connected: !!cs.loggedIn, how: cs.loggedIn ? `Signed in (${cs.authMethod || 'subscription'})` : '' },
    codex: { installed: !missing(x), connected: x.code === 0 && /logged in/i.test(x.out), how: x.code === 0 ? x.out.split(/\r?\n/)[0] : '' },
  };
}
// Sign-in needs a browser and sometimes a pasted code, so it opens in a real terminal window.
const LOGIN = { claude: 'claude auth login --claudeai', codex: 'codex login' };
function openLogin(tool) {
  const line = LOGIN[tool];
  if (!line) throw new Error('Unknown account.');
  if (WIN) spawn('cmd.exe', ['/c', `start "Sign in" cmd /k ${line}`], { detached: true, windowsVerbatimArguments: true, env: subscriptionEnv() }).unref();
  else if (process.platform === 'darwin') spawn('osascript', ['-e', `tell application "Terminal" to do script "${line}"`, '-e', 'tell application "Terminal" to activate']);
  else spawn('x-terminal-emulator', ['-e', line], { detached: true, env: subscriptionEnv() }).on('error', () => {}).unref();
}

// ---------- Instagram: download an account's recent post images once per handle
const fetched = new Map();
const run = (cmd, args, ms) => new Promise((resolve, reject) => {
  const proc = spawn(cmd, args, { windowsHide: true }); let err = '';
  if (ms) setTimeout(() => proc.kill(), ms).unref();
  proc.stderr.on('data', d => { err = (err + d).slice(-500); });
  proc.on('error', reject); proc.on('close', () => resolve(err));
});
const cleanHandle = h => String(h || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/[/?].*$/, '');
// Resolves to { dir, small }: full-size slides for the designer, 540px copies for the writer (a quarter of the reading cost).
function fetchAccount(handle, line) {
  handle = cleanHandle(handle);
  if (!/^[A-Za-z0-9._]+$/.test(handle)) return Promise.reject(new Error('That does not look like an Instagram handle.'));
  if (fetched.has(handle)) return fetched.get(handle);
  const dir = path.join(UP, 'Accounts', handle), small = path.join(UP, 'Accounts', handle + ' Small'), faces = path.join(UP, 'Avatars');
  const cookies = exists(IG_COOKIES) ? ['--cookies', IG_COOKIES] : [];
  const p = (async () => {
    fs.mkdirSync(small, { recursive: true }); fs.mkdirSync(faces, { recursive: true });
    line(`Downloading recent posts from @${handle}`);
    const err = await run('gallery-dl', [...cookies, '--range', '1-200', '--filter', "extension in ('jpg', 'jpeg', 'png', 'webp')", '-D', dir,
      '-f', '{post_shortcode} {num:>02}.{extension}', `https://www.instagram.com/${handle}/posts/`]).catch(e => { throw new Error('gallery-dl is not installed: ' + e.message); });
    const files = ls(dir);
    if (!files.length) throw new Error(`Instagram gave nothing for @${handle}. Drop screenshots instead. ${err}`);
    await run('gallery-dl', [...cookies, '-D', faces, '-f', `${handle}.{extension}`, `https://www.instagram.com/${handle}/avatar/`], 30000).catch(() => {});
    line(`${files.length} slide images saved`);
    for (const f of files) if (!exists(path.join(small, f))) await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(dir, f), '-vf', 'scale=540:-2', path.join(small, f)]).catch(() => {});
    return { dir, small: ls(small).length ? small : dir };
  })();
  p.catch(() => fetched.delete(handle));
  fetched.set(handle, p);
  return p;
}

// ---------- the work
function queueWrite(c, extra) {
  c.status = 'Writing'; c.stage = 'write'; c.step = 'reading'; c.error = '';
  const refDir = c.bucket ? path.join(UP, c.bucket) : '';
  const refFiles = refDir ? ls(refDir).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })) : [];
  const refs = refFiles.length ? `\nReference images attached by the operator, named img 1 through img ${refFiles.length} in this order: ${refFiles.map((f, i) => `img ${i + 1} = ${path.join(refDir, f)}`).join('; ')}. If the brain dump says @img N, use that exact image as a reference. These images mostly matter to the designer.` : '';
  const prompt = extra || `Carousel app job: write one carousel in one go.
Read CLAUDE.md, then follow System/One Go/Step.md exactly, including its progress lines. The writing itself is done with the viral-carousel-writer skill at ${path.join(SKILLS, 'viral-carousel-writer')}, as that step says. Do not ask anything. Give the finished carousel a real title of 3 to 4 words in the final report, based on the chosen topic.

Client: ${c.client}
Goal or link from the operator: ${c.goal || '(none given)'}
Brain dump:
"""
${c.dump || '(empty: you pick the topic)'}
"""${refs}`;
  const started = Date.now();
  queue({ engine: 'claude', kind: 'write', carouselId: c.id, client: c.client, label: `Writing for ${c.client}`,
    prompt, resume: extra ? c.claudeSession : undefined,
    onSession: id => { c.claudeSession = id; },
    after: (ok, result, error) => {
      const report = extractReport(result);
      if (report) Object.assign(c, { report, title: cleanName(report.title) || cleanName(path.basename(report.file || '', '.md')) || c.title, copyPath: report.file || c.copyPath });
      if (!c.copyPath || !exists(path.join(WRITER, c.copyPath))) {
        // No usable report: take the newest copy file written during this run.
        const dir = path.join(WRITER, 'Clients', c.client, 'Written Carousels');
        const f = ls(dir).map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs })).filter(x => x.t >= started).sort((a, b) => b.t - a.t)[0];
        if (f) { c.copyPath = `Clients/${c.client}/Written Carousels/${f.f}`; c.title = f.f.slice(0, -3); }
      }
      idx.carousels = idx.carousels.filter(o => o === c || o.copyPath !== c.copyPath);
      const good = c.copyPath && exists(path.join(WRITER, c.copyPath));
      c.status = good ? 'Copy ready' : 'Failed';
      if (!good) c.error = ok ? 'Claude finished without saving a carousel file.' : error;
    } });
  save();
}
function nextDesignDir() {
  const nums = ls(path.join(DESIGNER, 'Carousels')).map(d => +(/^Carousel (\d+)$/.exec(d) || [])[1] || 0);
  return `Carousels/Carousel ${Math.max(0, ...nums) + 1}`;
}
// A fan job runs one Codex process per part at the same time, so nine slides take about as long as one.
function fanRun(job, on) {
  let left = job.fan.length, bad = 0;
  job.procs = job.fan.map(part => runners.codex({ prompt: part.prompt, effort: 'low' }, {
    line: t => on.line(`[${part.label}] ${t}`), session: () => {}, result: (t, isError) => { if (isError) bad++; },
    exit: code => { if (code !== 0) bad++; if (--left === 0) { on.result(bad ? `${bad} of ${job.fan.length} runs stopped early.` : 'done', false); on.exit(0, ''); } },
  }));
  return job.procs[0];
}
// Designs the slides that are missing, or the ones named in opts.only, each in its own Codex run.
function queueDesign(c, opts = {}) {
  if (!c.designDir) {
    c.designDir = nextDesignDir();
    fs.mkdirSync(path.join(DESIGNER, c.designDir, 'Drafts'), { recursive: true });
  }
  const dir = path.join(DESIGNER, c.designDir), slides = parseCopy(copyOf(c)), N = slides.length;
  if (!opts.note) fs.writeFileSync(path.join(dir, 'Copy.md'),
    `# ${c.title}\n\nStatus: copy reviewed and approved in the carousel app on ${today()}. Client: ${c.client || 'none'}. Brand kit: ${c.brand}.\n\n${serializeCopy(slides)}`);
  const every = slides.map((_, i) => i + 1), missing = every.filter(n => !exists(path.join(dir, `Slide ${n}.png`)));
  const want = opts.only || (opts.note || !missing.length ? every : missing);
  c.status = 'Designing'; c.stage = 'design'; c.step = 'generate'; c.error = '';
  const kit = c.brand || c.designDir, refDir = c.bucket && ls(path.join(UP, c.bucket)).length ? path.join(UP, c.bucket) : '';
  const refFiles = refDir ? ls(refDir).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })) : [];
  const refs = refFiles.length ? `Reference images from the operator, named img 1 through img ${refFiles.length} in this order: ${refFiles.map((f, i) => `img ${i + 1} = ${path.join(refDir, f)}`).join('; ')}. In the brain dump, @img N means that exact image. What they wrote when attaching them:
"""
${c.dump}
"""
Take from each reference only what they named (typography, image elements, layout and so on). If they ask to update the branding and you are making Slide 1, also add a dated line to "${kit}/Branding.md" saying what changed. Everything they did not mention follows the brand kit.
` : '';
  const part = n => {
    const [role, guide, log] = n === 1 ? ['the cover', 'Cover slide edit instructions guide.md', 'Cover slide feedback log.md']
      : n === N && N > 2 ? ['the closing slide', 'CTA slide instructions guide.md', 'CTA slide feedback log.md'] : ['a body slide', 'Body slides instructions guide.md', 'Body slides feedback log.md'];
    return { label: `Slide ${n}`, prompt: `Carousel app job (app lane): make ONE slide of a carousel. The other slides are being made at the same moment by other runs, so touch nothing except your own slide's files.

Read first, with ONE shell command: AGENTS.md, "System/${guide}", "Memory/${log}", "${c.designDir}/Copy.md", "${kit}/Branding.md" and "${kit}/Feedback.md" if it exists (every line in it is a standing rule from the operator).
You are making Slide ${n} of ${N}, ${role}. Keep every word of that slide's copy exactly as written.
Brand kit: ${kit}. Look at its sample images (its Slide or Sample cover PNGs and its References folder) so your slide matches the rest of the deck: same palette, type roles, margins and illustration style.
${refs}${opts.note ? `The operator looked at the delivered slides and asks for this change${opts.only ? ' to this slide' : ' to the deck'}:
"""
${opts.note}
"""
${opts.only ? '' : 'If this change does not affect your slide, do nothing and end your turn.\n'}Before replacing "${c.designDir}/Slide ${n}.png", copy the current one into Drafts as "Slide ${n} v<next number>.png".
` : ''}Generate the finished slide as one 3:4 image with its typography in it, one attempt, and save it as "${c.designDir}/Slide ${n}.png".
App speed rules: no design critic, no review agent, no self-review, no second attempt, no Design notes, no Design review, no ledgers, no hashes, no ZIP. Do not open the finished image beyond confirming the file exists. Do not ask anything. If the slide cannot be made, write what and why in "${c.designDir}/Drafts/Slide ${n} problem.md".` };
  };
  queue({ engine: 'codex', kind: 'design', carouselId: c.id, client: c.client, label: `Designing ${c.title}`, prompt: '', fan: want.map(part),
    after: (ok, result, error) => {
      const made = slideImages(c).length;
      c.step = '';
      if (made >= N) { c.status = c.posted ? 'Done' : 'Slides ready'; zipDeck(c); }
      else if (ok && !opts.note && !opts.again) return queueDesign(c, { again: true });   // one automatic second go at the slides that did not land
      else { c.status = 'Failed'; c.error = ok ? `${made} of ${N} slides were made. “Try again” makes only the missing ones.` : error; }
    } });
  save();
}
const zipping = new Set();
function zipDeck(c) {
  const dir = path.join(DESIGNER, c.designDir), q = s => `'${s.replace(/'/g, "''")}'`;
  if (zipping.has(c.id)) return;
  zipping.add(c.id);
  const zip = path.join(dir, cleanName(c.title) + '.zip'), slides = ls(dir).filter(f => /^Slide \d+\.png$/.test(f));
  (WIN ? spawn('powershell', ['-NoProfile', '-Command', `Compress-Archive -Force -Path ${q(path.join(dir, 'Slide *.png'))} -DestinationPath ${q(zip)}`], { windowsHide: true })
    : spawn('zip', ['-j', '-q', zip, ...slides.map(f => path.join(dir, f))])).on('close', () => { zipping.delete(c.id); broadcast({ type: 'state' }); });
}
function onboard(b) {
  const name = cleanName(b.name);
  if (!name) throw new Error('The account needs a name.');
  if (clientNames().includes(name)) throw new Error(`There is already an account called ${name}.`);
  const dir = path.join(UP, cleanName(b.bucket) || newId(), 'Writing'), handle = cleanHandle(b.handle);
  if (!handle && !ls(dir).length) throw new Error('Give an Instagram account or drop their carousels, so there is something to learn from.');
  idx.clients[name] = { status: 'onboarding', sells: b.sells || '', helps: b.helps || '', handle };
  let src = dir;
  queue({ engine: 'claude', kind: 'onboard', client: name, label: `Learning how ${name} writes`,
    before: async line => { if (handle) src = (await fetchAccount(handle, line)).small + (ls(dir).length ? ' and ' + dir : ''); },
    get prompt() { return `Carousel app job: onboard a new client.
Read CLAUDE.md, then follow System/Learning the Client/Account Study.md exactly. Do not ask anything.

Client name: ${name}
What they sell: ${b.sells || '(not given, read it from the posts)'}
Who they help: ${b.helps || '(not given, read it from the posts)'}
The account is ${b.competitor ? "a competitor's, not their own" : 'their own'}.
Source material: ${src}
Slide images are named "<post> <slide number>". Any .md file in there is earlier notes about this client: treat what it says as known facts.`; },
    after: (ok, result, error) => {
      const r = extractReport(result) || {};
      Object.assign(idx.clients[name], { blurb: String(r.blurb || '').slice(0, 220), error: ok ? '' : error });
    } });
  if (!b.kit) newKit(name, { handle, dir, sells: b.sells });
  else if (idx.kits[b.kit]) idx.kits[b.kit].client = name;
  save();
  return name;
}
// A brand kit is a folder in Designer/Brands. Claude builds it in parts (System/Brand kit build guide.md) and the operator
// reviews each one: A brief, sample copy and cover; B cover again; C the other slides; D noted slides again. k.stage is
// 'cover' or 'slides' while it is a draft, and gone once approved.
// 'opus' is the newest Opus the installed claude CLI knows. Opus 5.5 by name needs CLI 2.1.280 or newer.
const KIT_MODEL = 'opus';
function newKit(client, o) {
  const base = client || cleanName(o.name) || 'Brand kit';
  let folder = base, n = 2;
  while (exists(path.join(DESIGNER, 'Brands', folder)) || idx.kits[`Brands/${folder}`]) folder = `${base} ${n++}`;
  const id = `Brands/${folder}`;
  idx.kits[id] = { client, name: cleanName(o.name), stage: 'cover', make: { dir: o.dir, handle: o.handle || '', sells: o.sells || '', note: o.note || '' } };
  kitJob(id, 'A');
  return id;
}
function kitJob(id, part, text = '') {
  const k = idx.kits[id], cover = path.join(DESIGNER, id, 'Sample cover.png'), m = k.make || {};
  Object.assign(k, { error: '', part, partText: text, busy: true });
  let src = m.dir;
  const pics = d => ls(d).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const partA = () => {
    const mine = pics(m.dir), acc = idx.clients[k.client] || {};
    return `${k.client ? `Account: ${k.client}${acc.handle ? ` (@${acc.handle})` : ''}${m.sells ? `, who sells: ${m.sells}` : ''}` : 'No account yet.'}
Kit name: ${k.name ? `"${k.name}"` : 'pick ONE plain everyday word that is easy to remember and fits the look, like Doodle or Cobalt'}
${mine.length ? `Reference images from the operator, in this order: ${mine.map((f, i) => `img ${i + 1} = ${path.join(m.dir, f)}`).join('; ')}.` : ''}${m.handle ? `
Slides downloaded from @${m.handle}: ${src}. They are named "<post> <slide number>". Look at no more than 12: covers, two body slides and the closing slide of the most recent carousels, and copy the 6 most useful into References.` : ''}
What the operator said about the references and the kit (@img N means that exact image):
"""
${m.note || '(nothing: read the look from the references)'}
"""`;
  };
  queue({ engine: 'claude', kind: 'brand', client: k.client, kit: id, cwd: DESIGNER, model: KIT_MODEL, effort: 'medium',
    label: { A: 'Writing the brief and making the cover', B: 'Redoing the cover', C: 'Making the rest of the sample slides', D: 'Redoing the slides I noted' }[part],
    resume: part === 'A' ? undefined : k.session, onSession: s => { k.session = s; },
    before: async line => { if (part === 'A' && m.handle) src = (await fetchAccount(m.handle, line)).dir; },
    get prompt() { return `Carousel app job (app lane): brand kit "${id}".
Read AGENTS.md for the folder rules. This is the app lane, so "System/Brand kit build guide.md" replaces the master workflow, the critic and every review round. Follow that guide, Part ${part}. Slide 1 of the sample is "${id}/Sample cover.png". Do not ask anything.

${part === 'A' ? partA() : text}`; },
    after: (ok, r, error) => {
      k.busy = false;
      const made = sampleSlides(id).length, total = sampleCopy(id).length;
      const good = part < 'C' ? exists(cover) : total > 1 && made >= total;
      k.error = good && ok ? '' : ok ? (part < 'C' ? 'Claude finished without making the cover.' : `${made} of ${total} sample slides were made.`) : error;
      if (good && part === 'C') k.stage = 'slides';
      if (part === 'A' && idx.clients[k.client]) idx.clients[k.client].brandError = k.error;
    } });
}

// ---------- http
const sse = new Set();
function broadcast(msg) { const s = `data: ${JSON.stringify(msg)}\n\n`; for (const r of sse) r.write(s); }
setInterval(() => { if (jobs.some(j => j.status === 'running')) broadcast({ type: 'state' }); }, 3000).unref();

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.zip': 'application/zip', '.md': 'text/plain; charset=utf-8' };
const body = req => new Promise((res, rej) => { const ch = []; req.on('data', c => ch.push(c)); req.on('end', () => res(Buffer.concat(ch))); req.on('error', rej); });
const json = (res, data, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
function sendFile(res, file) {
  if (!file || !exists(file) || isDir(file) || !TYPES[path.extname(file).toLowerCase()]) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()], 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://x'), p = decodeURIComponent(url.pathname), q = url.searchParams;
  const seg = p.split('/').filter(Boolean), M = req.method;
  if (M === 'GET' && p === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('retry: 2000\n\n'); sse.add(res); return req.on('close', () => sse.delete(res));
  }
  if (M === 'GET' && seg[0] === 'file') return sendFile(res, ROOTS[seg[1]] && inside(ROOTS[seg[1]], seg.slice(2).join('/')));
  if (M === 'GET' && seg[0] !== 'api') return sendFile(res, inside(APP, p === '/' ? 'index.html' : p.slice(1)));
  if (M !== 'GET' && req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return json(res, { error: 'Wrong origin' }, 403);

  if (M === 'GET' && p === '/api/state') return json(res, state());
  if (M === 'GET' && p === '/api/connect') return json(res, await connections());
  if (M === 'POST' && p.startsWith('/api/connect/')) { openLogin(p.split('/')[3]); return json(res, { ok: true }); }
  if (M === 'POST' && p === '/api/upload') {
    const dir = inside(UP, path.join(cleanName(q.get('bucket')), cleanName(q.get('part') || '')));
    const name = cleanName(q.get('name'));
    if (!dir || dir === UP || !name) return json(res, { error: 'Bad upload' }, 400);
    fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, name), await body(req));
    return json(res, { ok: true });
  }
  const b = M === 'GET' ? {} : JSON.parse((await body(req)).toString() || '{}');

  if (p === '/api/doc') {
    const file = inside(WRITER, b.path || q.get('path')) || null, d = inside(DESIGNER, b.path || q.get('path'));
    const target = (b.root || q.get('root')) === 'D' ? d : file;
    if (!target || !target.endsWith('.md')) return json(res, { error: 'Bad path' }, 400);
    if (M === 'GET') return json(res, { text: exists(target) ? read(target) : '' });
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, b.text); broadcast({ type: 'state' });
    return json(res, { ok: true });
  }
  if (M === 'POST' && p === '/api/clients') return json(res, { name: onboard(b) });
  if (seg[1] === 'clients' && seg[2]) {
    const name = seg[2];
    if (!clientNames().includes(name)) return json(res, { error: 'No such account' }, 404);
    if (M === 'GET') return json(res, clientDocs(name));
    if (seg[3] === 'approve') { idx.clients[name] = { ...(idx.clients[name] || {}), status: 'ready' }; save(); return json(res, { ok: true }); }
    if (seg[3] === 'feedback') {
      if (!String(b.text || '').trim()) return json(res, { error: 'Say what to remember.' }, 400);
      addRule(path.join(WRITER, 'Clients', name, 'Feedback', (['Slide 1', 'Strategy'].includes(b.file) ? b.file : 'Writing') + '.md'), b.text);
      broadcast({ type: 'state' }); return json(res, { ok: true });
    }
  }
  if (M === 'POST' && p === '/api/brands') {
    const dir = path.join(UP, cleanName(b.bucket) || newId(), 'Writing');
    if (!cleanHandle(b.handle) && !ls(dir).length) return json(res, { error: 'Give an account or drop reference slides.' }, 400);
    const id = newKit(clientNames().includes(b.client) ? b.client : '', { name: b.name, handle: cleanHandle(b.handle), dir, note: b.note });
    save(); return json(res, { id });
  }
  if (M === 'POST' && seg[1] === 'brands' && idx.kits[b.id]) {
    const k = idx.kits[b.id];
    if (seg[2] === 'meta') {
      if (b.name !== undefined) k.name = cleanName(b.name);
      if (b.client !== undefined) k.client = clientNames().includes(b.client) ? b.client : '';
      save(); return json(res, { ok: true });
    }
    if (seg[2] === 'feedback') {
      if (!String(b.text || '').trim()) return json(res, { error: 'Say what to remember.' }, 400);
      addRule(path.join(DESIGNER, b.id, 'Feedback.md'), b.text); broadcast({ type: 'state' }); return json(res, { ok: true });
    }
    const say = (label, v) => (String(v || '').trim() ? `${label}:\n"""\n${String(v).trim()}\n"""\n` : '');
    if (['cover-redo', 'cover-ok', 'slides-redo', 'retry', 'approve', 'delete'].includes(seg[2])) {
      if (jobs.some(j => j.kit === b.id && ['queued', 'running'].includes(j.status))) return json(res, { error: 'This kit is being worked on. Wait for it to finish, or stop it first.' }, 409);
      const fb = path.join(DESIGNER, b.id, 'Feedback.md'), note = String(b.note || '').trim();
      if (seg[2] === 'cover-redo') {
        if (note) addRule(fb, `the sample cover: ${note}`);
        kitJob(b.id, 'B', say('The operator looked at the cover and wants this changed', note) || 'The operator did not like the cover and left no note. Rethink it yourself as Part B says.');
      }
      if (seg[2] === 'cover-ok') kitJob(b.id, 'C', 'The operator approved the cover.\n' + say('Their note for the rest of the slides', note));
      if (seg[2] === 'slides-redo') {
        const notes = Object.entries(b.notes || {}).map(([n, v]) => [+n, String(v || '').trim()]).filter(([n, v]) => n && v);
        if (!notes.length && !note) return json(res, { error: 'Write what to change on at least one slide.' }, 400);
        for (const [n, v] of notes) addRule(fb, `slide ${n} of the sample: ${v}`);
        if (note) addRule(fb, `every slide: ${note}`);
        kitJob(b.id, 'D', notes.map(([n, v]) => say(`Slide ${n}`, v)).join('') + say('For every slide', note)
          + (notes.length ? `Remake only ${notes.map(([n]) => 'slide ' + n).join(', ')}${note ? ', plus any other slide the note for every slide applies to' : ''}.` : 'Remake every slide that note applies to.'));
      }
      if (seg[2] === 'retry') kitJob(b.id, k.part || 'A', k.partText || '');
      if (seg[2] === 'approve') { for (const f of ['stage', 'error', 'part', 'partText']) delete k[f]; }
      if (seg[2] === 'delete') {
        if (b.id.startsWith('Brands/')) archiveMove(path.join(DESIGNER, b.id), path.join('Designer Brands', k.name || path.basename(b.id)));
        delete idx.kits[b.id];
        for (const c of idx.carousels) if (c.brand === b.id) c.brand = '';
      }
      save(); return json(res, { ok: true });
    }
    if (seg[2] === 'sample') {
      queue({ engine: 'codex', kind: 'brand', client: k.client, kit: b.id, label: 'Remaking the sample cover',
        prompt: `Carousel app job (app lane). Read AGENTS.md, "${b.id}/Branding.md" and "${b.id}/Feedback.md" if it exists. Generate ONE fresh sample cover in that system${b.note ? `, with this change: ${b.note}` : ''}. Save it as "${b.id}/Sample cover.png", keeping the old one as "Sample cover before.png". No critic, no review round. Do not ask anything.` });
      return json(res, { ok: true });
    }
  }
  if (M === 'POST' && p === '/api/carousels') {
    if (!clientNames().includes(b.client)) return json(res, { error: 'Pick an account.' }, 400);
    renameReferences(cleanName(b.bucket));
    const kits = brands().filter(k => k.ready), mine = kits.filter(k => k.client === b.client);
    const c = { id: newId(), client: b.client, brand: ((mine.length ? mine : kits).find(k => k.id === b.brand) || mine[0] || {}).id || '',
      goal: String(b.goal || '').trim().slice(0, 600), dump: String(b.dump || ''), bucket: cleanName(b.bucket),
      title: 'Picking a topic for you', created: Date.now() };
    idx.carousels.push(c); idx.last = { client: c.client };
    queueWrite(c);
    return json(res, { id: c.id });
  }
  if (seg[1] === 'carousels' && seg[2]) {
    const c = carousel(seg[2]);
    if (!c) return json(res, { error: 'No such carousel' }, 404);
    const act = seg[3];
    if (M === 'DELETE' && !act) {
      if (jobs.some(j => j.carouselId === c.id && ['queued', 'running'].includes(j.status))) return json(res, { error: 'Wait for this carousel job to finish before deleting it.' }, 409);
      const copy = c.copyPath && inside(WRITER, c.copyPath), design = c.designDir && inside(DESIGNER, c.designDir);
      const kitFolder = !!(c.designDir && idx.kits[c.designDir]);
      if (c.copyPath) idx.removedCarousels.push(`copy:${c.copyPath}`);
      if (c.designDir) idx.removedCarousels.push(`design:${c.designDir}`);
      idx.removedCarousels = [...new Set(idx.removedCarousels)];
      if (copy) archiveMove(copy, path.join('Writer Clients', c.client || 'Unassigned', 'Written Carousels', path.basename(copy)));
      if (!kitFolder && design) archiveMove(design, path.join('Designer Carousels', path.basename(design)));
      idx.carousels = idx.carousels.filter(item => item.id !== c.id);
      save(); return json(res, { ok: true });
    }
    if (M === 'GET') {
      const dir = c.designDir && path.join(DESIGNER, c.designDir), zips = dir ? ls(dir).filter(f => f.endsWith('.zip')) : [], zip = zips.find(f => f === cleanName(c.title) + '.zip') || zips[0];
      if (!zip && dir && ['Slides ready', 'Done'].includes(c.status) && slideImages(c).length > 1) zipDeck(c);   // older decks get their ZIP the first time they are opened
      return json(res, { ...c, slides: parseCopy(copyOf(c)), images: slideImages(c), zip: zip ? `/file/D/${c.designDir}/${zip}` : '' });
    }
    if (act === 'copy') {
      if (!c.copyPath) return json(res, { error: 'This deck has no copy file in Writer.' }, 400);
      fs.writeFileSync(path.join(WRITER, c.copyPath), serializeCopy(b.slides)); c.edited = true; save();
      return json(res, { ok: true });
    }
    if (act === 'rewrite') {
      if (!String(b.note || '').trim()) return json(res, { error: 'Say what to change.' }, 400);
      if (b.rating) c.rating = +b.rating;
      addRule(path.join(WRITER, 'Clients', c.client, 'Feedback', 'Writing.md'), `on "${c.title}"${b.rating ? ` (rated ${+b.rating} of 5)` : ''}: ${b.note}`);
      queueWrite(c, `Carousel app job, same carousel: the operator reviewed the copy and asks for a change. Follow "Rewrites and edits" in System/One Go/Step.md, including its progress lines.
Client: ${c.client}
File: ${c.copyPath}
The app has already saved this note in Clients/${c.client}/Feedback/Writing.md. Sort it as hard rule 16 says: move it to the right feedback file, or to Standards if it is universal.
Change wanted:
"""
${b.note}
"""`);
      return json(res, { ok: true });
    }
    if (act === 'design') {
      if (b.brand && idx.kits[b.brand]) c.brand = b.brand;
      if (!c.brand) return json(res, { error: 'This account has no brand kit yet. Make one in Brand kits first.' }, 400);
      if (b.rating) c.rating = +b.rating;
      if (String(b.note || '').trim()) addRule(path.join(WRITER, 'Clients', c.client, 'Feedback', 'Writing.md'), `on "${c.title}", approved${b.rating ? ` and rated ${+b.rating} of 5` : ''}: ${b.note}`);
      if (c.edited && c.claudeSession) queue({ engine: 'claude', kind: 'learn', client: c.client, label: `Learning from your edits`, resume: c.claudeSession,
        prompt: `Carousel app job, same carousel: the operator edited ${c.copyPath} by hand before approving it. Read the file as it is now and follow "Rewrites and edits" in System/One Go/Step.md for edits. Do not change the carousel file.` });
      c.edited = false;
      queueDesign(c);
      return json(res, { ok: true });
    }
    if (act === 'rest') { queueDesign(c); return json(res, { ok: true }); }
    if (act === 'redo') {
      const note = String(b.note || '').trim(), bdir = c.brand || c.designDir;
      if (!note) return json(res, { error: 'Say what to change.' }, 400);
      if (idx.kits[bdir]) addRule(path.join(DESIGNER, bdir, 'Feedback.md'), `${+b.slide ? `slide ${+b.slide} of ` : ''}"${c.title}": ${note}`);
      queueDesign(c, { only: +b.slide ? [+b.slide] : null, note }); return json(res, { ok: true });
    }
    if (act === 'retry') { c.stage === 'design' ? queueDesign(c) : queueWrite(c); return json(res, { ok: true }); }
    if (act === 'posted') { c.posted = !b.undo; if (c.posted && c.status === 'Slides ready') c.status = 'Done'; save(); return json(res, { ok: true }); }
    if (act === 'done') { c.status = b.undo ? 'Slides ready' : 'Done'; save(); return json(res, { ok: true }); }
    if (act === 'client') { c.client = b.client; save(); return json(res, { ok: true }); }
    if (act === 'open') {
      if (!c.designDir && !c.copyPath) return json(res, { error: 'The files are not ready yet.' }, 400);
      const dir = c.designDir ? path.join(DESIGNER, c.designDir) : path.dirname(path.join(WRITER, c.copyPath));
      spawn(WIN ? 'explorer' : process.platform === 'darwin' ? 'open' : 'xdg-open', [dir], { detached: true }); return json(res, { ok: true });
    }
  }
  if (seg[1] === 'jobs' && seg[3] === 'stop') { const j = jobs.find(j => j.id === seg[2]); if (j) stopJob(j); return json(res, { ok: true }); }
  json(res, { error: 'Not found' }, 404);
}

const server = http.createServer((req, res) => handle(req, res).catch(e => json(res, { error: e.message }, 500)));
if (require.main === module) {
  loadIndex();
  server.listen(PORT, '127.0.0.1', () => console.log(`Carousels Are Easy is on http://127.0.0.1:${PORT}`));
}
module.exports = { loadIndex, parseCopy, serializeCopy, extractReport, inside, cleanName, queue, jobs, stopJob, setRunners: r => { runners = r; } };
