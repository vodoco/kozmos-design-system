import React from "react";
import type { UserLocationState } from "@kozmos-ds/product-contracts";
import { cn } from "../../utils";
import { MapControlButton } from "../MapControlButton";
import {
  Accessibility,
  Compass01 as Compass,
  LocationFollowing,
  LocationHeading,
  Minus,
  NavigationPointer01,
  NavigationPointerOff01,
  Plus,
} from "@kozmos-ds/icons";
import { useKozmosAnalytics } from "../../utils/analytics";

/**
 * The location control's mark for each state, as the Location Tracking
 * Buttons revamp draws it (Figma `ce7phRJR1sCkH6zT8EMH8I`, `1:237`): the
 * outline pointer while the map is not following, the solid pointer with a
 * cone while it follows, the upright pointer with the turning arc while the
 * map turns with the visitor, and the pointer struck through when there is no
 * position to show.
 *
 * `locating` keeps the outline, as it always has, and the Button's spinner
 * says the rest. `stale` keeps it too: the revamp has no stale mark, and a
 * last-known fix is not following anything.
 *
 * The SDK's marks are 24 squares (decision 40, Tracking Indicator 434:31572).
 * The two symbols sit on a 36-unit canvas with the pointer in the middle 24,
 * so they are drawn at 36 to put their pointer at the outlines' 24.
 */
function defaultLocationMark(state: UserLocationState): React.ReactNode {
  switch (state) {
    case "following":
      return <LocationFollowing size={36} />;
    case "heading":
      return <LocationHeading size={36} />;
    case "permission-denied":
    case "unavailable":
      return <NavigationPointerOff01 />;
    default:
      return <NavigationPointer01 />;
  }
}

/**
 * One 24 box for every mark the location control can draw, so a labelled
 * control's words stay 8 from the pointer whatever the mark: a symbol's cone
 * and arc overflow it, centred, as Figma's absolutely placed cone does.
 */
function LocationMarkBox({ children }: { children: React.ReactNode }) {
  return (
    <span className="kozmos-reset kozmos-map-control-glyph">{children}</span>
  );
}

/** No position to show: the SDK draws "No Location" alone, on one line. */
function hasNoPosition(state: UserLocationState) {
  return state === "permission-denied" || state === "unavailable";
}

export interface MapControlsGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onCompassReset?: () => void;
  onMyLocation?: () => void;
  compassBearing?: number;
  label?: string;
  /**
   * What each control is called, for a visitor who cannot see it.
   *
   * Hard-coded English until row 67: a German or Japanese device announced
   * "Zoom in" whatever else the product had translated. The defaults stay
   * English because a design system has no locale of its own — the product
   * has one, and now has somewhere to put it.
   */
  zoomInLabel?: string;
  zoomOutLabel?: string;
  compassResetLabel?: string;
  locationState?: UserLocationState;
  locationLabel?: string;
  /**
   * The state the control shows under its name: "Off", "On". The SDK reads
   * heading "On", as it reads following (decision 40). With no position
   * (`unavailable`, `permission-denied`) the control draws this alone, on one
   * line — the SDK's "No Location" — and its name still starts the accessible
   * name.
   */
  locationStateLabel?: string;
  /**
   * What heading adds to the name, for a screen reader: heading shows "On"
   * as following does, and only its mark tells the two apart on screen.
   * Read after the words the control shows. Default "map turns with you";
   * the product translates it.
   */
  locationHeadingDescription?: string;
  locationPresentation?: "icon-only" | "labelled";
  /**
   * The mark for any location state, in place of the group's own.
   *
   * The group draws one per state (row 77), from the revamp. A product with
   * its own artwork for a state passes that state alone; the others keep the
   * group's marks. It is drawn in the control's colour, so artwork that uses
   * `currentColor` follows the pressed tint as the group's own marks do.
   */
  locationIcons?: Partial<Record<UserLocationState, React.ReactNode>>;
  /**
   * Let the location control widen to say its new mode whenever it changes,
   * then collapse — `MapControlButton`'s `revealOnChange`. While it is set,
   * `locationPresentation` is ignored.
   *
   * This and `locationLabelPlacement` are how the SDK's location control
   * reads: icon-only over the map, "Focus / On" for a moment when the mode
   * changes. Both are off by default, so a product that already relies on a
   * fixed presentation sees nothing move.
   *
   * The step-free control, which takes this place during a route, follows
   * the same three settings, so the corner reads the same either way.
   */
  locationRevealOnChange?: boolean;
  /** `stacked` sets the state under the name — `MapControlButton`'s `labelPlacement`. */
  locationLabelPlacement?: "inline" | "stacked";
  /**
   * While a route is active, a step-free control takes the location
   * control's place: passing this draws it, and the location control is not
   * drawn. Called with the setting the visitor asked for.
   *
   * The same button, in the same place, during wayfinding (Olcay,
   * 2026-09-27). Pass it only while the route is shown; leaving it out brings
   * the location control back.
   */
  onStepFreeChange?: (stepFree: boolean) => void;
  /**
   * Whether the route is step-free now. Set it once the route it describes is
   * the one on the map — a control that says "On" over a route with stairs is
   * worse than one that is a moment late.
   */
  stepFree?: boolean;
  /** The control's name. Default "Step-free"; the product translates it. */
  stepFreeLabel?: string;
  /** The state appended to the name while on. Default "On". */
  stepFreeOnLabel?: string;
  /** The state appended to the name while off. Default "Off". */
  stepFreeOffLabel?: string;
  /** The mark, in place of the wheelchair symbol `RouteOptionCard` uses for step-free. */
  stepFreeIcon?: React.ReactNode;
}

