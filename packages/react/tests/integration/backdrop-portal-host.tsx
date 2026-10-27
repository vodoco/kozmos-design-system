import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import {
  Backdrop,
  BottomSheet,
  BottomSheetContent,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerTitle,
  Navbar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ThemeProvider,
} from "@kozmos-ds/react";

/**
 * A page with a sticky Navbar and a map under it, for
 * scripts/check-backdrop-portal.mjs: the map isolates its stacking as
 * MapView does since site GAP-40 (`isolate`), and holds "Add desk", which a
 * Backdrop rendered inside the map lights, with a step card as its child.
 */
interface Mount {
  isolate?: boolean;
  placement?: "fixed" | "inline";
  /** Inside a modal, with or without a target: #419's review. */
  modal?: "dialog" | "drawer" | "bottomsheet";
  withTarget?: boolean;
  /** A Popover and the backdrop, each opened by window.backdropPortal. */
  layers?: boolean;
}

const counts = { target: 0, card: 0, save: 0 };

function Page({ isolate = false, placement }: Mount) {
  const target = React.useRef<HTMLButtonElement>(null);
  return (
    <>
      <Navbar id="navbar" logo={<span>Pointr Cloud</span>} />
      <div
        id="map"
        className="bg-muted"
        style={{
          position: "relative",
          height: 520,
          isolation: isolate ? "isolate" : undefined,
        }}
      >
        <div style={{ position: "absolute", top: 120, left: 80 }}>
          <Button
            ref={target}
            id="target"
            variant="outline"
            onClick={() => {
              counts.target += 1;
            }}
          >
            Add desk
          </Button>
        </div>
        <Backdrop id="backdrop" target={target} placement={placement}>
          <section
            id="card"
            role="dialog"
            aria-label="Step 1 of 3"
            className="bg-background"
            style={{ position: "absolute", top: 220, left: 80, padding: 16 }}
          >
            <Button
              id="next"
              onClick={() => {
                counts.card += 1;
              }}
            >
              Next
            </Button>
          </section>
        </Backdrop>
      </div>
    </>
  );
}

/** A modal holding Save, Add desk and a Backdrop with a step card. */
function InModal({ modal, withTarget }: Mount) {
  const target = React.useRef<HTMLButtonElement>(null);
  const body = (
    <>
      <Button
        id="save"
        onClick={() => {
          counts.save += 1;
        }}
      >
        Save
      </Button>
      <Button
        ref={target}
        id="target"
        variant="outline"
        onClick={() => {
          counts.target += 1;
        }}
      >
        Add desk
      </Button>
      <Backdrop id="backdrop" target={withTarget ? target : undefined}>
        {withTarget ? (
          <section
            id="card"
            role="dialog"
            aria-label="Step 1 of 3"
            className="bg-background"
            style={{ position: "absolute", bottom: 16, left: 16, padding: 16 }}
          >
            <Button
              id="next"
              onClick={() => {
                counts.card += 1;
              }}
            >
              Next
            </Button>
          </section>
        ) : null}
      </Backdrop>
    </>
  );
  if (modal === "drawer")
    return (
      <Drawer open>
        <DrawerContent>
          <DrawerTitle>Filters</DrawerTitle>
          {body}
        </DrawerContent>
      </Drawer>
    );
  if (modal === "bottomsheet")
    return (
      <BottomSheet open>
        <BottomSheetContent title="Place">{body}</BottomSheetContent>
      </BottomSheet>
    );
  return (
    <Dialog open>
      <DialogContent>
        <DialogTitle>Add a desk</DialogTitle>
        {body}
      </DialogContent>
    </Dialog>
  );
}

const open = { popover: (_: boolean) => {}, backdrop: (_: boolean) => {} };

/** A Popover and a Backdrop, opened in the order the check asks. */
function Layers() {
  const [popover, setPopover] = React.useState(false);
  const [backdrop, setBackdrop] = React.useState(false);
  open.popover = setPopover;
  open.backdrop = setBackdrop;
  return (
    <div style={{ padding: 120 }}>
      <Popover open={popover}>
        <PopoverTrigger asChild>
          <Button id="trigger">Opening hours</Button>
        </PopoverTrigger>
        <PopoverContent id="popover" aria-label="Opening hours">
          Monday to Friday
        </PopoverContent>
      </Popover>
      <Backdrop id="backdrop" visible={backdrop} />
    </div>
  );
}

let root: Root | null = null;
function mount(options: Mount) {
  root?.unmount();
  counts.target = 0;
  counts.card = 0;
  counts.save = 0;
  root = createRoot(document.getElementById("fixture")!);
  flushSync(() =>
    root!.render(
      <ThemeProvider theme="light">
        {options.layers ? (
          <Layers />
        ) : options.modal ? (
          <InModal {...options} />
        ) : (
          <Page {...options} />
        )}
      </ThemeProvider>,
    ),
  );
}

declare global {
  interface Window {
    backdropPortal: {
      mount: typeof mount;
      counts: typeof counts;
      open: typeof open;
    };
  }
}
window.backdropPortal = { mount, counts, open };
