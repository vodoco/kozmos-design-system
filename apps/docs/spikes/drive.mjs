// Drives a spike page in a real browser and writes what happened, with the
// identifiers redacted, under <worktree>/test-results/pointr-spike/<name>/.
//   POINTR_KEYS_FROM=<qa page> node apps/docs/spikes/drive.mjs <url> <name> [ui=on|off] [engine]
// The page gets the identifiers through an init script, so they appear in no
// URL, no Referer header and no file.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "playwright";
import { loadPointrKeys } from "./spike-keys.mjs";

const [url, name, ui = "on", engine = "chromium", probe] =
  process.argv.slice(2);
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "../../../test-results/pointr-spike", name);
fs.mkdirSync(out, { recursive: true });
const keys = await loadPointrKeys();
const { redact } = keys;
const log = [];
const note = (line) => log.push(redact(line));

// Headless Chromium has no WebGL unless told which GL to use: by default it
// refuses its SwiftShader fallback ("Could not create a WebGL context").
// SPIKE_GL=metal uses this Mac's GPU; swiftshader (default) works anywhere.
const gl = process.env.SPIKE_GL ?? "swiftshader";
const args =
  engine === "chromium"
    ? gl === "metal"
      ? ["--use-angle=metal", "--ignore-gpu-blocklist"]
      : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
    : [];
const browser = await { chromium, firefox, webkit }[engine].launch({ args });
const [vw, vh] = (process.env.SPIKE_VIEWPORT ?? "1280x800")
  .split("x")
  .map(Number);
const context = await browser.newContext({
  viewport: { width: vw, height: vh },
});
await context.addInitScript(
  (value) => {
    window.__POINTR_SPIKE__ = value;
  },
  {
    baseUrl: keys.baseUrl,
    clientIdentifier: keys.clientIdentifier,
    licenseKey: keys.licenseKey,
    ui,
    welcome: process.env.SPIKE_WELCOME ?? "on",
    siteInternalIdentifier: process.env.SPIKE_SITE,
    buildingInternalIdentifier: process.env.SPIKE_BUILDING,
  },
);
const page = await context.newPage();
page.on("console", (msg) => note(`console.${msg.type()}: ${msg.text()}`));
page.on("pageerror", (err) => note(`pageerror: ${err.message}`));
page.on("requestfailed", (req) =>
  note(
    `requestfailed: ${req.method()} ${req.url()} ${req.failure()?.errorText}`,
  ),
);
const requests = [];
page.on("response", async (res) => {
  const req = res.request();
  const host = new URL(res.url()).host;
  const headers = res.headers();
  requests.push({
    method: req.method(),
    status: res.status(),
    host,
    path: new URL(res.url()).pathname,
    type: req.resourceType(),
    acao: headers["access-control-allow-origin"] ?? null,
    csp: headers["content-security-policy"] ?? null,
  });
});

const started = Date.now();
await page.goto(url);
// Ready when MapLibre says its style is loaded and the SDK has emitted
// map-ready (isMapReadyEmitted), or after 60 s.
const ready = await page
  .waitForFunction(
    () => {
      const view = window.PointrWebSDK?.MapWidget.getInstance()
        ?.getUiController()
        ?.getMapViewController()
        ?.getView();
      return Boolean(view?.map?.isStyleLoaded?.() && view.isMapReadyEmitted);
    },
    null,
    { timeout: 60000, polling: 500 },
  )
  .then(() => true)
  .catch(() => false);
note(`ready=${ready} after ${Date.now() - started} ms`);
await page.waitForTimeout(4000);
await page.screenshot({ path: path.join(out, "page.png") });

const summary = await page.evaluate(() => {
  const view = window.PointrWebSDK?.MapWidget.getInstance()
    ?.getUiController()
    ?.getMapViewController()
    ?.getView();
  const map = view?.map;
  const visible = [...document.querySelectorAll("#pointr-map *")]
    .filter(
      (el) =>
        el.id &&
        el.getClientRects().length &&
        getComputedStyle(el).visibility !== "hidden",
    )
    .map((el) => {
      const r = el.getBoundingClientRect();
      return `${el.tagName.toLowerCase()}#${el.id} ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`;
    });
  return {
    origin: location.origin,
    hasMap: Boolean(map),
    center: map?.getCenter?.(),
    zoom: map?.getZoom?.(),
    canvas: map ? [map.getCanvas().width, map.getCanvas().height] : null,
    visibleIdentifiedElements: visible,
  };
});
note(`summary: ${JSON.stringify(summary, null, 1)}`);

// A probe is a module whose default export (page, note, out) runs after the
// map is ready: the questions that need input or a second look.
if (probe) {
  const run = (await import(path.resolve(probe))).default;
  await run(page, note, out).catch((error) =>
    note(`probe failed: ${error.stack}`),
  );
}

const byHost = {};
for (const r of requests) {
  const key = `${r.host} ${r.status} acao=${r.acao}`;
  byHost[key] = (byHost[key] ?? 0) + 1;
}
note(`responses by host/status/ACAO: ${JSON.stringify(byHost, null, 1)}`);
const failures = requests.filter((r) => r.status >= 400);
note(`responses >= 400: ${JSON.stringify(failures, null, 1)}`);
fs.writeFileSync(path.join(out, "log.txt"), log.join("\n") + "\n");
fs.writeFileSync(
  path.join(out, "requests.json"),
  redact(JSON.stringify(requests, null, 1)),
);
console.log(
  redact(
    `wrote ${out}: ready=${ready}, ${requests.length} responses, ${failures.length} >= 400`,
  ),
);
await browser.close();
