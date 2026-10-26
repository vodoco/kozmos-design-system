import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { Backdrop, ThemeProvider } from "@kozmos-ds/react";

/**
 * Backdrop's cut-out in the built package, for scripts/check-backdrop-target.mjs
 * (GAP-189): a page with a scroller holding "Update", a "Decoy" and a
 * "Publish" below it, and a Backdrop over them that lights what `target`
 * names. Each part is a flat colour, so a pixel says whether it is dimmed.
 * "Update" is `position: relative; z-index: 1`, so the check can see that
 * nothing lifts or moves it.
 */
type TargetName =
  | "update"
  | "publish"
  | "both"
  | "rect"
  | "virtual"
  | "missing"
  | "none";

interface Mount {
  theme: "light" | "dark";
  target: TargetName;
  visible?: boolean;
}

const counts = { update: 0, publish: 0, decoy: 0, backdrop: 0 };
const flat = (background: string) => ({
  display: "block",
  width: 160,
  height: 48,
  border: 0,
  borderRadius: 8,
  background,
  color: "#000000",
  font: "16px sans-serif",
});

let setTarget: (name: TargetName) => void = () => {};

function Page({ theme, target: initial, visible = true }: Mount) {
  const [target, choose] = useState<TargetName>(initial);
  setTarget = choose;
  const update = useRef<HTMLButtonElement>(null);
  const missing = useRef<HTMLElement>(null);
  const [publish, setPublish] = useState<HTMLButtonElement | null>(null);
  const [decoyBox, setDecoyBox] = useState<DOMRect | null>(null);
  const decoy = useRef<HTMLButtonElement>(null);
  const lit =
    target === "update"
      ? update
      : target === "publish"
        ? publish
        : target === "both"
          ? [update, publish]
          : target === "rect"
            ? decoyBox
            : target === "virtual"
              ? {
                  getBoundingClientRect: () =>
                    decoy.current!.getBoundingClientRect(),
                }
              : target === "missing"
                ? missing
                : undefined;
  return (
    <ThemeProvider theme={theme}>
      <main
        style={{
          display: "grid",
          gap: 32,
          width: 360,
          margin: "0 auto",
          padding: 32,
        }}
      >
        <div
          id="scroller"
          style={{ height: 200, overflow: "auto", background: "#ffffff" }}
        >
          <div id="scroller-content" style={{ padding: "72px 24px 400px" }}>
            <button
              id="update"
              ref={update}
              style={{
                ...flat("#ffcc00"),
                position: "relative",
                zIndex: 1,
              }}
              onClick={() => (counts.update += 1)}
            >
              Update
            </button>
          </div>
        </div>
        <button
          id="decoy"
          ref={(node) => {
            decoy.current = node;
            if (node && !decoyBox) setDecoyBox(node.getBoundingClientRect());
          }}
          style={flat("#ffcc00")}
          onClick={() => (counts.decoy += 1)}
        >
          Decoy
        </button>
        <button
          id="publish"
          ref={setPublish}
          style={flat("#33ccff")}
          onClick={() => (counts.publish += 1)}
        >
          Publish
        </button>
      </main>
      <Backdrop
        id="backdrop"
        visible={visible}
        target={target === "none" ? undefined : lit}
        onClick={() => (counts.backdrop += 1)}
      />
    </ThemeProvider>
  );
}

let root: Root | null = null;
function mount(props: Mount) {
  root?.unmount();
  counts.update = counts.publish = counts.decoy = counts.backdrop = 0;
  root = createRoot(document.getElementById("fixture")!);
  flushSync(() => root!.render(<Page {...props} />));
}

declare global {
  interface Window {
    backdropTarget: {
      mount: typeof mount;
      counts: typeof counts;
      retarget: (name: TargetName) => void;
    };
  }
}
window.backdropTarget = {
  mount,
  counts,
  // Synchronously, so the check reads the frame the change starts in.
  retarget: (name) => flushSync(() => setTarget(name)),
};
