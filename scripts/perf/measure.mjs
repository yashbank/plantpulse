// Read-only perf baseline. Usage: BASE_URL=https://x OUT=out.json node scripts/perf/measure.mjs
import { chromium, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { writeFileSync } from 'node:fs';

dotenv.config({ path: '.env.e2e' });
const BASE = (process.env.BASE_URL || '').replace(/\/$/, '');
const OUT = process.env.OUT || 'perf-out.json';
const RUNS = Number(process.env.RUNS || 3);
if (!BASE) throw new Error('BASE_URL required');
const PAGES = ['/mis/dashboard', '/mis/orders', '/mis/store/dashboard', '/mis/store/stock', '/mis/production', '/mis/qc', '/mis/attendance', '/mis/employees', '/mis/po'];
const median = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };

const browser = await chromium.launch();

async function login() {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login`);
  await p.locator('#email').fill(process.env.E2E_OWNER_EMAIL);
  await p.locator('#password').fill(process.env.E2E_PASSWORD);
  await p.getByRole('button', { name: /sign in/i }).click();
  await p.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 });
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}
const state = await login();

async function once(path, mode) {
  const opts = mode === 'phone' ? { ...devices['Pixel 7'], storageState: state } : { viewport: { width: 1440, height: 900 }, storageState: state };
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (mode === 'phone') {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (9e6 / 8), uploadThroughput: (9e6 / 8) * 0.5 });
  }
  let reqs = 0, bytes = 0, js = 0;
  const types = new Map();
  await cdp.send('Network.enable');
  cdp.on('Network.responseReceived', (e) => types.set(e.requestId, e.type));
  cdp.on('Network.requestWillBeSent', () => { reqs++; });
  cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; if (types.get(e.requestId) === 'Script') js += e.encodedDataLength; });
  await page.addInitScript(() => {
    window.__m = { lcp: 0, cls: 0, fcp: null };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const final = page.url();
  const m = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    const f = performance.getEntriesByName('first-contentful-paint')[0];
    return { ttfb: n.responseStart, fcp: f ? f.startTime : null, lcp: window.__m.lcp || null, cls: window.__m.cls, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd };
  });
  await ctx.close();
  return { ...m, bytes, jsBytes: js, requests: reqs, redirectedToLogin: final.includes('/login') };
}

const result = { base: BASE, date: new Date().toISOString(), pages: {} };
for (const path of PAGES) {
  result.pages[path] = {};
  for (const mode of ['phone', 'desktop']) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      try { runs.push(await once(path, mode)); } catch (e) { runs.push({ error: String(e).slice(0, 200) }); }
    }
    const ok = runs.filter((r) => !r.error);
    const med = {};
    for (const k of ['ttfb', 'fcp', 'lcp', 'cls', 'dcl', 'load', 'bytes', 'jsBytes', 'requests']) med[k] = median(ok.map((r) => r[k]));
    med.redirectedToLogin = ok.some((r) => r.redirectedToLogin);
    result.pages[path][mode] = { median: med, runs };
    console.log(path, mode, JSON.stringify(med));
  }
}
writeFileSync(OUT, JSON.stringify(result, null, 2));
await browser.close();
