// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, ref } from "vue";
import { KozmosChipInput, KozmosThemeProvider } from "../../src/index";
import { renderBoth, type Drawn } from "./render";
import {
  inBoth,
  keyOn,
  standIns,
  typeInto,
  unmountBoth,
  type Model,
} from "./mounted-both";

/**
 * ChipInput (GAP-222), drawn in both: React's story (its meta draws the
 * field in a box, so the stories check cannot read it), as a server renders
 * it, and the edges React's tests cover (ChipInput.test.tsx): entries and
 * none, disabled and read-only, required, helper text, an error and each
 * status, the remove's words, an app's class, id and description.
 *
 * Then, mounted, each alone in the document: Enter and a comma add the
 * typed text, trimmed; Backspace in the empty field removes the last entry,
 * and none while text is typed; a chip's remove, focus staying in the
 * field; what was added, removed or refused said through the status, in
 * the product's words; a duplicate's text kept; pasted text split at
 * commas and line breaks; Enter in an empty field left to the form;
 * nothing added or removed while disabled or read-only; and v-model and
 * v-model:input-value hearing what React's callbacks hear.
 */
type Props = Record<string, unknown>;
const asVue = ({ className, value, ...rest }: Props) => ({
  ...rest,
  ...(className === undefined ? {} : { class: className }),
  ...(value === undefined ? {} : { modelValue: value }),
});
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const story = {
  label: "Keywords",
  placeholder: "Add a keyword",
  helperText: "Press Enter or type a comma to add one.",
  defaultValue: ["coffee", "breakfast", "wifi"],
};
const both = (props: Props) =>
  renderBoth(
    inTheme({
      react: "div",
      vue: "div",
      props: { className: "w-96" },
      vueProps: { class: "w-96" },
      children: [
        {
          react: KozmosReact.ChipInput,
          vue: KozmosChipInput,
          props,
          vueProps: asVue(props),
        },
      ],
    }),
  );

describe("KozmosChipInput draws what React's ChipInput draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await both(story);
    expect(react).toContain('aria-label="Remove coffee"');
    expect(vue).toBe(react);
  });

  it.each([
    ["no entries", { defaultValue: undefined }],
    ["held entries", { value: ["tea"] }],
    ["disabled", { disabled: true }],
    ["read-only", { readOnly: true }],
    ["required", { required: true }],
    ["a warning", { status: "warning" }],
    ["a success", { status: "success" }],
    ["a boolean error", { error: true }],
    ["an error", { error: "Add one keyword" }],
    ["held text", { inputValue: "te" }],
    ["default text", { defaultInputValue: "te" }],
    ["its own words", { removeLabel: (entry: string) => `Drop ${entry}` }],
    [
      "an app's class, input id and description",
      {
        className: "px-4",
        inputId: "keywords",
        title: "Keywords",
        "aria-describedby": "keywords-note",
        wrapperClassName: "kozmos-parity",
      },
    ],
    ["named by aria-label alone", { label: undefined, "aria-label": "Tags" }],
  ] as const)("a chip input: %s", async (_name, props) => {
    const { react, vue } = await both({ ...story, ...props });
    expect(vue).toBe(react);
  });
});

