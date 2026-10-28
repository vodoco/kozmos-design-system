import React from "react";
import { Check, X } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { SpinnerArc } from "../Spinner/SpinnerArc";

/**
 * How the steps are drawn: `numbered`, a numbered circle over each step's
 * label, or `dots`, one dot per step with no label shown, as a tour's
 * progress is. The indicator style only: `orientation`, and a status for
 * each step, sit beside it (GAP-173).
 */
export type StepperVariant = "numbered" | "dots";

/** A row of steps, or a column of them, as a wizard's side panel lists them. */
export type StepperOrientation = "horizontal" | "vertical";

/**
 * A step's status (decision 119): `done`, `current`, `pending` (not reached
 * yet), `error`, or `loading` while the step works. The first three are
 * Stepper's own words, as its dots name their states; `error` and `loading`
 * are the words Kozmos's other statuses use (`MapReadiness`,
 * `RouteLocationStatus`, `InputStatus`).
 */
export type StepperStepStatus =
  | "done"
  | "current"
  | "pending"
  | "error"
  | "loading";

/** A step, as an object where a string is not enough. */
export interface StepperStep {
  /** The step's name, as a string step is. */
  label: string;
  /**
   * How the step is drawn and what is said of it. By default it follows
   * `currentStep`: done before it, current at it, pending after it.
   */
  status?: StepperStepStatus;
  /**
   * Whether the visitor may not go to the step, with `onStepSelect`. By
   * default the steps before the current one may be and those after it may
   * not; `true` or `false` says otherwise for this step.
   */
  disabled?: boolean;
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Each step: a string, its label, or an object with a status (GAP-173). */
  steps: (string | StepperStep)[];
  /** The current step, from 0. Earlier steps are done; at `steps.length`, every one is. */
  currentStep: number;
  /** `numbered` (the default) or `dots` (GAP-191). */
  variant?: StepperVariant;
  /**
   * `horizontal` (the default), or `vertical`, each indicator beside its
   * label in a column. The numbered variant's; the dots are a row.
   */
  orientation?: StepperOrientation;
  /**
   * Called with a step's index when the visitor selects it. With it, every
   * step they may go to (see `StepperStep.disabled`) is a button, a Tab stop
   * of its own; the current step never is. The numbered variant's.
   */
  onStepSelect?: (index: number) => void;
  /**
   * The words for each status, said after a step's label ("Levels, Error").
   * English by default; a product that translates passes its own, for one
   * status or all five. The current step's is never said: it is
   * `aria-current="step"`.
   */
  statusLabels?: Partial<Record<StepperStepStatus, string>>;
  /**
   * The position, read as the steps' name: a function of the step (from 1)
   * and the count, or a template with `{step}` and `{count}`. English by
   * default, "Step 2 of 5". Once every step is done, the step is the last.
   */
  positionLabel?: string | ((step: number, count: number) => string);
}

const STATUS_LABELS: Record<StepperStepStatus, string> = {
  done: "Done",
  current: "Current",
  pending: "Not started",
  error: "Error",
  loading: "In progress",
};

