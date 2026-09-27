import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Trail() {
  return (
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
          <BreadcrumbLink href="#main">First floor</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Bookshop</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function Collapsed() {
  return (
    <Breadcrumb aria-label="Breadcrumb, collapsed">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#main">Venues</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Bookshop</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A trail",
    description: "Links for the way up, BreadcrumbPage for where you are.",
    Component: Trail,
  },
  {
    title: "Collapsed in the middle",
    description:
      "BreadcrumbEllipsis stands for the levels a narrow screen cannot show.",
    Component: Collapsed,
  },
];
