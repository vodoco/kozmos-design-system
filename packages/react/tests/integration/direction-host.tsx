import { createRoot } from "react-dom/client";
import {
  Progress,
  Search,
  SplitButton,
  Switch,
  Tag,
  ThemeProvider,
  Toast,
  ToastAction,
  ToastClose,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@kozmos-ds/react";

// The real components check-direction-rules.mjs measures in both directions.
createRoot(document.getElementById("root")!).render(
  <>
    {(["ltr", "rtl"] as const).map((dir) => (
      <ThemeProvider key={dir} dir={dir} defaultTheme="light">
        <div data-direction={dir} style={{ width: 300, padding: 8 }}>
          <Progress value={30} aria-label={`Progress ${dir}`} />
          <Switch aria-label={`Switch on ${dir}`} checked />
          <Switch aria-label={`Switch off ${dir}`} checked={false} />
          <SplitButton
            data-testid={`split-${dir}`}
            menuItems={[{ label: "Later", onClick: () => undefined }]}
          >
            Start
          </SplitButton>
          <Search aria-label={`Search ${dir}`} placeholder="Gate" />
          <div style={{ display: "flex", gap: 8, padding: 8 }}>
            <Tag data-testid={`tag-plain-${dir}`}>Vegan</Tag>
            <Tag data-testid={`tag-${dir}`} onRemove={() => undefined}>
              Vegan
            </Tag>
          </div>
          {/* A row of removable Tags that scrolls, flush: no padding above or
              below them. */}
          <div
            data-testid={`tag-row-${dir}`}
            style={{ display: "flex", gap: 4, overflowX: "auto" }}
          >
            {["Vegan", "Halal", "Kosher", "Gluten free", "Nut free"].map(
              (word) => (
                <Tag key={word} onRemove={() => undefined}>
                  {word}
                </Tag>
              ),
            )}
          </div>
          <ToastProvider>
            {/* Long enough that the words shrink to the action, so the
                space between them is the toast's own, not justify's. */}
            <Toast open data-testid={`toast-${dir}`}>
              <div data-part="toast-text">
                <ToastTitle>
                  Your route was updated because a lift is out of service
                </ToastTitle>
              </div>
              <ToastAction altText="Undo">Undo</ToastAction>
              <ToastClose aria-label={`Dismiss ${dir}`} />
            </Toast>
            <ToastViewport style={{ position: "relative" }} />
          </ToastProvider>
        </div>
      </ThemeProvider>
    ))}
  </>,
);
