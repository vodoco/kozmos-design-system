// Exercise the installed development server, not a version-string allowlist.
// Regression for GHSA-mjf5-7g4m-gx5w and the 8.6.18 Host validation hardening.
// No story-writing messages are sent: these probes stop at HTTP/WS admission.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
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
    const token = page.body.match(
      /["']?wsToken["']?\s*:\s*["']([^"']+)["']/,
    )?.[1];
    const ownOrigin = `http://127.0.0.1:${port}`;
    const channel = "/storybook-server-channel";
    const authenticatedChannel = token
      ? `${channel}?token=${encodeURIComponent(token)}`
      : channel;

    await t.test(
      "the normal local client can open its server channel",
      async () => {
        assert.equal(
          (
            await request(
              port,
              authenticatedChannel,
              { Origin: ownOrigin },
              true,
            )
          ).status,
          101,
        );
      },
    );
    await t.test(
      "a foreign origin is rejected even with a valid token",
      async () => {
        assert.equal(
          (
            await request(
              port,
              authenticatedChannel,
              { Origin: "https://untrusted.invalid" },
              true,
            )
          ).status,
          403,
        );
      },
    );
    await t.test(
      "an unauthenticated local-origin channel is rejected",
      async () => {
        assert.equal(
          (await request(port, channel, { Origin: ownOrigin }, true)).status,
          403,
        );
      },
    );
    await t.test(
      "an untrusted Host header cannot read the manager or its token",
      async () => {
        assert.equal(
          (await request(port, "/", { Host: "untrusted.invalid" })).status,
          403,
        );
      },
    );
  },
);
