import { createRoot } from "react-dom/client";
import {
  ThemeProvider,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  BottomSheet,
  BottomSheetContent,
  type DrawerSide,
} from "@kozmos-ds/react";

/* The modal surfaces' overlays and panels, each open on its own, for
   check-owned-css: with and without @scope, a Dialog's, a Drawer's on each
   side, inline in a box, and a BottomSheet's overlay must cover what is
   behind it in the theme's scrim, and the panel must sit where it is drawn.
   The check names the part and theme in the page's globals before this runs. */
declare global {
  interface Window {
    kozmosOverlay?: string;
    kozmosOverlayTheme?: "light" | "dark";
    /** A caller's own classes on the panel, for a comparison by hand. */
    kozmosOverlayClassName?: string;
  }
}

function Part({ part }: { part: string }) {
  if (part === "dialog")
    return (
      <Dialog defaultOpen>
        <DialogContent
          data-testid="panel"
          className={window.kozmosOverlayClassName}
        >
          <DialogTitle>Dialog</DialogTitle>
          <DialogDescription>Over the page.</DialogDescription>
        </DialogContent>
      </Dialog>
    );
  if (part === "bottom-sheet")
    return (
      <BottomSheet defaultOpen>
        <BottomSheetContent
          data-testid="panel"
          className={window.kozmosOverlayClassName}
          title="Sheet"
        >
          <p>Over the page.</p>
        </BottomSheetContent>
      </BottomSheet>
    );
  if (part === "drawer-inline")
    // Modal and inline: its scrim and panel are drawn over this box alone.
    return (
      <div
        data-testid="region"
        style={{
          position: "relative",
          marginInlineStart: 40,
          marginTop: 60,
          width: 600,
          height: 400,
        }}
      >
        <Drawer defaultOpen placement="inline" modal>
          <DrawerContent
            data-testid="panel"
            className={window.kozmosOverlayClassName}
            side="right"
          >
            <DrawerTitle>Drawer</DrawerTitle>
            <DrawerDescription>Over the region.</DrawerDescription>
          </DrawerContent>
        </Drawer>
      </div>
    );
  const side = part.replace("drawer-", "") as DrawerSide;
  return (
    <Drawer defaultOpen>
      <DrawerContent
        data-testid="panel"
        className={window.kozmosOverlayClassName}
        side={side}
      >
        <DrawerTitle>Drawer</DrawerTitle>
        <DrawerDescription>Over the page.</DrawerDescription>
      </DrawerContent>
    </Drawer>
  );
}

createRoot(document.getElementById("fixture")!).render(
  <ThemeProvider theme={window.kozmosOverlayTheme ?? "light"}>
    <div data-testid="page">
      <Part part={window.kozmosOverlay ?? "dialog"} />
    </div>
  </ThemeProvider>,
);
