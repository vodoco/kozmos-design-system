import { useId, useState } from "react";
import {
  Box,
  FieldWrapper,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Text,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function TimeZone() {
  const id = useId();
  const [value, setValue] = useState("Europe/London");
  return (
    <Box className="site-demo-column">
      <FieldWrapper label="Time zone" inputId={id}>
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Europe</SelectLabel>
              <SelectItem value="Europe/London">London</SelectItem>
              <SelectItem value="Europe/Istanbul">Istanbul</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Elsewhere</SelectLabel>
              <SelectItem value="Asia/Dubai">Dubai</SelectItem>
              <SelectItem value="America/New_York">New York</SelectItem>
              <SelectItem value="Asia/Singapore" disabled>
                Singapore
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </FieldWrapper>
      <Text size="sm" color="muted" aria-live="polite">
        {value}
      </Text>
    </Box>
  );
}

function WithAnError() {
  const id = useId();
  return (
    <Box className="site-demo-column">
      {/* The label needs the outer FieldWrapper (GAP-13), and SelectTrigger
          wraps itself in one of its own, which is what `aria-describedby`
          points at. Giving both the error printed the message twice
          (GAP-71), so the error goes to the trigger alone. */}
      <FieldWrapper label="Venue" inputId={id}>
        <Select>
          <SelectTrigger id={id} error="Choose a venue.">
            <SelectValue placeholder="Choose a venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="riverside">Riverside Centre</SelectItem>
            <SelectItem value="harbour">Harbour Terminal</SelectItem>
          </SelectContent>
        </Select>
      </FieldWrapper>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Grouped options",
    description:
      "A closed field that opens a list: groups with labels, a separator, a disabled option. The label comes from a FieldWrapper (GAP-13).",
    Component: TimeZone,
  },
  { title: "With an error", Component: WithAnError },
];
