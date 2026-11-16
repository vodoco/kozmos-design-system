import type { Meta, StoryObj } from "@storybook/react";
import {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
} from "./Toast";
import { Toaster, toast, type ToastOptions } from "./Toaster";
import { Button } from "../Button/Button";
import { useEffect, useState } from "react";

const meta: Meta<typeof Toast> = {
  id: "feedback-toast",
  title: "Core/Feedback/Toast",
  component: Toast,
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <ToastProvider>
        <Button onClick={() => setOpen(true)}>Show Toast</Button>
        <Toast open={open} onOpenChange={setOpen}>
          <div className="grid gap-1">
            <ToastTitle>Scheduled: Catch up</ToastTitle>
            <ToastDescription>
              Friday, February 10, 2023 at 5:57 PM
            </ToastDescription>
          </div>
          <ToastAction altText="Goto schedule">Undo</ToastAction>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
  },
};

/**
 * The toast as it shows, so a drawing holds its surface: background/0 under
 * the foreground ink, as SwiftUI and Compose draw it. It stays until it is
 * closed, so the visual review sees it.
 */
export const Open: Story = {
  render: () => (
    <ToastProvider duration={Infinity}>
      <Toast defaultOpen>
        <div className="grid gap-1">
          <ToastTitle>Scheduled: Catch up</ToastTitle>
          <ToastDescription>
            Friday, February 10, 2023 at 5:57 PM
          </ToastDescription>
        </div>
        <ToastAction altText="Goto schedule">Undo</ToastAction>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
};

/**
 * The close shown the whole time, `visible="always"` (GAP-268), beside one
 * shown on hover or focus, the default: a visitor who never hovers a toast
 * still sees how to close it. The Toaster's `closeVisible`, or a toast's own,
 * says the same for toast().
 */
export const CloseAlwaysVisible: Story = {
  name: "Close always visible",
  render: () => (
    <ToastProvider duration={Infinity}>
      <Toast defaultOpen>
        <div className="grid gap-1">
          <ToastTitle>Units merged</ToastTitle>
          <ToastDescription>The merge is saved as a draft.</ToastDescription>
        </div>
        <ToastClose visible="always" />
      </Toast>
      <Toast defaultOpen>
        <div className="grid gap-1">
          <ToastTitle>Scheduled: Catch up</ToastTitle>
          <ToastDescription>Hover it to show its close.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
};

// One of each tone, in the words a venue's app would use.
const TONED: [string, ToastOptions][] = [
  ["Route copied", { description: "Paste it into a message." }],
  [
    "Location saved",
    { tone: "success", description: "Find it in your saved places." },
  ],
  [
    "New floor plan",
    { tone: "info", description: "Level 2 was updated today." },
  ],
  [
    "Location is approximate",
    { tone: "warning", description: "Move near a window for a closer fix." },
  ],
  [
    "Could not save",
    {
      tone: "critical",
      description: "Check your connection and try again.",
      action: { label: "Retry", altText: "Save again from the place's card" },
    },
  ],
];

/**
 * `toast()`: one call from anywhere, drawn by the page's `<Toaster>` in the
 * provider's portal. Each button shows its tone; a critical toast is announced
 * at once, every other politely. Hover or focus them (F8) to keep them.
 */
export const FromACall: Story = {
  name: "toast() and Toaster",
  render: () => (
    <div className="flex flex-wrap gap-2">
      {TONED.map(([title, options]) => (
        <Button
          key={title}
          variant="outline"
          onClick={() => toast(title, options)}
        >
          {options.tone ?? "neutral"}
        </Button>
      ))}
      <Toaster />
    </div>
  ),
};

/**
 * Every tone as the Toaster draws it: the icon in the tone's text colour, on
 * the toast's own surface. They stay until closed, so the visual review sees
 * them; `toast.dismiss()` closes them all.
 */
export const Tones: Story = {
  render: function Tones() {
    useEffect(() => {
      const ids = TONED.map(([title, options]) =>
        toast(title, { ...options, duration: Infinity }),
      );
      return () => ids.forEach((id) => toast.dismiss(id));
    }, []);
    return (
      <div>
        <Button variant="outline" onClick={() => toast.dismiss()}>
          Dismiss all
        </Button>
        <Toaster limit={5} />
      </div>
    );
  },
};
