// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { defineComponent, type Component } from "vue";
import * as Bridge from "./index";
import { $, mount, until } from "../../test/react-bridge-harness";

// GAP-212 (decision 224) through the React bridge: Input's edit action, an
// object prop handed to React whole. CodeBlock is a native Vue part now:
// test/parity/code-block.parity.spec.ts holds it, and its copy, to React's.

const page = (template: string, setup: Record<string, unknown> = {}) =>
  defineComponent({
    components: Bridge as Record<string, Component>,
    setup: () => setup,
    template,
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
