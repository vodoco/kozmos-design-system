// A static server for the Pointr maps spike pages. It serves this folder
// only, on the host and port given (defaults 127.0.0.1:6140). It never binds
// 6006, which belongs to another session's Storybook.
//   node apps/docs/spikes/serve.mjs [host] [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const host = process.argv[2] ?? "127.0.0.1";
const port = Number(process.argv[3] ?? 6140);
if (port === 6006) throw new Error("6006 is another session's Storybook");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
};

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const file = path.normalize(
      path.join(root, decodeURIComponent(url.pathname)),
    );
    if (
      !file.startsWith(root) ||
      !fs.existsSync(file) ||
      fs.statSync(file).isDirectory()
    ) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, {
      "content-type": types[path.extname(file)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, host, () =>
    console.log(`spike server on http://${host}:${port}/`),
  );
