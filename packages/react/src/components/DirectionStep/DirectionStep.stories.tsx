import type { Meta, StoryObj } from "@storybook/react";
import {
  ElevatorUp,
  ElevatorDown,
  EscalatorUp,
  EscalatorDown,
  StairsUp,
  StairsDown,
  RampUp,
  RampDown,
  RouteEnter,
  RouteExit,
  type KozmosIconComponent,
} from "@kozmos-ds/icons";
import { DirectionStep, DirectionIcon, DIRECTION_TYPES } from "./DirectionStep";

/** The original navigation artwork awaiting design approval; no default draws it yet. */
const PROPOSED: [string, KozmosIconComponent][] = [
  ["lift-up", ElevatorUp],
  ["lift-down", ElevatorDown],
  ["escalator-up", EscalatorUp],
  ["escalator-down", EscalatorDown],
  ["stairs-up", StairsUp],
  ["stairs-down", StairsDown],
  ["ramp-up", RampUp],
  ["ramp-down", RampDown],
  ["enter", RouteEnter],
  ["exit", RouteExit],
];

const meta: Meta<typeof DirectionStep> = {
  id: "map-directionstep",
  title: "SDK/Navigation/DirectionStep",
  component: DirectionStep,
};

export default meta;
type Story = StoryObj<typeof DirectionStep>;

export const Default: Story = {
  args: {
    type: "straight",
    instruction: "Head North",
    distance: "100m",
  },
};

/**
 * Inspect physical direction at rail, row and guidance sizes in both reading
 * directions: the defaults every direction draws, and the original navigation
 * artwork proposed for lifts, escalators, stairs, ramps and entry, for design
 * to review. The proposed artwork is exported by @kozmos-ds/icons; no default
 * draws it until it is approved.
 */
export const GlyphAtlas: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(["ltr", "rtl"] as const).map((dir) => (
        <div key={dir} dir={dir} className="flex flex-col gap-2">
          <h2>{dir.toUpperCase()}</h2>
          {DIRECTION_TYPES.map((type) => (
            <div
              key={type}
              data-glyph-set="default"
              className="flex items-center gap-4 text-foreground"
            >
              <DirectionIcon type={type} className="h-3.5 w-3.5" />
              <DirectionIcon type={type} className="h-6 w-6" />
              <DirectionIcon type={type} className="h-8 w-8" />
              <span>{type}</span>
            </div>
          ))}
          <h3>Proposed, awaiting design approval</h3>
          {PROPOSED.map(([type, Icon]) => (
            <div
              key={type}
              data-glyph-set="proposed"
              className="flex items-center gap-4 text-foreground"
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              <Icon aria-hidden="true" className="h-6 w-6" />
              <Icon aria-hidden="true" className="h-8 w-8" />
              <span>{type}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** Qualifiers stay in language-owned order, inside the same wrapping sentence. */
export const InstructionParts: Story = {
  args: {
    type: "right",
    lang: "ja",
    instruction: [
      { text: "左側の", role: "secondary" },
      { text: "Bean & Leaf Café", lang: "en" },
      { text: "で右折してください" },
    ],
    distance: "100 m",
  },
};

/** The transitions: a level change by lift, escalator, stairs or something unnamed, a walkway, turning back. */
export const Transitions: Story = {
  render: () => (
    <div className="flex max-w-[360px] flex-col gap-2">
      <DirectionStep
        type="lift-down"
        instruction="Take Elevator down to First Floor"
        distance="58 m"
      />
      <DirectionStep
        type="escalator-up"
        instruction="Take the escalator up to Departures"
      />
      <DirectionStep
        type="stairs-down"
        instruction="Take the stairs down to the platform"
      />
      <DirectionStep type="level-up" instruction="Go up to Level 2" />
      <DirectionStep
        type="transition"
        instruction="Take Walkway to Terminal B"
        distance="40 m"
      />
      <DirectionStep type="turn-back" instruction="Turn back" />
    </div>
  ),
};
