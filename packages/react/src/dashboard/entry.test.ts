import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as main from "../index";
import * as dashboard from "./index";

// Decision 183 (owner, 13 Nov 2026): the Dashboard modules ship from
// @kozmos-ds/react/dashboard, and an SDK or Core product never pays for them.
// So nothing the main entry reaches may import from src/dashboard, and the
// main entry exports none of them. scripts/performance/bundle-analyzer.ts
// holds the built files to the same, and vite.dashboard.config.mts holds the
// other direction: a module takes Core parts through the public API only.
const SRC = path.resolve(__dirname, "..");
const DASHBOARD = path.resolve(__dirname);
const FIXTURE = /\.(?:test|spec|stories|figma)\.[jt]sx?$|\.mdx$/;
const IMPORT = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;

function sources(dir: string, files: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        full !== DASHBOARD &&
        entry.name !== "__tests__" &&
        entry.name !== "test"
      )
        sources(full, files);
    } else if (/\.[jt]sx?$/.test(entry.name) && !FIXTURE.test(entry.name))
      files.push(full);
  }
  return files;
}

describe("the ./dashboard entry", () => {
  it("is imported by nothing outside src/dashboard", () => {
    const offenders = sources(SRC).filter((file) =>
      [...fs.readFileSync(file, "utf8").matchAll(IMPORT)].some(
        ([, specifier]) =>
          specifier.startsWith(".") &&
          (path.resolve(path.dirname(file), specifier) + path.sep).startsWith(
            DASHBOARD + path.sep,
          ),
      ),
    );
    expect(offenders.map((file) => path.relative(SRC, file))).toEqual([]);
  });

  it("exports its modules, and the main entry none of them", () => {
    const modules = Object.keys(dashboard);
    expect(modules).toContain("BrandLoader");
    for (const name of modules) expect(main).not.toHaveProperty(name);
  });
});
