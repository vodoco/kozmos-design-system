#!/usr/bin/env node
// Serves this checkout's static Storybook for the visual review, and nothing
// else: the suite must measure this build, never whatever another worktree
// has listening on 6006. Node only, so it runs the same in the Playwright
// image as on a Mac.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";

const root = resolve("apps/docs/storybook-static");
const port = Number(process.argv[2] ?? 6199);

const types = {
  ".css": "text/css",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".map": "application/json",
  ".mjs": "text/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

createServer(async (request, response) => {
  const path = decodeURIComponent(
    new URL(request.url ?? "/", "http://localhost").pathname,
  );
  let file = resolve(join(root, path));
  // Nothing outside the build, however the path is spelt.
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    const body = await readFile(file);
    response
      .writeHead(200, {
        "content-type": types[extname(file)] ?? "application/octet-stream",
      })
      .end(body);
  } catch {
    response.writeHead(404).end();
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root} on http://127.0.0.1:${port}`);
});
