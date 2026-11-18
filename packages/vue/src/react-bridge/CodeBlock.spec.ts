// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { defineComponent, type Component } from "vue";
import * as Bridge from "./index";
import { $, eventually, mount, until } from "../../test/react-bridge-harness";

// GAP-216 (decision 225) and GAP-212 (decision 224) through the React
// bridge: a CodeBlock region with its copy, @copy its onCopy; Input's edit
// action, an object prop handed to React whole.

const page = (template: string, setup: Record<string, unknown> = {}) =>
  defineComponent({
    components: Bridge as Record<string, Component>,
    setup: () => setup,
    template,
  });

describe("CodeBlock through the bridge (GAP-216)", () => {
  it("draws the code in a named region, and @copy hears the copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const copied = vi.fn();
    mount(
      page(
        `<KozmosCodeBlock label="mergedUnit JSON" code='{ "fid": "f-1209" }'
           :wrap="false" copyable copyLabel="Copy JSON" @copy="copied" />`,
        { copied },
      ),
    );
    const region = await until(() =>
      $('[role="region"][aria-label="mergedUnit JSON"]'),
    );
    expect(region.getAttribute("data-wrap")).toBe("false");
    expect(region.querySelector("pre code")?.textContent).toBe(
      '{ "fid": "f-1209" }',
    );
    const copy = region.querySelector(
      'button[aria-label="Copy JSON"]',
    ) as HTMLButtonElement;
    copy.click();
    await eventually(() =>
      expect(copied).toHaveBeenCalledWith('{ "fid": "f-1209" }'),
    );
    expect(writeText).toHaveBeenCalledWith('{ "fid": "f-1209" }');
  });
});

describe("Input's edit action through the bridge (GAP-212)", () => {
  it("draws the pencil at the field's end and calls onEdit", async () => {
    const onEdit = vi.fn();
    mount(
      page(
        `<KozmosInput label="Map Style" readonly model-value="staff.json"
           :action="{ kind: 'edit', label: 'Edit Map Style', onEdit }" />`,
        { onEdit },
      ),
    );
    const edit = await until(
      () =>
        $('button[aria-label="Edit Map Style"]') as HTMLButtonElement | null,
    );
    expect(edit.previousElementSibling?.tagName).toBe("INPUT");
    edit.click();
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
