import * as React from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
  ThemeProvider,
} from "@kozmos-ds/react";

// GAP-190: popovers the product opens, beside a control they do not own
// (scripts/check-popover-anchor.mjs). `#root[data-mode]` picks the case; every
// popover is written as the docs write it, with no focus handler of its own.
type Side = "top" | "right" | "bottom" | "left";

declare global {
  interface Window {
    openStep?: (side: Side) => void;
    moveFeature?: (x: number, y: number) => void;
    openFeature?: () => void;
    tourLog?: string[];
  }
}

function TourStep() {
  const [side, setSide] = React.useState<Side | null>(null);
  window.openStep = (next) => setSide(next);
  return (
    <Popover
      open={side !== null}
      onOpenChange={(open) => {
        if (!open) setSide(null);
      }}
    >
      <div
        id="scroller"
        style={{ height: 360, overflowY: "auto", position: "relative" }}
      >
        <div style={{ height: 600, paddingTop: 160 }}>
          {/* Half the window in from the start, so a resize moves it. */}
          <div id="row" style={{ paddingInlineStart: "45%" }}>
            <PopoverAnchor asChild>
              <Button variant="outline" id="target">
                Add desk
              </Button>
            </PopoverAnchor>
          </div>
        </div>
      </div>
      <PopoverContent
        id="step"
        side={side ?? "bottom"}
        sideOffset={8}
        avoidCollisions={false}
        aria-label="Step 1 of 3"
        style={{ width: 192 }}
      >
        <Button size="sm">Next</Button>
      </PopoverContent>
    </Popover>
  );
}

function MapFeature() {
  const map = React.useRef<HTMLDivElement>(null);
  const point = React.useRef({ x: 120, y: 60 });
  const [open, setOpen] = React.useState(false);
  window.openFeature = () => setOpen(true);
  window.moveFeature = (x, y) => {
    point.current = { x, y };
  };
  const feature = React.useRef({
    getBoundingClientRect: () => {
      const box = map.current!.getBoundingClientRect();
      return DOMRect.fromRect({
        x: box.left + point.current.x,
        y: box.top + point.current.y,
        width: 0,
        height: 0,
      });
    },
  });
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        ref={map}
        id="map"
        style={{ height: 240, position: "relative" }}
        className="bg-muted"
      />
      <PopoverAnchor virtualRef={feature} />
      <PopoverContent
        id="feature"
        side="top"
        sideOffset={12}
        avoidCollisions={false}
        updatePositionStrategy="always"
        aria-label="Reception desk"
        style={{ width: 192 }}
      >
        Reception desk
      </PopoverContent>
    </Popover>
  );
}

// Two steps, one Popover each: step 1's Next closes it and opens step 2.
function Tour() {
  const [step, setStep] = React.useState(0);
  const log = (window.tourLog ??= []);
  const steps = [
    { target: "Add desk", label: "Step 1 of 2", action: "Next" },
    { target: "Choose a floor", label: "Step 2 of 2", action: "Done" },
  ];
  return (
    <div style={{ display: "flex", gap: 240, padding: 120 }}>
      <Button id="start" variant="outline" onClick={() => setStep(1)}>
        Start tour
      </Button>
      {steps.map(({ target, label, action }, index) => (
        <Popover
          key={label}
          open={step === index + 1}
          onOpenChange={(open) => {
            log.push(`${index + 1} onOpenChange(${open})`);
            if (!open) setStep(0);
          }}
        >
          <PopoverAnchor asChild>
            <Button id={`target-${index + 1}`}>{target}</Button>
          </PopoverAnchor>
          <PopoverContent id={`step-${index + 1}`} aria-label={label}>
            <Button
              size="sm"
              onClick={() => setStep(index + 2 > steps.length ? 0 : index + 2)}
            >
              {action}
            </Button>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}

// PopoverTrigger keeps Radix's own focus handling: Escape gives the trigger
// its focus back; a press outside leaves focus where the press put it.
function Triggered() {
  return (
    <div style={{ padding: 120 }}>
      <Popover>
        <PopoverTrigger asChild>
          <Button id="trigger">Open panel</Button>
        </PopoverTrigger>
        <PopoverContent id="panel" aria-label="Panel">
          <Button size="sm">Inside</Button>
        </PopoverContent>
      </Popover>
      <div id="blank" style={{ height: 300 }} />
    </div>
  );
}

// A point on a map that sits in a scrolling panel: the rect names the map's
// canvas as its contextElement, so the popover follows the panel's scroll and
// hides, with hideWhenDetached, once the point leaves the panel.
function MapInPanel() {
  const canvas = React.useRef<HTMLDivElement>(null);
  const point = React.useRef({
    getBoundingClientRect: () => {
      const box = canvas.current!.getBoundingClientRect();
      return DOMRect.fromRect({
        x: box.left + 160,
        y: box.top + 200,
        width: 0,
        height: 0,
      });
    },
    get contextElement() {
      return canvas.current ?? undefined;
    },
  });
  return (
    <Popover open>
      <div
        id="panel-box"
        style={{ height: 300, width: 360, overflowY: "auto", marginTop: 40 }}
      >
        <div
          ref={canvas}
          id="canvas"
          className="bg-muted"
          style={{ height: 900 }}
        />
      </div>
      <PopoverAnchor virtualRef={point} />
      <PopoverContent
        id="pin"
        side="top"
        sideOffset={8}
        hideWhenDetached
        onOpenAutoFocus={(event) => event.preventDefault()}
        aria-label="Lift"
        style={{ width: 120 }}
      >
        Lift
      </PopoverContent>
    </Popover>
  );
}

// Collisions on: a step asked for below a control at the window's foot
// flips above it.
function Flip() {
  return (
    <Popover open>
      <div style={{ position: "fixed", bottom: 16, left: 200 }}>
        <PopoverAnchor asChild>
          <Button id="foot">Settings</Button>
        </PopoverAnchor>
      </div>
      <PopoverContent
        id="flipped"
        side="bottom"
        sideOffset={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        aria-label="Settings hint"
        style={{ width: 192, height: 120 }}
      >
        Settings live here.
      </PopoverContent>
    </Popover>
  );
}

// Right to left, align="start" lines the popover's right edge up with the
// control's.
function Rtl() {
  return (
    <div style={{ padding: 200 }}>
      <Popover open>
        <PopoverAnchor asChild>
          <Button id="rtl-target">Add desk</Button>
        </PopoverAnchor>
        <PopoverContent
          id="rtl-step"
          side="bottom"
          align="start"
          sideOffset={8}
          avoidCollisions={false}
          onOpenAutoFocus={(event) => event.preventDefault()}
          aria-label="RTL step"
          style={{ width: 192 }}
        >
          Step
        </PopoverContent>
      </Popover>
    </div>
  );
}

const root = document.getElementById("root")!;
const mode = root.dataset.mode ?? "step";
createRoot(root).render(
  <ThemeProvider theme="light" dir={mode === "rtl" ? "rtl" : undefined}>
    <main>
      {mode === "step" && (
        <>
          <TourStep />
          <MapFeature />
        </>
      )}
      {mode === "tour" && <Tour />}
      {mode === "trigger" && <Triggered />}
      {mode === "context" && <MapInPanel />}
      {mode === "flip" && <Flip />}
      {mode === "rtl" && <Rtl />}
    </main>
  </ThemeProvider>,
);
