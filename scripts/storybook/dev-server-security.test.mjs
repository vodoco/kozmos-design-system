// Exercise the installed development server, not a version-string allowlist.
// Regression for GHSA-mjf5-7g4m-gx5w and the 8.6.18 Host validation hardening.
// No story-writing messages are sent: these probes stop at HTTP/WS admission.
// The channel URL each client opens comes from the installed client, so the
// probes follow it: 8.6.19 made the server require the client's `page` role,
// and a URL written out here stopped being the one the client opens.
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import fs from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const docs = path.join(root, "apps/docs");
const require = createRequire(path.join(docs, "package.json"));

// Storybook's own browser client (createBrowserChannel from the installed
// storybook/internal/channels), started for one role with the globals that
// role's page sets. It runs in a child process, so the browser globals it
// reads stay out of this one, and its WebSocket only records the URL.
const CLIENT = `
const [role, configType, channelOptions, port] = process.argv.slice(1);
const opened = [];
Object.assign(globalThis, {
  CONFIG_TYPE: configType,
  CHANNEL_OPTIONS: JSON.parse(channelOptions),
  location: { protocol: "http:", hostname: "127.0.0.1", port },
  WebSocket: class { constructor(url) { opened.push(url); } },
});
globalThis.window = globalThis;
require("storybook/internal/channels").createBrowserChannel({ page: role });
process.stdout.write(JSON.stringify(opened));
process.exit(0);
`;

// A global a Storybook page sets inline: the manager writes
// window['NAME'] = value; and the preview writes window.NAME = value;
function pageGlobal(body, name) {
  const value = body.match(
    new RegExp(
      `window(?:\\.${name}|\\['${name}'\\])\\s*=\\s*(.+?);?\\s*$`,
      "m",
    ),
  )?.[1];
  assert.ok(value, `the page sets no ${name}`);
  return value;
}

function request(port, route, headers = {}, upgrade = false) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: "127.0.0.1",
      port,
      path: route,
      headers: {
        ...(upgrade
          ? {
              Connection: "Upgrade",
              Upgrade: "websocket",
              "Sec-WebSocket-Version": "13",
              "Sec-WebSocket-Key": randomBytes(16).toString("base64"),
            }
          : {}),
        ...headers,
      },
    });
    req.setTimeout(10000, () => req.destroy(new Error("Request timed out")));
    req.on("error", reject);
    req.on("upgrade", (response, socket) => {
      socket.destroy();
      resolve({ status: response.statusCode, body: "" });
    });
    req.on("response", (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("error", reject);
      response.on("end", () => resolve({ status: response.statusCode, body }));
    });
    req.end();
  });
}

