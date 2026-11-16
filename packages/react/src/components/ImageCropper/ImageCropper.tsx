import React from "react";
import { ZoomIn, ZoomOut } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { IconButton } from "../IconButton/IconButton";
import { Slider } from "../Slider/Slider";

// ImageCropper (GAP-273, MAP-32): an image framed to an aspect ratio. The
// frame is the box; the image moves and scales under it. A pointer drags
// the image (two pointers pinch it), the box is one tab stop whose arrow
// keys move the frame by a tenth of itself and whose plus and minus zoom,
// and a zoom row under it has Zoom out, a zoom Slider and Zoom in. Each
// change is said in a polite live region. The result, `onCrop`, is the frame
// as fractions of the image, never pixels: the product crops.

/**
 * Where an image is framed: a rectangle of the image, each side a fraction
 * of the image's own width or height (0 to 1), measured from its top-left
 * corner, whatever the page's direction. Data, not pixels: the product
 * crops (`x * naturalWidth` and so on), on its server or in a canvas.
 */
export interface ImageCropperCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** What `statusLabel` is given: every number a whole percentage. */
export interface ImageCropperStatus {
  /** The frame's left edge, from the image's left. */
  left: number;
  /** The frame's top edge, from the image's top. */
  top: number;
  /** The zoom: 100 shows the most of the image the ratio allows. */
  zoom: number;
}

export interface ImageCropperProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** The image to frame: a URL, or an object URL for a file just picked. */
  src: string;
  /** The image's text alternative. */
  alt: string;
  /**
   * The frame's width over its height: 1, the default, for a square logo;
   * 16 / 9 for a cover.
   */
  aspectRatio?: number;
  /** The frame. Pass with `onCrop` to control it; null is the middle at 100%. */
  value?: ImageCropperCrop | null;
  /** The frame an uncontrolled cropper starts with; unset, the middle at zoom 100%. */
  defaultValue?: ImageCropperCrop;
  /** The frame, as fractions of the image, after every move or zoom. */
  onCrop?: (crop: ImageCropperCrop) => void;
  /**
   * The image has loaded: the frame it is drawn in, the one given held to
   * the ratio and the image, or the middle at 100%. What to apply when the
   * person changes nothing.
   */
  onImageLoad?: (crop: ImageCropperCrop) => void;
  /** How far it zooms in: 4, the default, shows a quarter of the widest frame. */
  maxZoom?: number;
  /** Whether the zoom row (Zoom out, the zoom Slider, Zoom in) is drawn. Default true. */
  showZoomControls?: boolean;
  disabled?: boolean;
  /** The cropper's name. Default "Image frame". */
  label?: string;
  /** How to work it, read with it (not drawn). */
  instructions?: string;
  /** What is said after each move or zoom. */
  statusLabel?: (status: ImageCropperStatus) => string;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  /** The zoom Slider's name. Default "Zoom". */
  zoomLabel?: string;
}

const ZOOM_STEP = 1.25;
const PAN_STEP = 0.1;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const defaultStatus = ({ left, top, zoom }: ImageCropperStatus) =>
  `Frame ${left}% from the left, ${top}% from the top, zoom ${zoom}%.`;

interface Size {
  width: number;
  height: number;
}

/** The image's frame at zoom 1: the largest of the ratio's shape it holds. */
function baseFrame(natural: Size, ratio: number): Size {
  const width = Math.min(natural.width, natural.height * ratio);
  return {
    width: width / natural.width,
    height: width / ratio / natural.height,
  };
}

/** A frame at `zoom`, its top-left at x and y, held inside the image. */
function place(
  base: Size,
  x: number,
  y: number,
  zoom: number,
  maxZoom: number,
): ImageCropperCrop {
  const z = clamp(zoom, 1, maxZoom);
  const width = base.width / z;
  const height = base.height / z;
  return {
    x: clamp(x, 0, 1 - width),
    y: clamp(y, 0, 1 - height),
    width,
    height,
  };
}

const zoomOf = (base: Size, crop: ImageCropperCrop) => base.width / crop.width;

/** A frame given in, made one this image and ratio can have. */
function normalise(
  base: Size,
  crop: ImageCropperCrop | undefined,
  maxZoom: number,
): ImageCropperCrop {
  if (!crop) {
    const width = base.width;
    const height = base.height;
    return place(base, (1 - width) / 2, (1 - height) / 2, 1, maxZoom);
  }
  return place(base, crop.x, crop.y, zoomOf(base, crop), maxZoom);
}

/**
 * The image drawn so that `crop` fills its box: the box has the crop's
 * shape, and the image is scaled and moved under it. Physical left and top,
 * not logical sides: an image's pixels do not mirror right to left.
 */
