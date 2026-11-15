// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref, type Component } from "vue";
import * as Bridge from "./index";
import {
  $,
  $$,
  choose,
  mount,
  settle,
  until,
} from "../../test/react-bridge-harness";

// GAP-270 through the React bridge: `preview="image"` and v-model. The chosen
// image shows with Change and Remove, and Remove empties the model.

const page = (template: string, setup: () => object = () => ({})) =>
  defineComponent({
    components: Bridge as Record<string, Component>,
    setup,
    template,
  });

describe("FileUpload's image preview through the bridge (GAP-270)", () => {
  const original = {
    create: URL.createObjectURL,
    revoke: URL.revokeObjectURL,
  };
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:kozmos/logo");
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    URL.createObjectURL = original.create;
    URL.revokeObjectURL = original.revoke;
  });

  it("shows the chosen image with Change and Remove, and Remove empties v-model", async () => {
    const files = ref<File[]>([]);
    const logo = new File(["png"], "acme.png", { type: "image/png" });
    mount(
      page(
        `<KozmosFileUpload v-model="files" preview="image" label="Logo" previewAlt="Acme logo" changeLabel="Ändern" />`,
        () => ({ files }),
      ),
    );
    const input = await until(() => $<HTMLInputElement>("input[type=file]"));
    expect(input.getAttribute("accept")).toBe("image/*");
    choose(input, [logo]);
    const image = await until(() => $<HTMLImageElement>("img"));
    expect(image.getAttribute("alt")).toBe("Acme logo");
    expect(image.getAttribute("src")).toBe("blob:kozmos/logo");
    expect(files.value).toEqual([logo]);
    const labels = $$<HTMLButtonElement>("button").map((button) =>
      button.getAttribute("aria-label"),
    );
    expect(labels).toEqual(["Ändern: acme.png", "Remove file: acme.png"]);

    $$<HTMLButtonElement>("button")[1].click();
    await settle();
    await until(() => (files.value.length === 0 ? true : null));
    expect($("img")).toBeNull();
  });
});
