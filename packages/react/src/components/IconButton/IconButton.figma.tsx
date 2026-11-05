import figma from "@figma/code-connect";
import { IconButton } from "./IconButton";

/**
 * Code Connect: Kozmos DS Core Library / IconButton
 *
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1203
 */
figma.connect(
  IconButton,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1203",
  {
    props: {
      variant: figma.enum("Variant", {
        Default: "default",
        Destructive: "destructive",
        Outline: "outline",
        Secondary: "secondary",
        Ghost: "ghost",
        Link: "link",
        Glass: "glass",
      }),
      size: figma.enum("Size", {
        Default: "icon",
        Small: "sm",
        Large: "lg",
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
      icon: figma.instance("Icon"),
      // GAP-197: the count over the icon's top-end corner, when Counter
      // shows it. Counter Text is a sample in the design; in code the count
      // is the product's number, which a snippet cannot read from text.
      counter: figma.boolean("Counter", {
        true: 3,
        false: undefined,
      }),
    },
    example: ({ variant, size, disabled, isLoading, icon, counter }) => (
      <IconButton
        variant={variant}
        size={size}
        disabled={disabled}
        isLoading={isLoading}
        counter={counter}
        aria-label="Icon action"
      >
        {icon}
      </IconButton>
    ),
  },
);
