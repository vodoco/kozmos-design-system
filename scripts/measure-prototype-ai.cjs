#!/usr/bin/env node
// Drives the Pointr prototype's AI companion (the round AI button beside the
// search field, Mobile SDK tab): opens the Assistant, types four requests and
// a follow-up, runs the scripted "Voice input", taps a suggested card, closes
// and reopens the chat, and opens the Filters panel from the normal flow with
// and without the chat over it. After every step it records the prototype's
// React state (mChatOpen, chatMsgs, chatThinking, chatListening, filters …),
// the chat page's geometry and computed styles, the AI ring's animation, the
// sheet's result rows and the map's pins. It also fetches the bundle and the
// stylesheet and writes the response rules and the animation keyframes out.
// Output: <out-dir>/states.jsonl (one line per step), <out-dir>/bundle.json,
// and a PNG of the phone frame per step.
//
//   node scripts/measure-prototype-ai.cjs /tmp/prototype-ai
//
// Same harness as measure-prototype-sheet.cjs: the page is 1280 × 1000 at 2×,
// the phone frame (402 × 874) is found by its "9:41" status text and marked
// [data-kframe]; every rect below is CSS px from the frame's top-left corner.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.PROTOTYPE_URL || 'https://agentic-search-zeta.vercel.app';
const out = process.argv[2];
if (!out) { console.error('usage: measure-prototype-ai.cjs <out-dir>'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });

