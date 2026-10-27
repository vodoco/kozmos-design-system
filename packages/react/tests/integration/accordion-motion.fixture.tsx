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
   the animation its content runs, in a plain provider and in one whose
   design config asks for reduced motion. */

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
        {/* Ten times slower than the tokens' 200ms, so a read lands while
            the content is still moving. */}
        <div
          style={
            {
              "--semantics-motion-duration-scale": 10,
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
