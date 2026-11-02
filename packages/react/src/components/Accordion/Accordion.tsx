import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { SpinnerArc } from "../Spinner/SpinnerArc";

interface AccordionProps {
  /**
   * How the sections are drawn. Defaults to "default", rows divided by a rule.
   * "boxed" (decision 149) draws each header as a box of its own, 8 apart: a
   * hairline while closed, and filled with theme 900 while open, with the
   * section's content in the page's flow under it. Its height is the
   * density's control height: 40 compact, 44 touch.
   */
  variant?: "default" | "boxed";
}

type AccordionRootProps = AccordionProps &
  (
    | AccordionPrimitive.AccordionSingleProps
    | AccordionPrimitive.AccordionMultipleProps
  );

/** Whether the parts sit in a boxed Accordion. */
const BoxedContext = React.createContext(false);

const Accordion = React.forwardRef<HTMLDivElement, AccordionRootProps>(
  ({ variant, ...props }, ref) => {
    const { trackEvent } = useKozmosAnalytics();
    const boxed = variant === "boxed";
    // No className key at all in the default form: Radix's Slot turns an
    // undefined one into an empty class attribute.
    const form = {
      ref,
      ...(boxed && {
        className: cn("kozmos-accordion-boxed", props.className),
      }),
    };

    return (
      <BoxedContext.Provider value={boxed}>
        {props.type === "multiple" ? (
          <AccordionPrimitive.Root
            {...props}
            {...form}
            onValueChange={(value: string[]) => {
              trackEvent("Accordion", "accordion_toggled", { value });
              props.onValueChange?.(value);
            }}
          />
        ) : (
          <AccordionPrimitive.Root
            {...props}
            {...form}
            onValueChange={(value: string) => {
              trackEvent("Accordion", "accordion_toggled", { value });
              props.onValueChange?.(value);
            }}
          />
        )}
      </BoxedContext.Provider>
    );
  },
);
Accordion.displayName = "Accordion";

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => {
  const boxed = React.useContext(BoxedContext);
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={boxed ? className : cn("border-b", className)}
      {...props}
    />
  );
});
AccordionItem.displayName = "AccordionItem";

export interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Trigger
> {
  /** The boxed form's mark at the start, drawn 20 square. */
  icon?: React.ReactNode;
  /**
   * The boxed form's small line over the title, and the product's words:
   * "Step 1/5". Read before the title, as part of the trigger's name.
   */
  label?: React.ReactNode;
  /**
   * A spinner where the chevron is, and the trigger busy to assistive
   * technology and disabled while it is set, in either form. The section's
   * content is left alone, and `disabled` here can't turn it off.
   */
  loading?: boolean;
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, children, icon, label, loading, ...props }, ref) => {
  const boxed = React.useContext(BoxedContext);
  return (
    <AccordionPrimitive.Header className={boxed ? "kozmos-reset" : "flex"}>
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          boxed
            ? "kozmos-reset kozmos-accordion-trigger"
            : "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
        // Radix passes a disabled item's state as this same attribute, and
        // reads it to skip a trigger by keyboard. After the caller's props,
        // or their `disabled={false}` would make a loading section pressable.
        // Only while loading: an undefined here would clear the item's own.
        {...(loading && { disabled: true, "aria-busy": true })}
      >
        {boxed ? (
          <>
            {icon}
            <span className="kozmos-accordion-text">
              {(label || label === 0) && (
                <span className="kozmos-accordion-label">{label}</span>
              )}
              {/* Keeps the two lines apart in the trigger's name: WebKit runs
                  one block into the next without it. */}{" "}
              {children}
            </span>
          </>
        ) : (
          children
        )}
        {loading ? (
          <SpinnerArc
            className={boxed ? undefined : "h-4 w-4 shrink-0"}
            size={boxed ? 20 : 16}
          />
        ) : (
          <ChevronDown
            className={
              boxed
                ? "kozmos-accordion-chevron"
                : "kozmos-accordion-chevron h-4 w-4 shrink-0"
            }
          />
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const boxed = React.useContext(BoxedContext);
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={
        // The boxed form holds a form: it clips only while it moves (the
        // keyframes carry the overflow), so a field's focus ring draws whole.
        boxed
          ? "kozmos-accordion-content text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
          : "kozmos-accordion-content overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      }
      {...props}
    >
      <div
        className={cn(boxed ? "kozmos-accordion-body" : "pb-4 pt-0", className)}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
