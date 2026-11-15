import * as React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./Tooltip";
import { ToggleButton } from "../ToggleButton/ToggleButton";
import { Switch } from "../Switch/Switch";
import { Checkbox } from "../Checkbox/Checkbox";
import { RadioGroup, RadioGroupItem } from "../Radio/Radio";
import { Tabs, TabsList, TabsTrigger } from "../Tabs/Tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../Accordion/Accordion";

/*
 * GAP-261. TooltipTrigger asChild writes the tooltip's data-state (closed,
 * delayed-open, instant-open) onto its child, over the part's own, so a look
 * keyed on data-state is lost on a part that is a tooltip's trigger: a
 * pressed ToggleButton drew unpressed. Each part's state look is read from
 * its ARIA state, which no trigger writes. check-owned-css measures the
 * drawn look in three engines; this holds the contract: the trigger's
 * data-state is the tooltip's, the ARIA state is the part's, and no class
 * on the part, or read from it by a child (group-), keys on data-state.
 */
function inTooltip(child: React.ReactElement) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild data-testid="trigger">
          {child}
        </TooltipTrigger>
        <TooltipContent>Tip</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const cases: [string, () => React.ReactElement, string, string][] = [
  [
    "a pressed ToggleButton",
    () => <ToggleButton aria-label="Bold" defaultPressed />,
    "aria-pressed",
    "true",
  ],
  [
    "an outline pressed ToggleButton",
    () => <ToggleButton aria-label="Bold" variant="outline" defaultPressed />,
    "aria-pressed",
    "true",
  ],
  [
    "an on Switch",
    () => <Switch aria-label="Wi-Fi" defaultChecked />,
    "aria-checked",
    "true",
  ],
  [
    "an on Switch with an error",
    () => <Switch aria-label="Wi-Fi" defaultChecked error />,
    "aria-checked",
    "true",
  ],
  [
    "a checked Checkbox",
    () => <Checkbox aria-label="Agree" checked />,
    "aria-checked",
    "true",
  ],
  [
    "an indeterminate Checkbox",
    () => <Checkbox aria-label="All" checked="indeterminate" />,
    "aria-checked",
    "mixed",
  ],
];

describe("a part whose look is its state, as a tooltip's trigger (GAP-261)", () => {
  // The part's own classes on data-state, and its children's that read the
  // part's (group-data-[state=…]). A child's data-[state=…] reads the
  // child's own data-state, which Radix writes and no trigger touches.
  const keyed = (node: Element) => [
    ...[...node.classList].filter((name) =>
      /data-\[state=|\[data-state=/.test(name),
    ),
    ...[...node.querySelectorAll("*")]
      .flatMap((at) => [...at.classList])
      .filter((name) => name.includes("group-data-[state=")),
  ];

  it.each(cases)(
    "%s keeps its state where a trigger cannot write it",
    (_, part, attribute, state) => {
      const { getByTestId } = render(inTooltip(part()));
      const trigger = getByTestId("trigger");
      expect(trigger).toHaveAttribute("data-state", "closed");
      expect(trigger).toHaveAttribute(attribute, state);
      expect(keyed(trigger)).toEqual([]);
    },
  );

  it.each(["default", "card", "tile"] as const)(
    "a chosen %s radio keeps its state where a trigger cannot write it",
    (variant) => {
      const { getByTestId } = render(
        <RadioGroup defaultValue="a" aria-label="Floors">
          {inTooltip(
            <RadioGroupItem value="a" variant={variant} label="Level 1" />,
          )}
        </RadioGroup>,
      );
      const trigger = getByTestId("trigger");
      expect(trigger).toHaveAttribute("data-state", "closed");
      expect(trigger).toHaveAttribute("aria-checked", "true");
      expect(keyed(trigger)).toEqual([]);
    },
  );

  it("an active tab keeps its state where a trigger cannot write it", () => {
    const { getByTestId } = render(
      <Tabs defaultValue="a">
        <TabsList>
          {inTooltip(<TabsTrigger value="a">Map</TabsTrigger>)}
        </TabsList>
      </Tabs>,
    );
    const trigger = getByTestId("trigger");
    expect(trigger).toHaveAttribute("data-state", "closed");
    expect(trigger).toHaveAttribute("aria-selected", "true");
    expect(keyed(trigger)).toEqual([]);
  });

  // The boxed trigger's open look is owned CSS, which jsdom does not draw:
  // check-owned-css measures it in three engines.
  it("an open accordion trigger keeps its state where a trigger cannot write it", () => {
    const { getByTestId } = render(
      <Accordion type="single" defaultValue="a">
        <AccordionItem value="a">
          {inTooltip(<AccordionTrigger>Hours</AccordionTrigger>)}
          <AccordionContent>9–5</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const trigger = getByTestId("trigger");
    expect(trigger).toHaveAttribute("data-state", "closed");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(keyed(trigger)).toEqual([]);
  });
});
