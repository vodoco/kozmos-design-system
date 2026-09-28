#!/usr/bin/env node
// Drives the Pointr prototype's initial bottom sheet (Mobile SDK tab) through
// its gestures and taps, and after every step records the sheet's box, its
// scroller, its visible buttons and rows, and the prototype's own React state.
// Output: <out-dir>/states.jsonl (one line per step) and a PNG of the phone
// frame per step. Its run of 2026-09-20 gave Kozmos's map shells their detents
// (a fifth of the frame, 54 % and 94 %) and their drag rule.
//
//   node scripts/measure-prototype-sheet.cjs /tmp/prototype-sheet
//
// The drag starts with two small moves so the sheet takes pointer capture
// before the pointer leaves it: the prototype captures only once a move of
// 6px has reached the sheet itself, as a finger's first move does.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.PROTOTYPE_URL || 'https://agentic-search-zeta.vercel.app';
const out = process.argv[2];
if (!out) { console.error('usage: measure-prototype-sheet.cjs <out-dir>'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const markFrame = () => p.evaluate(() => {
    const find = t => [...document.querySelectorAll('body *')].find(e => e.children.length === 0 && e.textContent.trim() === t);
    let f = find('9:41');
    while (f && !(f.getBoundingClientRect().width > 250 && f.getBoundingClientRect().height > 500)) f = f.parentElement;
    f.setAttribute('data-kframe', '');
    const r = f.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height };
  });
  const fresh = async () => {
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2500);
    const mobile = p.getByRole('tab', { name: 'Mobile SDK' });
    if (await mobile.count()) { await mobile.click(); await p.waitForTimeout(1200); }
    return markFrame();
  };
  const frame = await fresh();
  let n = 0;
  const measure = async (name, extra) => {
    await p.waitForTimeout(500);
    const st = await p.evaluate(() => {
      const fr = document.querySelector('[data-kframe]').getBoundingClientRect();
      const sheet = document.querySelector('[data-msheet]');
      if (!sheet) return { noSheet: true };
      const key = Object.keys(sheet).find(k => k.startsWith('__reactFiber'));
      let fb = sheet[key]; while (fb && !(fb.stateNode && fb.stateNode.state && 'mDetent' in fb.stateNode.state)) fb = fb.return;
      const inst = fb.stateNode; const s = inst.state;
      const sr = sheet.getBoundingClientRect();
      const rel = e => { const r = e.getBoundingClientRect(); return [+(r.left - fr.left).toFixed(1), +(r.top - sr.top).toFixed(1), +r.width.toFixed(1), +r.height.toFixed(1)]; };
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > sr.top && r.top < fr.bottom; };
      const all = [...sheet.querySelectorAll('*')];
      const input = sheet.querySelector('input');
      const scrollers = all.filter(e => ['auto', 'scroll'].includes(getComputedStyle(e).overflowY)).map(e => ({ rect: rel(e), top: e.scrollTop, sh: e.scrollHeight, ch: e.clientHeight, attrs: [...e.attributes].map(a => a.name).filter(a => a.startsWith('data-')) }));
      const buttons = all.filter(e => (e.tagName === 'BUTTON' || e.getAttribute('role') === 'button') && vis(e)).map(e => ({ l: (e.getAttribute('aria-label') || e.textContent.trim()).slice(0, 26), r: rel(e) }));
      const rows = all.filter(e => { const r = e.getBoundingClientRect(); return Math.abs(r.width - 370) < 1 && r.height >= 76 && r.height <= 112 && vis(e) && !(e.parentElement && Math.abs(e.parentElement.getBoundingClientRect().width - 370) < 1); }).map(e => ({ t: e.textContent.trim().slice(0, 34), r: rel(e) }));
      const texts = all.filter(e => e.children.length === 0 && e.textContent.trim() && vis(e) && e.tagName !== 'BUTTON').map(e => e.textContent.trim().slice(0, 22)).filter((t, i, a) => a.indexOf(t) === i).slice(0, 12);
      const ae = document.activeElement;
      const go = document.querySelector('[data-goanchor]');
      const overlay = document.querySelector('[data-overlaymount]');
      return { state: { mDetent: s.mDetent, mSearchDetent: s.mSearchDetent, searchFocus: s.searchFocus, mSearchView: s.mSearchView, mCat: s.mCat, q: s.q, mPoi: s.mPoi, mNav: s.mNav, mFilterOpen: s.mFilterOpen, mChatOpen: s.mChatOpen }, detents: inst.detents(), sheetTop: +(sr.top - fr.top).toFixed(1), sheetH: +sr.height.toFixed(1), transition: getComputedStyle(sheet).transition, input: input ? rel(input) : null, active: ae ? (ae.tagName + (ae.placeholder ? ':' + ae.placeholder : '')) : null, scrollers, buttons: buttons.slice(0, 10), rows: rows.slice(0, 4), texts, go: go ? rel(go) : null, overlay: overlay && overlay.textContent.trim() ? overlay.textContent.trim().slice(0, 60) : null };
    });
    n += 1;
    await p.screenshot({ path: path.join(out, `${String(n).padStart(2, '0')}-${name}.png`), clip: frame });
    const line = { step: n, name, ...(extra || {}), ...st };
    console.log(JSON.stringify(line));
    fs.appendFileSync(path.join(out, 'states.jsonl'), JSON.stringify(line) + '\n');
    return st;
  };
  const gx = frame.x + 201;
  const sheetTopAbs = async () => frame.y + (await p.evaluate(() => { const f = document.querySelector('[data-kframe]').getBoundingClientRect(); return document.querySelector('[data-msheet]').getBoundingClientRect().top - f.top; }));
  const drag = async (dy, opts = {}) => {
    const y0 = opts.fromY != null ? frame.y + opts.fromY : (await sheetTopAbs()) + 16;
    const x0 = opts.x != null ? frame.x + opts.x : gx;
    await p.mouse.move(x0, y0); await p.mouse.down();
    const sgn = Math.sign(dy);
    await p.mouse.move(x0, y0 + sgn * 3); await p.waitForTimeout(16);
    await p.mouse.move(x0, y0 + sgn * 8); await p.waitForTimeout(16);
    for (let i = 1; i <= 10; i++) { await p.mouse.move(x0, y0 + sgn * 8 + (dy - sgn * 8) * i / 10); await p.waitForTimeout(16); }
    let mid = null;
    if (opts.holdMeasure) mid = await p.evaluate(() => { const s = document.querySelector('[data-msheet]'); return { h: s.getBoundingClientRect().height, transition: getComputedStyle(s).transition }; });
    await p.mouse.up();
    return mid;
  };
  const clickAt = async (x, y) => p.mouse.click(frame.x + x, frame.y + y);
  const clickLabel = async (label) => {
    let l = p.locator(`[data-msheet] [aria-label="${label}"]`).first();
    if (!(await l.count())) l = p.locator('[data-msheet] button').filter({ hasText: new RegExp('^' + label.replace(/[&]/g, '\\$&') + '$') }).first();
    if (await l.count()) { await l.click({ force: true }); return true; }
    console.log('no control labelled', label); return false;
  };
  fs.writeFileSync(path.join(out, 'states.jsonl'), '');

  // The drag ladder: nearest-detent snapping, thresholds, the rubber band.
  await measure('initial', { frame });
  await clickAt(201, (await sheetTopAbs()) - frame.y + 8); await measure('grabber-tap');
  await drag(-100); await measure('dragUp100-from-min');
  await drag(-160); await measure('dragUp160-from-min');
  await drag(-160); await measure('dragUp160-from-half');
  await drag(-200); await measure('dragUp200-from-half');
  await drag(100); await measure('dragDown100-from-full');
  await drag(250); await measure('dragDown250-from-full');
  await drag(300); await measure('dragDown300-from-half');
  let mid = await drag(100, { holdMeasure: true }); await measure('dragDown100-held-at-min', { midDrag: mid });
  await drag(-500); await measure('dragUp500-from-min');
  mid = await drag(-100, { holdMeasure: true }); await measure('dragUp100-held-at-full', { midDrag: mid });
  await drag(250, { fromY: 500 }); await measure('dragDown250-over-content-at-top');

  // A. a tile at min, the results at each detent, the chip's ×.
  await fresh();
  await measure('A-initial');
  await clickLabel('Gates'); await measure('A-tile-gates-at-min');
  await drag(-160); await measure('A-results-half');
  await drag(-300); await measure('A-results-full');
  await clickLabel('Clear category'); await measure('A-clear-category-tapped');

  // B. the field: focus, typing, Clear, Cancel, a map tap while focused.
  await fresh();
  const input = () => p.locator('[data-msheet] input').first();
  await input().click(); await measure('B-input-tap-from-min');
  await p.keyboard.type('sta'); await measure('B-typed-sta');
  await clickLabel('Clear'); await measure('B-clear-tapped');
  await input().click(); await measure('B-input-tap-again');
  await clickLabel('Cancel search'); await measure('B-cancel-tapped');
  await input().click(); await p.waitForTimeout(300); await clickAt(201, 300); await measure('B-map-tapped-while-focused');

  // C. a result row to the POI card, its detents, and back.
  await fresh();
  await input().click(); await p.keyboard.type('sta'); await measure('C-typed-sta');
  const row = await p.evaluate(() => { const s = document.querySelector('[data-msheet]'); const fr = document.querySelector('[data-kframe]').getBoundingClientRect(); const e = [...s.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return Math.abs(r.width - 370) < 1 && r.height >= 78 && r.height <= 106 && /Starbucks/.test(e.textContent); }).pop(); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2 - fr.left, y: r.top + r.height / 2 - fr.top }; });
  if (row) { await clickAt(row.x, row.y); await measure('C-row-tapped-poi'); }
  await drag(500); await measure('C-poi-dragDown500');
  await drag(-100); await measure('C-poi-dragUp100');
  await drag(-500); await measure('C-poi-dragUp500-full');
  await clickLabel('Close'); await measure('C-poi-closed');

  // D. the AI search button; E. Filters.
  await fresh();
  await clickLabel('AI search'); await measure('D-ai-tapped');
  await fresh();
  await input().click(); await p.keyboard.type('sta'); await clickLabel('Filters'); await measure('E-filters-tapped');
  await browser.close();
})().catch(e => { console.error('ERR', e.stack.split('\n').slice(0, 4).join(' | ')); process.exit(1); });
