// DIAGNOSTIC, not for merging: helpers for the zz-diagnostic specs.
import { test, type Page } from "@playwright/test";

export async function settle(page: Page) {
  await page.waitForFunction(() =>
    Boolean(document.documentElement.dataset.theme),
  );
  await page.waitForTimeout(1500);
}

/** Main-thread share left to a task chain, and frames drawn without asking. */
async function share(page: Page, ms = 2500) {
  return page.evaluate(async (ms) => {
    const channel = new MessageChannel();
    let busy = 0;
    let longest = 0;
    let last = performance.now();
    const start = last;
    await new Promise<void>((resolve) => {
      channel.port1.onmessage = () => {
        const t0 = performance.now();
        longest = Math.max(longest, t0 - last);
        while (performance.now() - t0 < 1) {
          /* someone else's work */
        }
        busy += performance.now() - t0;
        last = performance.now();
        if (last - start < ms) channel.port2.postMessage(0);
        else resolve();
      };
      channel.port2.postMessage(0);
    });
    return {
      share: Math.round((busy / (performance.now() - start)) * 100),
      longestGap: Math.round(longest),
    };
  }, ms);
}

/** Frames when asked for every one: what a frame costs. */
async function frames(page: Page, ms = 2000) {
  return page.evaluate(async (ms) => {
    const times: number[] = [];
    await new Promise<void>((resolve) => {
      const start = performance.now();
      const tick = (t: number) => {
        times.push(t);
        if (t - start < ms) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    const gaps = times
      .slice(1)
      .map((t, i) => t - times[i]!)
      .sort((a, b) => a - b);
    return {
      fps: Math.round((times.length / ms) * 1000),
      median: Math.round(gaps[Math.floor(gaps.length / 2)] ?? 0),
      worst: Math.round(gaps[gaps.length - 1] ?? 0),
    };
  }, ms);
}

export async function measure(page: Page, label: string, css = "") {
  if (css) await page.addStyleTag({ content: css });
  await page.waitForTimeout(800);
  const a = await share(page);
  const f = await frames(page);
  console.log(
    `DIAG ${test.info().project.name} ${label}: share ${a.share}% longest gap ${a.longestGap}ms | rAF ${f.fps}/s median ${f.median}ms worst ${f.worst}ms`,
  );
}

export const cases: [string, string, string][] = [
  ["/get-started", "get-started as is", ""],
  ["/", "home as is", ""],
  [
    "/",
    "home, cover loops paused",
    ".site-cosmos * { animation-play-state: paused !important; }",
  ],
  [
    "/",
    "home, every loop paused",
    "* { animation-play-state: paused !important; }",
  ],
  ["/", "home, no cover", ".site-cosmos { display: none !important; }"],
  [
    "/",
    "home, cover only",
    "main > :not(.site-cosmos), footer { display: none !important; }",
  ],
  [
    "/",
    "home, cover without blur or backdrop",
    ".site-cosmos * { filter: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }",
  ],
  [
    "/",
    "home, cover without masks",
    ".site-cosmos * { mask: none !important; -webkit-mask: none !important; }",
  ],
];
