import figma from "@figma/code-connect";
import { Download01 } from "@kozmos-ds/icons";
import { SplitButton } from "./SplitButton";

// Decision 209, GAP-168: the menu's items are the ones Menu Open shows, an
// item with an icon, a separator and a disabled item. Menu Open itself is
// not mapped: it draws the menu open, which the user does, and SplitButton
// takes no prop for it.

figma.connect(
  SplitButton,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=383-2332",
  {
    props: {
      variant: figma.enum("Variant", {
        Default: "default",
        Secondary: "secondary",
        Destructive: "destructive",
        Outline: "outline",
      }),
      size: figma.enum("Size", {
        Small: "sm",
        Default: "default",
        Large: "lg",
      }),
      disabled: figma.enum("State", {
        Default: false,
        Disabled: true,
        Focus: false,
      }),
      children: figma.string("Label Text"),
    },
    example: ({ children, disabled, size, variant }) => (
      <SplitButton
        disabled={disabled}
        onMainClick={() => {}}
        menuItems={[
          {
            label: "Publish to staging",
            icon: <Download01 />,
            onClick: () => {},
          },
          { type: "separator" },
          { label: "Publish to production", disabled: true },
        ]}
        size={size}
        variant={variant}
      >
        {children}
      </SplitButton>
    ),
  },
);
