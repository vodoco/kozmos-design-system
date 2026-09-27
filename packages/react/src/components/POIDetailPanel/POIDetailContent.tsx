import React from "react";
import type {
  POIDetailsPresentation,
  POIServicePresentation,
} from "@kozmos-ds/product-contracts";
import {
  ClockPlus,
  Feather,
  getIconDefinition,
  isKozmosIconKey,
} from "@kozmos-ds/icons";
import { Star01 as Star } from "@kozmos-ds/icons";
import { Accessibility } from "@kozmos-ds/icons";
import { Button } from "../Button";
import { MetaStrip, MetaStripItem } from "../MetaStrip";

const summaryIcons = {
  rating: Star,
  accessibility: Accessibility,
  dietary: Feather,
  crowd: ClockPlus,
  price: null,
  property: null,
};

/** Images are decorative and never replace the readable label. Do not inline remote SVG. */
export function POIDetailAssetIcon({
  src,
  size = 16,
  monochrome = false,
}: {
  src: string;
  size?: number;
  monochrome?: boolean;
}) {
  const [failed, setFailed] = React.useState<string>();
  const safe =
    !src.includes("\\") && (/^https:\/\//i.test(src) || /^\/(?!\/)/.test(src));
  if (!safe || failed === src) return null;
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
  const Icon =
    item.iconName && isKozmosIconKey(item.iconName)
      ? getIconDefinition(item.iconName)?.component
      : undefined;
  return (
    <>
      {item.iconUrl ? (
        <POIDetailAssetIcon
          src={item.iconUrl}
          monochrome={item.iconMonochrome}
        />
      ) : (
        Icon && <Icon aria-hidden="true" size={16} />
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
