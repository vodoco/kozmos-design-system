#!/usr/bin/env node
// The subresource integrity of the Pointr Web SDK's two files on its CDN.
//
//   node scripts/sdk-integrity.mjs 10.14.0   prints the sdk-versions.ts entry for a version
//   node scripts/sdk-integrity.mjs --check   fetches every version sdk-versions.ts lists and
//                                            fails on a hash that no longer matches
//
// The files are fetched as bytes and hashed (sha384, base64), never executed
// or written to disk. It needs the network, so it is no required check: the
// live workflow (phase 4) runs it before an SDK version bump. It reads no key.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const table = path.resolve(here, "../src/sdk-versions.ts");
const source = fs.readFileSync(table, "utf8");
const cdn = source.match(/POINTR_SDK_CDN = "([^"]+)"/)?.[1];
if (!cdn) throw new Error(`No POINTR_SDK_CDN in ${table}`);

/** The table as written: version -> { script, style }. */
function recorded() {
  const versions = {};
  for (const [, version, body] of source.matchAll(
    /"(\d+\.\d+\.\d+)": \{([^}]*)\}/g,
  )) {
    versions[version] = {
      script: body.match(/script:\s*"([^"]+)"/)?.[1],
      style: body.match(/style:\s*"([^"]+)"/)?.[1],
    };
  }
  return versions;
}

async function integrity(url) {
  const response = await fetch(url, { redirect: "error" });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    integrity: `sha384-${crypto.createHash("sha384").update(bytes).digest("base64")}`,
    bytes: bytes.length,
  };
}

async function measure(version) {
  const script = await integrity(`${cdn}/${version}/pointrwebsdk.js`);
  const style = await integrity(`${cdn}/${version}/css/pointr.css`);
  return { script, style };
}

const args = process.argv.slice(2);
if (args.includes("--check")) {
  const versions = recorded();
  const names = Object.keys(versions);
  if (!names.length) throw new Error(`No versions read from ${table}`);
  let failed = 0;
  for (const version of names) {
    const now = await measure(version);
    for (const file of ["script", "style"]) {
      const same = now[file].integrity === versions[version][file];
      if (!same) failed += 1;
      console.log(
        `  ${same ? "ok  " : "FAIL"}  ${version} ${file} (${now[file].bytes} bytes)${same ? "" : `: the CDN serves ${now[file].integrity}, the table says ${versions[version][file]}`}`,
      );
    }
  }
  process.exitCode = failed ? 1 : 0;
} else {
  if (!args.length) {
    console.error("Name a version, as 10.13.0, or pass --check");
    process.exitCode = 2;
  }
  for (const version of args) {
    const now = await measure(version);
    console.log(`  "${version}": {
    script:
      "${now.script.integrity}",
    style:
      "${now.style.integrity}",
  },`);
  }
}
