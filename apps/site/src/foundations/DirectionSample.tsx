import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Chip,
  ChipGroup,
  Icon,
  Stack,
  Stepper,
  Surface,
  Switch,
  ThemeProvider,
} from "@kozmos/react";

/** The same parts under a left-to-right and a right-to-left provider. */
export function DirectionSample() {
  const [rtl, setRtl] = useState(false);
  return (
    <Stack gap={3}>
      <Switch label="Right to left" checked={rtl} onCheckedChange={setRtl} />
      <ThemeProvider dir={rtl ? "rtl" : "ltr"}>
        <Surface className="site-theme-sample">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#main">Venues</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#main">Riverside Centre</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Bookshop</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Stepper
            steps={["Search", "Choose", "Route", "Arrive"]}
            currentStep={2}
          />
          {/* GAP-32: ChipGroup is a plain div; the role makes the label count. */}
          <ChipGroup role="group" aria-label="Filters">
            <Chip size="sm" selected icon={<Icon name="check" />}>
              Open now
            </Chip>
            <Chip size="sm">Step-free</Chip>
          </ChipGroup>
          <Stack direction="row" gap={2}>
            {/* The icons' space from the words is the site's (GAP-56). */}
            <Button className="site-button-icon">
              <Icon name="arrow-left" size="sm" />
              Back
            </Button>
            <Button variant="outline" className="site-button-icon">
              Next
              <Icon name="arrow-right" size="sm" />
            </Button>
          </Stack>
        </Surface>
      </ThemeProvider>
    </Stack>
  );
}
