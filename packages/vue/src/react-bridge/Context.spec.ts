// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { h, nextTick, ref } from "vue";
import React from "react";
import { useTheme } from "@kozmos-ds/react";
import {
  KozmosAnalyticsProvider,
  KozmosButton,
  KozmosDensityScope,
  KozmosThemeProvider,
  type KozmosAnalyticsEvent,
} from "../index";
import * as Bridge from "./index";
import { createVueWrapper } from "./react-adapter";
import {
  $,
  eventually,
  mount,
  settle,
  until,
} from "../../test/react-bridge-harness";

// Vue's providers reach the React parts the bridge draws (GAP-230, decision
// 172). Every React root the bridge mounts is drawn inside React's
// ThemeProvider, DensityScope and AnalyticsProvider, given what the nearest
// KozmosThemeProvider, KozmosDensityScope and KozmosAnalyticsProvider hold,
// and a wrapper drawn in a compound's tree is given those whose Vue provider
// sits between it and the compound. Before, a bridged part read none of
// them: React's context stops at each React root.

/** React's own useTheme, in a part of the caller's: what a bridged part reads. */
const ThemeProbe = () => {
  const { theme, resolvedTheme } = useTheme();
  return React.createElement("output", null, `${theme} ${resolvedTheme}`);
};
const KozmosThemeProbe = createVueWrapper(ThemeProbe);
const SetsTheme = () => {
  const { setTheme } = useTheme();
  return React.createElement(
    "button",
    { "data-sets": "", onClick: () => setTheme("light") },
    "Light",
  );
};
const KozmosSetsTheme = createVueWrapper(SetsTheme);

/** An open tooltip's surface, which React draws in its theme's portal. */
const tooltip = (words: string) =>
  h(Bridge.KozmosTooltip, { open: true }, () => [
    h(Bridge.KozmosTooltipTrigger, null, () => "Info"),
    h(Bridge.KozmosTooltipContent, null, () => words),
  ]);
const surface = (words: string) =>
  until(() =>
    [...document.querySelectorAll<HTMLElement>("[data-state]")].find(
      (element) =>
        element.textContent?.startsWith(words) &&
        element.hasAttribute("data-side"),
    ),
  );

describe("KozmosAnalyticsProvider", () => {
  const batches: KozmosAnalyticsEvent[][] = [];
  const provider = (...children: ReturnType<typeof h>[]) =>
    h(
      KozmosAnalyticsProvider,
      {
        batchDelayMs: 10,
        onDispatch: (events: KozmosAnalyticsEvent[]) => batches.push(events),
      },
      () => children,
    );
  const reported = () =>
    batches.flat().map(({ component, eventName, properties }) => ({
      component,
      eventName,
      properties,
    }));

  it("hears a bridged part's events, and a native part's, in one batch", async () => {
    batches.length = 0;
    mount(() =>
      provider(
        h(Bridge.KozmosCheckbox, { "aria-label": "Step-free" }),
        h(KozmosButton, null, () => "Save"),
      ),
    );
    const checkbox = await until(() => $("[role=checkbox]"));
    checkbox.click();
    $("button:not([role])")!.click();
    // The bridged part's event reaches the provider a task after the native
    // one (React's AnalyticsProvider hands it on in a timeout), in the same
    // batch.
    await eventually(() =>
      expect(
        reported().sort((a, b) => a.component.localeCompare(b.component)),
      ).toEqual([
        {
          component: "Button",
          eventName: "button_clicked",
          properties: { variant: "default", emotion: null },
        },
        {
          component: "Checkbox",
          eventName: "checkbox_toggled",
          properties: { checked: true },
        },
      ]),
    );
    expect(batches).toHaveLength(1);
  });

  it("hears a part drawn in a compound's tree", async () => {
    batches.length = 0;
    mount(() =>
      provider(
        h(Bridge.KozmosRadioGroup, { "aria-label": "Level" }, () => [
          h(Bridge.KozmosRadioGroupItem, { value: "1", label: "Level 1" }),
          h(Bridge.KozmosCard, null, () => [
            h(Bridge.KozmosCheckbox, { "aria-label": "Step-free" }),
          ]),
        ]),
      ),
    );
    (await until(() => $("[role=checkbox]"))).click();
    (await until(() => $("[role=radio]"))).click();
    await eventually(() =>
      expect(
        reported()
          .map((event) => event.eventName)
          .sort(),
      ).toEqual(["checkbox_toggled", "radio_selection_changed"]),
    );
  });

  it("a nested provider inside a compound takes its own subtree's events", async () => {
    batches.length = 0;
    const inner: KozmosAnalyticsEvent[][] = [];
    mount(() =>
      provider(
        h(Bridge.KozmosCard, null, () => [
          h(
            KozmosAnalyticsProvider,
            {
              batchDelayMs: 10,
              onDispatch: (events: KozmosAnalyticsEvent[]) =>
                inner.push(events),
            },
            () => [h(Bridge.KozmosCheckbox, { "aria-label": "Step-free" })],
          ),
        ]),
      ),
    );
    (await until(() => $("[role=checkbox]"))).click();
    await eventually(() => expect(inner.flat()).toHaveLength(1));
    await settle();
    expect(batches).toEqual([]);
  });
});

