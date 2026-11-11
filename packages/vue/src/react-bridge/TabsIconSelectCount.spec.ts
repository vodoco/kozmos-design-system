// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { h } from "vue";
import React from "react";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TabsList,
  TabsTrigger,
} from "@kozmos-ds/react";
import * as Bridge from "./index";
import {
  $,
  $$,
  mount,
  press,
  unmount,
  until,
} from "../../test/react-bridge-harness";

const e = React.createElement;

afterEach(unmount);

/** The words an element's aria-labelledby names, in order. */
function labelledBy(element: Element) {
  return (element.getAttribute("aria-labelledby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ");
}

// React's parts below the root reach Vue as `children` (GAP-016), so the
// tab's icon (GAP-152) and the option's count (GAP-164) are React's props
// through the bridge.
describe("Tabs' icon and Select's count through the bridge", () => {
  it("KozmosTabs draws a tab's icon over its words, and names the tab by its words", async () => {
    mount(() =>
      h(Bridge.KozmosTabs, {
        defaultValue: "poi",
        children: e(TabsList, null, [
          e(
            TabsTrigger,
            {
              key: "poi",
              value: "poi",
              icon: e("svg", { "aria-label": "Pin", role: "img" }),
            },
            "POI",
          ),
          e(TabsTrigger, { key: "virtual", value: "virtual" }, "Virtual"),
        ]),
      }),
    );
    const icon = await until(() => $('[data-slot="tabs-trigger-icon"]'));
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    const tab = icon.closest("[role=tab]")!;
    expect(tab.firstElementChild).toBe(icon);
    expect(tab.textContent).toBe("POI");
    expect($$('[data-slot="tabs-trigger-icon"]')).toHaveLength(1);
  });

  it("KozmosSelect reads an option's count with its words, and the closed select shows its words alone", async () => {
    mount(() =>
      h(Bridge.KozmosSelect, {
        modelValue: "poi",
        children: [
          e(
            SelectTrigger,
            { key: "trigger", "aria-label": "Content" },
            e(SelectValue),
          ),
          e(SelectContent, { key: "content" }, [
            e(SelectItem, { key: "poi", value: "poi", count: 96 }, "POI"),
            e(SelectItem, { key: "virtual", value: "virtual" }, "Virtual"),
          ]),
        ],
      }),
    );
    const trigger = await until(() =>
      $("[role=combobox]")?.textContent === "POI" ? $("[role=combobox]") : null,
    );
    expect(trigger!.textContent).toBe("POI");
    trigger!.focus();
    press(trigger!, "Enter");
    const option = await until(() =>
      $$("[role=option]").find((node) => node.textContent?.startsWith("POI")),
    );
    expect(labelledBy(option!)).toBe("POI 96");
    const virtual = $$("[role=option]").find(
      (node) => node.textContent === "Virtual",
    )!;
    expect(labelledBy(virtual)).toBe("Virtual");
  });
});
