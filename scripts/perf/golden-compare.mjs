// Usage: node scripts/perf/golden-compare.mjs <before> <after>   (reads e2e/golive/golden/<label>/*.json)
import { readdirSync, readFileSync, existsSync } from 'node:fs';
const [b, a] = process.argv.slice(2);
if (!b || !a) { console.error('usage: golden-compare.mjs <before> <after>'); process.exit(2); }
const dir = (l) => `e2e/golive/golden/${l}`;
const load = (l, f) => JSON.parse(readFileSync(`${dir(l)}/${f}`, 'utf8'));
const counts = (arr) => arr.reduce((m, x) => (m.set(x, (m.get(x) ?? 0) + 1), m), new Map());
const msdiff = (x, y) => { const cx = counts(x), cy = counts(y), out = []; for (const k of new Set([...cx.keys(), ...cy.keys()])) { const d = (cy.get(k) ?? 0) - (cx.get(k) ?? 0); if (d) out.push(`${d > 0 ? '+' : ''}${d}x ${k}`); } return out; };
let bad = 0, pages = 0;
for (const f of readdirSync(dir(b)).filter((f) => f.endsWith('.json')).sort()) {
  pages++;
  if (!existsSync(`${dir(a)}/${f}`)) { console.log(`${f}: MISSING FILE in ${a}`); bad++; continue; }
  const x = load(b, f), y = load(a, f), L = [];
  if (x.error || y.error) { if (x.error !== y.error) L.push(`error: before=${x.error ?? 'none'} after=${y.error ?? 'none'}`); }
  else {
    if (x.status !== y.status || x.finalPath !== y.finalPath) L.push(`status/path: ${x.status} ${x.finalPath} -> ${y.status} ${y.finalPath}`);
    const n = msdiff(x.numbers, y.numbers); if (n.length) L.push(`NUMBERS differ: ${n.slice(0, 30).join(', ')}`);
    const h = msdiff(x.tableHeaders, y.tableHeaders); if (h.length) L.push(`HEADERS differ: ${h.join(', ')}`);
    if (x.tableRowCount !== y.tableRowCount) L.push(`ROWCOUNT ${x.tableRowCount} -> ${y.tableRowCount}`);
    const hd = msdiff(x.headings, y.headings); if (hd.length) L.push(`(info) headings: ${hd.join(', ')}`);
    const bd = msdiff(x.badgeTexts, y.badgeTexts); if (bd.length) L.push(`(info) badges: ${bd.join(', ')}`);
    const gone = x.buttonAndLinkLabels.filter((l) => !y.buttonAndLinkLabels.includes(l));
    const menuUp = (y.moreActionsCount ?? 0) > (x.moreActionsCount ?? 0);
    if (gone.length) L.push(menuUp ? `(info) labels moved, More actions ${x.moreActionsCount}->${y.moreActionsCount}: ${gone.join(' | ')}` : `MISSING labels: ${gone.join(' | ')}`);
  }
  if (L.length) { console.log(f); L.forEach((l) => console.log('  ' + l)); if (L.some((l) => /^(NUMBERS|HEADERS|ROWCOUNT|MISSING|status|error)/.test(l))) bad++; }
}
console.log(`\n${pages} snapshots compared, ${bad} with blocking differences`);
process.exit(bad ? 1 : 0);
