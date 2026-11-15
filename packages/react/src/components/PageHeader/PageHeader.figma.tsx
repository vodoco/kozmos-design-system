import figma from "@figma/code-connect";
import { InfoCircle } from "@kozmos-ds/icons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../Breadcrumb/Breadcrumb";
import { Button } from "../Button/Button";
import { IconButton } from "../IconButton/IconButton";
import { PageHeader } from "./PageHeader";

// GAP-036: the PageHeader set. Its node id is the set built in the live file
// (2446:23074).
figma.connect(
  PageHeader,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2446-23074",
  {
    props: {
      tone: figma.enum("Tone", {
        Subtle: "subtle",
        Default: "default",
      }),
      size: figma.enum("Size", {
        Medium: "md",
        Large: "lg",
      }),
      title: figma.string("Title Text"),
      description: figma.boolean("Description", {
        true: figma.string("Description Text"),
        false: undefined,
      }),
      breadcrumb: figma.boolean("Breadcrumb", {
        true: (
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/sites/logan">
                  Boston Logan Airport
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ),
        false: undefined,
      }),
      info: figma.boolean("Info", {
        true: (
          <IconButton aria-label="About this page" size="sm">
            <InfoCircle aria-hidden="true" className="h-5 w-5" />
          </IconButton>
        ),
        false: undefined,
      }),
      actions: figma.boolean("Actions", {
        true: <Button>Save changes</Button>,
        false: undefined,
      }),
    },
    example: ({
      tone,
      size,
      title,
      description,
      breadcrumb,
      info,
      actions,
    }) => (
      <PageHeader
        tone={tone}
        size={size}
        breadcrumb={breadcrumb}
        title={title}
        info={info}
        description={description}
        actions={actions}
      />
    ),
  },
);