describe("KozmosChipInput, mounted, as React's", () => {
  beforeAll(standIns);
  afterEach(unmountBoth);
  const input = () => document.querySelector<HTMLInputElement>("input")!;
  const key = (name: string) => keyOn(input(), name);
  const button = (label: string) =>
    document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const paste = (text: string) => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", {
      value: { getData: () => text },
    });
    input().dispatchEvent(event);
  };
  const entries = (start: unknown = ["coffee"], own = false): Model => ({
    prop: "value",
    callback: "onValueChange",
    vueProp: "modelValue",
    listener: "onUpdate:modelValue",
    start,
    own,
  });
  const text = (start = "", own = true): Model => ({
    prop: "inputValue",
    callback: "onInputValueChange",
    vueProp: "inputValue",
    listener: "onUpdate:inputValue",
    start,
    own,
  });

  async function compare(
    props: Props,
    steps: (() => unknown)[],
    models: Model[] = [entries(), text()],
    setLater: Parameters<typeof inBoth>[0]["setLater"] = {},
  ) {
    const all = { label: "Keywords", ...props };
    const result = await inBoth({
      react: KozmosReact.ChipInput,
      vue: KozmosChipInput,
      props: all,
      vueProps: asVue(all),
      models,
      steps,
      setLater,
    });
    const { heard, shots } = result;
    for (const [index, shot] of shots.react.entries())
      expect(shots.vue[index], `after step ${index}`).toBe(shot);
    expect(heard.vue.models).toEqual(heard.react.models);
    expect(heard.vue.events).toEqual(heard.react.events);
    return result;
  }
  const values = (heard: { models: Record<string, unknown[][]> }) =>
    heard.models.value.map(([next]) => next);

  it("adds the typed text on Enter and on a comma, trimmed, and says so", async () => {
    const { heard, shots } = await compare({}, [
      () => input().focus(),
      () => typeInto(input(), "  tea "),
      () => key("Enter"),
      () => typeInto(input(), "wifi, cake"),
    ]);
    expect(values(heard.react)).toEqual([
      ["coffee", "tea"],
      ["coffee", "tea", "wifi"],
    ]);
    expect(shots.react[3]).toContain("tea added");
    expect(heard.react.events.map((event) => event.eventName)).toEqual([
      "entry_added",
      "entry_added",
    ]);
  });

  it("removes the last entry on Backspace in the empty field, none while text is typed; a chip's remove keeps focus in the field", async () => {
    const { heard } = await compare(
      {},
      [
        () => input().focus(),
        () => typeInto(input(), "x"),
        () => key("Backspace"),
        () => typeInto(input(), ""),
        () => key("Backspace"),
        () => button("Remove coffee").click(),
        () => expect(document.activeElement?.localName).toBe("input"),
      ],
      [entries(["coffee", "tea", "wifi"]), text()],
    );
    expect(values(heard.react)).toEqual([["coffee", "tea"], ["tea"]]);
  });

  it("says each change in the product's words, and the same words twice", async () => {
    await compare(
      {
        addedLabel: (entry: string) => `+${entry}`,
        removedLabel: (entry: string) => `-${entry}`,
        duplicateLabel: (entry: string) => `=${entry}`,
        removeLabel: (entry: string) => `Drop ${entry}`,
      },
      [
        () => input().focus(),
        () => typeInto(input(), "tea"),
        () => key("Enter"),
        () => key("Backspace"),
        () => typeInto(input(), "coffee"),
        () => key("Enter"),
        () => key("Enter"),
      ],
    );
  });

  it("splits pasted text at commas and line breaks; Enter in an empty field is the form's", async () => {
    const { shots } = await compare({}, [
      () => input().focus(),
      () => paste("tea\nwifi, cake"),
      () => typeInto(input(), ""),
      () => expect(key("Enter").defaultPrevented).toBe(false),
    ]);
    expect(shots.react[2]).toContain("tea added, wifi added");
  });

  it("adds and removes nothing while disabled or read-only", async () => {
    for (const locked of [{ disabled: true }, { readOnly: true }]) {
      const { heard } = await compare(locked, [
        () => typeInto(input(), "tea"),
        () => key("Enter"),
        () => typeInto(input(), ""),
        () => key("Backspace"),
        () => button("Remove coffee").click(),
      ]);
      expect(values(heard.react)).toEqual([]);
    }
  });

  it("is held by its owner: an entry the owner refuses is not shown", async () => {
    await compare(
      {},
      [() => input().focus(), () => typeInto(input(), "tea,")],
      [entries(["coffee"]), text("", false)],
      { 1: { react: { value: ["coffee"] }, vue: { modelValue: ["coffee"] } } },
    );
  });

  it("v-model and v-model:input-value bind both ways", async () => {
    const chosen = ref(["coffee"]);
    const typed = ref("");
    const host = document.body.appendChild(document.createElement("div"));
    const app = createApp({
      render: () =>
        h(KozmosThemeProvider, null, () =>
          h(KozmosChipInput, {
            label: "Keywords",
            modelValue: chosen.value,
            inputValue: typed.value,
            "onUpdate:modelValue": (next: string[]) => (chosen.value = next),
            "onUpdate:inputValue": (next: string) => (typed.value = next),
          }),
        ),
    });
    app.mount(host);
    await nextTick();
    typeInto(input(), "tea");
    await nextTick();
    expect(typed.value).toBe("tea");
    key("Enter");
    await nextTick();
    expect(chosen.value).toEqual(["coffee", "tea"]);
    expect(typed.value).toBe("");
    chosen.value = [];
    await nextTick();
    expect(document.querySelectorAll("[data-slot=chip]")).toHaveLength(0);
    app.unmount();
  });
});
