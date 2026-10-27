import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import {
  Button,
  DesignConfigProvider,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ThemeProvider,
  TourStep,
  type TourStepProps,
  type TourStepTarget,
} from "@kozmos-ds/react";

/**
 * TourStep in the built package, for scripts/check-tour-step.mjs (GAP-188):
 * a page with a "Start tour" button, an "Open a site" target half way across
 * it and a counter of presses on the target, in a provider of the given
 * theme, density and direction. The step points at the target as the mount
 * names it: the element (a ref), a rect, a virtual element, a ref to
 * nothing, or nothing. Two steps, so Next moves the tour on.
 */
interface Mount {
  theme: "light" | "dark";
  density?: "touch" | "compact";
  dir?: "ltr" | "rtl";
  target?: "ref" | "rect" | "virtual" | "missing" | "none";
  side?: TourStepProps["side"];
  align?: TourStepProps["align"];
  /** The step opens with the page, as a tour started by the product does. */
  open?: boolean;
  /** A coachmark: no stepCount, no Back and no Next. */
  coachmark?: boolean;
  /** The coachmark's one action, "Got it", with no dots beside it. */
  coachmarkAction?: boolean;
  /** Under a DesignConfigProvider whose config reduces motion. */
  configReduced?: boolean;
  /** A popover the body opens, to stack above the card. */
  bodyPopover?: boolean;
}

const STEPS = [
  {
    title: "Open a site",
    body: "Each site in this client is listed here.",
    instruction: "Go ahead and open a site to proceed to the next step.",
  },
  {
    title: "Open a building",
    body: "Each building in the site is listed here.",
    instruction: "Go ahead and open a building to proceed to the next step.",
  },
];

interface Controls {
  setInstruction(text: string | null): void;
  open(): void;
  presses(): number;
  closes(): number;
}
let controls: Controls | null = null;
// Where the virtual element is, past the target: moved with nothing else on
// the page changing, as a point on a map is when the map pans.
const offset = { x: 0, y: 0 };

function Page({
  target = "ref",
  side = "bottom",
  align = "center",
  open: openAtStart = true,
  coachmark = false,
  coachmarkAction = false,
  bodyPopover = false,
}: Mount) {
  const site = React.useRef<HTMLButtonElement>(null);
  const nothing = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(openAtStart);
  const [at, setAt] = React.useState(0);
  const [instruction, setInstruction] = React.useState<string | null>(
    STEPS[0].instruction,
  );
  const presses = React.useRef(0);
  const closes = React.useRef(0);
  controls = {
    setInstruction,
    open: () => {
      setAt(0);
      setOpen(true);
    },
    presses: () => presses.current,
    closes: () => closes.current,
  };
  // A rect where the target is, read once; a virtual element that reads it
  // as it is now.
  const [virtual] = React.useState(() => ({
    getBoundingClientRect: () => {
      const box = site.current!.getBoundingClientRect();
      return DOMRect.fromRect({
        x: box.x + offset.x,
        y: box.y + offset.y,
        width: box.width,
        height: box.height,
      });
    },
  }));
  const [rect, setRect] = React.useState<TourStepTarget>(null);
  React.useLayoutEffect(() => {
    const box = site.current!.getBoundingClientRect();
    setRect({
      top: box.top,
      left: box.left,
      width: box.width,
      height: box.height,
    });
  }, []);
  const targets: Record<NonNullable<Mount["target"]>, TourStepTarget> = {
    ref: site,
    rect,
    virtual,
    missing: nothing,
    none: undefined,
  };
  const step = STEPS[at];
  return (
    <div style={{ position: "relative", height: 800 }}>
      <div style={{ padding: 16 }}>
        <Button id="start" variant="ghost" onClick={() => controls?.open()}>
          Start tour
        </Button>
      </div>
      <div style={{ position: "absolute", insetInlineStart: 420, top: 360 }}>
        <Button
          ref={site}
          id="target"
          variant="outline"
          onClick={() => {
            presses.current += 1;
          }}
        >
          Open a site
        </Button>
      </div>
      <TourStep
        id="step"
        open={open}
        target={targets[target]}
        side={side}
        align={align}
        tourLabel={coachmark ? undefined : "How Pointr Cloud is organised"}
        step={at + 1}
        stepCount={coachmark ? undefined : STEPS.length}
        title={coachmark ? "Draw rooms here" : step.title}
        hint={coachmark ? undefined : "Sites are listed by client."}
        instruction={coachmark ? undefined : (instruction ?? undefined)}
        onBack={coachmark || at === 0 ? undefined : () => setAt(at - 1)}
        onNext={
          coachmark
            ? coachmarkAction
              ? () => setOpen(false)
              : undefined
            : () => (at < STEPS.length - 1 ? setAt(at + 1) : setOpen(false))
        }
        nextLabel={
          coachmark ? "Got it" : at < STEPS.length - 1 ? "Next" : "Finish"
        }
        closeLabel={coachmark ? "Dismiss" : "Close tour"}
        onClose={() => {
          closes.current += 1;
          setOpen(false);
        }}
      >
        {coachmark ? "Pick the room tool, then click the corners." : step.body}
        {bodyPopover ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button id="more" size="sm" variant="outline">
                More
              </Button>
            </PopoverTrigger>
            <PopoverContent
              id="more-popover"
              side="top"
              align="start"
              sideOffset={-24}
              aria-label="More"
              style={{ width: 160 }}
            >
              More about sites
            </PopoverContent>
          </Popover>
        ) : null}
      </TourStep>
    </div>
  );
}

let root: Root | null = null;
function mount(options: Mount) {
  root?.unmount();
  root = createRoot(document.getElementById("fixture")!);
  const {
    theme,
    density = "touch",
    dir = "ltr",
    configReduced = false,
  } = options;
  // The provider's direction and density reach its portal, where the card
  // and the dim are drawn.
  flushSync(() =>
    root!.render(
      configReduced ? (
        <DesignConfigProvider
          theme={theme}
          dir={dir}
          density={density}
          persistKey={null}
          config={{ motion: "reduced" }}
        >
          <Page {...options} />
        </DesignConfigProvider>
      ) : (
        <ThemeProvider theme={theme} dir={dir} density={density}>
          <Page {...options} />
        </ThemeProvider>
      ),
    ),
  );
}

declare global {
  interface Window {
    tourStep: {
      mount: typeof mount;
      moveVirtual(x: number, y: number): void;
      setInstruction(text: string | null): void;
      open(): void;
      presses(): number;
      closes(): number;
    };
  }
}
window.tourStep = {
  mount,
  moveVirtual: (x, y) => {
    offset.x = x;
    offset.y = y;
  },
  setInstruction: (text) => controls?.setInstruction(text),
  open: () => controls?.open(),
  presses: () => controls?.presses() ?? 0,
  closes: () => controls?.closes() ?? 0,
};
