import { describe, expect, it } from "vitest";
import {
  compareMembers,
  typesAgree,
  type PortContract,
  type ReactMember,
  type VueProp,
} from "./read-contract";

/**
 * The contract's rules on parts not ported yet, as React declares them:
 * each case is what a real React part takes (named), against a Vue port that
 * says it rightly or wrongly. `contract.spec.ts` runs the rules on the ports.
 */
const member = (
  name: string,
  type: string,
  extra: Partial<ReactMember> = {},
): ReactMember => ({
  name,
  type,
  required: false,
  origin: "kozmos",
  default: null,
  // As the compiler would read these simple types.
  callable: /=>/.test(type),
  returnsNode: /=>\s*React\.ReactNode/.test(type),
  ...extra,
});
const prop = (name: string, extra: Partial<VueProp> = {}): VueProp => ({
  name,
  required: false,
  hasDefault: true,
  default: undefined,
  isBoolean: false,
  ...extra,
});
const contract = (part: Partial<PortContract>): PortContract => ({
  port: { vue: "KozmosPart", react: "Part", stories: null },
  react: [],
  reactAttributes: [],
  reactElement: null,
  reactDefaults: new Map(),
  vueProps: [],
  vueEmits: [],
  vueSlots: [],
  ...part,
});
const ids = (part: Partial<PortContract>) =>
  compareMembers(contract(part)).map((finding) => finding.id);

