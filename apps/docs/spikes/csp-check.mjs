// Question 7: serves pointr-map-snippet.html, with the identifiers put in
// memory only, from a stand-in sandbox origin under several
// Content-Security-Policy headers, and reads the snippet's own check panel.
//   POINTR_KEYS_FROM=<qa page> node apps/docs/spikes/csp-check.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { loadPointrKeys } from "./spike-keys.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "../../../test-results/pointr-spike/q7-csp");
fs.mkdirSync(out, { recursive: true });
const keys = await loadPointrKeys();
const snippet = fs
  .readFileSync(path.join(here, "pointr-map-snippet.html"), "utf8")
  .replace("__POINTR_BASE_URL__", keys.baseUrl)
  .replace("__POINTR_CLIENT_IDENTIFIER__", keys.clientIdentifier)
  .replace("__POINTR_LICENSE_KEY__", keys.licenseKey);

// What the SDK reached in the spike's runs (requests.json), as one policy.
// connect-src needs data: (the SDK fetches data: URIs) and worker-src blob:
// (MapLibre's workers): without the second the map never appears.
const minimal = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://pointr-websdk.azureedge.net",
  "style-src 'self' 'unsafe-inline' https://pointr-websdk.azureedge.net",
  "font-src data:",
  "img-src 'self' data: blob: https://pointr-websdk.azureedge.net https://*.blob.core.windows.net",
  "connect-src 'self' data: https://*.pointr.cloud https://*.blob.core.windows.net https://pointr-websdk.azureedge.net https://mapscdn.pointr.tech https://api.maptiler.com",
  "worker-src blob:",
  "child-src blob:",
].join("; ");
const policies = {
  none: null,
  "self-only": "default-src 'self' 'unsafe-inline' data: blob:",
  minimal,
  "minimal-without-blob-workers": minimal
    .replace("; worker-src blob:", "")
    .replace("; child-src blob:", ""),
};

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const results = {};
for (const [name, csp] of Object.entries(policies)) {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 700 },
  });
  const page = await context.newPage();
  await page.route("https://sandbox.example/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      headers: csp ? { "content-security-policy": csp } : {},
      body: snippet,
    }),
  );
  await page.goto("https://sandbox.example/prototype.html");
  await page
    .waitForFunction(
      () =>
        /map: (ready|failed|error)|script: (failed|not started)/.test(
          document.getElementById("check")?.innerText ?? "",
        ),
      null,
      { timeout: 70000, polling: 500 },
    )
    .catch(() => {});
  await page.waitForTimeout(2500);
  const text = await page.locator("#check").innerText();
  const violations = await page.evaluate(() => [
    ...new Set(window.__pointrCheck.violations),
  ]);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  results[name] = {
    csp,
    panel: keys.redact(text),
    violations: violations.map(keys.redact),
  };
  await context.close();
}
// A sandboxed iframe, as an artifact or prototype host might draw one:
// scripts only (an opaque origin, no storage), and scripts with its origin.
const escapeAttr = (html) =>
  html.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
for (const sandbox of ["allow-scripts", "allow-scripts allow-same-origin"]) {
  const name = `iframe sandbox="${sandbox}"`;
  const context = await browser.newContext({
    viewport: { width: 1024, height: 700 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on(
    "console",
    (m) =>
      m.type() === "error" && errors.push(keys.redact(m.text()).slice(0, 200)),
  );
  await page.route("https://sandbox.example/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><html><body style="margin:0"><iframe sandbox="${sandbox}" style="border:0;width:100vw;height:100vh" srcdoc="${escapeAttr(snippet)}"></iframe></body></html>`,
    }),
  );
  await page.goto("https://sandbox.example/host.html");
  const frame = page.frameLocator("iframe");
  await page.waitForTimeout(1000);
  let text = "";
  for (let i = 0; i < 140; i++) {
    text = await frame
      .locator("#check")
      .innerText()
      .catch(() => "");
    if (/map: (ready|failed|error)|script: failed/.test(text)) break;
    await page.waitForTimeout(500);
  }
  await page.screenshot({
    path: path.join(out, `iframe-${sandbox.replace(/ /g, "+")}.png`),
  });
  results[name] = {
    panel: keys.redact(text),
    consoleErrors: [...new Set(errors)].slice(0, 8),
  };
  await context.close();
}
await browser.close();
fs.writeFileSync(path.join(out, "csp.json"), JSON.stringify(results, null, 1));
for (const [name, r] of Object.entries(results))
  console.log(
    `== ${name}\n${r.panel}\n${(r.violations ?? r.consoleErrors).slice(0, 6).join("\n")}`,
  );
