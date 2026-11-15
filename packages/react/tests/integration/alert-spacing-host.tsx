import { createRoot } from "react-dom/client";
import { InfoCircle } from "@kozmos-ds/icons";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Stack,
  ThemeProvider,
  type AlertProps,
} from "@kozmos-ds/react";

/**
 * Alerts in the built package, for scripts/check-alert-spacing.mjs (GAP-269):
 * every variant in each shape a product builds. The check reads the space
 * between the alert's edge (inside its border) and its first and last
 * content, and where the icon sits against the words beside it.
 */
const VARIANTS: NonNullable<AlertProps["variant"]>[] = [
  "default",
  "destructive",
  "success",
  "warning",
  "info",
];

const icon = <InfoCircle className="h-4 w-4" data-part="icon" />;

function Shapes({ variant }: { variant: NonNullable<AlertProps["variant"]> }) {
  const at = (shape: string) => ({
    "data-case": `${shape}-${variant}`,
    variant,
  });
  return (
    <>
      <Alert {...at("titled")}>
        {icon}
        <AlertTitle data-part="first">Merge saved as a draft</AlertTitle>
        <AlertDescription data-part="last">
          Publish the draft to show the merged units on the map.
        </AlertDescription>
      </Alert>
      <Alert {...at("title-less")}>
        {icon}
        <AlertDescription data-part="first last">
          The merged unit keeps the first unit’s name.
        </AlertDescription>
      </Alert>
      <Alert {...at("title-less-two-lines")}>
        {icon}
        <AlertDescription data-part="first last">
          The merged unit keeps the first unit’s name, its category and its
          opening hours; the other units’ are kept in the merge history.
        </AlertDescription>
      </Alert>
      <Alert {...at("title-less-action")}>
        {icon}
        <AlertDescription data-part="first last">
          <Stack
            direction="row"
            align="center"
            justify="between"
            wrap="wrap"
            gap={2}
          >
            <span>Two units merged.</span>
            <Button size="sm" variant="outline">
              Undo
            </Button>
          </Stack>
        </AlertDescription>
      </Alert>
      <Alert {...at("no-icon")}>
        <AlertDescription data-part="first last">
          View only. Only Dashboard admins can change these settings.
        </AlertDescription>
      </Alert>
    </>
  );
}

function Page() {
  return (
    <ThemeProvider theme="light">
      <div style={{ display: "grid", gap: 16, width: 360, padding: 16 }}>
        {VARIANTS.map((variant) => (
          <Shapes key={variant} variant={variant} />
        ))}
      </div>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("fixture")!).render(<Page />);
