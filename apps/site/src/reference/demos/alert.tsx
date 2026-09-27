import {
  Alert,
  AlertDescription,
  AlertTitle,
  Box,
  Icon,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const variants = [
  {
    variant: "default",
    title: "Route recalculated",
    body: "You are on a new route to Gate B12.",
    icon: "info-circle",
  },
  {
    variant: "info",
    title: "Lifts out of service",
    body: "Use the escalators by the atrium until 15:00.",
    icon: "info-circle",
  },
  {
    variant: "success",
    title: "Saved",
    body: "The bookshop is in your favourites.",
    icon: "check",
  },
  {
    variant: "warning",
    title: "Closing soon",
    body: "The terrace closes in 20 minutes.",
    icon: "alert-triangle",
  },
  {
    variant: "destructive",
    title: "Location unavailable",
    body: "Allow location access to see where you are.",
    icon: "alert-circle",
  },
] as const;

function Variants() {
  return (
    <Box className="site-demo-wide">
      {variants.map((entry) => (
        <Alert key={entry.variant} variant={entry.variant}>
          <Icon name={entry.icon} />
          <AlertTitle>{entry.title}</AlertTitle>
          <AlertDescription>{entry.body}</AlertDescription>
        </Alert>
      ))}
    </Box>
  );
}

function AsANote() {
  return (
    <Alert variant="info" role="note">
      <AlertDescription>
        A note that is on the page from the start: {'role="note"'} replaces the
        default {'role="alert"'}, which would announce it as urgent (GAP-12).
      </AlertDescription>
    </Alert>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Five variants",
    description:
      "default, info, success, warning and destructive, each with an icon, a title and a description.",
    Component: Variants,
  },
  {
    title: "As a static note",
    description:
      "The role can be overridden for content that is not an interruption.",
    Component: AsANote,
  },
];
