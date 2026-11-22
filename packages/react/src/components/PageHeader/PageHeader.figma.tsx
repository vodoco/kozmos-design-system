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
import { Tag } from "../Tag/Tag";
import { PageHeader } from "./PageHeader";

// GAP-036: the PageHeader set. Its node id is the set built in the live file
// (2446:23074).
figma.connect(
  PageHeader,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2446-23074",
  {
    // The breadcrumb, the info IconButton and the action are drawn only by
    // mappings, which Code Connect does not collect imports from: they are
    // listed here.
    imports: [
      "import { PageHeader, Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage, IconButton, Button, Tag } from '@kozmos-ds/react';",
      "import { InfoCircle } from '@kozmos-ds/icons';",
    ],
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
      // Decision 210: a node beside the title and outside its h1, drawn as
      // a status Tag in the alert emotion, its words Addon Text, as
      // ListItem's titleAddon is mapped.
      titleAddon: figma.boolean("Show Title Addon", {
        true: figma.string("Addon Text"),
        false: undefined,
      }),
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
      titleAddon,
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
        titleAddon={<Tag emotion="alert">{titleAddon}</Tag>}
        info={info}
        description={description}
        actions={actions}
      />
    ),
  },
);
