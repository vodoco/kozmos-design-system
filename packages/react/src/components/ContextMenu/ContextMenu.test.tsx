import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ContextMenu";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "../Menu/Menu";

// GAP-155: a right click and the keyboard's context-menu key open the same
// menu, at the pointer or at the item; a long press opens it on touch. Its
// panel and rows are Menu's.
function Tree({
  onSelect,
  onContextMenu,
}: {
  onSelect?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
}) {
  return (
    <>
      <button type="button" id="host">
        Host
      </button>
      <ContextMenu>
        <ContextMenuTrigger onContextMenu={onContextMenu}>
          <div role="tree" aria-label="Map content">
            <div role="treeitem" tabIndex={0} aria-selected="false">
              Gate A12
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={onSelect}>Copy</ContextMenuItem>
          <ContextMenuItem>Paste</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}

const row = () => screen.getByRole("treeitem", { name: "Gate A12" });

describe("ContextMenu (GAP-155)", () => {
  it("opens on a right click, and an item is picked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Tree onSelect={onSelect} />);
    expect(screen.queryByRole("menu")).toBeNull();
    await user.pointer({ keys: "[MouseRight]", target: row() });
    const copy = await screen.findByRole("menuitem", { name: "Copy" });
    await user.click(copy);
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it.each([
    ["the context-menu key", { key: "ContextMenu" }],
    ["Shift+F10", { key: "F10", shiftKey: true }],
  ])("opens from %s at the item that has focus", async (_, key) => {
    const onContextMenu = vi.fn((event: React.MouseEvent) => ({
      x: event.clientX,
      y: event.clientY,
    }));
    render(<Tree onContextMenu={onContextMenu} />);
    const item = row();
    item.getBoundingClientRect = () =>
      DOMRect.fromRect({ x: 40, y: 100, width: 200, height: 32 });
    item.focus();
    // The key is the menu's: the browser does nothing more with it.
    expect(fireEvent.keyDown(item, key)).toBe(false);
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    // At the item: its inline start, below it.
    expect(onContextMenu).toHaveReturnedWith({ x: 40, y: 132 });
  });

  it("opens from the keyboard at the item's inline start right to left", async () => {
    const onContextMenu = vi.fn((event: React.MouseEvent) => event.clientX);
    render(
      <div dir="rtl" style={{ direction: "rtl" }}>
        <Tree onContextMenu={onContextMenu} />
      </div>,
    );
    const item = row();
    item.getBoundingClientRect = () =>
      DOMRect.fromRect({ x: 40, y: 100, width: 200, height: 32 });
    fireEvent.keyDown(item, { key: "ContextMenu" });
    await screen.findByRole("menu");
    expect(onContextMenu).toHaveReturnedWith(240);
  });

  it("cancels the contextmenu event the menu key's keyup fires in the open menu, so the browser's menu stays shut", async () => {
    render(<Tree />);
    fireEvent.keyDown(row(), { key: "ContextMenu" });
    await screen.findByRole("menu");
    // Chromium on Windows fires it at what has focus once the key is up.
    const focused = document.activeElement!;
    expect(focused.closest('[role="menu"]')).not.toBeNull();
    expect(fireEvent.contextMenu(focused)).toBe(false);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("opens from the keyboard at the item's inline start in a dir=auto that resolves right to left", async () => {
    const onContextMenu = vi.fn((event: React.MouseEvent) => event.clientX);
    render(
      <div dir="auto">
        <Tree onContextMenu={onContextMenu} />
      </div>,
    );
    const item = row();
    item.getBoundingClientRect = () =>
      DOMRect.fromRect({ x: 40, y: 100, width: 200, height: 32 });
    // The browser resolves "auto" from the text; jsdom doesn't, so the
    // resolved direction is given as the browser would compute it.
    const computed = window.getComputedStyle;
    const spy = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation((element, pseudo) => {
        const style = computed(element, pseudo);
        return element === item
          ? ({ ...style, direction: "rtl" } as CSSStyleDeclaration)
          : style;
      });
    try {
      fireEvent.keyDown(item, { key: "ContextMenu" });
      await screen.findByRole("menu");
    } finally {
      spy.mockRestore();
    }
    expect(onContextMenu).toHaveReturnedWith(240);
  });

  it("leaves other keys, and F10 without Shift, alone", () => {
    render(<Tree />);
    for (const key of [
      { key: "F10" },
      { key: "F10", shiftKey: true, ctrlKey: true },
      { key: "Enter" },
      { key: "m" },
    ])
      expect(fireEvent.keyDown(row(), key)).toBe(true);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens nothing from the keyboard when disabled, or when the caller handled the key", () => {
    const { rerender } = render(
      <ContextMenu>
        <ContextMenuTrigger disabled>
          <div tabIndex={0}>Gate A12</div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Copy</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    fireEvent.keyDown(screen.getByText("Gate A12"), { key: "ContextMenu" });
    expect(screen.queryByRole("menu")).toBeNull();
    rerender(
      <ContextMenu>
        <ContextMenuTrigger onKeyDown={(event) => event.preventDefault()}>
          <div tabIndex={0}>Gate A12</div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Copy</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    fireEvent.keyDown(screen.getByText("Gate A12"), { key: "ContextMenu" });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens on a long press on touch", async () => {
    vi.useFakeTimers();
    try {
      render(<Tree />);
      fireEvent.pointerDown(row(), { pointerType: "touch" });
      vi.advanceTimersByTime(700);
      vi.useRealTimers();
      expect(await screen.findByRole("menu")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("draws Menu's panel and rows", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Tree />
        <Menu>
          <MenuTrigger>Open</MenuTrigger>
          <MenuContent>
            <MenuItem>Rename</MenuItem>
          </MenuContent>
        </Menu>
      </>,
    );
    await user.pointer({ keys: "[MouseRight]", target: row() });
    const contextPanel = await screen.findByRole("menu");
    const contextRow = screen.getByRole("menuitem", { name: "Copy" });
    const contextClasses = [contextPanel.className, contextRow.className];
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    await user.click(screen.getByRole("button", { name: "Open" }));
    const menuPanel = await screen.findByRole("menu");
    const menuRow = screen.getByRole("menuitem", { name: "Rename" });
    expect(contextClasses).toEqual([menuPanel.className, menuRow.className]);
  });

  it("makes the page inert while it is open, as Menu does, and gives it back", async () => {
    const user = userEvent.setup();
    render(<Tree />);
    await user.pointer({ keys: "[MouseRight]", target: row() });
    await screen.findByRole("menuitem", { name: "Copy" });
    expect(document.getElementById("host")!.closest("[inert]")).not.toBeNull();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.querySelector("[inert]")).toBeNull());
  });
});
