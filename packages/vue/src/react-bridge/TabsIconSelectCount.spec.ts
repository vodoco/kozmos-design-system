// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { h } from "vue";
import React from "react";
import { TabsList, TabsTrigger } from "@kozmos-ds/react";
import * as Bridge from "./index";
import { $, $$, mount, unmount, until } from "../../test/react-bridge-harness";

const e = React.createElement;

afterEach(unmount);

// React's parts below the root reach Vue as `children` (GAP-016), so the
// tab's icon (GAP-152) is React's prop through the bridge. Select's count
// (GAP-164) is the native KozmosSelectItem's `#count` since wave V2
// (select.parity.spec.ts).
describe("Tabs' icon through the bridge", () => {
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
});
