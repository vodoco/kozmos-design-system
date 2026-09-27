import React from "react";
import type { POIMediaPresentation } from "@kozmos-ds/product-contracts";
import { ChevronLeft, ChevronRight } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { IconButton } from "../IconButton";

export interface POIMediaGalleryProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "onChange"
> {
  media: readonly POIMediaPresentation[];
  label: string;
  activeIndex?: number;
  defaultActiveIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  previousLabel?: string;
  nextLabel?: string;
  controlsLabel?: string;
  unavailableLabel?: string;
  positionLabel: (current: number, total: number) => string;
}

const useLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;
const boundedIndex = (index: number, length: number) =>
  Math.min(
    Math.max(Number.isFinite(index) ? Math.trunc(index) : 0, 0),
    Math.max(length - 1, 0),
  );

/** Scroll only the gallery, never its enclosing detail panel or document. */
function alignImage(list: HTMLUListElement | null, index: number) {
  const item = list?.children[index];
  if (!list || !item) return;
  const viewport = list.getBoundingClientRect();
  const image = item.getBoundingClientRect();
  const rtl = getComputedStyle(list).direction === "rtl";
  const delta = rtl ? image.right - viewport.right : image.left - viewport.left;
  // The owned scrollport has scroll-behavior:auto. No forced motion, including
  // under reduced motion. At the last image the browser clamps to its scroll range.
  if (Math.abs(delta) > 1) list.scrollBy?.({ left: delta, behavior: "auto" });
}

function MediaImage({
  item,
  eager,
  unavailableLabel,
}: {
  item: POIMediaPresentation;
  eager: boolean;
  unavailableLabel: string;
}) {
  const [failed, setFailed] = React.useState(false);
  return failed ? (
    <div
      className="kozmos-reset kozmos-poi-gallery-unavailable"
      role="img"
      aria-label={
        item.alt ? `${item.alt}: ${unavailableLabel}` : unavailableLabel
      }
    >
      {unavailableLabel}
    </div>
  ) : (
    <img
      alt={item.alt}
      className="kozmos-reset kozmos-poi-gallery-image"
      loading={eager ? "eager" : "lazy"}
      src={item.src}
      onError={() => setFailed(true)}
    />
  );
}

