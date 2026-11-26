/* Final typography pass over the published HTML (last step of build:languages, after every page in
   every language has been generated and translated):
   1. no spaced dashes in copy: " — " / " – " become ", " (or " | " before the PRO-GAMES POLAND name,
      and an unspaced en dash between numbers, e.g. "8 – 12" -> "8–12"). Applied to text, to
      alt / title / aria-label / placeholder / meta content and to JSON-LD strings; never to scripts or
      styles. The brand PRO-GAMES POLAND keeps its hyphen.
   2. PRO-GAMES POLAND never breaks across lines: in visible text it is wrapped in <span class="nw">
      (white-space:nowrap in styles.css).
   Source files keep their wording, so translation dictionaries keep matching; this pass only shapes
   the output. Idempotent. Usage: node build/typography.cjs [--force] */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'creator', 'creator-assets', 'api', 'assets', 'build', 'verification', 'verification-output']);
const SKIP_FILES = new Set(['KONTROLA_WARIANTOW.html']);
const BRAND = 'PRO-GAMES POLAND';
const DASH = /(\S?)(?: |&nbsp;| )[—–](?: |&nbsp;| )(?=(\S?))/g;

function dashes(text) {
  return text.replace(DASH, (all, before, after, offset, whole) => {
    if (/\d/.test(before) && /\d/.test(after)) return before + '–';
    if (whole.startsWith(BRAND, offset + all.length)) return before + ' | ';
    if (/[,:;.!?(]/.test(before)) return before + ' ';
    return before + ', ';
  });
}

const FIT = `<script data-nw-fit>(()=>{const box=e=>{let p=e.parentElement;while(p&&getComputedStyle(p).display==='inline')p=p.parentElement;return p};const f=()=>document.querySelectorAll('.nw').forEach(s=>{s.classList.remove('nw-wrap');const p=box(s);if(p&&s.getBoundingClientRect().right>p.getBoundingClientRect().right+1)s.classList.add('nw-wrap')});addEventListener('load',f);addEventListener('resize',f)})()</script>`;
const ATTRS = /\b(alt|title|aria-label|placeholder|content)=(["'])(.*?)\2/g;
const RAW = new Set(['script', 'style', 'textarea', 'title', 'option', 'svg']);

function processHtml(html) {
  const parts = html.split(/(<[^>]+>)/);
  let raw = null, ld = false, svgDepth = 0, inTitle = false;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p) continue;
    if (p[0] === '<') {
      const m = p.match(/^<\/?\s*([a-zA-Z0-9-]+)/); const tag = m ? m[1].toLowerCase() : '';
      const closing = p[1] === '/';
      if (raw && closing && tag === raw) { raw = null; ld = false; continue; }
      if (raw) continue;
      if (tag === 'svg' && !closing && !p.endsWith('/>')) svgDepth++;
      else if (tag === 'svg' && closing) svgDepth = Math.max(0, svgDepth - 1);
      if (tag === 'title' && !svgDepth) inTitle = !closing;
      parts[i] = p.replace(ATTRS, (a, name, q, val) => `${name}=${q}${dashes(val)}${q}`);
      if (!closing && RAW.has(tag) && tag !== 'svg' && tag !== 'title') {
        raw = tag; ld = tag === 'script' && /application\/ld\+json/i.test(p);
      }
      continue;
    }
    if (raw) { if (ld) parts[i] = dashes(p); continue; }
    let t = dashes(p);
    if (!svgDepth && !inTitle) t = t.split(BRAND).join(`<span class="nw">${BRAND}</span>`);
    parts[i] = t;
  }
  // a previous run's spans are not split again; tiny fallback: if the name is wider than its block
  // (very narrow screens, huge headings), let that one occurrence wrap
  let out = parts.join('');
  if (out.includes('class="nw"') && !out.includes('data-nw-fit')) out = out.replace(/<\/body>/i, FIT + '\n</body>');
  return out.replace(/<span class="nw"><span class="nw">PRO-GAMES POLAND<\/span><\/span>/g, `<span class="nw">${BRAND}</span>`);
}

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) yield* walk(path.join(dir, e.name)); }
    else if (e.name.endsWith('.html') && !SKIP_FILES.has(e.name)) yield path.join(dir, e.name);
  }
}

if (require.main === module) {
  // Shapes the deploy output only (Vercel sets VERCEL=1). Locally the committed pages stay the source
  // the translation step reads, so repeated local builds stay idempotent; use --force to preview.
  if (!process.env.VERCEL && !process.argv.includes('--force')) { console.log('Typography: skipped (not a Vercel build; use --force).'); process.exit(0); }
  let n = 0;
  for (const file of walk(root)) {
    const src = fs.readFileSync(file, 'utf8');
    const out = processHtml(src);
    if (out !== src) { fs.writeFileSync(file, out); n++; }
  }
  console.log(`Typography: ${n} pages (no spaced dashes, ${BRAND} kept on one line).`);
}
module.exports = { processHtml, dashes };
