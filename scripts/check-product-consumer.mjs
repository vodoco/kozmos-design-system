/** Build the existing product from installed tarballs, never workspace aliases.
 * This is deliberately not a claim of authenticated SDK/routing acceptance.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
assert(
  process.argv.slice(2).every((arg) => arg === "--browser"),
  "Only --browser is supported",
);
const product = "apps/mapscale-review";
const source = path.join(root, product);
const work = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-product-consumer-")),
);
const app = path.join(work, "app");
const tarballs = path.join(work, "tarballs");
fs.mkdirSync(app);
fs.mkdirSync(tarballs);
const log = path.join(work, "verification.log");
function run(command, args, cwd = app, extraEnv = {}) {
  try {
    const output = execFileSync(command, args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      env: { ...process.env, ...extraEnv, npm_config_update_notifier: "false" },
    });
    fs.appendFileSync(log, `$ ${command} ${args.join(" ")}\n${output}\n`);
    return output;
  } catch (error) {
    fs.appendFileSync(log, `${error.stdout ?? ""}\n${error.stderr ?? ""}`);
    throw error;
  }
}

try {
  // Copy only versioned inputs, not .env files, credentials, node_modules or dist.
  // Scratch is included by the product's own tsconfig and must not be omitted.
  const files = execFileSync("git", ["ls-files", "-z", "--", product], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);
  for (const file of files) {
    const relative = path.relative(product, file);
    if (
      !/^(src\/|public\/|scratch\/|index\.html$|tsconfig(?:\.[\w-]+)?\.json$|vite\.config\.ts$)/.test(
        relative,
      )
    )
      continue;
    assert(
      !relative.split(path.sep).some((part) => part.startsWith(".")),
      `Hidden input must not be copied: ${relative}`,
    );
    const destination = path.join(app, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(root, file), destination);
  }

  const localPackages = {};
  for (const entry of fs.readdirSync(path.join(root, "packages"))) {
    const dir = path.join(root, "packages", entry);
    const manifestPath = path.join(dir, "package.json");
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (manifest.private || !manifest.name) continue;
    assert(
      fs.existsSync(path.join(dir, "dist")),
      `Build ${manifest.name} first`,
    );
    const before = new Set(fs.readdirSync(tarballs));
    run("pnpm", ["pack", "--pack-destination", tarballs], dir);
    const created = fs
      .readdirSync(tarballs)
      .filter((file) => !before.has(file));
    assert.equal(created.length, 1);
    localPackages[manifest.name] = `file:${path.join(tarballs, created[0])}`;
  }

  const manifest = JSON.parse(
    fs.readFileSync(path.join(source, "package.json"), "utf8"),
  );
  for (const group of ["dependencies", "devDependencies"]) {
    for (const [name, range] of Object.entries(manifest[group] ?? {})) {
      if (localPackages[name]) manifest[group][name] = localPackages[name];
      else {
        assert(
          !range.startsWith("workspace:"),
          `Unpacked workspace dependency: ${name}`,
        );
        // Pin direct tool/product dependencies to the currently installed frozen
        // workspace versions, instead of quietly upgrading them during the pilot.
        const installed = JSON.parse(
          fs.readFileSync(
            path.join(source, "node_modules", name, "package.json"),
            "utf8",
          ),
        );
        assert.equal(installed.name, name);
        manifest[group][name] = installed.version;
      }
    }
  }
  // Override transitive Kozmos dependencies too, without falsely making them
  // direct dependencies of the product. npm receives packed files, not links.
  manifest.overrides = { ...manifest.overrides, ...localPackages };
  fs.writeFileSync(
    path.join(app, "package.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(`Product consumer: ${product}\nIsolated install: ${work}`);
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"]);
  // Every public package is packed and offered as an override, but a product
  // installs only those it depends on: a React product never installs
  // @kozmos-ds/vue. What it names directly must be installed; whatever is
  // installed, directly or not, must be the packed distribution.
  const direct = new Set(
    ["dependencies", "devDependencies"].flatMap((group) =>
      Object.keys(manifest[group] ?? {}).filter((name) => localPackages[name]),
    ),
  );
  const installed = Object.keys(localPackages).filter((name) =>
    fs.existsSync(path.join(app, "node_modules", name)),
  );
  for (const name of direct)
    assert(
      installed.includes(name),
      `${name} is a direct dependency of ${product} but was not installed`,
    );
  assert(installed.length > 0, `${product} installed no Kozmos package`);
  for (const name of installed) {
    const resolved = fs.realpathSync(path.join(app, "node_modules", name));
    assert(
      resolved.startsWith(`${app}${path.sep}`),
      `${name} escaped the isolated consumer`,
    );
    assert(
      !fs.existsSync(path.join(resolved, "src")),
      `${name} is not a distribution-only install`,
    );
  }
  run("npm", ["run", "build"]);
  console.log(
    "PASS: original product typecheck + production build, including scratch benches.",
  );
  run(path.join(app, "node_modules/.bin/tsc"), [
    "-p",
    "tsconfig.app.json",
    "--skipLibCheck",
    "false",
  ]);
  console.log(
    "PASS: product application typecheck with library checking enabled.",
  );
  run("node", ["scratch/geometry.test.mjs"]);
  console.log("PASS: existing product geometry tests.");
  fs.writeFileSync(
    path.join(work, "result.json"),
    JSON.stringify(
      {
        product,
        app,
        log,
        status: "build-verified",
        authenticatedIntegration: "not-tested",
        routingAcceptance: "not-tested",
        packages: installed,
      },
      null,
      2,
    ),
  );
  console.log(
    `Retained build, lockfile and logs: ${work}\nNo authentication, live API requests or publication performed.`,
  );
  if (process.argv.includes("--browser")) {
    for (const engine of ["chromium", "firefox", "webkit"]) {
      run(
        process.execPath,
        [path.join(root, "scripts/check-product-consumer-browser.mjs"), work],
        root,
        { ADAPTIVE_BROWSER: engine },
      );
      console.log(
        `PASS: ${engine} offline product shell, responsive geometry, typography, keyboard and axe.`,
      );
    }
  }
} catch (error) {
  console.error(
    `Product consumer failed. Inspect ${log}\n${String(error.stdout || error.stderr || error).slice(-6000)}`,
  );
  process.exitCode = 1;
}
