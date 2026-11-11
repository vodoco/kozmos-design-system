import { createThemePortal } from "../../theme/ThemePortal";
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "@kozmos-ds/icons";

import { cn, mergeAriaIds } from "../../utils";

import { resolveLocale } from "../Calendar/calendar-dates";
import { Counter } from "../Counter";
import { FieldWrapper } from "../FieldWrapper";
import { useKozmosAnalytics } from "../../utils/analytics";
import { inertOutside } from "../../utils/modal-inert";
import { useInputModality } from "../../utils/input-modality";

const SelectPortal = createThemePortal(SelectPrimitive.Portal);

const Select: React.FC<
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>
> = ({ onValueChange, ...props }) => {
  const { trackEvent } = useKozmosAnalytics();
  return (
    <SelectPrimitive.Root
      onValueChange={(value) => {
        trackEvent("Select", "select_value_changed", { value });
        onValueChange?.(value);
      }}
      {...props}
    />
  );
};
Select.displayName = "Select";

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    error?: boolean | string;
    wrapperClassName?: string;
  }
>(
  (
    {
      className,
      children,
      error,
      wrapperClassName,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const errorId = React.useId();
    const hasError = !!error;
    const isStringError = typeof error === "string";
    // Listening before the list opens: the key that opens it comes first.
    useInputModality();

    return (
      <FieldWrapper
        error={error}
        errorId={errorId}
        className={wrapperClassName}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          aria-invalid={hasError || ariaInvalid}
          aria-describedby={mergeAriaIds(
            ariaDescribedBy,
            hasError && isStringError ? errorId : undefined,
          )}
          className={cn(
            "flex h-field w-full items-center justify-between rounded-control border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
            hasError &&
              "border-destructive text-destructive-text focus:ring-destructive",
            className,
          )}
          {...props}
        >
          {children}
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
      </FieldWrapper>
    );
  },
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    portalContainer?: React.ComponentPropsWithoutRef<
      typeof SelectPrimitive.Portal
    >["container"];
  }
>(
  (
    { className, children, position = "popper", portalContainer, ...props },
    ref,
  ) => {
    const release = React.useRef<(() => void) | undefined>();
    // Radix focuses its items under the pointer too, so the row's keyboard
    // ring reads which hand moved last (owned-selection.css).
    const modality = useInputModality();
    const contentRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        release.current?.();
        // Radix's Select is always modal: as it opens it hides the page with
        // aria-hidden's hideOthers, so the page is kept in reach exactly
        // where that keeps it visible (GAP-193).
        release.current = node
          ? inertOutside(node, { mirrorAriaHidden: true })
          : undefined;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );
    return (
      <SelectPortal container={portalContainer}>
        <SelectPrimitive.Content
          ref={contentRef}
          className={cn(
            "relative z-50 max-h-96 min-w-32 overflow-hidden rounded-control border bg-popover text-popover-foreground shadow-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            position === "popper" &&
              "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            className,
          )}
          position={position}
          data-modality={modality}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.Viewport
            className={cn(
              "p-3",
              position === "popper" &&
                "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
            )}
          >
            {children}
          </SelectPrimitive.Viewport>
          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPortal>
    );
  },
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-3 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

export interface SelectItemProps extends React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Item
> {
  /**
   * A count beside the option's words (GAP-164), as a neutral Counter at the
   * row's end, before the check's place. It sits outside the item text, so
   * the closed select shows the words alone. A number is written in the
   * app's grouping (the document's `lang`, as Calendar reads it: "1,234",
   * "1.234" in German), and the option is named by its words, then its
   * count: "POI, 96". A caller's own `aria-label` wins.
   */
  count?: React.ReactNode;
}

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const subscribeToNothing = () => () => {};
const serverLocale = () => "en-US";

/**
 * The app's language, as Calendar reads it (resolveLocale): the document's
 * `lang`, then the browser's. A server, and hydration, write en-US; the
 * client's first render after that writes the app's own.
 */
function useAppLocale() {
  return React.useSyncExternalStore(
    subscribeToNothing,
    () => resolveLocale(),
    serverLocale,
  );
}

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ className, children, count, ...props }, ref) => {
  const textId = React.useId();
  const countId = React.useId();
  const locale = useAppLocale();
  const hasCount = count !== undefined && count !== null && count !== false;
  // A number in the app's grouping, as SwiftUI and Compose write it.
  const countText = !hasCount
    ? null
    : typeof count === "number"
      ? new Intl.NumberFormat(locale).format(count)
      : count;
  const callerLabel = props["aria-label"];
  const callerLabelledBy = props["aria-labelledby"];
  const plain = (node: React.ReactNode) =>
    typeof node === "string" || typeof node === "number";
  const plainName =
    hasCount && plain(children) && plain(countText)
      ? `${children}, ${countText}`
      : null;
  // Words or a count that are not plain text: the name is read from what
  // they draw once they are drawn, in the same "words, count" form.
  const textRef = React.useRef<HTMLSpanElement>(null);
  const countRef = React.useRef<HTMLSpanElement>(null);
  const [drawnName, setDrawnName] = React.useState<string | null>(null);
  useIsomorphicLayoutEffect(() => {
    const words = textRef.current?.textContent?.trim();
    const number = countRef.current?.textContent?.trim();
    const next =
      hasCount && !plainName && words && number ? `${words}, ${number}` : null;
    setDrawnName((current) => (current === next ? current : next));
  });
  // Radix names the option by its item text alone, through
  // aria-labelledby, which would beat a caller's aria-label: that label
  // wins. With a count, the name is the words, then the count: "POI, 96".
  let naming: Record<string, string | undefined> | null = null;
  if (callerLabel !== undefined && callerLabelledBy === undefined) {
    naming = { "aria-labelledby": undefined };
  } else if (hasCount && callerLabelledBy === undefined) {
    const name = plainName ?? drawnName;
    naming = name
      ? { "aria-label": name, "aria-labelledby": undefined }
      : { "aria-labelledby": `${textId} ${countId}` };
  }
  return (
    // Combobox's row (owned-selection.css): the words, then the check at the
    // end, a light row under the pointer or the keyboard. The check's place
    // is kept on every row, so counts form one column that a new choice
    // never moves (decision 1).
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "kozmos-reset kozmos-option select-none data-[disabled]:pointer-events-none",
        className,
      )}
      {...props}
      {...naming}
    >
      <span className="kozmos-reset kozmos-option-content">
        <SelectPrimitive.ItemText
          ref={textRef}
          {...(hasCount ? { id: textId } : null)}
        >
          {children}
        </SelectPrimitive.ItemText>
      </span>
      {hasCount ? (
        <Counter ref={countRef} id={countId} className="shrink-0">
          {countText}
        </Counter>
      ) : null}
      <span
        data-slot="select-item-check"
        className="flex h-4 w-4 shrink-0 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator asChild>
          <Check
            aria-hidden="true"
            className="kozmos-reset kozmos-option-check"
          />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
