import React from "react";
import { cn } from "../../utils";
import { ThemeProviderContext } from "../../theme/theme-context";
import { MapPopupRegionContext } from "../AdaptiveMapShell/map-popup-region";
import { Button } from "../Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Select";

/** A host-supported language. IDs must be unique, nonempty canonical BCP 47 tags. */
export interface LanguageOption {
  id: string;
  /** Native language name, not a flag or a translated country name. */
  label: string;
  /** Direction of this name only; the host commits the application direction. */
  direction?: "ltr" | "rtl";
  disabled?: boolean;
}

export interface LanguageSwitcherProps {
  languages: readonly LanguageOption[];
  /** Committed app/SDK locale. Never optimistically changed by this control. */
  selectedLocale: string;
  /** Requests a change; the host owns async application, rollback and persistence. */
  onLocaleRequest: (locale: string) => void;
  disabled?: boolean;
  pending?: boolean;
  /** Localized failure message. Does not change the committed selection. */
  error?: string;
  onRetry?: () => void;
  label?: string;
  placeholder?: string;
  pendingLabel?: string;
  retryLabel?: string;
  /** Interface direction; otherwise inherited from ThemeProvider. */
  dir?: "ltr" | "rtl";
  className?: string;
}

/** Web-only map control. Native apps follow device/app language instead. */
export const LanguageSwitcher = React.forwardRef<
  HTMLButtonElement,
  LanguageSwitcherProps
>(
  (
    {
      languages,
      selectedLocale,
      onLocaleRequest,
      disabled = false,
      pending = false,
      error,
      onRetry,
      label = "Language",
      placeholder = "Choose language",
      pendingLabel = "Changing language…",
      retryLabel = "Retry",
      dir,
      className,
    },
    ref,
  ) => {
    const theme = React.useContext(ThemeProviderContext);
    const region = React.useContext(MapPopupRegionContext);
    const direction = dir ?? theme?.dir ?? "ltr";
    const [open, setOpen] = React.useState(false);
    const id = React.useId();
    const selected = languages.find(
      (language) => language.id === selectedLocale,
    );
    const display = selected?.label ?? (selectedLocale || placeholder);
    const blocked = disabled || pending || region?.available === false;
    // Unavailable: nothing to choose or nowhere to show it. Pending is not
    // unavailable: the trigger keeps focus while the host applies the choice,
    // so it is aria-disabled rather than disabled, which would drop focus.
    const unavailable =
      disabled ||
      region?.available === false ||
      !languages.some(
        (language) => !language.disabled && language.id !== selectedLocale,
      );
    const canChange = !unavailable && !pending;
    React.useEffect(() => {
      if (!canChange) setOpen(false);
    }, [canChange]);

    return (
      <div className={cn("min-w-0 max-w-full", className)} dir={direction}>
        <Select
          value={selectedLocale}
          dir={direction}
          disabled={unavailable}
          open={open && canChange}
          onOpenChange={(next) => setOpen(next && canChange)}
          onValueChange={(locale) => {
            if (
              canChange &&
              locale !== selectedLocale &&
              languages.some(
                (language) => language.id === locale && !language.disabled,
              )
            ) {
              onLocaleRequest(locale);
            }
          }}
        >
          <SelectTrigger
            ref={ref}
            // Pending looks as unavailable as disabled did, though it keeps focus.
            className="h-12 min-w-32 max-w-full border-0 shadow-map-control aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            aria-label={`${label}, ${display}`}
            aria-busy={pending || undefined}
            aria-disabled={(pending && !unavailable) || undefined}
            aria-describedby={
              error ? `${id}-error` : pending ? `${id}-pending` : undefined
            }
          >
            <SelectValue placeholder={placeholder}>
              <bdi lang={selected?.id} dir={selected?.direction ?? "auto"}>
                {display}
              </bdi>
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            side="top"
            align="start"
            sideOffset={4}
            collisionPadding={0}
            collisionBoundary={region?.boundary ?? undefined}
            // A side panel can put the usable popup region beside the trigger.
            // Honor that boundary fully rather than tethering into the panel.
            sticky={region ? "always" : "partial"}
            className="data-[side=top]:translate-y-0 data-[side=bottom]:translate-y-0"
            style={{
              maxHeight: "var(--radix-select-content-available-height)",
              maxWidth: "var(--radix-select-content-available-width)",
              minWidth:
                "min(8rem, var(--radix-select-content-available-width))",
            }}
            onCloseAutoFocus={(event) => {
              if (unavailable) {
                event.preventDefault();
                if (document.activeElement === document.body)
                  region?.focusFallback();
              }
            }}
          >
            {languages.map((language) => (
              <SelectItem
                key={language.id}
                value={language.id}
                disabled={language.disabled}
                textValue={language.label}
                className="min-h-11 whitespace-normal break-words"
              >
                <bdi lang={language.id} dir={language.direction ?? "auto"}>
                  {language.label}
                </bdi>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Mounted throughout: a live region inserted with its text is often not announced. */}
        <p
          id={`${id}-pending`}
          role="status"
          className={pending ? "mt-2 text-sm text-muted-foreground" : "sr-only"}
        >
          {pending ? pendingLabel : null}
        </p>
        {error && (
          <div className="mt-2 text-sm text-destructive-text">
            <p id={`${id}-error`} role="alert">
              {error}
            </p>
            {onRetry && (
              <Button
                variant="ghost"
                disabled={blocked}
                onClick={() => {
                  if (!blocked) onRetry();
                }}
              >
                {retryLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  },
);
LanguageSwitcher.displayName = "LanguageSwitcher";
