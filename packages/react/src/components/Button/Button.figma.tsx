import figma from "@figma/code-connect";
import { Button } from "./Button";

/**
 * Code Connect: Kozmos DS Core Library / Button
 */
figma.connect(
  Button,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1055",
  {
    props: {
      variant: figma.enum("Variant", {
        Default: "default",
        Secondary: "secondary",
        Destructive: "destructive",
        Outline: "outline",
        Ghost: "ghost",
        Link: "link",
        Glass: "glass",
        Subtle: "subtle",
      }),
      size: figma.enum("Size", {
        Default: "default",
        Small: "sm",
        Large: "lg",
        Icon: "icon",
      }),
      disabled: figma.enum("State", {
        Default: false,
        Disabled: true,
        Loading: false,
      }),
      isLoading: figma.enum("State", {
        Default: false,
        Disabled: false,
        Loading: true,
      }),
      children: figma.children(["Icon", "Label Text"]),
    },
    example: ({ variant, size, children, disabled, isLoading }) => (
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        isLoading={isLoading}
      >
        {children}
      </Button>
    ),
  },
);