function framedStyle(crop: ImageCropperCrop): React.CSSProperties {
  // Four places of a percentage are far finer than a pixel.
  const percent = (value: number) => `${Number(value.toFixed(4))}%`;
  return {
    width: percent(100 / crop.width),
    height: percent(100 / crop.height),
    left: percent((-crop.x / crop.width) * 100),
    top: percent((-crop.y / crop.height) * 100),
  };
}

const sameCrop = (a: ImageCropperCrop, b: ImageCropperCrop) =>
  Math.abs(a.x - b.x) < 1e-9 &&
  Math.abs(a.y - b.y) < 1e-9 &&
  Math.abs(a.width - b.width) < 1e-9 &&
  Math.abs(a.height - b.height) < 1e-9;

const ImageCropper = React.forwardRef<HTMLDivElement, ImageCropperProps>(
  (
    {
      src,
      alt,
      aspectRatio = 1,
      value,
      defaultValue,
      onCrop,
      onImageLoad,
      maxZoom: givenMaxZoom = 4,
      showZoomControls = true,
      disabled = false,
      label = "Image frame",
      instructions = "Drag the image, or use the arrow keys to move the frame and plus and minus to zoom.",
      statusLabel = defaultStatus,
      zoomInLabel = "Zoom in",
      zoomOutLabel = "Zoom out",
      zoomLabel = "Zoom",
      className,
      ...props
    },
    ref,
  ) => {
    const maxZoom = Math.max(1, givenMaxZoom);
    const helpId = React.useId();
    const image = React.useRef<HTMLImageElement>(null);
    // The image's size, for the src it was read from: a new src frames anew.
    const [natural, setNatural] = React.useState<
      (Size & { src: string }) | null
    >(null);
    const [inner, setInner] = React.useState<ImageCropperCrop | null>(null);
    const [said, setSaid] = React.useState("");
    const pointers = React.useRef(
      new Map<number, { clientX: number; clientY: number }>(),
    );
    const gesture = React.useRef<{
      clientX: number;
      clientY: number;
      distance: number;
      crop: ImageCropperCrop;
    } | null>(null);
    const moved = React.useRef(false);

    const loaded = natural && natural.src === src ? natural : null;
    const base = loaded ? baseFrame(loaded, aspectRatio) : null;
    const crop = base
      ? value !== undefined
        ? normalise(base, value ?? undefined, maxZoom)
        : inner
      : null;
    const zoom = base && crop ? zoomOf(base, crop) : 1;

    const latest = React.useRef({ onImageLoad, value, defaultValue });
    latest.current = { onImageLoad, value, defaultValue };

    const read = React.useCallback(
      (element: HTMLImageElement) => {
        const size = {
          width: element.naturalWidth,
          height: element.naturalHeight,
        };
        if (!size.width || !size.height) return;
        if (
          natural &&
          natural.src === src &&
          natural.width === size.width &&
          natural.height === size.height
        )
          return;
        setNatural({ ...size, src });
        const start = normalise(
          baseFrame(size, aspectRatio),
          latest.current.value === undefined
            ? latest.current.defaultValue
            : (latest.current.value ?? undefined),
          maxZoom,
        );
        setInner(start);
        // Not a change, so not onCrop (a v-model reports no change on
        // mount): the frame drawn, for a product applying it untouched.
        latest.current.onImageLoad?.(start);
      },
      [natural, src, aspectRatio, maxZoom],
    );

    // An image already in the cache may have loaded before React listened.
    React.useEffect(() => {
      const element = image.current;
      if (element?.complete) read(element);
    }, [read]);

    const announce = (next: ImageCropperCrop) =>
      setSaid(
        statusLabel({
          left: Math.round(next.x * 100),
          top: Math.round(next.y * 100),
          zoom: Math.round(zoomOf(base as Size, next) * 100),
        }),
      );

    /** Moves the frame; says where it is now unless `quiet`. */
    const commit = (next: ImageCropperCrop, quiet = false) => {
      if (!crop || sameCrop(next, crop)) {
        if (!quiet && crop) announce(crop);
        return;
      }
      if (value === undefined) setInner(next);
      onCrop?.(next);
      if (!quiet) announce(next);
    };

    /** Zoom about the frame's middle, so what is centred stays centred. */
    const zoomTo = (to: number, quiet = false, from = crop) => {
      if (!from || !base) return;
      const z = clamp(to, 1, maxZoom);
      commit(
        place(
          base,
          from.x + from.width / 2 - base.width / z / 2,
          from.y + from.height / 2 - base.height / z / 2,
          z,
          maxZoom,
        ),
        quiet,
      );
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled || !crop || !base) return;
      // Physical, in right to left too: an image does not mirror.
      const steps: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const step = steps[event.key];
      if (step)
        commit(
          place(
            base,
            crop.x + step[0] * crop.width * PAN_STEP,
            crop.y + step[1] * crop.height * PAN_STEP,
            zoom,
            maxZoom,
          ),
        );
      else if (event.key === "+" || event.key === "=") zoomTo(zoom * ZOOM_STEP);
      else if (event.key === "-" || event.key === "_") zoomTo(zoom / ZOOM_STEP);
      else return;
      event.preventDefault();
    };

    const startGesture = () => {
      const points = Array.from(pointers.current.values());
      if (!crop || points.length === 0) {
        gesture.current = null;
        return;
      }
      const [a, b] = points;
      gesture.current = {
        clientX: b ? (a.clientX + b.clientX) / 2 : a.clientX,
        clientY: b ? (a.clientY + b.clientY) / 2 : a.clientY,
        distance: b
          ? Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
          : 0,
        crop,
      };
    };

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || !crop || event.button !== 0) return;
      if (pointers.current.size >= 2) return;
      pointers.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });
      event.currentTarget.setPointerCapture?.(event.pointerId);
      startGesture();
    };

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!pointers.current.has(event.pointerId)) return;
      pointers.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });
      const start = gesture.current;
      if (!start || !base) return;
      const box = event.currentTarget.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const [a, b] = Array.from(pointers.current.values());
      const clientX = b ? (a.clientX + b.clientX) / 2 : a.clientX;
      const clientY = b ? (a.clientY + b.clientY) / 2 : a.clientY;
      const scale =
        b && start.distance
          ? Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) /
            start.distance
          : 1;
      const z = clamp(zoomOf(base, start.crop) * scale, 1, maxZoom);
      const width = base.width / z;
      const height = base.height / z;
      // The frame keeps its middle under the pinch, then follows the drag:
      // dragging the image right shows more of its left, so it moves left.
      const middleX =
        start.crop.x +
        start.crop.width / 2 -
        ((clientX - start.clientX) / box.width) * start.crop.width;
      const middleY =
        start.crop.y +
        start.crop.height / 2 -
        ((clientY - start.clientY) / box.height) * start.crop.height;
      moved.current = true;
      // Quiet while it moves: the place is said once the pointer lets go.
      commit(
        place(base, middleX - width / 2, middleY - height / 2, z, maxZoom),
        true,
      );
    };

    const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!pointers.current.delete(event.pointerId)) return;
      startGesture();
      if (pointers.current.size === 0 && moved.current) {
        moved.current = false;
        if (crop) announce(crop);
      }
    };

    const atMin = !crop || zoom <= 1 + 1e-9;
    const atMax = !crop || zoom >= maxZoom - 1e-9;

    return (
      <div
        ref={ref}
        data-slot="image-cropper"
        data-disabled={disabled ? "" : undefined}
        className={cn("kozmos-image-cropper", className)}
        {...props}
      >
        <div
          role="application"
          aria-roledescription="cropper"
          aria-label={label}
          aria-describedby={helpId}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          data-slot="image-cropper-frame"
          // The focus ring every Kozmos control draws, from its utilities.
          className="kozmos-image-cropper-frame ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          style={{ aspectRatio: String(aspectRatio) }}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
        >
          <img
            ref={image}
            src={src}
            alt={alt}
            draggable={false}
            onLoad={(event) => read(event.currentTarget)}
            className="kozmos-image-cropper-image"
            style={crop ? framedStyle(crop) : { visibility: "hidden" }}
          />
        </div>
        <span id={helpId} className="sr-only">
          {instructions}
        </span>
        <span role="status" aria-live="polite" className="sr-only">
          {said}
        </span>
        {showZoomControls ? (
          // At a limit a zoom button is unavailable, not disabled: a
          // disabled button that has focus drops it to the page.
          <div
            data-slot="image-cropper-zoom"
            className="kozmos-image-cropper-zoom"
          >
            <IconButton
              type="button"
              variant="outline"
              aria-label={zoomOutLabel}
              aria-disabled={atMin || undefined}
              disabled={disabled}
              onClick={() => {
                if (!atMin) zoomTo(zoom / ZOOM_STEP);
              }}
            >
              <ZoomOut aria-hidden="true" />
            </IconButton>
            <Slider
              aria-label={zoomLabel}
              min={100}
              max={Math.round(maxZoom * 100)}
              step={1}
              value={[Math.round(zoom * 100)]}
              disabled={disabled || !crop || maxZoom === 1}
              formatValue={(percent) => `${percent}%`}
              wrapperClassName="kozmos-image-cropper-slider"
              // The Slider says its own value; the live region stays quiet.
              onValueChange={([percent]) => zoomTo(percent / 100, true)}
            />
            <IconButton
              type="button"
              variant="outline"
              aria-label={zoomInLabel}
              aria-disabled={atMax || undefined}
              disabled={disabled}
              onClick={() => {
                if (!atMax) zoomTo(zoom * ZOOM_STEP);
              }}
            >
              <ZoomIn aria-hidden="true" />
            </IconButton>
          </div>
        ) : null}
      </div>
    );
  },
);
ImageCropper.displayName = "ImageCropper";

export { ImageCropper };
