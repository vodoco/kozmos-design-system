import React from "react";
import type {
  POIAction,
  POIDetailsPresentation,
  POIPresentation,
  POISupplementaryAction,
} from "@kozmos-ds/product-contracts";
import { NavigationPointer01 as Navigation, X } from "@kozmos-ds/icons";
import {
  Bookmark,
  CalendarCheck01,
  Heart,
  Phone,
  Share01,
  ShoppingBag02,
} from "@kozmos-ds/icons";
import { cn, poiLocationLabel } from "../../utils";
import { scrollHorizontalWithKeyboard } from "../../utils/keyboard-scroll";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Heading } from "../Heading";
import { POIMediaGallery } from "../POIMediaGallery";
import {
  POIDetailAttribute,
  POIDetailContent,
  POIDetailSummaryStrip,
} from "./POIDetailContent";

export interface POIActionState {
  disabled?: boolean;
  loading?: boolean;
  pressed?: boolean;
  message?: string;
  messageTone?: "status" | "error";
}

export interface POIDetailPanelProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "onAction"
> {
  poi: POIPresentation;
  /** Additive details; basic POI consumers do not need category-specific fields. */
  details?: POIDetailsPresentation;
  actionLabels: Readonly<Record<POIAction, string>>;
  /** Accessible name for the horizontally scrollable action group. */
  actionsLabel?: string;
  actionStates?: Partial<Record<POIAction, POIActionState>>;
  onAction: (action: POIAction, poiId: string) => void;
  /** Supplementary capabilities do not widen the required action label record. */
  onSupplementaryAction?: (
    action: POISupplementaryAction,
    poiId: string,
  ) => void;
  supplementaryActionStates?: Partial<
    Record<POISupplementaryAction, POIActionState>
  >;
  onClose?: () => void;
  closeLabel?: string;
  mediaLabel?: string;
  mediaPositionLabel?: (current: number, total: number) => string;
  mediaPreviousLabel?: string;
  mediaNextLabel?: string;
  mediaUnavailableLabel?: string;
  mediaControlsLabel?: string;
  accessRestrictionsHeading?: string;
  servicesHeading?: string;
  readMoreLabel?: string;
  readLessLabel?: string;
  tagsLabel?: string;
  presentation?: "inline" | "sheet" | "panel";
  titleLevel?: 2 | 3;
}

const actionIcons = {
  navigate: Navigation,
  favourite: Heart,
  bookmark: Bookmark,
  share: Share01,
  order: ShoppingBag02,
};
const supplementaryIcons = { book: CalendarCheck01, call: Phone };
const isToggle = (action: POIAction) =>
  action === "favourite" || action === "bookmark";