test(
  "Storybook dev server admits its own client and rejects untrusted requests",
  { timeout: 120000 },
  async (t) => {
    const fixture = fs.mkdtempSync(
      path.join(os.tmpdir(), "kozmos-storybook-security-"),
    );
    let server;
    t.after(async () => {
      try {
        if (
          !server?.pid ||
          server.exitCode !== null ||
          server.signalCode !== null
        )
          return;
        const exited = once(server, "exit");
        process.kill(-server.pid, "SIGTERM");
        const force = setTimeout(() => {
          if (server.exitCode === null && server.signalCode === null)
            process.kill(-server.pid, "SIGKILL");
        }, 5000);
        try {
          await exited;
        } finally {
          clearTimeout(force);
        }
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    });
    const framework = path.dirname(
      require.resolve("@storybook/react-vite/package.json"),
    );
    fs.writeFileSync(
      path.join(fixture, "main.cjs"),
      `module.exports = ${JSON.stringify({ stories: [path.join(fixture, "probe.stories.js")], framework: { name: framework, options: {} }, core: { disableTelemetry: true } })};\n`,
    );
    fs.writeFileSync(
      path.join(fixture, "probe.stories.js"),
      'export default { title: "Security probe" }; export const Ready = { render: () => null };\n',
    );

    const reservation = http.createServer();
    reservation.listen(0, "127.0.0.1");
    await once(reservation, "listening");
    const { port } = reservation.address();
    await new Promise((resolve) => reservation.close(resolve));
    const storybookPackage = require.resolve("storybook/package.json");
    const manifest = JSON.parse(fs.readFileSync(storybookPackage, "utf8"));
    const cli = path.resolve(
      path.dirname(storybookPackage),
      manifest.bin.storybook,
    );
    let output = "";
    server = spawn(
      process.execPath,
      [
        cli,
        "dev",
        "--config-dir",
        fixture,
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
        "--ci",
        "--disable-telemetry",
        "--no-open",
      ],
      {
        cwd: docs,
        env: { ...process.env, CI: "1", STORYBOOK_DISABLE_TELEMETRY: "1" },
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const capture = (chunk) => {
      output = (output + chunk).slice(-24000);
    };
    server.stdout.on("data", capture);
    server.stderr.on("data", capture);
    let spawnError;
    server.on("error", (error) => {
      spawnError = error;
    });
    const deadline = Date.now() + 90000;
    let page;
    while (Date.now() < deadline) {
      if (
        spawnError ||
        server.exitCode !== null ||
        server.signalCode !== null
      ) {
        assert.fail(
          `Storybook failed to start: ${spawnError ?? server.exitCode}\n${output}`,
        );
      }
      try {
        const response = await request(port, "/");
        if (
          response.status === 200 &&
          response.body.includes("STORYBOOK_RENDERER")
        ) {
          page = response;
          break;
        }
      } catch {
        /* The server has not started listening yet. */
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert.ok(page, `Storybook did not become ready\n${output}`);
    const ownOrigin = `http://127.0.0.1:${port}`;
    // The dev server's two browser clients, each from the page that starts
    // it: the manager at / and the preview in its iframe.
    const pages = { manager: "/", preview: "/iframe.html" };
    const token = JSON.parse(pageGlobal(page.body, "CHANNEL_OPTIONS")).wsToken;
    assert.ok(token, "the manager page carries no server channel token");
    const channels = {};
    for (const [role, pagePath] of Object.entries(pages)) {
      const response =
        role === "manager" ? page : await request(port, pagePath);
      assert.equal(response.status, 200, `the ${role} page did not load`);
      const channelOptions = pageGlobal(response.body, "CHANNEL_OPTIONS");
      assert.equal(
        JSON.parse(channelOptions).wsToken,
        token,
        `the ${role} page carries another token`,
      );
      const configType = pageGlobal(response.body, "CONFIG_TYPE").replace(
        /^(["'])(.*)\1$/,
        "$2",
      );
      const opened = JSON.parse(
        execFileSync(
          process.execPath,
          ["--eval", CLIENT, role, configType, channelOptions, String(port)],
          { cwd: docs, encoding: "utf8" },
        ),
      );
      assert.equal(
        opened.length,
        1,
        `the ${role} opened ${opened.length} sockets`,
      );
      const url = new URL(opened[0]);
      assert.equal(
        url.host,
        `127.0.0.1:${port}`,
        `the ${role} left this server`,
      );
      channels[role] = url;
    }
    // The same URL with every parameter that carries the token taken out.
    const withoutToken = (url) => {
      const stripped = new URL(url);
      for (const [name, value] of [...stripped.searchParams]) {
        if (value === token) stripped.searchParams.delete(name);
      }
      assert.notEqual(stripped.search, url.search, "the client sent no token");
      return stripped;
    };
    const route = (url) => url.pathname + url.search;

    await t.test(
      "the normal local client can open its server channel",
      async () => {
        for (const [role, url] of Object.entries(channels)) {
          assert.equal(
            (await request(port, route(url), { Origin: ownOrigin }, true))
              .status,
            101,
            `the ${role}'s channel was refused`,
          );
        }
      },
    );
    await t.test(
      "a foreign origin is rejected even with a valid token",
      async () => {
        for (const [role, url] of Object.entries(channels)) {
          assert.equal(
            (
              await request(
                port,
                route(url),
                { Origin: "https://untrusted.invalid" },
                true,
              )
            ).status,
            403,
            `the ${role}'s channel opened for a foreign origin`,
          );
        }
      },
    );
    await t.test(
      "an unauthenticated local-origin channel is rejected",
      async () => {
        for (const [role, url] of Object.entries(channels)) {
          assert.equal(
            (
              await request(
                port,
                route(withoutToken(url)),
                { Origin: ownOrigin },
                true,
              )
            ).status,
            403,
            `the ${role}'s channel opened without its token`,
          );
        }
      },
    );
    await t.test(
      "an untrusted Host header cannot read the manager, the preview or the token",
      async () => {
        for (const [role, pagePath] of Object.entries(pages)) {
          assert.equal(
            (await request(port, pagePath, { Host: "untrusted.invalid" }))
              .status,
            403,
            `the ${role} page was served to an untrusted Host`,
          );
        }
      },
    );
  },
);
