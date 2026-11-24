// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { Stars01 } from "@kozmos-ds/icons";
import { Stars01 as VueStars01 } from "@kozmos-ds/icons/vue";
import {
  createApp,
  createCommentVNode,
  defineComponent,
  h,
  nextTick,
  ref,
  type App,
} from "vue";
import {
  KozmosButton,
  KozmosNotice,
  KozmosThemeProvider,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";
import { element, slotted } from "./slotted";

/**
 * What the stories parity check cannot draw from React's args, drawn in
 * both: the stories whose action or summary is a Button, and the one with
 * its own render. Then the edges React's tests cover (Notice.test.tsx): its
 * tones, its marks and their absence, progress and done, its liveness, and
 * its disclosure. Then, mounted, what a server render cannot show: More
 * opens and closes the detail, v-model:expanded hears what React's
 * onExpandedChange hears, a controlled notice waits for its owner, the live
 * region says its words as they change, and the action is reached after
 * More, in the order React's are.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const notice = (
  props: Record<string, unknown>,
  slots: Record<string, (Drawn | string)[]>,
) => {
  const { className, ...rest } = props;
  return slotted(
    KozmosReact.Notice,
    KozmosNotice,
    props,
    slots,
    className === undefined ? rest : { ...rest, class: className },
  );
};
const button = (props: Record<string, unknown>, label: string) =>
  slotted(KozmosReact.Button, KozmosButton, props, { default: [label] });
const stars: Drawn = {
  react: Stars01,
  vue: VueStars01,
  props: { className: "h-4 w-4" },
  vueProps: { class: "h-4 w-4" },
};
const allergens =
  "AI results may be incomplete. Check allergens with the venue.";
const wording =
  "These results are AI-assisted and may be incomplete or out of date.";

const both = (tree: Drawn) => renderBoth(inTheme(tree));

describe("KozmosNotice draws what React's Notice draws", () => {
  it("Emergency: draws what React's story draws", async () => {
    const { react, vue } = await both(
      notice(
        { tone: "critical", collapsible: false },
        {
          summary: ["If someone's life is in danger, call 112 now"],
          default: [
            "Airport staff can help too. The nearest help points are below.",
          ],
          action: [button({ variant: "destructive" }, "Call 112")],
        },
      ),
    );
    expect(react).toContain('data-tone="critical"');
    expect(react).not.toContain("aria-expanded");
    expect(react).not.toMatch(/\shidden[\s>]/);
    expect(vue).toBe(react);
  });

  it("SearchWithAi: draws what React's story draws", async () => {
    const { react, vue } = await both(
      notice(
        { tone: "info", iconAlign: "center" },
        {
          icon: [stars],
          summary: [
            element(
              "span",
              { className: "flex items-center justify-between gap-2" },
              [
                "Not finding it?",
                button({ size: "sm", variant: "outline" }, "Search with AI"),
              ],
            ),
          ],
        },
      ),
    );
    expect(react).toContain("items-center");
    expect(vue).toBe(react);
  });

  it("SuccessProgressAndDone: draws what React's story draws", async () => {
    const { react, vue } = await both(
      element("div", { className: "flex flex-col gap-3" }, [
        notice(
          { tone: "warning", collapsible: false },
          {
            summary: ["Set Geometry"],
            default: ["Draw the building's outline on the map."],
            action: [
              button(
                { size: "sm", variant: "outline" },
                "Set Building Boundary",
              ),
            ],
          },
        ),
        notice(
          { tone: "info", status: "progress" },
          { summary: ["Saving the geometry"] },
        ),
        notice(
          { tone: "success", status: "done" },
          { summary: ["Geometry is set"] },
        ),
      ]),
    );
    expect(react).toContain("kozmos-spinner-arc");
    expect(react).toContain("data-kozmos-notice-done");
    expect(vue).toBe(react);
  });

  it.each([
    ["warning, by default", {}],
    ["info", { tone: "info" }],
    ["critical", { tone: "critical" }],
    ["success", { tone: "success" }],
    ["a tone it does not know is warning", { tone: "loud" }],
    ["centred on a one-line summary", { iconAlign: "center" }],
    ["in progress", { status: "progress" }],
    ["done", { status: "done", tone: "success" }],
    ["done, centred", { status: "done", iconAlign: "center" }],
    ["assertive", { live: "assertive" }],
    ["not a live region", { live: "off" }],
    ["an app's role", { role: "note" }],
    ["an app's aria-live", { "aria-live": "off" }],
    ["a class over the recipe's", { className: "px-0 kozmos-parity" }],
  ] as const)("a notice: %s", async (_name, props) => {
    const { react, vue } = await both(
      notice({ ...props }, { summary: ["Check allergens."] }),
    );
    expect(vue).toBe(react);
  });

  it.each([
    ["closed, with More", {}],
    ["open by default", { defaultExpanded: true }],
    ["held open", { expanded: true }],
    [
      "held closed over defaultExpanded",
      { expanded: false, defaultExpanded: true },
    ],
    ["its own words for More", { expandLabel: "Read more" }],
    ["shown at once when it must not be discovered", { collapsible: false }],
    [
      "not collapsible, whatever expanded says",
      { collapsible: false, expanded: false },
    ],
    [
      "in progress, its detail in line with the summary",
      { status: "progress" },
    ],
  ] as const)("its detail: %s", async (_name, props) => {
    const { react, vue } = await both(
      notice({ ...props }, { summary: [allergens], default: [wording] }),
    );
    expect(vue).toBe(react);
  });

  it("a caller's mark replaces the tone's, and keeps its column when done", async () => {
    for (const status of [undefined, "done"]) {
      const { react, vue } = await both(
        notice(
          { status },
          {
            icon: [stars],
            summary: [allergens],
            default: [wording],
            action: [button({}, "Call")],
          },
        ),
      );
      expect(react).toContain("pl-6");
      expect(vue).toBe(react);
    }
  });

  it("an #icon that draws nothing is React's icon={null}: no mark, no column", async () => {
    for (const icon of [null, false]) {
      const { react, vue } = await both({
        react: () =>
          React.createElement(
            KozmosReact.Notice,
            {
              icon,
              summary: allergens,
              action: React.createElement("button", null, "Call"),
            },
            wording,
          ),
        vue: defineComponent({
          setup: () => () =>
            h(KozmosNotice, null, {
              icon: () => [createCommentVNode("v-if")],
              summary: () => [allergens],
              action: () => [h("button", null, "Call")],
              default: () => [wording],
            }),
        }),
      });
      // No mark's box before the summary: only More's chevron is drawn.
      expect(react).not.toContain('class="shrink-0');
      expect(react.match(/<svg/g)).toHaveLength(1);
      expect(react).not.toContain("pl-6");
      expect(vue).toBe(react);
    }
  });

  it("offers no disclosure, and no detail, when the default slot draws nothing", async () => {
    const { react, vue } = await both({
      react: () =>
        React.createElement(KozmosReact.Notice, { summary: allergens }, null),
      vue: defineComponent({
        setup: () => () =>
          h(KozmosNotice, null, {
            summary: () => [allergens],
            default: () => [createCommentVNode("v-if")],
          }),
      }),
    });
    expect(react).not.toContain("<button");
    expect(vue).toBe(react);
  });
});

describe("KozmosNotice, mounted, as React's", () => {
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
  const more = (root: HTMLElement) =>
    root.querySelector<HTMLButtonElement>("button.kozmos-notice-more")!;
  const snapshot = (root: HTMLElement) => normalizeHtml(root.innerHTML);
  async function mountReact(node: React.ReactNode) {
    const element = host();
    reactRoot = createRoot(element);
    await act(async () => reactRoot!.render(node));
    return element;
  }
  function mountVue(render: () => ReturnType<typeof h>) {
    const element = host();
    vueApp = createApp({ render });
    vueApp.mount(element);
    return element;
  }
  const click = async (button: HTMLElement) => {
    await act(async () => button.click());
    await nextTick();
  };

  it("More opens and closes the detail, and v-model:expanded hears what onExpandedChange hears", async () => {
    const heard = { react: [] as unknown[][], vue: [] as unknown[][] };
    const reactHost = await mountReact(
      React.createElement(
        KozmosReact.Notice,
        {
          summary: allergens,
          onExpandedChange: (...args: unknown[]) => heard.react.push(args),
        },
        wording,
      ),
    );
    const vueHost = mountVue(() =>
      h(
        KozmosNotice,
        {
          "onUpdate:expanded": (...args: unknown[]) => heard.vue.push(args),
        },
        { summary: () => [allergens], default: () => [wording] },
      ),
    );
    const seen = [{ react: snapshot(reactHost), vue: snapshot(vueHost) }];
    for (let i = 0; i < 2; i++) {
      await click(more(reactHost));
      await click(more(vueHost));
      seen.push({ react: snapshot(reactHost), vue: snapshot(vueHost) });
    }
    expect(heard.react).toEqual([[true], [false]]);
    expect(heard.vue).toEqual(heard.react);
    expect(seen[0].react).toContain('aria-expanded="false"');
    expect(seen[1].react).toContain('aria-expanded="true"');
    expect(more(vueHost).getAttribute("aria-controls")).toBe(
      vueHost.querySelector("[id]")?.id,
    );
    for (const { react, vue } of seen) expect(vue).toBe(react);
  });

  it("a controlled notice waits for its owner, and follows it", async () => {
    const heard = { react: [] as unknown[][], vue: [] as unknown[][] };
    const drawReact = (expanded: boolean) =>
      React.createElement(
        KozmosReact.Notice,
        {
          summary: allergens,
          expanded,
          onExpandedChange: (...args: unknown[]) => heard.react.push(args),
        },
        wording,
      );
    const reactHost = await mountReact(drawReact(false));
    const expanded = ref(false);
    const vueHost = mountVue(() =>
      h(
        KozmosNotice,
        {
          expanded: expanded.value,
          "onUpdate:expanded": (...args: unknown[]) => heard.vue.push(args),
        },
        { summary: () => [allergens], default: () => [wording] },
      ),
    );
    // Asked to open, neither opens on its own.
    await click(more(reactHost));
    await click(more(vueHost));
    expect(heard.react).toEqual([[true]]);
    expect(heard.vue).toEqual(heard.react);
    expect(more(reactHost).getAttribute("aria-expanded")).toBe("false");
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    // Its owner opens it.
    await act(async () => reactRoot!.render(drawReact(true)));
    expanded.value = true;
    await nextTick();
    expect(more(reactHost).getAttribute("aria-expanded")).toBe("true");
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("v-model:expanded binds both ways", async () => {
    const expanded = ref(false);
    const vueHost = mountVue(() =>
      h(
        KozmosNotice,
        {
          expanded: expanded.value,
          "onUpdate:expanded": (value: boolean) => (expanded.value = value),
        },
        { summary: () => [allergens], default: () => [wording] },
      ),
    );
    await click(more(vueHost));
    expect(expanded.value).toBe(true);
    expect(more(vueHost).getAttribute("aria-expanded")).toBe("true");
    expanded.value = false;
    await nextTick();
    expect(more(vueHost).getAttribute("aria-expanded")).toBe("false");
  });

  it("its live region says its words as they change, and how loudly", async () => {
    const steps = [
      { live: "polite", status: "progress", summary: "Saving the geometry" },
      { live: "polite", status: "done", summary: "Geometry is set" },
      { live: "assertive", status: undefined, summary: "Saving failed" },
    ] as const;
    const reactHost = await mountReact(null);
    const current = ref<(typeof steps)[number]>(steps[0]);
    const vueHost = mountVue(() =>
      h(
        KozmosNotice,
        { live: current.value.live, status: current.value.status },
        { summary: () => [current.value.summary] },
      ),
    );
    for (const step of steps) {
      await act(async () =>
        reactRoot!.render(
          React.createElement(KozmosReact.Notice, {
            live: step.live,
            status: step.status,
            summary: step.summary,
          }),
        ),
      );
      current.value = step;
      await nextTick();
      const live = vueHost.querySelector("[aria-live]")!;
      expect(live.textContent).toBe(step.summary);
      expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    }
  });

  it("reaches More, then the action, in React's order", async () => {
    const reactHost = await mountReact(
      React.createElement(
        KozmosReact.Notice,
        {
          summary: allergens,
          action: React.createElement(KozmosReact.Button, null, "Call 112"),
        },
        wording,
      ),
    );
    const vueHost = mountVue(() =>
      h(KozmosNotice, null, {
        summary: () => [allergens],
        default: () => [wording],
        action: () => [h(KozmosButton, null, () => "Call 112")],
      }),
    );
    const order = (root: HTMLElement) =>
      [...root.querySelectorAll<HTMLElement>("button, [tabindex]")]
        .filter((el) => el.tabIndex >= 0 && !el.closest("[hidden]"))
        .map((el) => el.textContent);
    expect(order(reactHost)).toEqual(["More", "Call 112"]);
    expect(order(vueHost)).toEqual(order(reactHost));
  });
});
