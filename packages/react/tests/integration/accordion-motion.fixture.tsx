import React from "react";
import { createRoot } from "react-dom/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  DesignConfigProvider,
  ThemeProvider,
} from "@kozmos-ds/react";

/* Accordion opening and closing: scripts/check-accordion-motion.mjs reads
   the animation its content runs and its chevron's turn, at the motion
   tokens' timing, slowed through the token, and in a provider whose design
   config asks for reduced motion. */

function Item({ id }: { id: string }) {
  return (
    <Accordion type="single" collapsible data-testid={id}>
      <AccordionItem value="hours">
        <AccordionTrigger>Opening hours</AccordionTrigger>
        <AccordionContent>
          Monday to Friday, 9 to 6. Saturday, 10 to 4. Closed on Sundays and
          public holidays.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function Fixture() {
  return (
    <div style={{ display: "grid", gap: 24, padding: 16, width: 480 }}>
      <ThemeProvider theme="light">
        {/* At the tokens' own timing, to read the duration and easing it
            runs on. */}
        <Item id="token" />
        {/* The standard duration token ten times over, 2800ms, so a read
            lands while the content is still moving, and the duration is
            seen to follow the token. */}
        <div
          style={
            {
              "--semantics-motion-duration-standard": "2800ms",
            } as React.CSSProperties
          }
        >
          <Item id="plain" />
        </div>
      </ThemeProvider>
      <DesignConfigProvider initialConfig={{ motion: "reduced" }}>
        <Item id="config-reduced" />
      </DesignConfigProvider>
    </div>
  );
}

createRoot(document.getElementById("fixture")!).render(<Fixture />);
