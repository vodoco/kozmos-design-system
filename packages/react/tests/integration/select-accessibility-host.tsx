import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ThemeProvider,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Button,
} from "@kozmos-ds/react";

declare global {
  interface Window {
    unmountSelectFixture?: () => void;
    closeControlledSelect?: () => void;
  }
}
function Field({
  name,
  controlled = false,
  custom = false,
}: {
  name: string;
  controlled?: boolean;
  custom?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (controlled) window.closeControlledSelect = () => setOpen(false);
  return (
    <Select {...(controlled ? { open, onOpenChange: setOpen } : {})}>
      <SelectTrigger aria-label={name}>
        <SelectValue placeholder="Choose" />
      </SelectTrigger>
      <SelectContent
        portalContainer={
          custom ? document.getElementById("custom-portal") : undefined
        }
      >
        <SelectItem value="one">One</SelectItem>
        <SelectItem value="two">Two</SelectItem>
      </SelectContent>
    </Select>
  );
}
const root = createRoot(document.getElementById("fixture")!);
window.unmountSelectFixture = () => root.unmount();
root.render(
  <ThemeProvider theme="light">
    <main>
      <Field name="Normal" />
      <Field name="Controlled" controlled />
      <Field name="Custom" custom />
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Choose a setting.</DialogDescription>
          <Field name="Nested" />
        </DialogContent>
      </Dialog>
    </main>
  </ThemeProvider>,
);
