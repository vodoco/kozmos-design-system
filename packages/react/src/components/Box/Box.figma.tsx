import figma from "@figma/code-connect";
import { Box } from "./Box";

figma.connect(
  Box,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-1002",
  {
    props: {
      className: figma.enum("Surface", {
        Transparent: "",
        Surface: "rounded-control bg-card p-4 text-card-foreground",
        Outlined: "rounded-control border bg-card p-4 text-card-foreground",
      }),
      children: figma.slot("Content Slot"),
    },
    example: ({ children, className }) => (
      <Box className={className}>{children}</Box>
    ),
  },
);
