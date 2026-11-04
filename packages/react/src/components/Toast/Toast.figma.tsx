import figma from "@figma/code-connect";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./Toast";

const toastUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8189";

// Tone is toast()'s tone and the part's (GAP-167): Neutral draws no icon, so
// it passes none. A product shows one from anywhere with
// `toast(title, { description, tone })` and a Toaster; these are the parts
// that call draws.
figma.connect(Toast, toastUrl, {
  variant: { Content: "Basic" },
  props: {
    title: figma.string("Title Text"),
    description: figma.string("Description Text"),
    tone: figma.enum("Tone", {
      Success: "success",
      Info: "info",
      Warning: "warning",
      Critical: "critical",
    }),
  },
  example: ({ description, title, tone }) => (
    <ToastProvider>
      <Toast open tone={tone}>
        <div className="grid gap-1">
          <ToastTitle>{title}</ToastTitle>
          <ToastDescription>{description}</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
});

figma.connect(Toast, toastUrl, {
  variant: { Content: "Action" },
  props: {
    title: figma.string("Title Text"),
    description: figma.string("Description Text"),
    action: figma.string("Action Text"),
    tone: figma.enum("Tone", {
      Success: "success",
      Info: "info",
      Warning: "warning",
      Critical: "critical",
    }),
  },
  example: ({ action, description, title, tone }) => (
    <ToastProvider>
      <Toast open tone={tone}>
        <div className="grid gap-1">
          <ToastTitle>{title}</ToastTitle>
          <ToastDescription>{description}</ToastDescription>
        </div>
        <ToastAction altText={action}>{action}</ToastAction>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
});
