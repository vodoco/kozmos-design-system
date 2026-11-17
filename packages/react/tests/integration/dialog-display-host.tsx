import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Heading,
  Text,
  ThemeProvider,
} from "@kozmos-ds/react";
import { ImageField, type ImageFieldImage } from "@kozmos-ds/react/dashboard";

/**
 * Dialog's full size and its header's media, and the display size, from the
 * built package, for scripts/check-dialog-display.mjs (0.17.0): a full
 * Dialog with a header and an image (decision 202, GAP-259), ImageField's
 * preview, which now opens in it, a Dialog whose header carries media inside
 * its padding or bleeding to its edges (decision 195, GAP-214), and Text and
 * Heading at the display size (decision 203, GAP-272).
 */
type Case = "full" | "image-field" | "media" | "media-bleed" | "display";

// A 4:3 picture, drawn in the page, so nothing is fetched.
const picture = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#2f6fe4"/></svg>',
)}`;

const images: ImageFieldImage[] = [
  { id: "a", src: picture, alt: "Main entrance" },
];

function Case({ name }: { name: Case }) {
  if (name === "display")
    return (
      <div style={{ padding: 16, width: 640 }}>
        <Text size="display" data-testid="text">
          Digitize your building
        </Text>
        <Text size="display" weight="normal" data-testid="text-normal">
          Digitize
        </Text>
        <Heading level={1} size="display" data-testid="heading">
          Digitize your building like never before.
        </Heading>
      </div>
    );
  if (name === "image-field")
    return (
      <div style={{ padding: 16, width: 480 }}>
        <ImageField label="Images" max={3} defaultValue={images} />
      </div>
    );
  if (name === "full")
    return (
      <Dialog open>
        <DialogContent size="full" data-testid="dialog">
          <DialogHeader data-testid="header">
            <DialogTitle>Image 1</DialogTitle>
            <DialogDescription>Main entrance</DialogDescription>
          </DialogHeader>
          <img
            data-testid="body"
            src={picture}
            alt="Main entrance"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              minHeight: 0,
            }}
          />
        </DialogContent>
      </Dialog>
    );
  return (
    <Dialog open>
      <DialogContent data-testid="dialog">
        <DialogHeader
          data-testid="header"
          media={
            <img
              data-testid="media-image"
              src={picture}
              alt=""
              style={{ height: 160, objectFit: "cover" }}
            />
          }
          mediaLabel={
            name === "media-bleed"
              ? "Charts rising over a floor plan"
              : undefined
          }
          mediaBleed={name === "media-bleed"}
        >
          <DialogTitle>Interested in Analytics?</DialogTitle>
          <DialogDescription>
            See how people move through your buildings.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

let root: Root | null = null;
function mount(name: Case) {
  root?.unmount();
  root = createRoot(document.getElementById("fixture")!);
  flushSync(() =>
    root!.render(
      <ThemeProvider theme="light">
        <Case name={name} />
      </ThemeProvider>,
    ),
  );
}

declare global {
  interface Window {
    dialogDisplay: { mount: typeof mount };
  }
}
window.dialogDisplay = { mount };
