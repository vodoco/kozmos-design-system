import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Stack,
  Text,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Confirm() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Remove from favourites</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove the bookshop?</DialogTitle>
          <DialogDescription>
            It leaves your favourites on every device.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Stack direction="row" gap={2}>
            <DialogClose asChild>
              <Button variant="outline">Keep it</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="destructive">Remove</Button>
            </DialogClose>
          </Stack>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Informational() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">About this map</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Riverside Centre</DialogTitle>
          <DialogDescription>
            Map data from the venue, updated weekly.
          </DialogDescription>
        </DialogHeader>
        <Text size="sm">
          Positions are approximate. Opening hours come from each tenant and may
          change without notice.
        </Text>
      </DialogContent>
    </Dialog>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A confirmation",
    description:
      "Modal, focus-trapped, dismissed by its buttons, the close control, Escape or the scrim. Its overlay is owned by the nearest ThemeProvider.",
    Component: Confirm,
  },
  {
    title: "Informational",
    Component: Informational,
  },
];
