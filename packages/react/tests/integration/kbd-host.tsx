import { createRoot } from "react-dom/client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Kbd,
  Text,
  ThemeProvider,
} from "@kozmos-ds/react";

/**
 * Kbd and ContextMenu in the built package, for scripts/check-kbd.mjs
 * (GAP-156, GAP-155): a hint with a key and a combination, in a button so
 * the browser names it, light and dark; and a context menu over a focusable
 * row, opened from the keyboard.
 */
function Words() {
  return (
    <>
      Press <Kbd>Esc</Kbd> to clear, or <Kbd keys={["Ctrl", "K"]} /> to search.
    </>
  );
}

/** The hint as text, to copy, and in a button, which its content names. */
function Hint({ name }: { name: string }) {
  return (
    <>
      <Text size="sm" data-case={name}>
        <Words />
      </Text>
      <button type="button" data-name={name} style={{ textAlign: "start" }}>
        <Words />
      </button>
    </>
  );
}

function Fixture() {
  return (
    <div style={{ display: "grid", gap: 24, padding: 16 }}>
      <ThemeProvider theme="light">
        <Hint name="light" />
        <ContextMenu>
          <ContextMenuTrigger>
            <div role="tree" aria-label="Map content">
              <div role="treeitem" tabIndex={0} data-case="row">
                Gate A12
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Copy</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </ThemeProvider>
      <ThemeProvider theme="dark">
        <Hint name="dark" />
      </ThemeProvider>
    </div>
  );
}

createRoot(document.getElementById("fixture")!).render(<Fixture />);