function ActionMessage({ state }: { state?: POIActionState }) {
  if (!state?.message) return null;
  return (
    <p
      className="kozmos-poi-action-message"
      role={state.messageTone === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

function POILogo({ logo }: { logo: NonNullable<POIPresentation["logo"]> }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) return null;
  return (
    <img
      alt={logo.alt}
      className="kozmos-reset kozmos-poi-logo"
      src={logo.src}
      onError={() => setFailed(true)}
    />
  );
}

const useLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const POIDetailPanel = React.forwardRef<HTMLElement, POIDetailPanelProps>(
  (
    {
      className,
      poi,
      details,
      actionLabels,
      actionsLabel = "Place actions",
      actionStates = {},
      onAction,
      onSupplementaryAction,
      supplementaryActionStates = {},
      onClose,
      closeLabel = "Close details",
      mediaLabel = `${poi.name} photos`,
      mediaPositionLabel = (current, total) => `Image ${current} of ${total}`,
      mediaPreviousLabel = "Previous image",
      mediaNextLabel = "Next image",
      mediaUnavailableLabel = "Image unavailable",
      mediaControlsLabel,
      accessRestrictionsHeading = "Access restrictions",
      servicesHeading = "Service options",
      readMoreLabel = "Read more",
      readLessLabel = "Read less",
      tagsLabel = "Tags",
      presentation = "inline",
      titleLevel = 2,
      ...props
    },
    ref,
  ) => {
    const titleId = React.useId();
    const root = React.useRef<HTMLElement>(null);
    React.useImperativeHandle(ref, () => root.current!, []);
    useLayoutEffect(() => {
      // Preserve scroll through resize/content refresh, but a different place
      // starts at its identity. Focus remains the responsibility of the host.
      if (root.current) root.current.scrollTop = 0;
    }, [poi.id]);
    const locationLabel = poiLocationLabel(poi);
    const actions = poi.actions.filter((action) => !isToggle(action));
    const SectionHeading = titleLevel === 2 ? "h3" : "h4";
    const hasRestriction =
      poi.accessRestrictions !== undefined &&
      poi.accessRestrictions !== "none" &&
      Boolean(poi.accessRestrictionsLabel);
    const hasBody =
      hasRestriction ||
      poi.media.length > 0 ||
      Boolean(poi.services?.length) ||
      Boolean(
        details?.groups?.some((group) => group.items.length > 0) ||
        details?.openingHours ||
        details?.description?.preview ||
        details?.tags?.length,
      );
    return (
      <article
        ref={root}
        aria-labelledby={titleId}
        className={cn("kozmos-reset kozmos-poi-detail", className)}
        data-presentation={presentation}
        {...props}
      >
        <header className="kozmos-poi-header">
          <div className="kozmos-poi-identity">
            {poi.logo && <POILogo key={poi.logo.src} logo={poi.logo} />}
            <Heading
              level={titleLevel}
              className="kozmos-poi-title"
              id={titleId}
            >
              {poi.name}
            </Heading>
          </div>
          <div className="kozmos-poi-header-actions">
            {poi.actions.filter(isToggle).map((action) => {
              const Icon = actionIcons[action];
              const state = actionStates[action];
              return (
                <IconButton
                  key={action}
                  variant={state?.pressed ? "default" : "outline"}
                  emotion={state?.pressed ? "themed" : "neutral"}
                  aria-label={actionLabels[action]}
                  aria-pressed={state?.pressed ?? false}
                  disabled={state?.disabled}
                  isLoading={state?.loading}
                  onClick={() => onAction(action, poi.id)}
                  type="button"
                >
                  <Icon aria-hidden="true" size={20} />
                </IconButton>
              );
            })}
            {onClose && (
              <IconButton
                variant="outline"
                emotion="neutral"
                aria-label={closeLabel}
                onClick={onClose}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </IconButton>
            )}
          </div>
        </header>
        <div className="kozmos-poi-location">
          {locationLabel && <p>{locationLabel}</p>}
          {poi.availabilityLabel && (
            <p
              className="kozmos-poi-availability"
              data-availability={poi.availability ?? "unknown"}
            >
              {poi.availabilityLabel}
            </p>
          )}
        </div>
        {poi.description && (
          <p className="kozmos-poi-intro">{poi.description}</p>
        )}
        {(actions.length > 0 ||
          Boolean(details?.supplementaryActions?.length)) && (
          <div
            key={poi.id}
            className="kozmos-poi-actions"
            role="group"
            aria-label={actionsLabel}
            tabIndex={0}
            onKeyDown={scrollHorizontalWithKeyboard}
            onFocusCapture={(event) => {
              if (event.target === event.currentTarget) return;
              const target = event.target.getBoundingClientRect();
              const viewport = event.currentTarget.getBoundingClientRect();
              // Reveal the focused control and its ring within this strip only.
              // scrollIntoView would also move the panel/page ancestors.
              const delta =
                target.left < viewport.left
                  ? target.left - viewport.left - 4
                  : target.right > viewport.right
                    ? target.right - viewport.right + 4
                    : 0;
              if (delta)
                event.currentTarget.scrollBy({ left: delta, behavior: "auto" });
            }}
          >
            {actions.map((action) => {
              const Icon = actionIcons[action];
              const state = actionStates[action];
              const estimate =
                action === "navigate" ? details?.travelEstimate : undefined;
              return (
                <Button
                  key={action}
                  className={cn(
                    "kozmos-poi-action",
                    action === "navigate" && "kozmos-poi-action-primary",
                  )}
                  data-has-estimate={Boolean(estimate) || undefined}
                  disabled={state?.disabled}
                  isLoading={state?.loading}
                  onClick={() => onAction(action, poi.id)}
                  type="button"
                  variant={action === "navigate" ? "default" : "outline"}
                  emotion={action === "navigate" ? "themed" : "neutral"}
                  aria-label={
                    estimate
                      ? [
                          actionLabels[action],
                          estimate.durationLabel,
                          estimate.distanceLabel,
                        ]
                          .filter(Boolean)
                          .join(" ")
                      : undefined
                  }
                >
                  <Icon
                    aria-hidden="true"
                    size={action === "navigate" ? 24 : 20}
                  />
                  <span>
                    {actionLabels[action]}
                    {estimate && (
                      <small className="kozmos-poi-estimate">
                        {" "}
                        {[estimate.durationLabel, estimate.distanceLabel]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    )}
                  </span>
                </Button>
              );
            })}
            {details?.supplementaryActions?.map(({ action, label }) => {
              const Icon = supplementaryIcons[action];
              const state = supplementaryActionStates[action];
              return (
                <Button
                  key={action}
                  className="kozmos-poi-action"
                  variant="outline"
                  emotion="neutral"
                  type="button"
                  disabled={!onSupplementaryAction || state?.disabled}
                  isLoading={state?.loading}
                  onClick={() => onSupplementaryAction?.(action, poi.id)}
                >
                  <Icon aria-hidden="true" size={18} />
                  {label}
                </Button>
              );
            })}
          </div>
        )}
        {poi.actions.map((action) => (
          <ActionMessage key={action} state={actionStates[action]} />
        ))}
        {details?.supplementaryActions?.map(({ action }) => (
          <ActionMessage
            key={action}
            state={supplementaryActionStates[action]}
          />
        ))}
        {details && <POIDetailSummaryStrip details={details} />}
        {hasBody && (
          <div className="kozmos-poi-body">
            {poi.accessRestrictions !== undefined &&
              poi.accessRestrictions !== "none" &&
              poi.accessRestrictionsLabel && (
                <section
                  aria-label={accessRestrictionsHeading}
                  className="kozmos-reset kozmos-poi-restrictions"
                >
                  {poi.accessRestrictionsLabel}
                </section>
              )}
            <POIMediaGallery
              key={`media-${poi.id}`}
              label={mediaLabel}
              media={poi.media}
              positionLabel={mediaPositionLabel}
              previousLabel={mediaPreviousLabel}
              nextLabel={mediaNextLabel}
              unavailableLabel={mediaUnavailableLabel}
              controlsLabel={mediaControlsLabel}
            />
            {Boolean(poi.services?.length) && (
              <section aria-label={servicesHeading}>
                <SectionHeading className="kozmos-poi-section-heading">
                  {servicesHeading}
                </SectionHeading>
                <ul className="kozmos-poi-chips">
                  {poi.services!.map((service) => (
                    <li className="kozmos-reset" key={service.id}>
                      <POIDetailAttribute item={service} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {details && (
              <POIDetailContent
                key={poi.id}
                details={details}
                titleLevel={titleLevel}
                readMoreLabel={readMoreLabel}
                readLessLabel={readLessLabel}
                tagsLabel={tagsLabel}
              />
            )}
          </div>
        )}
      </article>
    );
  },
);

POIDetailPanel.displayName = "POIDetailPanel";
export { POIDetailPanel };
