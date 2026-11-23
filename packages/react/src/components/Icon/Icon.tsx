import React from "react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "../../utils";
// The recipe is shared with Vue's KozmosIcon (recipes/icon.ts).
import { iconAriaHidden, iconVariants } from "../../recipes/icon";
import { getIconComponent, type KozmosIconKey } from "@kozmos-ds/icons";
import type {
  KozmosIconComponent as LucideIcon,
  KozmosIconProps as LucideProps,
} from "@kozmos-ds/icons";

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
        aria-hidden={iconAriaHidden(
          props["aria-label"],
          props["aria-labelledby"],
        )}
        className={cn(iconVariants({ size, color, className }))}
        {...props}
      />
    );
  },
);

Icon.displayName = "Icon";
export { Icon };
