import { createRoot } from "react-dom/client";
import {
  Badge,
  Button,
  Input,
  Separator,
  ThemeProvider,
} from "@kozmos-ds/react";

function Samples({ id }: { id: string }) {
  return (
    <section style={{ width: 300, padding: 16 }}>
      <Badge data-testid={`${id}-badge`}>Available</Badge>
      <Separator data-testid={`${id}-separator`} />
      <Button data-testid={`${id}-button`}>Continue</Button>
      <Input data-testid={`${id}-input`} aria-label={`${id} search`} />
    </section>
  );
}

createRoot(document.getElementById("fixture")!).render(
  <>
    <ThemeProvider theme="dark">
      <Samples id="dark" />
      <ThemeProvider theme="light">
        <Samples id="nested-light" />
      </ThemeProvider>
    </ThemeProvider>
    <ThemeProvider theme="light">
      <Samples id="light" />
    </ThemeProvider>
  </>,
);
