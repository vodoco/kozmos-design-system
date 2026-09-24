import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";
import { getIconComponent, type KozmosIconKey } from "@kozmos/icons";
import type { LucideIcon, LucideProps } from "lucide-react";

const iconVariants = cva("", {
  variants: {
    size: {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
      xl: "h-8 w-8",
    },
    color: {
      default: "text-current",
      muted: "text-muted-foreground",
      primary: "text-primary",
      destructive: "text-destructive-text",
    },
  },
  defaultVariants: {
    size: "md",
    color: "default",
  },
});

export interface IconProps
  extends
    Omit<LucideProps, "color" | "size">,
    VariantProps<typeof iconVariants> {
  icon?: LucideIcon;
  name?: KozmosIconKey;
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, icon, name, size, color, ...props }, ref) => {
    const IconComp = icon ?? (name ? getIconComponent(name) : undefined);
    if (!IconComp) return null;

    return (
      <IconComp
        ref={ref}
        aria-hidden={
          props["aria-label"] || props["aria-labelledby"] ? undefined : "true"
        }
        className={cn(iconVariants({ size, color, className }))}
        {...props}
      />
    );
  },
);

Icon.displayName = "Icon";
export { Icon };
