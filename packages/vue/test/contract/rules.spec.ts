import { describe, expect, it } from "vitest";
import {
  compareMembers,
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

  it("takes update:<prop> alone for a controlled prop, value or open", () => {
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
    // React's own name may stand beside it…
    expect(
      ids({
        react,
        vueProps,
        vueEmits: ["update:open", "openChange", "update:modelValue"],
      }),
    ).toEqual([]);
    // …but never replace it.
    expect(
      ids({ react, vueProps, vueEmits: ["openChange", "update:modelValue"] }),
    ).toEqual(["KozmosPart.update:open:event"]);
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
});
