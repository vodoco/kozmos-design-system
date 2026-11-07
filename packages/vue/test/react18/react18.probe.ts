// @vitest-environment jsdom
// Run by the React 18 run alone (vitest.react18.config.mts names it; the
// default run's `*.spec.ts` does not). It proves the run is on React 18:
// what Vite loads (this file, the bridge, @kozmos-ds/react's build) and
// what Node loads itself (Radix and the rest), one react-dom only, and a
// Radix-drawn part rendering, which a second React would break.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Set by vitest.react18.config.mts from the React 18 install
// (./react18.mjs), which this file, loaded by Vite, does not resolve itself.
const {
  reactDir: REACT_DIR,
  reactDomDir: REACT_DOM_DIR,
  reactVersion: REACT_VERSION,
  reactDomVersion: REACT_DOM_VERSION,
} = JSON.parse(process.env.KOZMOS_REACT18 ?? "{}") as Record<string, string>;

interface Resolution {
  pid: number;
  kind: "import" | "require";
  specifier: string;
  parent: string | null;
  file: string;
}

describe("the React 18 run", () => {
  it(`loads React ${REACT_VERSION} everywhere, and one react-dom`, async () => {
    expect(REACT_DIR, "the run sets KOZMOS_REACT18").toBeTruthy();
    expect(REACT_VERSION, "apps/docs's react is React 18").toMatch(/^18\./);
    expect(REACT_DOM_VERSION).toBe(REACT_VERSION);

    // React DOM names itself to the devtools hook as it loads.
    const renderers: string[] = [];
    (globalThis as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      isDisabled: false,
      supportsFiber: true,
      renderers: new Map(),
      inject(internals: { rendererPackageName: string; version: string }) {
        renderers.push(`${internals.rendererPackageName}@${internals.version}`);
        return renderers.length;
      },
      onScheduleFiberRoot() {},
      onCommitFiberRoot() {},
      onCommitFiberUnmount() {},
      onPostCommitFiberRoot() {},
      checkDCE() {},
    };
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

    const React = await import("react");
    const ReactDOM = await import("react-dom");
    const { createRoot } = await import("react-dom/client");
    // The bridge's own imports of react and react-dom run here too.
    await import("../../src/react-bridge/index");
    const { Switch } = await import("@kozmos-ds/react");

    expect(React.version, "react, as Vite loads it").toBe(REACT_VERSION);
    expect(ReactDOM.version, "react-dom, as Vite loads it").toBe(REACT_VERSION);

    // A part Radix draws: Radix on another React would fail its hooks.
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await React.act(async () => {
      root.render(
        React.createElement(Switch, { checked: true, "aria-label": "probe" }),
      );
    });
    expect(host.querySelector('[role="switch"]')).not.toBeNull();
    await React.act(async () => root.unmount());
    host.remove();

    expect(renderers, "one react-dom, React 18's").toEqual([
      `react-dom@${REACT_VERSION}`,
    ]);

    // What Node resolved itself, through ./hooks.mjs, in every worker so
    // far. Every worker also fails on its own resolution outside React 18,
    // and ./global-setup.mjs checks all of them once every worker is done.
    const log = process.env.KOZMOS_REACT18_LOG;
    expect(log, "the run sets KOZMOS_REACT18_LOG").toBeTruthy();
    const all = readFileSync(log!, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Resolution);
    const mine = all.filter((entry) => entry.pid === process.pid);
    const elsewhere = all.filter(
      ({ file }) =>
        !file.startsWith(`${REACT_DIR}/`) &&
        !file.startsWith(`${REACT_DOM_DIR}/`),
    );
    expect(
      elsewhere,
      "every react and react-dom Node resolved, in any worker, is React 18's",
    ).toEqual([]);
    const fromRadix = mine.filter(
      ({ kind, parent }) => kind === "import" && /@radix-ui/.test(parent ?? ""),
    );
    expect(fromRadix.length, "Radix's imports of react").toBeGreaterThan(0);
    expect(
      mine.filter(({ kind }) => kind === "require").length,
      "requires of react (react-dom's own, react-remove-scroll's)",
    ).toBeGreaterThan(0);
  });
});