describe("the contract's rules", () => {
  it("asks a part with no node props for typed slots too", () => {
    // A Vue Switch drawing slots.default?.() with no SlotsType.
    expect(
      ids({
        react: [member("checked", "boolean")],
        vueProps: [prop("checked")],
        vueSlots: null,
      }),
    ).toEqual(["KozmosPart.slots"]);
    expect(
      ids({
        react: [member("checked", "boolean")],
        vueProps: [prop("checked")],
        vueSlots: [{ name: "default", required: false }],
      }),
    ).toEqual(["KozmosPart.default:extra-slot"]);
  });

  it("tells a function default from React's none, and reads every default", () => {
    expect(
      ids({
        react: [member("format", "(value: number) => string")],
        vueProps: [prop("format", { default: (v: number) => `${v}` })],
      }),
    ).toEqual(["KozmosPart.format:default"]);
    // A default that is not a literal (RoutingInputGroup's, CategoryField's)
    // is never read as none: it is stated as an exception.
    expect(
      ids({
        react: [member("tint", "string", { default: "DEFAULT_TINT" })],
        vueProps: [prop("tint")],
      }),
    ).toEqual(["KozmosPart.tint:default"]);
    expect(
      ids({
        react: [
          member("label", "string", {
            default:
              '"Remove this point from the route, and every leg after it, when you press it"',
          }),
        ],
        vueProps: [
          prop("label", {
            default:
              "Remove this point from the route, and every leg after it, when you press it",
          }),
        ],
      }),
    ).toEqual([]);
  });

  it("gives a form field v-model, though React's value is an attribute", () => {
    // Input: its value and onChange are the input element's.
    const input = {
      reactElement: "HTMLInputElement",
      reactAttributes: ["value", "onChange", "disabled"],
    };
    expect(ids(input)).toEqual([
      "KozmosPart.modelValue:prop",
      "KozmosPart.update:modelValue:event",
    ]);
    expect(
      ids({
        ...input,
        vueProps: [prop("modelValue")],
        vueEmits: ["update:modelValue"],
      }),
    ).toEqual([]);
    // A button's value is an attribute, not a model.
    expect(
      ids({
        reactElement: "HTMLButtonElement",
        reactAttributes: ["value", "onChange"],
      }),
    ).toEqual([]);
  });

  it("takes update:<prop>, and only that, for a controlled prop, value or open", () => {
    const react = [
      member("open", "boolean"),
      member("onOpenChange", "(open: boolean) => void"),
      member("value", "string"),
      member("onValueChange", "(value: string) => void"),
    ];
    const vueProps = [prop("open"), prop("modelValue")];
    expect(
      ids({ react, vueProps, vueEmits: ["update:open", "update:modelValue"] }),
    ).toEqual([]);
    // React's own name beside it says the same thing twice (decision 160)…
    expect(
      ids({
        react,
        vueProps,
        vueEmits: ["update:open", "openChange", "update:modelValue"],
      }),
    ).toEqual(["KozmosPart.openChange:duplicate-event"]);
    // …and in its place leaves v-model without its event.
    expect(
      ids({
        react,
        vueProps,
        vueEmits: ["openChange", "update:modelValue"],
      }).sort(),
    ).toEqual([
      "KozmosPart.openChange:duplicate-event",
      "KozmosPart.update:open:event",
    ]);
  });

  it("asks for an event in camelCase, so its handler is React's", () => {
    const react = [member("onStartNavigation", "() => void")];
    expect(ids({ react, vueEmits: ["startNavigation"] })).toEqual([]);
    const [finding] = compareMembers(
      contract({ react, vueEmits: ["start-navigation"] }),
    );
    expect(finding.id).toBe("KozmosPart.onStartNavigation:event");
    expect(finding.message).toContain("declare `startNavigation`");
  });

  it("reads a node only at a prop's top level", () => {
    // BottomNavigation's items carry icons, and are data.
    expect(
      ids({
        react: [
          member("items", "{ label: string; icon: React.ReactNode }[]", {
            required: true,
          }),
        ],
        vueProps: [prop("items", { required: true })],
      }),
    ).toEqual([]);
    expect(
      ids({
        react: [member("icon", "string | React.ReactNode")],
        vueSlots: [{ name: "icon", required: false }],
      }),
    ).toEqual([]);
    expect(
      ids({
        react: [member("icon", "React.ReactNode")],
        vueProps: [prop("icon")],
      }),
    ).toEqual(["KozmosPart.icon:slot", "KozmosPart.icon:extra-prop"]);
  });

  it("accepts a part that takes only slots", () => {
    // A CardFooter-like part: children, and nothing else.
    expect(
      ids({
        react: [member("children", "React.ReactNode", { required: true })],
        vueSlots: [{ name: "default", required: true }],
      }),
    ).toEqual([]);
  });

  it("asks a Boolean prop for its default", () => {
    expect(
      ids({
        react: [member("open", "boolean")],
        vueProps: [prop("open", { isBoolean: true, hasDefault: false })],
      }),
    ).toEqual(["KozmosPart.open:boolean"]);
  });
  it("takes Kozmos's own onChange as a controlled value's change", () => {
    // SearchBar, OTPInput, Rating: value and onChange(value), Kozmos's own.
    const react = [
      member("value", "string"),
      member("onChange", "(value: string) => void"),
    ];
    expect(
      ids({
        react,
        vueProps: [prop("modelValue")],
        vueEmits: ["update:modelValue"],
      }),
    ).toEqual([]);
    expect(
      ids({
        react,
        vueProps: [prop("modelValue")],
        vueEmits: ["update:modelValue", "change"],
      }),
    ).toEqual(["KozmosPart.change:duplicate-event"]);
  });

  it("keeps a value nothing controls as `value`", () => {
    // TabsTrigger, AccordionItem, SelectItem: an identity, not a model.
    const react = [member("value", "string", { required: true })];
    expect(
      ids({ react, vueProps: [prop("value", { required: true })] }),
    ).toEqual([]);
    expect(
      ids({ react, vueProps: [prop("modelValue", { required: true })] }).sort(),
    ).toEqual(["KozmosPart.modelValue:extra-prop", "KozmosPart.value:prop"]);
  });

  it("reads a callback by what it is, not by how its type is written", () => {
    // DialogContent's onOpenAutoFocus is typed through Radix's aliases.
    const react = [
      member("onOpenAutoFocus", "DismissableLayerProps['onOpenAutoFocus']", {
        callable: true,
        origin: "radix",
      }),
    ];
    expect(ids({ react, vueEmits: ["openAutoFocus"] })).toEqual([]);
    expect(ids({ react, vueProps: [prop("onOpenAutoFocus")] })).toEqual([
      "KozmosPart.onOpenAutoFocus:event",
      "KozmosPart.onOpenAutoFocus:extra-prop",
    ]);
  });

  it("leaves DOM events to fall through, and reads React's defaults on DOM attributes", () => {
    const button = {
      reactElement: "HTMLButtonElement",
      reactAttributes: ["type", "onClick", "disabled"],
      reactDefaults: new Map([["type", '"button"']]),
    };
    expect(ids({ ...button, vueEmits: ["click"] })).toEqual([
      "KozmosPart.click:dom-event",
    ]);
    // AISearchButton's `type = "button"`.
    expect(
      ids({ ...button, vueProps: [prop("type", { default: "button" })] }),
    ).toEqual([]);
    expect(ids({ ...button, vueProps: [prop("type")] })).toEqual([
      "KozmosPart.type:default",
    ]);
  });

  it("asks a render prop's port to decide its slot's props", () => {
    // BrowseCategoriesPanel's renderIcon(category).
    const react = [
      member(
        "renderIcon",
        "(category: CategoryPresentation) => React.ReactNode",
      ),
    ];
    expect(
      ids({ react, vueSlots: [{ name: "renderIcon", required: false }] }),
    ).toEqual(["KozmosPart.renderIcon:render-prop"]);
  });
  it("compares a callback's arguments by position, and a DOM attribute's type as a range", () => {
    // Accordion: Radix's single or multiple onValueChange; one Vue event
    // carries either.
    expect(
      typesAgree(
        "Args<[string] | [string[]]>",
        "Args<[value: string | string[]]>",
      ),
    ).toBe(true);
    // Without Args, the two shapes differ: the helper is what accepts it.
    expect(
      typesAgree("[string] | [string[]]", "[value: string | string[]]"),
    ).toBe(false);
    expect(typesAgree("Args<[x: string]>", "Args<[x: number]>")).toBe(false);
    expect(
      typesAgree("Args<[x: string]>", "Args<[x: string, y: number]>"),
    ).toBe(false);
    // A field reports a string, within what React's value attribute takes.
    expect(
      typesAgree("[string]", "[string | number | readonly string[]]", "within"),
    ).toBe(true);
    expect(typesAgree("[boolean]", "[string | number]", "within")).toBe(false);
    expect(typesAgree("string", "string | number")).toBe(false);
  });
});
