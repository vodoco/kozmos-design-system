import { useState } from "react";
import {
  Box,
  Button,
  Stack,
  Text,
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@kozmos-ds/react";
import { Screen } from "../Screen";
import type { DemoModule } from "../types";

function Saved() {
  const [open, setOpen] = useState(false);
  return (
    <ToastProvider>
      <Box className="site-demo-column">
        <Screen>
          <ToastViewport />
        </Screen>
        <Text size="sm" color="muted">
          A toast appears at the viewport’s edge and leaves after a while. The
          provider and viewport wrap the app once; Toast is opened where the
          event happens. The viewport pins itself to the window (GAP-36), so the
          screen above is its window and the toast stays in the app — and there
          the toast shows that it draws no fill of its own (GAP-58): the page
          reads through it. Over a plain white page it passes for solid.
        </Text>
        <Box className="site-demo-row">
          <Button variant="outline" onClick={() => setOpen(true)}>
            Save the bookshop
          </Button>
        </Box>
      </Box>
      <Toast open={open} onOpenChange={setOpen}>
        <Stack gap={1}>
          <ToastTitle>Saved</ToastTitle>
          <ToastDescription>
            The bookshop is in your favourites.
          </ToastDescription>
        </Stack>
        <ToastAction
          altText="Undo saving the bookshop"
          onClick={() => setOpen(false)}
        >
          Undo
        </ToastAction>
        <ToastClose />
      </Toast>
    </ToastProvider>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Saved, with undo",
    description:
      "Title, description, an action with an altText for assistive technology, and a close button.",
    Component: Saved,
    tall: true,
  },
];
