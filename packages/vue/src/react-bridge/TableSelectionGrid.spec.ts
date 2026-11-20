// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import React from "react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowSelect,
  TableSelectAll,
} from "@kozmos-ds/react";
import * as Bridge from "./index";
import { $, $$, mount, unmount, until } from "../../test/react-bridge-harness";

const e = React.createElement;

afterEach(unmount);

// Decision 209's Table and Grid through the bridge. The rows are React's,
// below the root, as `children` (GAP-016), so Table's selection reaches
// them in the one React root: `v-model:selectedIds` is the selection
// (GAP-171), a head's `onSort` sorts (GAP-037). A virtualized Grid reports
// its range as `@range-change`, and its default slot draws only those items
// (GAP-172).
const people = ["ada", "grace"];
const rows = (onSort: () => void) => [
  e(
    TableHeader,
    { key: "head" },
    e(TableRow, null, [
      e(TableHead, { key: "all" }, e(TableSelectAll)),
      e(TableHead, { key: "name", onSort, sortDirection: "ascending" }, "Name"),
    ]),
  ),
  e(
    TableBody,
    { key: "body" },
    people.map((id) =>
      e(TableRow, { key: id, rowId: id }, [
        e(TableCell, { key: "select" }, e(TableRowSelect, { label: id })),
        e(TableCell, { key: "name" }, id),
      ]),
    ),
  ),
];

describe("Table's selection and sort through the bridge", () => {
  it("v-model:selectedIds is the selection, both ways", async () => {
    const selected = ref<string[]>(["grace"]);
    mount(() =>
      h(Bridge.KozmosTable, {
        selectable: true,
        selectedIds: selected.value,
        "onUpdate:selectedIds": (ids: string[]) => (selected.value = ids),
        children: rows(() => {}),
      }),
    );
    const grace = await until(() => $('[role=checkbox][aria-label="grace"]'));
    expect(grace.getAttribute("aria-checked")).toBe("true");
    expect(
      $('[role=checkbox][aria-label="Select all rows"]')!.getAttribute(
        "aria-checked",
      ),
    ).toBe("mixed");
    $<HTMLButtonElement>('[role=checkbox][aria-label="ada"]')!.click();
    await until(() => selected.value.length === 2);
    expect(selected.value).toEqual(["grace", "ada"]);
    await until(
      () =>
        $('[role=checkbox][aria-label="Select all rows"]')!.getAttribute(
          "aria-checked",
        ) === "true",
    );
    expect($$("tr[data-state=selected]")).toHaveLength(2);
  });

  it("a head's onSort runs from the bridge's table", async () => {
    const onSort = vi.fn();
    mount(() => h(Bridge.KozmosTable, { children: rows(onSort) }));
    const button = await until(() => $("th[aria-sort=ascending] button"));
    button.click();
    expect(onSort).toHaveBeenCalledTimes(1);
  });
});

describe("Grid virtualized through the bridge", () => {
  it("@range-change reports the window, and the slot draws only it", async () => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.dataset.virtualScroller !== undefined ? 200 : 0;
      },
    );
    const Sites = defineComponent({
      setup() {
        const range = ref({ start: 0, end: 0 });
        return () =>
          h(
            Bridge.KozmosGrid,
            {
              virtualized: true,
              cols: 2,
              gap: 0,
              itemCount: 500,
              rowHeight: 100,
              onRangeChange: (next: { start: number; end: number }) =>
                (range.value = next),
            },
            {
              default: () =>
                Array.from(
                  { length: range.value.end - range.value.start },
                  (_, offset) =>
                    h(
                      "div",
                      { role: "listitem", key: range.value.start + offset },
                      `Site ${range.value.start + offset + 1}`,
                    ),
                ),
            },
          );
      },
    });
    mount(Sites);
    // 200 / 100 = 2 rows in view and 2 below: 4 rows of 2.
    await until(() => $$("[role=listitem]").length === 8);
    await nextTick();
    expect($$("[role=listitem]").map((item) => item.textContent)).toEqual(
      Array.from({ length: 8 }, (_, index) => `Site ${index + 1}`),
    );
    expect($("[role=list]")!.contains($("[role=listitem]"))).toBe(true);
  });
});
