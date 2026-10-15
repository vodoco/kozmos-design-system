import React from "react";
import { createRoot } from "react-dom/client";
import {
  AICompanionPanel,
  Button,
  Combobox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  MultiSelect,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ThemeProvider,
} from "@kozmos-ds/react";

const root = document.getElementById("root")!;
function Fixture() {
  const [open, setOpen] = React.useState(false);
  const [closes, setCloses] = React.useState(0);
  const change = (next: boolean) => {
    setOpen(next);
    if (!next) setCloses((count) => count + 1);
  };
  const field = (
    <Combobox
      label="Origin"
      popupLayout={root.dataset.layout === "inline" ? "inline" : "overlay"}
      options={
        root.dataset.empty === "true" || root.dataset.status === "true"
          ? []
          : [{ label: "Lobby", value: "lobby" }]
      }
      helperText={
        root.dataset.status === "true" ? "Locations unavailable" : undefined
      }
      emptyText={
        root.dataset.status === "true" ? "Locations unavailable" : undefined
      }
      onKeyDown={(event) => {
        if (root.dataset.prevent === "true" && event.key === "Escape")
          event.preventDefault();
      }}
    />
  );
  let content: React.ReactNode;
  // Ten places: more than the popup's 16rem shows, so the listbox scrolls.
  const places = Array.from({ length: 10 }, (_, index) => ({
    label: `Place ${index + 1}`,
    value: `place-${index + 1}`,
  }));
  if (root.dataset.host === "clip")
    // A box that clips its overflow, as a panel, a sheet or a card does: an
    // overlay popup must not be cut off by it (it is in a portal). The inline
    // layout takes its place in the flow and is for content-sized boxes.
    // In a ThemeProvider, as a product has it: its utilities apply, and the
    // popup's portal is the theme's own.
    return (
      <ThemeProvider>
        <div
          data-clip=""
          style={{
            height: root.dataset.layout === "inline" ? "auto" : 120,
            overflow: "hidden",
            border: "1px solid",
          }}
        >
          <Combobox
            label="Origin"
            options={places}
            popupLayout={
              root.dataset.layout === "inline" ? "inline" : "overlay"
            }
          />
          {root.dataset.layout !== "inline" && (
            <MultiSelect label="Tags" options={places} />
          )}
        </div>
      </ThemeProvider>
    );
  if (root.dataset.host === "dialog-multi")
    // A MultiSelect in a modal dialog: the dialog turns pointer events off
    // outside its layers, so the list in its portal must be a layer of its
    // own, or a press on a place lands on the dialog's overlay.
    content = (
      <ThemeProvider>
        <Dialog open={open} onOpenChange={change}>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Choose tags</DialogTitle>
            <DialogDescription>Choose places</DialogDescription>
            <MultiSelect label="Tags" options={places} />
          </DialogContent>
        </Dialog>
      </ThemeProvider>
    );
  else if (root.dataset.host === "dialog")
    content = (
      <Dialog open={open} onOpenChange={change}>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Choose origin</DialogTitle>
          <DialogDescription>Choose a location</DialogDescription>
          {field}
        </DialogContent>
      </Dialog>
    );
  else if (root.dataset.host === "popover")
    content = (
      <Popover open={open} onOpenChange={change}>
        <PopoverTrigger asChild>
          <Button>Open</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Choose origin">{field}</PopoverContent>
      </Popover>
    );
  else
    content = (
      <>
        <Button onClick={() => change(true)}>Open</Button>
        <AICompanionPanel open={open} onClose={() => change(false)}>
          {field}
        </AICompanionPanel>
      </>
    );
  return (
    <>
      {content}
      <span data-close-count="" aria-hidden="true">
        {closes}
      </span>
    </>
  );
}
createRoot(root).render(
  <React.StrictMode>
    <Fixture />
  </React.StrictMode>,
);
