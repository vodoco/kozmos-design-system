import { createRoot } from "react-dom/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  DensityScope,
  Input,
  ThemeProvider,
} from "@kozmos-ds/react";
import { Building02 } from "@kozmos-ds/icons";

/* Accordion's boxed form (decision 149): scripts/check-accordion-boxed.mjs
   measures the sections in a 408 panel, in both themes, at both densities and
   right to left, and reads a default Accordion beside them. */

function Sections({ id }: { id: string }) {
  return (
    <div style={{ width: 408 }}>
      <Accordion
        type="single"
        variant="boxed"
        collapsible
        defaultValue="details"
        data-testid={id}
      >
        <AccordionItem value="details">
          <AccordionTrigger icon={<Building02 />} label="Step 1/5">
            Building details
          </AccordionTrigger>
          <AccordionContent>
            <Input aria-label="Building name" />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="location">
          <AccordionTrigger icon={<Building02 />} label="Step 2/5">
            Location
          </AccordionTrigger>
          <AccordionContent>Where it is</AccordionContent>
        </AccordionItem>
        <AccordionItem value="levels" disabled>
          <AccordionTrigger icon={<Building02 />} label="Step 3/5">
            Levels
          </AccordionTrigger>
          <AccordionContent>The levels</AccordionContent>
        </AccordionItem>
        <AccordionItem value="plans">
          <AccordionTrigger icon={<Building02 />} label="Step 4/5" loading>
            Floor plans
          </AccordionTrigger>
          <AccordionContent>The plans</AccordionContent>
        </AccordionItem>
        <AccordionItem value="review">
          <AccordionTrigger icon={<Building02 />} label="Step 5/5">
            Review
          </AccordionTrigger>
          <AccordionContent>The review</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function Fixture() {
  return (
    <div style={{ display: "grid", gap: 24, padding: 16 }}>
      <ThemeProvider theme="light">
        <DensityScope density="compact">
          <Sections id="light" />
        </DensityScope>
        <Sections id="touch" />
        <div dir="rtl">
          <DensityScope density="compact">
            <Sections id="rtl" />
          </DensityScope>
        </div>
        {/* Long words in a narrow panel: the lines wrap and the header grows,
            with its marks kept inside it. */}
        <DensityScope density="compact">
          <div style={{ width: 220 }}>
            <Accordion
              type="single"
              variant="boxed"
              collapsible
              data-testid="narrow"
            >
              <AccordionItem value="long">
                <AccordionTrigger
                  icon={<Building02 />}
                  label="Step 1/5 of the whole of it"
                >
                  A building details section with a very long title
                </AccordionTrigger>
                <AccordionContent>The form</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </DensityScope>
        <div style={{ width: 408 }}>
          <Accordion
            type="single"
            collapsible
            defaultValue="one"
            data-testid="default"
          >
            <AccordionItem value="one">
              <AccordionTrigger>Opening hours</AccordionTrigger>
              <AccordionContent>Nine to five</AccordionContent>
            </AccordionItem>
            <AccordionItem value="two">
              <AccordionTrigger>Step-free access</AccordionTrigger>
              <AccordionContent>Lifts at both ends</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ThemeProvider>
      <ThemeProvider theme="dark">
        <DensityScope density="compact">
          <Sections id="dark" />
        </DensityScope>
      </ThemeProvider>
    </div>
  );
}

createRoot(document.getElementById("fixture")!).render(<Fixture />);