describe("KozmosThemeProvider", () => {
  it("a bridged part reads its theme, and follows a change", async () => {
    const theme = ref<"dark" | "light">("dark");
    mount(() =>
      h(KozmosThemeProvider, { theme: theme.value }, () => [
        h(KozmosThemeProbe),
      ]),
    );
    await eventually(() => expect($("output")?.textContent).toBe("dark dark"));
    theme.value = "light";
    await nextTick();
    await eventually(() =>
      expect($("output")?.textContent).toBe("light light"),
    );
  });

  it("React's setTheme asks Vue's provider, which reports update:theme", async () => {
    const asked: string[] = [];
    mount(() =>
      h(
        KozmosThemeProvider,
        {
          defaultTheme: "dark",
          "onUpdate:theme": (next: string) => asked.push(next),
        },
        () => [h(KozmosSetsTheme), h(KozmosThemeProbe)],
      ),
    );
    (await until(() => $("[data-sets]"))).click();
    await eventually(() => expect(asked).toEqual(["light"]));
    await eventually(() =>
      expect($("output")?.textContent).toBe("light light"),
    );
  });

  it("what a bridged part draws in a portal is in its theme, with its tokens", async () => {
    mount(() =>
      h(
        KozmosThemeProvider,
        { theme: "dark", tokens: { dark: { "--kozmos-probe": "1px" } } },
        () => [tooltip("Opens at 9")],
      ),
    );
    const content = await surface("Opens at 9");
    const portal = content.closest<HTMLElement>("[data-kozmos-portal]");
    expect(portal?.getAttribute("data-theme")).toBe("dark");
    expect(portal?.style.getPropertyValue("--kozmos-probe")).toBe("1px");
  });

  it("a bridged part takes its direction", async () => {
    mount(() =>
      h(KozmosThemeProvider, { dir: "rtl" }, () => [
        h(Bridge.KozmosRadioGroup, { "aria-label": "Level" }, () => [
          h(Bridge.KozmosRadioGroupItem, { value: "1", label: "Level 1" }),
        ]),
      ]),
    );
    // Radix's group reads its direction from React's DirectionProvider.
    const group = await until(() => $("[role=radiogroup]"));
    expect(group.getAttribute("dir")).toBe("rtl");
  });
});

describe("KozmosDensityScope", () => {
  it("what a bridged part draws in a portal takes the scope's density", async () => {
    mount(() =>
      h(KozmosThemeProvider, { density: "touch" }, () => [
        h(KozmosDensityScope, { density: "compact" }, () => [
          tooltip("Opens at 9"),
        ]),
      ]),
    );
    const content = await surface("Opens at 9");
    expect(content.getAttribute("data-kozmos-density")).toBe("compact");
  });

  it("a scope between a compound and its part reaches the part", async () => {
    mount(() =>
      h(KozmosThemeProvider, { density: "touch" }, () => [
        h(Bridge.KozmosCard, null, () => [
          h(KozmosDensityScope, { density: "compact" }, () => [
            tooltip("Inside"),
          ]),
          tooltip("Outside"),
        ]),
      ]),
    );
    expect((await surface("Inside")).getAttribute("data-kozmos-density")).toBe(
      "compact",
    );
    expect((await surface("Outside")).getAttribute("data-kozmos-density")).toBe(
      "touch",
    );
  });
});
