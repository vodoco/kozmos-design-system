// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { Terminal } from "@kozmos-ds/icons";
import { Terminal as VueTerminal } from "@kozmos-ds/icons/vue";
import { createApp, h, nextTick, ref, type App } from "vue";
import {
  KozmosAlert,
  KozmosAlertDescription,
  KozmosAlertTitle,
  KozmosThemeProvider,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";
import { element, slotted } from "./slotted";

/**
 * React's Alert stories draw an icon, an AlertTitle and an AlertDescription
 * with their own render, so the stories parity check cannot draw them from
 * args: here is each, drawn in both (the icon is `@kozmos-ds/icons`' own in
 * each), and the edges React's tests cover (Alert/Density.test.tsx). Then,
 * mounted, the live region: its role and `aria-live` follow `live` as it
 * changes, and what is said in it changes alike.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
/** React's `className` is Vue's `class`. */
function vue(props: Record<string, unknown>) {
  const { className, ...rest } = props;
  return className === undefined ? rest : { ...rest, class: className };
}
const terminal: Drawn = {
  react: Terminal,
  vue: VueTerminal,
  props: { className: "h-4 w-4" },
  vueProps: { class: "h-4 w-4" },
};
const title = (words: string, props: Record<string, unknown> = {}) =>
  slotted(
    KozmosReact.AlertTitle,
    KozmosAlertTitle,
    props,
    { default: [words] },
    vue(props),
  );
const description = (words: string) =>
  slotted(
    KozmosReact.AlertDescription,
    KozmosAlertDescription,
    {},
    {
      default: [words],
    },
  );
const alert = (props: Record<string, unknown>, children: Drawn[]) =>
  slotted(
    KozmosReact.Alert,
    KozmosAlert,
    props,
    { default: children },
    vue(props),
  );

const both = (tree: Drawn) => renderBoth(inTheme(tree));

describe("KozmosAlert draws what React's Alert draws", () => {
  it.each([
    [
      "Default",
      undefined,
      "Heads up!",
      "You can add components to your app using the cli.",
    ],
    [
      "Destructive",
      "destructive",
      "Error",
      "Your session has expired. Please log in again.",
    ],
    [
      "Success",
      "success",
      "Success",
      "Your changes have been saved successfully.",
    ],
    [
      "Warning",
      "warning",
      "Warning",
      "Your account is about to expire. Please renew your subscription.",
    ],
    ["Info", "info", "Info", "Scheduled maintenance is planned for tonight."],
  ])(
    "%s: draws what React's story draws",
    async (_story, variant, heading, words) => {
      const { react, vue } = await both(
        alert(variant ? { variant } : {}, [
          terminal,
          title(heading),
          description(words),
        ]),
      );
      // Not a live region by default (GAP-006).
      expect(react).not.toContain("role=");
      expect(react).toContain("<svg");
      expect(vue).toBe(react);
    },
  );

  it("WithoutTitle: draws what React's story draws", async () => {
    const { react, vue } = await both(
      element("div", { className: "flex max-w-[520px] flex-col gap-4" }, [
        alert({ variant: "info" }, [
          terminal,
          description("The merge is saved as a draft."),
        ]),
        alert({ variant: "warning" }, [
          terminal,
          description(
            "The merged unit keeps the first unit’s name, its category and its opening hours; the other units’ are kept in the merge history.",
          ),
        ]),
      ]),
    );
    expect(vue).toBe(react);
  });

  it("LivenessAndTitle: draws what React's story draws", async () => {
    const { react, vue } = await both(
      element("div", { className: "flex max-w-[520px] flex-col gap-4" }, [
        alert({ variant: "info" }, [
          title("View only"),
          description(
            "Only Dashboard admins can change these settings. Not a live region: nothing is announced.",
          ),
        ]),
        alert({ live: "polite", variant: "success" }, [
          title("Saved"),
          description(
            'role="status" — read when the screen reader next pauses.',
          ),
        ]),
        alert({ live: "assertive", variant: "destructive" }, [
          title("Publish failed"),
          description(
            'role="alert" — interrupts. Only for something that cannot wait.',
          ),
        ]),
      ]),
    );
    expect(react).toContain('aria-live="polite" class');
    expect(react).toContain('role="status"');
    expect(react).toContain('aria-live="assertive" class');
    expect(react).toContain('role="alert"');
    expect(vue).toBe(react);
  });

  it.each([
    ["an app's role wins", { role: "note" }],
    ["an app's role wins over live", { role: "log", live: "assertive" }],
    ["an app's aria-live wins", { live: "polite", "aria-live": "off" }],
    ["a class over the recipe's", { className: "p-2 kozmos-parity" }],
  ] as const)("%s", async (_name, props) => {
    const { react, vue } = await both(
      alert({ ...props }, [description("Saved")]),
    );
    expect(vue).toBe(react);
  });

  it.each([2, 3, 4, 5, 6, "none"] as const)(
    "AlertTitle at level %s",
    async (level) => {
      const { react, vue } = await both(title("Saved", { level }));
      expect(react).toContain(level === "none" ? "<p" : `<h${level}`);
      expect(vue).toBe(react);
    },
  );
});

describe("KozmosAlert's live region, mounted, as React's", () => {
  let reactRoot: Root | undefined;
  let vueApp: App | undefined;
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  afterEach(() => {
    act(() => reactRoot?.unmount());
    vueApp?.unmount();
    reactRoot = undefined;
    vueApp = undefined;
    document.body.replaceChildren();
  });
  const host = () => document.body.appendChild(document.createElement("div"));

  it("says what it says, and how loudly, as `live` and its words change", async () => {
    const steps: { live: "off" | "polite" | "assertive"; words: string }[] = [
      { live: "off", words: "View only." },
      { live: "polite", words: "Saved." },
      { live: "assertive", words: "Publish failed." },
      { live: "off", words: "View only." },
    ];
    const reactHost = host();
    reactRoot = createRoot(reactHost);
    const drawReact = (step: (typeof steps)[number]) =>
      act(async () =>
        reactRoot!.render(
          React.createElement(
            KozmosReact.Alert,
            { live: step.live },
            React.createElement(KozmosReact.AlertDescription, null, step.words),
          ),
        ),
      );
    const current = ref(steps[0]);
    const vueHost = host();
    vueApp = createApp({
      render: () =>
        h(
          KozmosAlert,
          { live: current.value.live },
          {
            default: () => [
              h(KozmosAlertDescription, null, () => current.value.words),
            ],
          },
        ),
    });
    vueApp.mount(vueHost);
    const seen: { react: string; vue: string }[] = [];
    for (const step of steps) {
      await drawReact(step);
      current.value = step;
      await nextTick();
      seen.push({
        react: normalizeHtml(reactHost.innerHTML),
        vue: normalizeHtml(vueHost.innerHTML),
      });
    }
    expect(seen[1].react).toContain('role="status"');
    expect(seen[2].react).toContain('role="alert"');
    expect(seen[3].react).not.toContain("aria-live");
    for (const { react, vue } of seen) expect(vue).toBe(react);
  });
});