const POIMediaGallery = React.forwardRef<HTMLElement, POIMediaGalleryProps>(
  (
    {
      className,
      media,
      label,
      activeIndex,
      defaultActiveIndex = 0,
      onActiveIndexChange,
      previousLabel = "Previous image",
      nextLabel = "Next image",
      controlsLabel = `${label} controls`,
      unavailableLabel = "Image unavailable",
      positionLabel,
      ...props
    },
    ref,
  ) => {
    const [internalIndex, setInternalIndex] =
      React.useState(defaultActiveIndex);
    const [observation, setObservation] = React.useState({ index: 0 });
    const listRef = React.useRef<HTMLUListElement>(null);
    const controlled = activeIndex !== undefined;
    const currentIndex = boundedIndex(
      controlled ? activeIndex : internalIndex,
      media.length,
    );
    const latestIndex = React.useRef(currentIndex);
    const scrollSource = React.useRef<"native" | "command" | null>(null);
    const mediaKey = JSON.stringify(media.map((item) => item.id));
    const previousMedia = React.useRef("");
    const hasMedia = media.length > 0;
    const galleryId = React.useId();

    useLayoutEffect(() => {
      latestIndex.current = currentIndex;
      if (!controlled && internalIndex !== currentIndex)
        setInternalIndex(currentIndex);
      // Natural scrolling updates both indices together; do not fight the gesture.
      // Buttons, an external controlled value, or a rejected controlled request
      // leave them different and require alignment.
      if (
        scrollSource.current !== "native" ||
        currentIndex !== observation.index ||
        previousMedia.current !== mediaKey
      ) {
        alignImage(listRef.current, currentIndex);
      }
      scrollSource.current = null;
      previousMedia.current = mediaKey;
    }, [currentIndex, observation, mediaKey, controlled, internalIndex]);

    useLayoutEffect(() => {
      const list = listRef.current;
      if (!list || typeof ResizeObserver === "undefined") return;
      let width = list.clientWidth;
      let direction = getComputedStyle(list).direction;
      const observer = new ResizeObserver(() => {
        if (list.clientWidth !== width) {
          width = list.clientWidth;
          alignImage(list, latestIndex.current);
        }
      });
      observer.observe(list);
      const directionObserver = new MutationObserver(() => {
        const next = getComputedStyle(list).direction;
        if (next !== direction) {
          direction = next;
          alignImage(list, latestIndex.current);
        }
      });
      for (
        let ancestor: HTMLElement | null = list;
        ancestor;
        ancestor = ancestor.parentElement
      ) {
        directionObserver.observe(ancestor, {
          attributes: true,
          attributeFilter: ["dir", "class", "style"],
        });
      }
      return () => {
        observer.disconnect();
        directionObserver.disconnect();
      };
    }, [hasMedia]);

    const selectIndex = (
      index: number,
      source: "native" | "command" = "command",
    ) => {
      const next = boundedIndex(index, media.length);
      if (next === currentIndex) {
        if (source === "command") alignImage(listRef.current, currentIndex);
        return;
      }
      scrollSource.current = source;
      if (!controlled) setInternalIndex(next);
      onActiveIndexChange?.(next);
    };

    const onScroll = () => {
      const list = listRef.current;
      if (!list) return;
      const bounds = list.getBoundingClientRect();
      const rtl = getComputedStyle(list).direction === "rtl";
      let nearest = 0;
      let distance = Infinity;
      Array.from(list.children).forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const next = Math.abs(
          rtl ? bounds.right - rect.right : rect.left - bounds.left,
        );
        if (next < distance) {
          nearest = index;
          distance = next;
        }
      });
      // An acknowledgement of our own alignment must not schedule another
      // alignment: its delayed render could undo the user's next native scroll.
      // A fresh observation also lets a controlled parent reject the same
      // requested index more than once without losing reconciliation.
      if (nearest !== currentIndex) {
        setObservation({ index: nearest });
        selectIndex(nearest, "native");
      }
    };

    if (!hasMedia) return null;
    return (
      <section
        ref={ref}
        aria-label={label}
        className={cn("kozmos-reset kozmos-poi-gallery", className)}
        {...props}
      >
        <div className="kozmos-poi-gallery-toolbar">
          <p
            aria-live="polite"
            aria-atomic="true"
            className="kozmos-reset kozmos-poi-gallery-position"
          >
            {positionLabel(currentIndex + 1, media.length)}
          </p>
          {media.length > 1 && (
            <div
              aria-label={controlsLabel}
              className="kozmos-poi-gallery-controls"
              role="group"
            >
              <IconButton
                aria-controls={galleryId}
                aria-label={previousLabel}
                variant="outline"
                emotion="neutral"
                disabled={currentIndex === 0}
                onClick={() => selectIndex(currentIndex - 1)}
                type="button"
              >
                <ChevronLeft
                  aria-hidden="true"
                  className="kozmos-poi-gallery-arrow"
                  size={20}
                />
              </IconButton>
              <IconButton
                aria-controls={galleryId}
                aria-label={nextLabel}
                variant="outline"
                emotion="neutral"
                disabled={currentIndex === media.length - 1}
                onClick={() => selectIndex(currentIndex + 1)}
                type="button"
              >
                <ChevronRight
                  aria-hidden="true"
                  className="kozmos-poi-gallery-arrow"
                  size={20}
                />
              </IconButton>
            </div>
          )}
        </div>
        <ul
          tabIndex={0}
          aria-label={label}
          ref={listRef}
          id={galleryId}
          className="kozmos-reset kozmos-poi-gallery-list"
          onScroll={onScroll}
          onKeyDown={(event) => {
            if (
              event.target !== event.currentTarget ||
              event.altKey ||
              event.ctrlKey ||
              event.metaKey ||
              event.shiftKey
            )
              return;
            const rtl =
              getComputedStyle(event.currentTarget).direction === "rtl";
            const offset =
              event.key === "ArrowRight"
                ? rtl
                  ? -1
                  : 1
                : event.key === "ArrowLeft"
                  ? rtl
                    ? 1
                    : -1
                  : 0;
            if (offset || event.key === "Home" || event.key === "End") {
              event.preventDefault();
              selectIndex(
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? media.length - 1
                    : currentIndex + offset,
              );
            }
          }}
        >
          {media.map((item, index) => (
            <li
              className="kozmos-reset kozmos-poi-gallery-item"
              data-active={index === currentIndex || undefined}
              aria-current={index === currentIndex ? "true" : undefined}
              key={item.id}
            >
              <MediaImage
                key={item.src}
                item={item}
                eager={index === currentIndex}
                unavailableLabel={unavailableLabel}
              />
            </li>
          ))}
        </ul>
      </section>
    );
  },
);
POIMediaGallery.displayName = "POIMediaGallery";
export { POIMediaGallery };
