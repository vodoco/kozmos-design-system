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
  Popover,
  PopoverContent,
  PopoverTrigger,
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
  if (root.dataset.host === "dialog")
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
