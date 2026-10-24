import React from "react";
import type {
  POIDetailsPresentation,
  POIServicePresentation,
} from "@kozmos-ds/product-contracts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Arriving,
  ClockPlus,
  CustomTransition,
  ElevatorDown,
  ElevatorUp,
  ElevatorUpAndDown,
  EscalatorDown,
  EscalatorNoDirection,
  EscalatorUp,
  Feather,
  FollowTheLine,
  HardLeft,
  HardRight,
  LogIn01,
  LogOut01,
  RampDown,
  RampNoDirection,
  RampUp,
  RouteEnter,
  RouteEntranceExit,
  RouteExit,
  SecurityControl,
  Shuttle,
  StairsDown,
  StairsNoDirection,
  StairsUp,
  TurnBack,
  getIconComponent,
  isKozmosIconKey,
  type KozmosIconComponent,
} from "@kozmos-ds/icons";
import { Star01 as Star } from "@kozmos-ds/icons";
import { Accessibility } from "@kozmos-ds/icons";
import { Button } from "../Button";
import { MetaStrip, MetaStripItem } from "../MetaStrip";

/**
 * The names a tag draws that `Icon`'s registry does not know, which
 * `KozmosIcon` on iOS and Android draws, and so their tags: each wayfinding
 * glyph of Pointr Maps - Express (navigation-glyphs.json) by the kebab case
 * of its export name, and the four Pointr Icon Library outlines the natives
 * keep by name. The artwork is `@kozmos-ds/icons`' own, the source the
 * natives' copies are generated or taken from. The registry's names and
 * aliases resolve through the registry first; none of them is here.
 */
const tagIconsBeyondTheRegistry: Readonly<Record<string, KozmosIconComponent>> =
  {
    "elevator-up": ElevatorUp,
    "elevator-down": ElevatorDown,
    "stairs-up": StairsUp,
    "stairs-down": StairsDown,
    "escalator-up": EscalatorUp,
    "escalator-down": EscalatorDown,
    "ramp-up": RampUp,
    "ramp-down": RampDown,
    "route-enter": RouteEnter,
    "route-exit": RouteExit,
    "elevator-up-and-down": ElevatorUpAndDown,
    "escalator-no-direction": EscalatorNoDirection,
    "stairs-no-direction": StairsNoDirection,
    "ramp-no-direction": RampNoDirection,
    "route-entrance-exit": RouteEntranceExit,
    "hard-left": HardLeft,
    "hard-right": HardRight,
    "turn-back": TurnBack,
    "follow-the-line": FollowTheLine,
    arriving: Arriving,
    "custom-transition": CustomTransition,
    "security-control": SecurityControl,
    shuttle: Shuttle,
    "log-in-01": LogIn01,
    "log-out-01": LogOut01,
    "arrow-up-right": ArrowUpRight,
    "arrow-down-right": ArrowDownRight,
  };

/**
 * A tag's icon for its `iconName`, or none for a name Kozmos does not know:
 * the label stands alone, never beside a stand-in. Only the map's own keys
 * count, so an inherited name such as `constructor` draws nothing.
 */
function tagIcon(name: string | undefined): KozmosIconComponent | undefined {
  if (!name) return undefined;
  if (isKozmosIconKey(name)) return getIconComponent(name);
  return Object.prototype.hasOwnProperty.call(tagIconsBeyondTheRegistry, name)
    ? tagIconsBeyondTheRegistry[name]
    : undefined;
}

const summaryIcons = {
  rating: Star,
  accessibility: Accessibility,
  dietary: Feather,
  crowd: ClockPlus,
  price: null,
  property: null,
};

/**
 * Images are decorative and never replace the readable label. Do not inline
 * remote SVG. An asset that is unsafe, or fails to load, draws `fallback`
 * instead: the glyph the item's `iconName` or kind draws, as on iOS and
 * Android (GAP-178, the owner's rule of 21 Oct). It drew nothing until then.
 */
