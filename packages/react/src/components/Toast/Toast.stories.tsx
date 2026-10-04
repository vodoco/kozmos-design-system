import type { Meta, StoryObj } from "@storybook/react";
import {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastAction,
} from "./Toast";
import { Button } from "../Button/Button";
import { useState } from "react";

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
