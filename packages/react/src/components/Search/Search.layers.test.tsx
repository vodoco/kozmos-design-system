import React from "react";
import { render as renderUI, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Search } from "./Search";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../Dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover";
import { Button } from "../Button";

const render = (ui: React.ReactElement) =>
  renderUI(ui, { wrapper: React.StrictMode });

// A Dialog's and a Popover's Escape is heard on the document before the
// field hears it (Radix's useEscapeKeydown, capture). A clearable Search
// holding text is the top layer while it has the focus, so the first
// Escape clears it and the next closes what holds it (GAP-161).

function InDialog({ onClear }: { onClear: () => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Find</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Find a place</DialogTitle>
        <DialogDescription>Search the venue</DialogDescription>
        <Search
          aria-label="Place"
          defaultValue="Gate"
          clearable
          onClear={onClear}
        />
        <Button>Done</Button>
      </DialogContent>
    </Dialog>
  );
}

it("in a Dialog, the first Escape clears the field and the second closes the dialog", async () => {
  const user = userEvent.setup();
  const onClear = vi.fn();
  render(<InDialog onClear={onClear} />);
  await user.click(screen.getByRole("button", { name: "Find" }));
  const field = screen.getByRole("searchbox");
  await user.click(field);
  await user.keyboard("{Escape}");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(field).toHaveValue("");
  expect(field).toHaveFocus();
  expect(onClear).toHaveBeenCalledTimes(1);
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(onClear).toHaveBeenCalledTimes(1);
});

it("in a Dialog, Escape away from the field still closes it, and keeps the text", async () => {
  const user = userEvent.setup();
  const onClear = vi.fn();
  render(<InDialog onClear={onClear} />);
  await user.click(screen.getByRole("button", { name: "Find" }));
  await user.click(screen.getByRole("searchbox"));
  await user.click(screen.getByRole("button", { name: "Done" }));
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(onClear).not.toHaveBeenCalled();
});

it("in a Popover, the first Escape clears the field and the second closes the popover", async () => {
  const user = userEvent.setup();
  render(
    <Popover>
      <PopoverTrigger asChild>
        <Button>Filter</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Filter">
        <Search aria-label="Place" defaultValue="Gate" clearable />
      </PopoverContent>
    </Popover>,
  );
  await user.click(screen.getByRole("button", { name: "Filter" }));
  const field = screen.getByRole("searchbox");
  await user.click(field);
  await user.keyboard("{Escape}");
  expect(screen.getByRole("dialog", { name: "Filter" })).toBeInTheDocument();
  expect(field).toHaveValue("");
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Filter" })).toBeNull(),
  );
});
