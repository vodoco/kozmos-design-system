import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../ThemeProvider/ThemeProvider";
import { Toaster, toast } from "./Toaster";
import { ToastProvider, Toast, ToastTitle, ToastViewport } from "./Toast";

// The queue is the page's: each test leaves it empty.
afterEach(() => {
  cleanup();
  act(() => toast.dismiss());
});

const toasts = () => Array.from(document.querySelectorAll("li.kozmos-toast"));
const show = (...args: Parameters<typeof toast>) => {
  let id = "";
  act(() => {
    id = toast(...args);
  });
  return id;
};
// Radix's announcement: a visually hidden region it mounts for a second,
// two frames after the toast.
const announcements = () =>
  Array.from(document.querySelectorAll('[role="status"][aria-live]')).filter(
    (node) => !node.closest("li"),
  );

function Page({ children }: { children?: React.ReactNode }) {
  return (
    <ThemeProvider theme="light">
      <button>Save</button>
      <Toaster />
      {children}
    </ThemeProvider>
  );
}

describe("toast() and Toaster", () => {
  it("draws a toast from a call, in the provider's portal, with its words", async () => {
    render(<Page />);
    show("Saved", { description: "Your changes are live." });
    const item = await screen.findByText("Saved");
    expect(item.closest("[data-kozmos-portal]")).not.toBeNull();
    expect(screen.getByText("Your changes are live.")).toBeInTheDocument();
    expect(item.closest("li")).toHaveClass("bg-background", "text-foreground");
  });

  it("draws in its own provider's theme, so a dark module's toasts are dark", async () => {
    render(
      <ThemeProvider theme="light">
        <ThemeProvider theme="dark" dir="rtl">
          <Toaster />
        </ThemeProvider>
      </ThemeProvider>,
    );
    show("Saved");
    const portal = (await screen.findByText("Saved")).closest(
      "[data-kozmos-portal]",
    );
    expect(portal).toHaveAttribute("data-theme", "dark");
    expect(portal).toHaveAttribute("dir", "rtl");
  });

  it("draws each tone's icon in the tone's text colour, and none for neutral", async () => {
    render(
      <ThemeProvider theme="light">
        <Toaster limit={5} />
      </ThemeProvider>,
    );
    const inks = {
      success: "text-success-text",
      info: "text-info-text",
      warning: "text-warning-text",
      critical: "text-destructive-text",
    } as const;
    for (const tone of Object.keys(inks) as (keyof typeof inks)[])
      show(tone, { tone, duration: Infinity });
    show("neutral", { duration: Infinity });
    await screen.findByText("neutral");
    for (const [tone, ink] of Object.entries(inks)) {
      const item = screen.getByText(tone).closest("li")!;
      expect(item).toHaveAttribute("data-tone", tone);
      const icon = item.querySelector("svg[aria-hidden='true']");
      expect(icon, tone).toHaveClass(ink);
    }
    const neutral = screen.getByText("neutral").closest("li")!;
    expect(neutral).toHaveAttribute("data-tone", "neutral");
    // Only the close button's cross.
    expect(neutral.querySelectorAll("svg")).toHaveLength(1);
  });

  it("announces a critical toast assertively and every other tone politely, unless told", async () => {
    render(
      <ThemeProvider theme="light">
        <Toaster limit={10} />
      </ThemeProvider>,
    );
    show("Could not save", { tone: "critical", description: "Try again." });
    show("Saved", { tone: "success" });
    show("Heads up", { tone: "warning" });
    show("Offline", {
      tone: "warning",
      live: "assertive",
      action: { label: "Retry", altText: "Retry from Settings" },
    });
    show("Retrying", { tone: "critical", live: "polite" });
    await waitFor(() =>
      expect(announcements().filter((node) => node.textContent)).toHaveLength(
        5,
      ),
    );
    const said = Object.fromEntries(
      announcements().map((node) => [
        node.textContent,
        node.getAttribute("aria-live"),
      ]),
    );
    expect(said).toEqual({
      // Spaced: Radix joins the toast's text with nothing between.
      "Notification Could not save Try again.": "assertive",
      "Notification Saved": "polite",
      "Notification Heads up": "polite",
      "Notification Offline Retry from Settings": "assertive",
      "Notification Retrying": "polite",
    });
    // Announced once, by Radix's region: the toasts themselves are not live.
    for (const item of toasts()) {
      expect(item).not.toHaveAttribute("role");
      expect(item).not.toHaveAttribute("aria-live");
    }
  });

  it("says a product's own words: the region, the announcement and the close", async () => {
    render(
      <ThemeProvider theme="light">
        <Toaster
          label="Mitteilungen ({hotkey})"
          toastLabel="Mitteilung"
          closeLabel="Mitteilung schließen"
        />
      </ThemeProvider>,
    );
    show("Gespeichert");
    await screen.findByText("Gespeichert");
    expect(
      screen.getByRole("region", { name: "Mitteilungen (F8)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mitteilung schließen" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(announcements().map((node) => node.textContent)).toEqual([
        "Mitteilung Gespeichert",
      ]),
    );
  });

  it("names the close Dismiss notification by default, as the natives do", async () => {
    render(<Page />);
    show("Saved");
    await screen.findByText("Saved");
    expect(
      screen.getByRole("button", { name: "Dismiss notification" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Notifications (F8)" }),
    ).toBeInTheDocument();
  });

  it("does not take focus when a toast shows", async () => {
    render(<Page />);
    const save = screen.getByRole("button", { name: "Save" });
    save.focus();
    show("Saved", { action: { label: "Undo" } });
    await screen.findByText("Saved");
    expect(document.activeElement).toBe(save);
  });

  it("queues past its limit, oldest first, and draws the next as one closes", async () => {
    render(
      <ThemeProvider theme="light">
        <Toaster limit={2} />
      </ThemeProvider>,
    );
    const first = show("One", { duration: Infinity });
    show("Two", { duration: Infinity });
    show("Three", { duration: Infinity });
    await screen.findByText("Two");
    expect(screen.queryByText("Three")).toBeNull();
    act(() => toast.dismiss(first));
    expect(await screen.findByText("Three")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("One")).toBeNull());
  });

  it("closes at its close button, its action and toast.dismiss, calling onDismiss once each", async () => {
    render(<Page />);
    const closed = vi.fn();
    const undo = vi.fn();
    show("A", { duration: Infinity, onDismiss: () => closed("A") });
    show("B", {
      duration: Infinity,
      onDismiss: () => closed("B"),
      action: { label: "Undo", onClick: undo },
    });
    show("C", { duration: Infinity, onDismiss: () => closed("C") });
    await screen.findByText("C");
    const a = screen.getByText("A").closest("li")!;
    fireEvent.click(
      within(a).getByRole("button", { name: "Dismiss notification" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledTimes(1);
    act(() => toast.dismiss());
    act(() => toast.dismiss());
    expect(closed.mock.calls.flat()).toEqual(["A", "B", "C"]);
    await waitFor(() => expect(toasts()).toHaveLength(0));
  });

  it("closes on its own after its duration", async () => {
    vi.useFakeTimers();
    try {
      render(
        <ThemeProvider theme="light">
          <Toaster duration={1000} />
        </ThemeProvider>,
      );
      show("Saved");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      expect(screen.getByText("Saved")).toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });
      expect(screen.queryByText("Saved")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("replaces a toast with the same id in its place in the queue, and says it again", async () => {
    render(
      <ThemeProvider theme="light">
        <Toaster limit={2} />
      </ThemeProvider>,
    );
    const id = show("Saving…", { id: "save", duration: Infinity });
    show("Other", { duration: Infinity });
    show("Waiting", { duration: Infinity });
    expect(id).toBe("save");
    await screen.findByText("Other");
    show("Saved", { id: "save", tone: "success" });
    await screen.findByText("Saved");
    expect(screen.queryByText("Saving…")).toBeNull();
    // Still first in the queue: drawn, while the third still waits.
    expect(screen.queryByText("Waiting")).toBeNull();
    expect(toasts()).toHaveLength(2);
    await waitFor(() =>
      expect(announcements().map((node) => node.textContent)).toContain(
        "Notification Saved",
      ),
    );
  });

  it("keeps a replaced toast's onDismiss: it runs once, when the replacement closes, before the replacement's own", async () => {
    render(<Page />);
    const closed = vi.fn();
    const saving = () => closed("saving");
    show("Saving…", { id: "save", duration: Infinity, onDismiss: saving });
    show("Still saving…", { id: "save", duration: Infinity });
    await screen.findByText("Still saving…");
    expect(closed).not.toHaveBeenCalled();
    // The same function again runs once; a new one runs after it.
    show("Saved", {
      id: "save",
      duration: Infinity,
      onDismiss: saving,
    });
    show("Saved", {
      id: "save",
      duration: Infinity,
      onDismiss: () => closed("saved"),
    });
    act(() => toast.dismiss("save"));
    expect(closed.mock.calls.flat()).toEqual(["saving", "saved"]);
    // Shown again once it has closed, it starts afresh.
    await waitFor(() => expect(toasts()).toHaveLength(0));
    show("Saving…", { id: "save", duration: Infinity });
    act(() => toast.dismiss("save"));
    expect(closed).toHaveBeenCalledTimes(2);
  });

  it("passes its style and classes to the list, so a product can move it clear of a panel", async () => {
    render(
      <ThemeProvider theme="light">
        <Toaster className="kozmos-test-list" style={{ bottom: 24 }} />
      </ThemeProvider>,
    );
    show("User added", { tone: "success" });
    const list = (await screen.findByText("User added")).closest("ol")!;
    expect(list).toHaveClass("kozmos-test-list");
    expect(list.style.bottom).toBe("24px");
  });

  it("is swiped toward the inline end: to the left right to left", async () => {
    render(
      <ThemeProvider theme="light">
        <Toaster />
        <ThemeProvider theme="light" dir="rtl">
          <Toaster id="rtl" />
        </ThemeProvider>
      </ThemeProvider>,
    );
    show("Left to right");
    show("Right to left", { toaster: "rtl" });
    const ltr = (await screen.findByText("Left to right")).closest("li")!;
    const rtl = (await screen.findByText("Right to left")).closest("li")!;
    expect(ltr).toHaveAttribute("data-swipe-direction", "right");
    expect(rtl).toHaveAttribute("data-swipe-direction", "left");
  });

  it("sends a toast to the Toaster it names, in that Toaster's provider", async () => {
    render(
      <>
        <ThemeProvider theme="light">
          <Toaster />
        </ThemeProvider>
        <ThemeProvider theme="dark">
          <Toaster id="module" />
        </ThemeProvider>
      </>,
    );
    show("For the page");
    show("For the module", { toaster: "module" });
    const page = await screen.findByText("For the page");
    const module = await screen.findByText("For the module");
    expect(page.closest("[data-kozmos-portal]")).toHaveAttribute(
      "data-theme",
      "light",
    );
    expect(module.closest("[data-kozmos-portal]")).toHaveAttribute(
      "data-theme",
      "dark",
    );
    expect(screen.getAllByText("For the page")).toHaveLength(1);
    expect(screen.getAllByText("For the module")).toHaveLength(1);
  });

  it("draws a toast once when two Toasters of one id are mounted, and the other takes over when the first goes", async () => {
    function Two({ first }: { first: boolean }) {
      return (
        <>
          {first && (
            <ThemeProvider theme="light">
              <Toaster />
            </ThemeProvider>
          )}
          <ThemeProvider theme="dark">
            <Toaster />
          </ThemeProvider>
        </>
      );
    }
    const { rerender } = render(<Two first />);
    show("Saved", { duration: Infinity });
    await screen.findByText("Saved");
    expect(screen.getAllByText("Saved")).toHaveLength(1);
    expect(
      screen.getByText("Saved").closest("[data-kozmos-portal]"),
    ).toHaveAttribute("data-theme", "light");
    rerender(<Two first={false} />);
    await waitFor(() =>
      expect(
        screen.getByText("Saved").closest("[data-kozmos-portal]"),
      ).toHaveAttribute("data-theme", "dark"),
    );
    expect(screen.getAllByText("Saved")).toHaveLength(1);
  });

  it("keeps a toast shown before any Toaster mounts until one does", async () => {
    show("Early", { duration: Infinity });
    render(<Page />);
    expect(await screen.findByText("Early")).toBeInTheDocument();
  });

  it("leaves the existing parts as they were: a hand-made toast is not a Toaster's", () => {
    render(
      <ThemeProvider theme="light">
        <ToastProvider>
          <Toast open>
            <ToastTitle>By hand</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      </ThemeProvider>,
    );
    const item = screen.getByText("By hand").closest("li")!;
    expect(item).not.toHaveClass("kozmos-toast");
    expect(item).not.toHaveAttribute("data-tone");
    expect(item.closest("[data-kozmos-portal]")).toBeNull();
  });
});
