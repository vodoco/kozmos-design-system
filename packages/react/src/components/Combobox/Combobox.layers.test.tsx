import React from "react";
import {
  fireEvent,
  render as renderUI,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "./Combobox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "../Dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover";
import { AICompanionPanel } from "../AICompanionPanel";
import { Button } from "../Button";

type Host = "dialog" | "popover" | "assistant";
const render = (ui: React.ReactElement) =>
  renderUI(ui, { wrapper: React.StrictMode });

it("unwinds Combobox, Popover and Dialog in order", async () => {
  const user = userEvent.setup();
  render(
    <Dialog>
      <DialogTrigger asChild>
        <Button>Start</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Journey</DialogTitle>
        <DialogDescription>Choose origin</DialogDescription>
        <Popover>
          <PopoverTrigger asChild>
            <Button>Places</Button>
          </PopoverTrigger>
          <PopoverContent aria-label="Places">
            <Combobox
              label="Origin"
              options={[{ label: "Lobby", value: "lobby" }]}
            />
          </PopoverContent>
        </Popover>
      </DialogContent>
    </Dialog>,
  );
  await user.click(screen.getByRole("button", { name: "Start" }));
  await user.click(screen.getByRole("button", { name: "Places" }));
  const input = screen.getByRole("combobox");
  await user.click(input);
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(screen.getAllByRole("dialog")).toHaveLength(2);
  expect(input).toHaveFocus();
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Places" })).toHaveFocus(),
  );
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Start" })).toHaveFocus(),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("lets the first Escape close the dialog when the open popup has nothing in it", async () => {
  // Loading with no suggestions or commands, and the empty text the same as
  // the helper text, so it is not repeated: the popup is open but empty. It
  // must not take a layer and swallow the first Escape.
  const user = userEvent.setup();
  render(
    <Dialog>
      <DialogTrigger asChild>
        <Button>Start</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Journey</DialogTitle>
        <DialogDescription>Choose origin</DialogDescription>
        <Combobox
          label="Origin"
          options={[]}
          helperText="Searching…"
          emptyText="Searching…"
        />
      </DialogContent>
    </Dialog>,
  );
  await user.click(screen.getByRole("button", { name: "Start" }));
  const input = screen.getByRole("combobox");
  await user.click(input);
  await user.type(input, "lo");
  expect(input).toHaveAttribute("aria-expanded", "false");
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
});

function Fixture({
  host,
  onClose,
  prevent = false,
  empty = false,
}: {
  host: Host;
  onClose: () => void;
  prevent?: boolean;
  empty?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const change = (next: boolean) => {
    setOpen(next);
    if (!next) onClose();
  };
  const field = (
    <Combobox
      label="Origin"
      options={empty ? [] : [{ label: "Lobby", value: "lobby" }]}
      onKeyDown={(event) => {
        if (prevent && event.key === "Escape") event.preventDefault();
      }}
    />
  );
  if (host === "dialog")
    return (
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
  if (host === "popover")
    return (
      <Popover open={open} onOpenChange={change}>
        <PopoverTrigger asChild>
          <Button>Open</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Choose origin">{field}</PopoverContent>
      </Popover>
    );
  return (
    <>
      <Button onClick={() => change(true)}>Open</Button>
      <AICompanionPanel open={open} onClose={() => change(false)}>
        {field}
      </AICompanionPanel>
    </>
  );
}

describe.each<Host>(["dialog", "popover", "assistant"])(
  "Combobox in %s",
  (host) => {
    it.each([false, true])(
      "dismisses only suggestions before its parent (empty=%s)",
      async (empty) => {
        const user = userEvent.setup();
        const close = vi.fn();
        render(<Fixture host={host} onClose={close} empty={empty} />);
        const trigger = screen.getByRole("button", {
          name: "Open",
          exact: true,
        });
        await user.click(trigger);
        const input = screen.getByRole("combobox");
        await user.click(input);
        expect(document.querySelector("[data-combobox-popup]")).not.toBeNull();
        await user.keyboard("{Escape}");
        expect(close).not.toHaveBeenCalled();
        expect(input).toHaveFocus();
        expect(document.querySelector("[data-combobox-popup]")).toBeNull();
        await user.keyboard("{Escape}");
        expect(close).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(trigger).toHaveFocus());
        // Reopening must not leave a stale registration blocking parent dismissal.
        await user.click(trigger);
        await user.click(screen.getByRole("combobox"));
        await user.keyboard("{Escape}{Escape}");
        expect(close).toHaveBeenCalledTimes(2);
      },
    );
    it.each(["ime", "host"])(
      "preserves the popup and parent for %s-owned Escape",
      async (mode) => {
        const user = userEvent.setup();
        const close = vi.fn();
        render(
          <Fixture host={host} onClose={close} prevent={mode === "host"} />,
        );
        await user.click(
          screen.getByRole("button", { name: "Open", exact: true }),
        );
        const input = screen.getByRole("combobox");
        await user.click(input);
        const browserDefaultAllowed = fireEvent.keyDown(input, {
          key: "Escape",
          isComposing: mode === "ime",
        });
        expect(browserDefaultAllowed).toBe(mode === "ime");
        expect(close).not.toHaveBeenCalled();
        expect(screen.getByRole("listbox")).toBeInTheDocument();
        expect(input).toHaveFocus();
      },
    );
    it("returns focus from the popup toggle without reopening suggestions", async () => {
      const user = userEvent.setup();
      const close = vi.fn();
      render(<Fixture host={host} onClose={close} />);
      await user.click(
        screen.getByRole("button", { name: "Open", exact: true }),
      );
      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.tab();
      expect(
        screen.getByRole("button", { name: "Close options" }),
      ).toHaveFocus();
      await user.keyboard("{Escape}");
      expect(close).not.toHaveBeenCalled();
      expect(input).toHaveFocus();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  },
);