// A brace-balanced literal starting at src[i] (a "[" or "{"), skipping strings.
const balanced = (src, i) => {
  const open = src[i], close = open === '[' ? ']' : '}';
  let depth = 0, q = null;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (q) { if (c === '\\') j++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  return null;
};
// The bundle's constants are object/array literals of strings with bare keys;
// quote the keys and they are JSON.
const literal = (src, name) => {
  const at = src.indexOf(`"${name}",`); if (at < 0) return null;
  const lit = balanced(src, at + name.length + 3);
  try { return JSON.parse(lit.replace(/([{,])\s*([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')); } catch (e) { return { unparsed: lit.slice(0, 200) }; }
};
const excerpt = (src, needle, before, after) => { const i = src.indexOf(needle); return i < 0 ? null : src.slice(Math.max(0, i - (before || 0)), i + (after || 300)); };
const count = (src, needle) => src.split(needle).length - 1;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  // Every request the page makes, tagged with the step it followed: the proof
  // that sending a message calls nothing.
  let n = 0;
  const net = [];
  p.on('request', r => net.push({ afterStep: n, method: r.method(), type: r.resourceType(), url: r.url().slice(0, 140) }));
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

  // 1. The bundle and the stylesheet: the rules, the tables, the timings.
  const assets = await p.evaluate(() => ({ js: document.querySelector('script[type="module"]').src, css: document.querySelector('link[rel="stylesheet"]').href }));
  const js = await (await p.request.get(assets.js)).text();
  const css = await (await p.request.get(assets.css)).text();
  const intentStart = js.indexOf('chatIntent(n){'), intentEnd = js.indexOf('_ctr(n){', intentStart);
  const chatIntent = js.slice(intentStart, intentEnd);
  const rules = [...chatIntent.matchAll(/if\(\/([^/]+)\/\.test\(d\)\)/g)].map(m => m[1]);
  const texts = [...chatIntent.matchAll(/text:"([^"]+)"/g)].map(m => m[1]);
  const keyframes = name => { const m = css.match(new RegExp('@keyframes ' + name + '\\{.*?\\}\\}')); return m ? m[0] : (js.indexOf('@keyframes ' + name) >= 0 ? 'in the js' : null); };
  const bundle = {
    assets, jsBytes: js.length, cssBytes: css.length,
    chatIntent, rulesInOrder: rules, cannedTexts: texts,
    CHAT_SEED: literal(js, 'CHAT_SEED'), DICTATION: literal(js, 'DICTATION'), TAGS: literal(js, 'TAGS'), FILTERS: literal(js, 'FILTERS'), FILTERSEGS: literal(js, 'FILTERSEGS'), PINPOS: literal(js, 'PINPOS'),
    sendText: excerpt(js, 'sendText(n){', 0, 420), micTap: excerpt(js, 'micTap(){', 0, 470), micStop: excerpt(js, '_micStop(){', 0, 160), openChat: excerpt(js, 'openChat(){', 0, 620), closeChat: excerpt(js, 'closeChat(){', 0, 230), lastSug: excerpt(js, '_lastSug(){', 0, 150),
    ringStyle: excerpt(js, 'aiRingStyle:', 0, 330), coreStyle: excerpt(js, 'aiCoreStyle:', 0, 200), wrapStyle: excerpt(js, 'aiWrapStyle:', 0, 130), wrapSmStyle: excerpt(js, 'aiWrapSmStyle:', 0, 110), coreSmStyle: excerpt(js, 'aiCoreSmStyle:', 0, 200),
    pageStyle: excerpt(js, 'mChatPageStyle:', 0, 560), puckStyle: excerpt(js, 'mChatPuckStyle:', 0, 640), thinkStyle: excerpt(js, 'mThinkStyle:', 0, 230), bubbleStyle: excerpt(js, 'bubbleStyle:{', 0, 330), cardSelect: excerpt(js, 'cards:re.map(', 0, 130),
    inputStyle: excerpt(js, 'mChatInputStyle:', 0, 330), micStyle: excerpt(js, 'mMicStyle:', 0, 420), sendStyle: excerpt(js, 'mSendStyle:', 0, 230), placeholder: excerpt(js, 'mChatPlaceholder:', 0, 60),
    markers: excerpt(js, 'mMarkers:', 0, 330), resultsFilter: excerpt(js, 'b=a.filters||[]', 0, 110), hideSearchTools: excerpt(js, 'mHideSearchTools:', 0, 60), showAi: excerpt(js, 'mShowAiInField:', 0, 50),
    filterPageStyle: excerpt(js, 'mFilterPageStyle:', 0, 260), filterApply: excerpt(js, 'mFilterApplyLabel:', 0, 110), filterIconStyle: excerpt(js, 'filterIconStyle:', 0, 420), filterChipsGate: excerpt(js, 'm.never?', 0, 120),
    stateSeed: excerpt(js, 'mChatOpen:!1,chatMsgs:[]', 30, 120),
    counts: { 'fetch(': count(js, 'fetch('), SpeechRecognition: count(js, 'SpeechRecognition'), getUserMedia: count(js, 'getUserMedia'), XMLHttpRequest: count(js, 'XMLHttpRequest'), WebSocket: count(js, 'WebSocket'), EventSource: count(js, 'EventSource'), aiRipple: count(js, 'aiRipple'), aiPulse: count(js, 'aiPulse'), aiWave: count(js, 'aiWave'), mSheetUp: count(js, 'mSheetUp'), 'state.filters writes': count(js, 'filters:[]') },
    fetches: [...js.matchAll(/fetch\(/g)].map(m => js.slice(m.index - 60, m.index + 40)),
    keyframes: { aiSpin: keyframes('aiSpin'), aiPulse: keyframes('aiPulse'), aiWave: keyframes('aiWave'), aiRipple: keyframes('aiRipple'), mSheetUp: keyframes('mSheetUp') },
  };
  fs.writeFileSync(path.join(out, 'bundle.json'), JSON.stringify(bundle, null, 2));

  // 2. The measurement taken after every step.
  const measure = async (name, opts = {}) => {
    await p.waitForTimeout(opts.wait == null ? 500 : opts.wait);
    const st = await p.evaluate(() => {
      const frameEl = document.querySelector('[data-kframe]');
      const fr = frameEl.getBoundingClientRect();
      const key = Object.keys(frameEl).find(k => k.startsWith('__reactFiber'));
      let fb = frameEl[key]; while (fb && !(fb.stateNode && fb.stateNode.state && 'mChatOpen' in fb.stateNode.state)) fb = fb.return;
      const inst = fb.stateNode; const s = inst.state;
      const r1 = v => +(+v).toFixed(1);
      const rel = e => { const r = e.getBoundingClientRect(); return [r1(r.left - fr.left), r1(r.top - fr.top), r1(r.width), r1(r.height)]; };
      const hex = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return c; const v = m[1].split(',').map(x => x.trim()); const h = v.slice(0, 3).map(x => (+x).toString(16).padStart(2, '0')).join(''); return '#' + h.toUpperCase() + (v[3] != null && +v[3] !== 1 ? ' @' + Math.round(+v[3] * 100) + '%' : ''); };
      const cs = e => getComputedStyle(e);
      const font = e => { const c = cs(e); return `${c.fontFamily.split(',')[0].replace(/"/g, '')} ${parseFloat(c.fontSize)}/${c.lineHeight === 'normal' ? 'normal' : parseFloat(c.lineHeight)} ${c.fontWeight} ${hex(c.color)}`; };
      const box = e => { const c = cs(e); return { rect: rel(e), bg: hex(c.backgroundColor), border: c.borderTopWidth !== '0px' ? `${c.borderTopWidth} ${c.borderTopStyle} ${hex(c.borderTopColor)}` : 'none', radius: c.borderRadius, padding: c.padding, shadow: c.boxShadow === 'none' ? 'none' : c.boxShadow.slice(0, 60) }; };
      const anim = e => { const c = cs(e); return { name: c.animationName, duration: c.animationDuration, timing: c.animationTimingFunction, iteration: c.animationIterationCount }; };
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > fr.top && r.top < fr.bottom; };
      const q = (sel, root) => (root || frameEl).querySelector(sel);
      const all = [...frameEl.querySelectorAll('*')];
      const state = {};
      for (const k of ['mDetent', 'mSearchDetent', 'searchFocus', 'mSearchView', 'mCat', 'q', 'mPoi', 'mNav', 'mFilterOpen', 'mChatOpen', 'chatReveal', 'chatPuck', 'chatOrigin', 'chatPuckTo', 'chatThinking', 'chatListening', 'chatDraft', 'chatMsgs', 'filters', 'favFilter', 'bookFilter', 'mFloorOpen']) state[k] = s[k];
      const results = inst.results().map(r => r.slug);
      const titles = {}; const data = inst.data(); for (const k of Object.keys(data)) titles[k] = data[k].properties.title;
      const sheet = q('[data-msheet]');
      // The sheet's result rows: the 370-wide radius-16 pointer cards (resultCardStyle), named by their first span.
      const sheetRows = sheet ? all.filter(e => sheet.contains(e) && Math.abs(e.getBoundingClientRect().width - 370) < 1 && cs(e).cursor === 'pointer' && cs(e).borderRadius === '16px' && e.querySelector('span')).map(e => e.querySelector('span').textContent.trim().slice(0, 30)) : [];
      // The list the vm draws: results() narrowed by state.filters through TAGS (the bundle's j).
      const filteredResults = results.filter(slug => (s.filters || []).every(f => (inst.TAGS[slug] || []).indexOf(f) > -1));
      const pins = all.filter(e => e.getAttribute('role') === 'button' && e.firstElementChild && e.firstElementChild.tagName === 'svg' && e.firstElementChild.getAttribute('viewBox') === '0 0 24 32').map(e => ({ label: e.getAttribute('aria-label'), rect: rel(e), opacity: cs(e).opacity, fill: hex(cs(e.querySelector('path')).fill) }));
      const buttons = all.filter(e => (e.tagName === 'BUTTON' || e.getAttribute('role') === 'button') && vis(e)).map(e => (e.getAttribute('aria-label') || e.textContent.trim()).slice(0, 26));
      // The AI button in the search row.
      const aiWrap = q('[aria-label="AI search"]');
      const ai = aiWrap ? { wrap: rel(aiWrap), ring: { rect: rel(aiWrap.children[0]), gradient: cs(aiWrap.children[0]).backgroundImage.slice(0, 110), anim: anim(aiWrap.children[0]) }, core: { rect: rel(aiWrap.children[1]), bg: hex(cs(aiWrap.children[1]).backgroundColor), color: hex(cs(aiWrap.children[1]).color) }, icon: aiWrap.querySelector('svg') ? rel(aiWrap.querySelector('svg')) : null, coveredBy: (() => { const r = aiWrap.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return t === aiWrap || aiWrap.contains(t) ? 'itself' : (t && (t.getAttribute('aria-label') || t.getAttribute('data-chatscroll') != null && 'chat scroller' || t.tagName.toLowerCase() + (t.textContent.trim().slice(0, 20) ? ':' + t.textContent.trim().slice(0, 20) : ''))); })() } : null;
      // The Filters button in the search row.
      const fBtn = q('[aria-label="Filters"]');
      const chatPage = q('[data-chathead]') ? q('[data-chathead]').parentElement.parentElement : null;
      const filtersButton = fBtn ? { ...box(fBtn), color: hex(cs(fBtn).color), badge: fBtn.lastElementChild && cs(fBtn.lastElementChild).display !== 'none' ? { text: fBtn.lastElementChild.textContent, rect: rel(fBtn.lastElementChild), bg: hex(cs(fBtn.lastElementChild).backgroundColor), border: cs(fBtn.lastElementChild).border } : null, coveredBy: (() => { const r = fBtn.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return t === fBtn || fBtn.contains(t) ? 'itself' : (chatPage && chatPage.contains(t) ? 'chat page (' + (t.textContent.trim().slice(0, 12) || t.tagName.toLowerCase()) + ')' : (t && (t.getAttribute('aria-label') || t.tagName.toLowerCase()))); })() } : null;
      // The chat page.
      const head = q('[data-chathead]');
      let chat = null;
      if (head) {
        const header = head.parentElement, page = header.parentElement, scroller = q('[data-chatscroll]'), ta = q('[aria-label="Message"]'), mic = q('[aria-label="Voice input"]'), send = q('[aria-label="Send"]'), close = q('[aria-label="Close assistant"]');
        const title = header.children[1];
        const pc = cs(page);
        const msgs = [...scroller.children].map(row => {
          if (row.tagName === 'SPAN') return { thinking: true, text: row.textContent, ...box(row), font: font(row), anim: anim(row) };
          const bubble = row.children[0];
          if (!bubble) return null;
          const cards = row.children[1] ? [...row.children[1].children].map(wrap => { const card = wrap.firstElementChild; const spans = [...card.querySelectorAll('span')]; const logo = card.querySelector('.logo-slot, img'); return { name: spans[0].textContent, nameFont: font(spans[0]), ...box(card), logo: logo ? rel(logo) : null, floor: (spans.find(x => x.textContent && x !== spans[0] && cs(x).fontSize === '14px' && x.querySelector('span')) || spans[spans.length - 2] || {}).textContent, floorFont: spans[spans.length - 2] ? font(spans[spans.length - 2]) : null, time: spans[spans.length - 1].textContent, timeFont: font(spans[spans.length - 1]), dot: card.querySelector('span > span[style*="border-radius: 50%"]') ? rel(card.querySelector('span > span[style*="border-radius: 50%"]')) : null }; }) : [];
          return { align: cs(row).alignItems, text: bubble.textContent, bubble: { ...box(bubble), font: font(bubble), maxWidth: cs(bubble).maxWidth }, cards: cards.length ? { count: cards.length, container: { rect: rel(row.children[1]), gap: cs(row.children[1]).gap, paddingTop: cs(row.children[1]).paddingTop }, first: cards[0], last: cards[cards.length - 1], names: cards.map(c => c.name) } : null };
        }).filter(Boolean);
        const puck = all.find(e => cs(e).zIndex === '47');
        chat = {
          page: { ...box(page), zIndex: pc.zIndex, clipPath: pc.clipPath, opacity: pc.opacity, transition: pc.transition.slice(0, 120), paddingTop: pc.paddingTop, paddingBottom: pc.paddingBottom },
          header: { rect: rel(header), padding: cs(header).padding, borderBottom: `${cs(header).borderBottomWidth} ${hex(cs(header).borderBottomColor)}`, gap: cs(header).gap },
          smallRing: { wrap: rel(head), ring: { rect: rel(head.children[0]), anim: anim(head.children[0]) }, core: rel(head.children[1]), icon: head.querySelector('svg') ? rel(head.querySelector('svg')) : null },
          title: { text: title.textContent, font: font(title), rect: rel(title) },
          close: { ...box(close), color: hex(cs(close).color), icon: close.querySelector('svg') ? rel(close.querySelector('svg')) : null },
          scroller: { rect: rel(scroller), padding: cs(scroller).padding, gap: cs(scroller).gap, scrollTop: scroller.scrollTop, scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight },
          messages: msgs,
          inputRow: { rect: rel(ta.parentElement), padding: cs(ta.parentElement).padding, borderTop: `${cs(ta.parentElement).borderTopWidth} ${hex(cs(ta.parentElement).borderTopColor)}`, gap: cs(ta.parentElement).gap },
          textarea: { ...box(ta), font: font(ta), placeholder: ta.placeholder, value: ta.value, minHeight: cs(ta).minHeight, maxHeight: cs(ta).maxHeight, overflowY: cs(ta).overflowY, focused: document.activeElement === ta },
          mic: { ...box(mic), color: hex(cs(mic).color), icon: mic.querySelector('svg') ? rel(mic.querySelector('svg')) : null },
          send: { ...box(send), color: hex(cs(send).color), icon: send.querySelector('svg') ? rel(send.querySelector('svg')) : null },
          puck: puck ? { rect: rel(puck), opacity: cs(puck).opacity, transform: cs(puck).transform, anim: anim(puck), transition: cs(puck).transition.slice(0, 80) } : null,
          filtersInside: !!page.querySelector('[aria-label="Filters"], [aria-label="Apply filters"]'),
        };
      }
      // The Filters page.
      const fClose = q('[aria-label="Close filters"]');
      let filtersPage = null;
      if (fClose) {
        const header = fClose.parentElement, page = header.parentElement, scroller = page.children[1], apply = q('[aria-label="Apply filters"]'), reset = q('[aria-label="Reset filters"]');
        const segs = [...scroller.children].map(seg => { const chips = [...seg.children[1].children]; const on = chips.filter(c => cs(c).fontWeight === '600'); return { name: seg.children[0].textContent, nameFont: font(seg.children[0]), letterSpacing: cs(seg.children[0]).letterSpacing, transform: cs(seg.children[0]).textTransform, count: chips.length, labels: chips.map(c => c.textContent), selected: on.map(c => c.textContent), firstChip: { ...box(chips[0]), font: font(chips[0]) }, selectedChip: on[0] ? { ...box(on[0]), font: font(on[0]) } : null, rect: rel(seg) }; });
        filtersPage = { page: { ...box(page), zIndex: cs(page).zIndex, anim: anim(page), running: page.getAnimations().map(a => a.animationName), paddingTop: cs(page).paddingTop, paddingBottom: cs(page).paddingBottom }, header: { rect: rel(header), padding: cs(header).padding }, title: { text: header.children[0].textContent, font: font(header.children[0]) }, reset: { text: reset.textContent, font: font(reset), rect: rel(reset) }, close: { ...box(fClose), color: hex(cs(fClose).color) }, scroller: { rect: rel(scroller), padding: cs(scroller).padding, scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight }, segments: segs, apply: { text: apply.textContent, ...box(apply), font: font(apply), row: { rect: rel(apply.parentElement), padding: cs(apply.parentElement).padding } } };
      }
      const ae = document.activeElement;
      // Which @keyframes rules the document really has (a declared animation name proves nothing), and what runs on the ring.
      const keyframeRules = []; for (const ss of document.styleSheets) { try { for (const r of ss.cssRules) if (r.type === CSSRule.KEYFRAMES_RULE) keyframeRules.push(r.name); } catch (e) { keyframeRules.push('(unreadable sheet)'); } }
      const ringRunning = aiWrap ? aiWrap.children[0].getAnimations().map(a => a.animationName) : null;
      return { state, results, filteredResults, resultTitles: results.map(k => titles[k]), keyframeRules: keyframeRules.filter(k => /^ai|^mSheet/.test(k)), ringRunning, sheet: sheet ? { top: r1(sheet.getBoundingClientRect().top - fr.top), height: r1(sheet.getBoundingClientRect().height) } : null, sheetRows, pins, buttons: buttons.slice(0, 16), active: ae ? ae.tagName + (ae.getAttribute('aria-label') ? ':' + ae.getAttribute('aria-label') : '') : null, ai, filtersButton, chat, filtersPage };
    });
    n += 1;
    await p.screenshot({ path: path.join(out, `${String(n).padStart(2, '0')}-${name}.png`), clip: frame });
    const line = { step: n, name, ...(opts.extra || {}), ...st };
    console.log(JSON.stringify({ step: n, name, state: { mDetent: st.state.mDetent, mChatOpen: st.state.mChatOpen, chatThinking: st.state.chatThinking, chatListening: st.state.chatListening, msgs: (st.state.chatMsgs || []).length, filters: st.state.filters, mPoi: st.state.mPoi, mFilterOpen: st.state.mFilterOpen }, results: st.results.length, pins: st.pins.map(x => x.label), ring: st.ai && st.ai.ring.anim.name + ' ' + st.ai.ring.anim.duration, lastMsg: st.chat && st.chat.messages.length ? st.chat.messages[st.chat.messages.length - 1].text : null }));
    fs.appendFileSync(path.join(out, 'states.jsonl'), JSON.stringify(line) + '\n');
    return st;
  };
  // A control by its aria-label, or a button by its exact text (the tiles carry no label).
  const tap = async (label) => {
    let l = p.locator(`[data-kframe] [aria-label="${label}"]`).first();
    if (!(await l.count())) l = p.locator('[data-kframe] button').filter({ hasText: new RegExp('^' + label.replace(/[&]/g, '\\$&') + '$') }).first();
    if (!(await l.count())) { console.log('no control labelled', label); return false; }
    await l.click({ force: true }); return true;
  };
  const say = async (text, name) => {
    await p.locator('[data-kframe] [aria-label="Message"]').click();
    await p.keyboard.type(text);
    await measure(name + '-typed', { extra: { request: text } });
    await p.keyboard.press('Enter');
    await measure(name + '-thinking-0ms', { wait: 0, extra: { request: text } });
    await measure(name + '-answered', { wait: 900, extra: { request: text } });
  };
  fs.writeFileSync(path.join(out, 'states.jsonl'), '');

  // A. Open the Assistant, the four requests and a follow-up, a card, close, reopen.
  await measure('A-initial', { extra: { frame } });
  await tap('AI search');
  await measure('A-ai-tapped-0ms', { wait: 0 });
  await measure('A-ai-tapped-120ms', { wait: 120 });
  await measure('A-chat-open', { wait: 700 });
  await tap('Send'); await measure('A0-send-empty', { wait: 300 });
  await say('vegan restaurants', 'A1-vegan');
  await say('coffee near gate B', 'A2-coffee');
  await say('wheelchair accessible toilets', 'A3-toilets');
  await say('where can I buy a charger', 'A4-charger');
  await say('vegan', 'A5-vegan-followup');
  await say('how long to gate B4', 'A6-gate');
  // The Starbucks card the coffee answer suggested, scrolled back into view and tapped.
  const tapped = await p.evaluate(() => { const sc = document.querySelector('[data-chatscroll]'); const card = [...sc.querySelectorAll('div[style*="cursor: pointer"]')].find(e => /^Starbucks/.test(e.textContent.trim())); if (!card) return false; card.scrollIntoView({ block: 'center' }); return true; });
  if (tapped) { await p.waitForTimeout(300); await measure('A7-starbucks-card-in-view'); await p.locator('[data-chatscroll] div[style*="cursor: pointer"]').filter({ hasText: /^Starbucks/ }).first().click({ force: true }); }
  await measure('A7-card-tapped-0ms', { wait: 0 });
  await measure('A7-card-tapped-poi', { wait: 600 });
  await tap('Close'); await measure('A8-poi-closed');
  await tap('AI search'); await measure('A9-chat-reopened', { wait: 700 });
  await tap('Close assistant'); await measure('A10-close-tapped-0ms', { wait: 0 });
  await measure('A10-chat-closed', { wait: 500 });

  // B. The scripted Voice input.
  await fresh();
  await tap('AI search'); await measure('B-chat-open', { wait: 700 });
  await tap('Voice input'); await measure('B1-mic-tapped-0ms', { wait: 0 });
  await measure('B1-mic-400ms', { wait: 400 });
  await measure('B1-dictated', { wait: 2800 });
  await tap('Send'); await measure('B2-sent-thinking-0ms', { wait: 0 });
  await measure('B2-answered', { wait: 900 });
  await tap('Voice input'); await measure('B3-mic-again-500ms', { wait: 500 });
  await tap('Voice input'); await measure('B3-mic-stopped', { wait: 100 });
  await tap('Close assistant'); await measure('B4-chat-closed', { wait: 500 });

  // C. The Filters button in the normal flow, then the chat over it.
  await fresh();
  await p.locator('[data-msheet] input').first().click(); await p.keyboard.type('sta'); await measure('C-typed-sta');
  await tap('Filters'); await measure('C1-filters-open', { wait: 450 });
  await tap('Vegan'); await measure('C2-vegan-toggled');
  await tap('Wheelchair Friendly'); await measure('C3-wheelchair-toggled');
  await tap('Reset filters'); await measure('C4-reset');
  await tap('Vegan'); await tap('Apply filters'); await measure('C5-applied-vegan', { wait: 450 });
  await tap('AI search'); await measure('C6-chat-over-query', { wait: 700 });
  await say('coffee', 'C7-coffee-with-filter');
  await tap('Close assistant'); await measure('C8-chat-closed', { wait: 500 });
  await tap('Filters'); await tap('Reset filters'); await tap('Apply filters'); await measure('C9-filters-reset-applied', { wait: 450 });

  // D. The AI button and Filters in the category form.
  await fresh();
  await tap('Gates'); await measure('D-category-gates');
  await tap('AI search'); await measure('D1-chat-over-category', { wait: 700 });
  // Does Shift+Enter add a line or send? (onChatKey tests only w.key === "Enter".)
  await p.locator('[data-kframe] [aria-label="Message"]').click(); await p.keyboard.type('two lines'); await p.keyboard.press('Shift+Enter');
  await measure('D1b-shift-enter', { wait: 900 });
  await tap('Close assistant'); await measure('D2-chat-closed', { wait: 500 });
  // The requests the page made after the load, by origin, and the ones that were not assets or images.
  const byOrigin = {}; for (const r of net) { const o = r.url.split('/').slice(0, 3).join('/'); byOrigin[o] = (byOrigin[o] || 0) + 1; }
  const suspicious = net.filter(r => !['document', 'script', 'stylesheet', 'font', 'image', 'media'].includes(r.type));
  fs.writeFileSync(path.join(out, 'network.json'), JSON.stringify({ total: net.length, byOrigin, notAssetOrImage: suspicious, all: net }, null, 1));
  console.log(JSON.stringify({ network: { total: net.length, byOrigin, notAssetOrImage: suspicious.length } }));
  await browser.close();
})().catch(e => { console.error('ERR', e.stack.split('\n').slice(0, 6).join(' | ')); process.exit(1); });