// Each status's indicator: a completed step is a prominent fill, the theme
// fill with the theme foreground on it, the same in both themes (decision
// 59), and an error the danger fill, as a danger Button is. The current and
// loading steps' ring is 2, theme 600, as the plugin paints it; a pending
// one's 1, foreground/500, as Figma and the natives draw it (`border-muted`
// read 1.2:1 on the page until 2026-09-22).
const INDICATOR: Record<StepperStepStatus, string> = {
  done: "border-2 border-theme-fill bg-theme-fill text-theme-fill-foreground",
  current: "border-2 border-primary text-foreground",
  loading: "border-2 border-primary text-primary",
  error: "kozmos-stepper-error border-2",
  pending:
    "border-[color:var(--primitives-colors-foreground-500)] text-muted-foreground",
};

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      className,
      steps,
      currentStep,
      variant = "numbered",
      orientation = "horizontal",
      onStepSelect,
      statusLabels,
      positionLabel = "Step {step} of {count}",
      ...props
    },
    ref,
  ) => {
    const count = steps.length;
    // A step that is not a number is before the first: nothing done and
    // nothing current. The position names the first step then, and the last
    // once every step is done.
    const at = Number.isFinite(currentStep) ? currentStep : -1;
    const step = Math.min(Math.max(Math.floor(at) + 1, 1), count);
    const position =
      typeof positionLabel === "function"
        ? positionLabel(step, count)
        : positionLabel
            .replace(/\{step\}/g, String(step))
            .replace(/\{count\}/g, String(count));
    const items = steps.map((item) =>
      typeof item === "string" ? { label: item } : item,
    );

    if (variant === "dots") {
      // No steps, no tour: the root alone, as the numbered stepper draws it,
      // with no group to name and no list.
      if (count === 0)
        return (
          <div
            ref={ref}
            className={cn("kozmos-stepper-dots", className)}
            {...props}
          />
        );
      // The dots draw no label, so the group says where the tour is and each
      // dot is named by its step, in text a screen reader reads and the page
      // never shows. The current dot is the long one, so its shape says it
      // as well as its colour; the pending ones are foreground 500, 3:1 or
      // more on the page, a popover and the muted fill in both themes. They
      // draw the position alone: a step's status is the numbered variant's.
      return (
        <div
          ref={ref}
          role="group"
          aria-label={position}
          className={cn("kozmos-stepper-dots", className)}
          {...props}
        >
          <ol className="kozmos-stepper-dots-list">
            {items.map(({ label }, index) => {
              const state =
                index < at ? "done" : index === at ? "current" : "pending";
              return (
                <li
                  key={index}
                  className="kozmos-stepper-dot"
                  data-state={state}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  <span className="kozmos-stepper-dot-name">{label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      );
    }

    const vertical = orientation === "vertical";
    return (
      // A list of the steps, named by the position, as the dots' group is.
      // The root keeps the row's own classes, so a string stepper draws as
      // it always has; a connector is drawn for the eye only.
      <div
        ref={ref}
        role={count ? "list" : undefined}
        aria-label={count ? position : undefined}
        data-orientation={vertical ? "vertical" : undefined}
        className={cn(
          vertical ? "kozmos-stepper-vertical" : "flex w-full items-center",
          className,
        )}
        {...props}
      >
        {items.map((item, index) => {
          const isCurrent = index === currentStep;
          const status: StepperStepStatus =
            item.status ??
            (index < currentStep ? "done" : isCurrent ? "current" : "pending");
          // A screen reader hears the status after the label. The current
          // step is `aria-current="step"`, which says it, so "current" is not
          // said again there.
          const word =
            isCurrent && status === "current"
              ? null
              : (statusLabels?.[status] ?? STATUS_LABELS[status]);
          // A step the visitor may go to is a button and a Tab stop of its
          // own, as Pagination's pages and Breadcrumb's links are: a list of
          // buttons is not a composite widget, so it takes no roving focus.
          // By default the steps before the current one, so none when the
          // current step is not a number; `disabled` says otherwise.
          const navigable =
            !!onStepSelect &&
            !isCurrent &&
            (item.disabled === undefined
              ? index < currentStep
              : !item.disabled);
          const content = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "kozmos-stepper-indicator flex h-8 w-8 flex-none items-center justify-center rounded-pill border text-sm font-medium transition-colors",
                  INDICATOR[status],
                )}
              >
                {status === "done" ? (
                  <Check className="h-4 w-4" />
                ) : status === "error" ? (
                  <X className="h-4 w-4" />
                ) : status === "loading" ? (
                  <SpinnerArc size={16} />
                ) : (
                  index + 1
                )}
              </span>
              {/* A step can shrink below its label, which then truncates in
                  a row: it fits any width without widening the page. The
                  label's text stays whole for assistive technology, and the
                  title shows it on hover. In a column it wraps. */}
              <span
                title={vertical ? undefined : item.label}
                className={cn(
                  "kozmos-stepper-label",
                  vertical ? "min-w-0 text-sm" : "max-w-full truncate text-xs",
                  isCurrent
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
                {word ? (
                  <span className="kozmos-stepper-status">, {word}</span>
                ) : null}
              </span>
            </>
          );
          const stepClass = vertical
            ? "kozmos-stepper-step"
            : "flex min-w-0 flex-col items-center gap-2";

          return (
            <React.Fragment key={index}>
              {/* The current step is `aria-current="step"`, so a screen
                  reader hears which step the visitor is on: it set none
                  until 2026-10-21. A step the visitor may go to is the
                  button inside its item. */}
              <div
                role="listitem"
                data-status={status}
                aria-current={isCurrent ? "step" : undefined}
                className={
                  !navigable ? stepClass : vertical ? undefined : "flex min-w-0"
                }
              >
                {navigable ? (
                  <button
                    type="button"
                    className={`${stepClass} kozmos-stepper-button`}
                    onClick={() => onStepSelect(index)}
                  >
                    {content}
                  </button>
                ) : (
                  content
                )}
              </div>
              {index < count - 1 && (
                <div
                  aria-hidden="true"
                  // In a row, 8 a side on a phone and 16 from sm: three
                  // connectors at 16 took 96 of a 288-wide row.
                  className={`kozmos-stepper-connector ${
                    vertical ? "" : "mx-2 h-[1px] flex-1 sm:mx-4 "
                  }${index < currentStep ? "bg-primary" : "bg-border"}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  },
);
Stepper.displayName = "Stepper";

export { Stepper };