export function POIDetailAssetIcon({
  src,
  size = 16,
  monochrome = false,
  fallback = null,
}: {
  src: string;
  size?: number;
  monochrome?: boolean;
  fallback?: React.ReactNode;
}) {
  const [failed, setFailed] = React.useState<string>();
  const safe =
    !src.includes("\\") && (/^https:\/\//i.test(src) || /^\/(?!\/)/.test(src));
  if (!safe || failed === src) return <>{fallback}</>;
  const image = (
    <img
      className="kozmos-poi-property-icon"
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      crossOrigin={monochrome ? "anonymous" : undefined}
      onError={() => setFailed(src)}
    />
  );
  if (!monochrome) return image;
  // Escape the quoted CSS URL; never interpolate an unquoted URL as CSS.
  const mask = `url(${JSON.stringify(src)})`;
  return (
    <span
      className="kozmos-poi-property-mask"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    >
      {image}
    </span>
  );
}

export function POIDetailAttribute({ item }: { item: POIServicePresentation }) {
  const Icon = tagIcon(item.iconName);
  const glyph = Icon ? <Icon aria-hidden="true" size={16} /> : null;
  return (
    <>
      {item.iconUrl ? (
        <POIDetailAssetIcon
          src={item.iconUrl}
          monochrome={item.iconMonochrome}
          fallback={glyph}
        />
      ) : (
        glyph
      )}
      <span>{item.label}</span>
    </>
  );
}

export function POIDetailSummaryStrip({
  details,
}: {
  details: POIDetailsPresentation;
}) {
  if (!details.summary?.length) return null;
  return (
    <MetaStrip className="kozmos-poi-summary" tabIndex={undefined}>
      {details.summary.slice(0, 3).map((item) => {
        const Icon = summaryIcons[item.kind];
        return (
          <MetaStripItem
            className="kozmos-poi-summary-item"
            key={item.id}
            label={item.label}
            data-tone={item.tone}
            icon={
              item.iconUrl ? (
                <POIDetailAssetIcon
                  src={item.iconUrl}
                  size={20}
                  monochrome={item.iconMonochrome}
                  fallback={Icon ? <Icon size={20} /> : null}
                />
              ) : Icon ? (
                <Icon size={20} />
              ) : undefined
            }
          >
            <span className="kozmos-poi-summary-text">
              <span className="kozmos-poi-summary-value">
                {item.priceLevel ? (
                  <>
                    <span className="kozmos-poi-price" aria-hidden="true">
                      {"$".repeat(item.priceLevel)}
                      <span>{"$".repeat(4 - item.priceLevel)}</span>
                    </span>
                    <span className="kozmos-meta-label-hidden">
                      {item.value}
                    </span>
                  </>
                ) : (
                  item.value
                )}
              </span>
              {item.detail && <small>{item.detail}</small>}
            </span>
          </MetaStripItem>
        );
      })}
    </MetaStrip>
  );
}

export function POIDetailContent({
  details,
  titleLevel,
  readMoreLabel,
  readLessLabel,
  tagsLabel,
}: {
  details: POIDetailsPresentation;
  titleLevel: 2 | 3;
  readMoreLabel: string;
  readLessLabel: string;
  tagsLabel: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const descriptionId = React.useId();
  const Heading = titleLevel === 2 ? "h3" : "h4";
  const description = details.description;
  const hasMore = Boolean(
    description?.full && description.full !== description.preview,
  );
  return (
    <div className="kozmos-poi-sections">
      {details.groups
        ?.filter((group) => group.items.length > 0)
        .map((group) => (
          <section aria-label={group.heading} key={group.id}>
            <Heading className="kozmos-poi-section-heading">
              {group.heading}
            </Heading>
            <ul className="kozmos-poi-chips">
              {group.items.map((item) => (
                <li className="kozmos-reset" key={item.id}>
                  <POIDetailAttribute item={item} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      {details.openingHours && (
        <section aria-label={details.openingHours.label}>
          <Heading className="kozmos-poi-section-heading">
            {details.openingHours.label}
          </Heading>
          {details.openingHours.rows.length > 0 ? (
            <details className="kozmos-reset kozmos-poi-hours">
              <summary>{details.openingHours.summary}</summary>
              <dl className="kozmos-poi-hours-rows">
                {details.openingHours.rows.map((row) => (
                  <div key={row.id}>
                    <dt>{row.day}</dt>
                    <dd>{row.hours}</dd>
                  </div>
                ))}
              </dl>
              {details.openingHours.note && <p>{details.openingHours.note}</p>}
            </details>
          ) : (
            <p className="kozmos-poi-hours-note">
              {details.openingHours.summary}
              {details.openingHours.note && <> — {details.openingHours.note}</>}
            </p>
          )}
        </section>
      )}
      {description?.preview && (
        <div>
          <p className="kozmos-poi-description" id={descriptionId}>
            {expanded && hasMore ? description.full : description.preview}
          </p>
          {hasMore && (
            <Button
              variant="link"
              aria-controls={descriptionId}
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
              type="button"
            >
              {expanded ? readLessLabel : readMoreLabel}
            </Button>
          )}
        </div>
      )}
      {Boolean(details.tags?.length) && (
        <ul className="kozmos-poi-chips" aria-label={tagsLabel}>
          {details.tags!.map((tag) => (
            <li className="kozmos-reset" key={tag.id}>
              <POIDetailAttribute item={tag} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
