import { useState } from "react";
import { Box, Input } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Basics() {
  const [name, setName] = useState("Sam Rivera");
  return (
    <Box className="site-demo-column">
      <Input
        label="Full name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoComplete="name"
      />
      <Input
        label="Email"
        type="email"
        placeholder="name@example.com"
        helperText="We only use it to send the confirmation."
      />
      <Input label="Read only" value="Riverside Centre" readOnly />
      <Input label="Disabled" value="Cannot change" disabled />
    </Box>
  );
}

function ValidationStates() {
  return (
    <Box className="site-demo-column">
      <Input
        label="Venue code"
        defaultValue="RVC-01"
        status="success"
        helperText="Available."
      />
      <Input
        label="Postcode"
        defaultValue="SW1A"
        status="warning"
        helperText="Looks incomplete."
      />
      <Input
        label="Email"
        defaultValue="not-an-email"
        error="Enter an email address, like name@example.com."
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Basics",
    description:
      "label, helperText, native types and attributes. Owned styles, so it renders the same in every engine.",
    Component: Basics,
  },
  {
    title: "Validation states",
    description:
      "status colours the frame and helper; error replaces the helper text, sets aria-invalid and is announced.",
    Component: ValidationStates,
  },
];
