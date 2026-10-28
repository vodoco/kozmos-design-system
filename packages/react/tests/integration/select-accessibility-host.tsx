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
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  Alert,
  AlertTitle,
  AlertDescription,
  Notice,
  LanguageSwitcher,
  Button,
} from "@kozmos-ds/react";

declare global {
  interface Window {
    unmountSelectFixture?: () => void;
    closeControlledSelect?: () => void;
    mountLateAlert?: () => void;
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
// GAP-193: Kozmos's live parts, each holding a control, as a product puts
// them on a page — inside its own tree, never as a direct child of the body.
// Each is marked so the check can find it; nothing here sets aria-live.
function LiveParts() {
  const [late, setLate] = useState(false);
  window.mountLateAlert = () => setLate(true);
  return (
    <>
      <section aria-label="Live parts">
        <Alert live="polite" data-live-part="alert-polite">
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>Your changes were saved.</AlertDescription>
          <Button variant="outline">Undo</Button>
        </Alert>
        <Alert live="assertive" data-live-part="alert-assertive">
          <AlertTitle>Not saved</AlertTitle>
          <AlertDescription>The connection dropped.</AlertDescription>
          <Button variant="outline">Retry</Button>
        </Alert>
        <Notice
          data-live-part="notice-polite"
          tone="info"
          summary="Allergens may be present"
        >
          Dishes are prepared in a kitchen that handles nuts.
        </Notice>
        <Notice
          data-live-part="notice-assertive"
          live="assertive"
          tone="critical"
          collapsible={false}
          summary="Leave the building"
          action={<Button variant="outline">Call 112</Button>}
        >
          Use the nearest exit.
        </Notice>
      </section>
      {/* A product's own region, named live by its role alone, with no
          aria-live: the primitive hides it as it opens, so it must be out of
          reach as well, not a hidden button that still takes focus. */}
      <div role="status" data-product-live="">
        <p>3 people are editing</p>
        <button type="button">Show them</button>
      </div>
      <div>
        <p>Connection</p>
        {late && (
          // Mounted while a popup is open, in a box the primitive hid as it
          // opened: hidden with it, so it must be out of reach too.
          <Alert live="assertive" data-late-part="alert-late">
            <AlertTitle>Connection lost</AlertTitle>
            <Button variant="outline">Reconnect</Button>
          </Alert>
        )}
      </div>
    </>
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
      <Drawer>
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Narrow the results.</DrawerDescription>
          <Button>Apply</Button>
        </DrawerContent>
      </Drawer>
      <Menu>
        <MenuTrigger asChild>
          <Button>Open menu</Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem>Rename</MenuItem>
          <MenuItem>Delete</MenuItem>
        </MenuContent>
      </Menu>
      <LiveParts />
      <LanguageSwitcher
        languages={[
          { id: "en", label: "English" },
          { id: "tr", label: "Türkçe" },
          { id: "ar", label: "العربية", direction: "rtl" },
        ]}
        selectedLocale="en"
        onLocaleRequest={() => {}}
      />
    </main>
  </ThemeProvider>,
);