const MapControlsGroup = React.forwardRef<
  HTMLDivElement,
  MapControlsGroupProps
>(
  (
    {
      className,
      onZoomIn,
      onZoomOut,
      onCompassReset,
      onMyLocation,
      compassBearing = 0,
      label = "Map controls",
      zoomInLabel = "Zoom in",
      zoomOutLabel = "Zoom out",
      compassResetLabel = "Reset bearing",
      locationState = "off",
      locationLabel = "Focus location",
      locationStateLabel,
      locationHeadingDescription = "map turns with you",
      locationPresentation = "icon-only",
      locationIcons,
      locationRevealOnChange = false,
      locationLabelPlacement = "inline",
      onStepFreeChange,
      stepFree = false,
      stepFreeLabel = "Step-free",
      stepFreeOnLabel = "On",
      stepFreeOffLabel = "Off",
      stepFreeIcon,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();

    const handleZoomIn = () => {
      trackEvent("MapControls", "zoom_in", {});
      onZoomIn?.();
    };

    const handleZoomOut = () => {
      trackEvent("MapControls", "zoom_out", {});
      onZoomOut?.();
    };

    return (
      <div
        ref={ref}
        aria-label={label}
        className={cn(
          "relative flex flex-col gap-2 pointer-events-auto",
          className,
        )}
        role="group"
        {...props}
      >
        {/* Zoom: one surface, its two controls its segments. The surface,
            the hairline between them and their inset focus rings are the
            owned map-control rules. */}
        {(onZoomIn || onZoomOut) && (
          <div className="kozmos-reset kozmos-map-control-stack">
            {onZoomIn && (
              <MapControlButton
                icon={<Plus />}
                label={zoomInLabel}
                variant="ghost"
                onClick={handleZoomIn}
              />
            )}
            {onZoomOut && (
              <MapControlButton
                icon={<Minus />}
                label={zoomOutLabel}
                variant="ghost"
                onClick={handleZoomOut}
              />
            )}
          </div>
        )}

        {/* Compass */}
        {onCompassReset && (
          <MapControlButton
            icon={
              <Compass
                className="transition-transform duration-300"
                style={{ transform: `rotate(${compassBearing}deg)` }}
              />
            }
            label={compassResetLabel}
            variant="ghost"
            onClick={() => {
              trackEvent("MapControls", "compass_reset", {});
              onCompassReset();
            }}
          />
        )}

        {/* Step-free, in the location control's place while a route is
            active. Two controls, keyed apart: sharing one button, the swap
            read as that button changing state, revealed a label nobody had
            set, and handed the location control's focus to the new one. */}
        {onStepFreeChange ? (
          <MapControlButton
            key="step-free"
            data-map-control="step-free"
            icon={
              <LocationMarkBox>
                {stepFreeIcon ?? <Accessibility />}
              </LocationMarkBox>
            }
            label={stepFreeLabel}
            labelPlacement={locationLabelPlacement}
            presentation={locationPresentation}
            pressed={stepFree}
            revealOnChange={locationRevealOnChange}
            stateLabel={stepFree ? stepFreeOnLabel : stepFreeOffLabel}
            onClick={() => {
              trackEvent("MapControls", "step_free_toggled", {
                stepFree: !stepFree,
              });
              onStepFreeChange(!stepFree);
            }}
          />
        ) : (
          /* My Location */
          onMyLocation && (
            <MapControlButton
              key="location"
              data-location-state={locationState}
              icon={
                <LocationMarkBox>
                  {locationIcons?.[locationState] ??
                    defaultLocationMark(locationState)}
                </LocationMarkBox>
              }
              isLoading={locationState === "locating"}
              label={locationLabel}
              labelPlacement={locationLabelPlacement}
              presentation={locationPresentation}
              pressed={
                locationState === "following" || locationState === "heading"
              }
              revealOnChange={locationRevealOnChange}
              showLabel={!hasNoPosition(locationState)}
              stateDescription={
                locationState === "heading"
                  ? locationHeadingDescription
                  : undefined
              }
              stateLabel={locationStateLabel}
              onClick={() => {
                trackEvent("MapControls", "my_location_triggered", {});
                onMyLocation();
              }}
            />
          )
        )}
      </div>
    );
  },
);

MapControlsGroup.displayName = "MapControlsGroup";

export { MapControlsGroup };
