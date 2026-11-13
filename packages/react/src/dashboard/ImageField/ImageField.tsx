import React from "react";
import { clsx } from "clsx";
import { Crop01, Eye, Trash01, ZoomIn, ZoomOut } from "@kozmos-ds/icons";
import { Button } from "../../components/Button/Button";
import { IconButton } from "../../components/IconButton/IconButton";
import { Input } from "../../components/Input/Input";
import { FileUpload } from "../../components/FileUpload/FileUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/Dialog/Dialog";

/**
 * Where an image is framed: a rectangle of the image, each side a fraction
 * of the image's own width or height (0 to 1), measured from its top-left
 * corner, whatever the page's direction. Data, not pixels: the product crops
 * (`x * naturalWidth` and so on), on its server or in a canvas.
 */
export interface ImageFieldCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * One image of the field. `id`, `src` and `alt` are POIMediaPresentation's
 * shape (@kozmos-ds/product-contracts), so a place's media list passes in
 * as it is.
 */
export interface ImageFieldImage {
  /** The product's key for the image; the field makes one for an image it adds. */
  id: string;
  /**
   * Where it is drawn from: the URL a person pasted, the product's URL once
   * it has uploaded a file, or, for a file just picked, an object URL the
   * field made (and revokes once the image leaves the field, removed or
   * given the product's own URL, or the field unmounts).
   */
  src: string;
  /** Its text alternative, which the field edits. */
  alt: string;
  /** The file a person picked, until the product uploads it and drops it. */
  file?: File;
  /** Its frame, with `aspectRatio`; unset, the image is framed in its middle. */
  crop?: ImageFieldCrop;
}

/** The field's words, in the product's language. Each has an English default. */
export interface ImageFieldLabels {
  /** The live count beside the label: "2 of 7 images". */
  count: (count: number, max: number) => string;
  /** The upload button's name. */
  upload: string;
  /** The drop zone's first words, and what follows them. */
  browse: string;
  drop: string;
  /** The line under the drop zone; by default the types, the size limit and the ratio. */
  hint?: string;
  urlLabel: string;
  urlPlaceholder: string;
  addUrl: string;
  invalidUrl: string;
  wrongType: (fileName: string, allowed: string) => string;
  tooLarge: (fileName: string, limit: string) => string;
  tooMany: (left: number) => string;
  altText: (position: number) => string;
  preview: (position: number) => string;
  frame: (position: number) => string;
  remove: (position: number) => string;
  /** The preview's title; its description is the image's alt text. */
  previewTitle: (position: number) => string;
  /** Said in the preview when the image has no alt text yet. */
  noAlt: string;
  cropTitle: string;
  /** How to work the cropper, read with it. */
  cropHelp: string;
  /** The cropper's name. */
  cropRegion: string;
  /** Said after each move or zoom; every number is a whole percentage. */
  cropStatus: (frame: { left: number; top: number; zoom: number }) => string;
  zoomIn: string;
  zoomOut: string;
  apply: string;
  cancel: string;
  close: string;
}

const LABELS: ImageFieldLabels = {
  count: (count, max) => `${count} of ${max} ${max === 1 ? "image" : "images"}`,
  upload: "Upload an image",
  browse: "Browse",
  drop: "or drag an image here",
  urlLabel: "Image URL",
  urlPlaceholder: "https://",
  addUrl: "Add",
  invalidUrl: "Enter a web address that starts with https:// or http://.",
  wrongType: (name, allowed) => `${name} is not one of ${allowed}.`,
  tooLarge: (name, limit) => `${name} is larger than ${limit}.`,
  tooMany: (left) =>
    left === 1
      ? "Add one more image at most."
      : `Add ${left} more images at most.`,
  altText: (n) => `Alt text, image ${n}`,
  preview: (n) => `Preview image ${n}`,
  frame: (n) => `Frame image ${n}`,
  remove: (n) => `Remove image ${n}`,
  previewTitle: (n) => `Image ${n}`,
  noAlt: "No alt text yet.",
  cropTitle: "Frame the image",
  cropHelp:
    "Drag the image, or use the arrow keys to move the frame and plus and minus to zoom.",
  cropRegion: "Image frame",
  cropStatus: ({ left, top, zoom }) =>
    `Frame ${left}% from the left, ${top}% from the top, zoom ${zoom}%.`,
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  apply: "Apply",
  cancel: "Cancel",
  close: "Close",
};

export interface ImageFieldProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** The field's name, drawn above it and naming its group: "Images", "Logo". */
  label: string;
  /** The images, in order. Pass with `onChange` to control the field. */
  value?: ImageFieldImage[];
  /** The images an uncontrolled field starts with. */
  defaultValue?: ImageFieldImage[];
  /**
   * Every change: an image added (with its `file`, when picked), removed,
   * framed or described. Kozmos sends nothing anywhere; the product uploads.
   */
  onChange?: (images: ImageFieldImage[]) => void;
  /** How many images the field takes (Pointr Cloud: Images 7, Logo 1). Default 1. */
  max?: number;
  /**
   * The file types a person may pick, as an input's `accept`: offered by the
   * picker, and checked again after a pick or a drop. Default JPG and PNG.
   */
  accept?: string;
  /** The largest file, in bytes. */
  maxSize?: number;
  /**
   * The frame's width over its height (16 / 9). Set, each image is drawn in
   * that frame and has a cropper, which opens when one image is added.
   */
  aspectRatio?: number;
  disabled?: boolean;
  labels?: Partial<ImageFieldLabels>;
}

const DEFAULT_ACCEPT = "image/jpeg,image/png";
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.25;
const PAN_STEP = 0.1;

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${units[unit]}`;
}

function acceptTokens(accept: string) {
  return accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

/** What a person reads for the allowed types: "JPG, PNG". */
function typeNames(accept: string) {
  const names = acceptTokens(accept).map((token) => {
    if (token === "image/jpeg" || token === ".jpg" || token === ".jpeg")
      return "JPG";
    if (token.endsWith("/*")) return token.slice(0, -2);
    return token.replace(/^.*[/.]/, "").toUpperCase();
  });
  return Array.from(new Set(names)).join(", ");
}

/** Whether a file is one `accept` allows, as the picker reads it. */
function accepts(accept: string, file: File) {
  const tokens = acceptTokens(accept);
  if (tokens.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) =>
    token.startsWith(".")
      ? name.endsWith(token)
      : token.endsWith("/*")
        ? type.startsWith(token.slice(0, -1))
        : type === token,
  );
}

/** 16 / 9 as "16:9". */
function ratioName(ratio: number) {
  for (let height = 1; height <= 32; height += 1) {
    const width = ratio * height;
    if (Math.abs(width - Math.round(width)) < 1e-6)
      return `${Math.round(width)}:${height}`;
  }
  return ratio.toFixed(2);
}

function isWebAddress(text: string) {
  try {
    const url = new URL(text);
    return (
      (url.protocol === "https:" || url.protocol === "http:") && !!url.host
    );
  } catch {
    return false;
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * The image drawn so that `crop` fills its box: the box has the crop's
 * shape, and the image is scaled and moved under it. Physical left and top,
 * not logical sides: an image's pixels do not mirror right to left.
 */
function framedStyle(crop: ImageFieldCrop): React.CSSProperties {
  return {
    width: `${100 / crop.width}%`,
    height: `${100 / crop.height}%`,
    left: `${(-crop.x / crop.width) * 100}%`,
    top: `${(-crop.y / crop.height) * 100}%`,
  };
}

/** The image's frame at zoom 1: the largest of the ratio's shape it holds. */
function baseFrame(natural: { width: number; height: number }, ratio: number) {
  const width = Math.min(natural.width, natural.height * ratio);
  return {
    width: width / natural.width,
    height: width / ratio / natural.height,
  };
}

interface CropperProps {
  image: ImageFieldImage;
  aspectRatio: number;
  labels: ImageFieldLabels;
  onApply: (crop: ImageFieldCrop) => void;
  onCancel: () => void;
}

/**
 * A minimal accessible cropper, this module's own (no Core part frames an
 * image): the frame is the box, the image moves and scales under it. The
 * box is one tab stop; the arrow keys move the frame by a tenth of itself,
 * plus and minus zoom, a pointer drags the image, and each change is said in
 * a polite live region. It hands back the frame as fractions of the image.
 */
function Cropper({
  image,
  aspectRatio,
  labels,
  onApply,
  onCancel,
}: CropperProps) {
  const helpId = React.useId();
  const [natural, setNatural] = React.useState<{
    width: number;
    height: number;
  } | null>(null);
  const [frame, setFrame] = React.useState<{
    x: number;
    y: number;
    zoom: number;
  } | null>(null);
  const [said, setSaid] = React.useState("");
  const drag = React.useRef<{
    pointer: number;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
  } | null>(null);

  const base = natural ? baseFrame(natural, aspectRatio) : null;
  const crop =
    base && frame
      ? {
          x: frame.x,
          y: frame.y,
          width: base.width / frame.zoom,
          height: base.height / frame.zoom,
        }
      : null;

  const onLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const size = {
      width: event.currentTarget.naturalWidth,
      height: event.currentTarget.naturalHeight,
    };
    if (!size.width || !size.height) return;
    const start = baseFrame(size, aspectRatio);
    const given = image.crop;
    const zoom = given ? clamp(start.width / given.width, 1, MAX_ZOOM) : 1;
    const width = start.width / zoom;
    const height = start.height / zoom;
    setNatural(size);
    setFrame({
      x: clamp(given ? given.x : (1 - width) / 2, 0, 1 - width),
      y: clamp(given ? given.y : (1 - height) / 2, 0, 1 - height),
      zoom,
    });
  };

  const move = (next: { x: number; y: number; zoom: number }) => {
    if (!base) return;
    const zoom = clamp(next.zoom, 1, MAX_ZOOM);
    const width = base.width / zoom;
    const height = base.height / zoom;
    const placed = {
      x: clamp(next.x, 0, 1 - width),
      y: clamp(next.y, 0, 1 - height),
      zoom,
    };
    setFrame(placed);
    setSaid(
      labels.cropStatus({
        left: Math.round(placed.x * 100),
        top: Math.round(placed.y * 100),
        zoom: Math.round(zoom * 100),
      }),
    );
  };

  /** Zoom about the frame's middle, so what is centred stays centred. */
  const zoomBy = (factor: number) => {
    if (!crop || !frame || !base) return;
    const zoom = clamp(frame.zoom * factor, 1, MAX_ZOOM);
    move({
      x: crop.x + crop.width / 2 - base.width / zoom / 2,
      y: crop.y + crop.height / 2 - base.height / zoom / 2,
      zoom,
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!crop || !frame) return;
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const step = steps[event.key];
    if (step) {
      move({
        x: crop.x + step[0] * crop.width * PAN_STEP,
        y: crop.y + step[1] * crop.height * PAN_STEP,
        zoom: frame.zoom,
      });
    } else if (event.key === "+" || event.key === "=") zoomBy(ZOOM_STEP);
    else if (event.key === "-" || event.key === "_") zoomBy(1 / ZOOM_STEP);
    else return;
    event.preventDefault();
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!crop || event.button !== 0) return;
    drag.current = {
      pointer: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: crop.x,
      y: crop.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId || !crop || !frame) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.width || !box.height) return;
    // Dragging the image right shows more of its left: the frame moves left.
    move({
      x: start.x - ((event.clientX - start.clientX) / box.width) * crop.width,
      y: start.y - ((event.clientY - start.clientY) / box.height) * crop.height,
      zoom: frame.zoom,
    });
  };

  const endDrag = () => {
    drag.current = null;
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{labels.cropTitle}</DialogTitle>
        <DialogDescription id={helpId}>{labels.cropHelp}</DialogDescription>
      </DialogHeader>
      <div
        role="application"
        aria-roledescription="cropper"
        aria-label={labels.cropRegion}
        aria-describedby={helpId}
        tabIndex={0}
        className="kozmos-image-field-cropper"
        style={{ aspectRatio: String(aspectRatio) }}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          src={image.src}
          alt={image.alt}
          draggable={false}
          onLoad={onLoad}
          className="kozmos-image-field-cropper-image"
          style={crop ? framedStyle(crop) : { visibility: "hidden" }}
        />
      </div>
      <span role="status" aria-live="polite" className="kozmos-image-field-sr">
        {said}
      </span>
      {/* At a limit a zoom button is unavailable, not disabled: a disabled
          button that has focus drops it to the page, out of the dialog. */}
      <div className="kozmos-image-field-zoom">
        <IconButton
          type="button"
          variant="outline"
          aria-label={labels.zoomOut}
          aria-disabled={!frame || frame.zoom <= 1 || undefined}
          onClick={() => {
            if (frame && frame.zoom > 1) zoomBy(1 / ZOOM_STEP);
          }}
        >
          <ZoomOut aria-hidden="true" />
        </IconButton>
        <IconButton
          type="button"
          variant="outline"
          aria-label={labels.zoomIn}
          aria-disabled={!frame || frame.zoom >= MAX_ZOOM || undefined}
          onClick={() => {
            if (frame && frame.zoom < MAX_ZOOM) zoomBy(ZOOM_STEP);
          }}
        >
          <ZoomIn aria-hidden="true" />
        </IconButton>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {labels.cancel}
        </Button>
        <Button
          type="button"
          disabled={!crop}
          onClick={() => crop && onApply(crop)}
        >
          {labels.apply}
        </Button>
      </DialogFooter>
    </>
  );
}

type Opened = { kind: "preview" | "crop"; id: string } | null;

/**
 * Pointr Cloud's image field (CLOUD-UI-004): up to `max` images, added by
 * upload or by URL, each a thumbnail with its alt text, a full-screen
 * preview, a cropper to `aspectRatio`, and Remove. Built on FileUpload,
 * Input, Dialog and IconButton. It never uploads: `onChange` hands the
 * product each picked File, each URL and each frame, and the product
 * uploads and crops.
 *
 * A Dashboard module (decision 183): import it from
 * `@kozmos-ds/react/dashboard`, with `@kozmos-ds/react/dashboard.css` after
 * the package's style.css.
 */
const ImageField = React.forwardRef<HTMLDivElement, ImageFieldProps>(
  (
    {
      label,
      value,
      defaultValue,
      onChange,
      max = 1,
      accept = DEFAULT_ACCEPT,
      maxSize,
      aspectRatio,
      disabled = false,
      labels: given,
      className,
      ...props
    },
    ref,
  ) => {
    const labels = { ...LABELS, ...given };
    const baseId = React.useId();
    const legendId = `${baseId}-legend`;
    const countId = `${baseId}-count`;
    const made = React.useRef(0);
    const objectUrls = React.useRef(new Set<string>());
    const list = React.useRef<HTMLUListElement>(null);
    const urlInput = React.useRef<HTMLInputElement>(null);
    const returnFocus = React.useRef<HTMLElement | null>(null);
    const focusAfterRemove = React.useRef<string | null | undefined>(undefined);

    const [inner, setInner] = React.useState<ImageFieldImage[]>(
      defaultValue ?? [],
    );
    const images = value ?? inner;
    const upload = React.useRef<HTMLDivElement>(null);

    // An object URL the field made is revoked once it has been drawn and
    // left the images (removed, or the product swapped in its uploaded URL),
    // and every one when the field goes. Not before it is drawn: a product
    // may commit the new image a render later.
    const drawn = React.useRef(new Set<string>());
    React.useEffect(() => {
      const now = new Set(images.map((image) => image.src));
      for (const src of objectUrls.current) {
        if (now.has(src)) drawn.current.add(src);
        else if (drawn.current.has(src)) {
          URL.revokeObjectURL(src);
          objectUrls.current.delete(src);
          drawn.current.delete(src);
        }
      }
    }, [images]);
    React.useEffect(() => {
      const made = objectUrls.current;
      return () => {
        for (const src of made) URL.revokeObjectURL(src);
        made.clear();
      };
    }, []);
    const left = Math.max(max - images.length, 0);
    const full = left === 0;
    const [uploadError, setUploadError] = React.useState<string | null>(null);
    const [url, setUrl] = React.useState("");
    const [urlError, setUrlError] = React.useState<string | null>(null);
    const [opened, setOpened] = React.useState<Opened>(null);

    const commit = (next: ImageFieldImage[]) => {
      if (value === undefined) setInner(next);
      onChange?.(next);
    };

    const nextId = () => {
      made.current += 1;
      return `${baseId}-image-${made.current}`;
    };

    /** Added: framed at once when there is a ratio and it is one image. */
    const add = (added: ImageFieldImage[]) => {
      commit([...images, ...added]);
      if (aspectRatio && added.length === 1) {
        returnFocus.current = null;
        setOpened({ kind: "crop", id: added[0].id });
      }
    };

    const onFiles = (files: File[]) => {
      // The same file picked again is a change: FileUpload keeps the last
      // pick in its input, so the field empties it after each one. FileUpload
      // forwards its box, not its input (a Core gap), so the field finds it.
      const input =
        upload.current?.querySelector<HTMLInputElement>('input[type="file"]');
      if (input) input.value = "";
      if (files.length === 0) return;
      const wrong = files.find((file) => !accepts(accept, file));
      const large = maxSize
        ? files.find((file) => file.size > maxSize)
        : undefined;
      const error =
        files.length > left
          ? labels.tooMany(left)
          : wrong
            ? labels.wrongType(wrong.name, typeNames(accept))
            : large && maxSize
              ? labels.tooLarge(large.name, formatBytes(maxSize))
              : null;
      setUploadError(error);
      if (error) return;
      add(
        files.map((file) => {
          const src = URL.createObjectURL(file);
          objectUrls.current.add(src);
          return { id: nextId(), src, alt: "", file };
        }),
      );
    };

    const addUrl = () => {
      const text = url.trim();
      if (!isWebAddress(text)) {
        setUrlError(labels.invalidUrl);
        return;
      }
      setUrlError(null);
      setUrl("");
      add([{ id: nextId(), src: text, alt: "" }]);
    };

    const remove = (index: number) => {
      const image = images[index];
      const neighbour = images[index + 1] ?? images[index - 1];
      focusAfterRemove.current = neighbour?.id ?? null;
      if (objectUrls.current.has(image.src)) {
        URL.revokeObjectURL(image.src);
        objectUrls.current.delete(image.src);
        drawn.current.delete(image.src);
      }
      setUploadError(null);
      commit(images.filter((_, i) => i !== index));
    };

    /** An image's button, found by the image's id and the button's job. */
    const action = (id: string, job: "remove" | "crop") => {
      const item = Array.from(
        list.current?.querySelectorAll<HTMLElement>("[data-image-id]") ?? [],
      ).find((element) => element.dataset.imageId === id);
      return item?.querySelector<HTMLElement>(`[data-action="${job}"]`) ?? null;
    };

    const update = (id: string, change: Partial<ImageFieldImage>) =>
      commit(
        images.map((image) =>
          image.id === id ? { ...image, ...change } : image,
        ),
      );

    // Focus does not fall to the page when a Remove goes: it moves to the
    // next image's Remove, or the one before, or the URL field.
    React.useEffect(() => {
      const target = focusAfterRemove.current;
      if (target === undefined) return;
      focusAfterRemove.current = undefined;
      const button = target === null ? null : action(target, "remove");
      (button ?? urlInput.current)?.focus();
    });

    const openWith =
      (kind: "preview" | "crop", id: string) =>
      (event: React.MouseEvent<HTMLButtonElement>) => {
        returnFocus.current = event.currentTarget;
        setOpened({ kind, id });
      };

    const openedIndex = opened
      ? images.findIndex((image) => image.id === opened.id)
      : -1;
    const openedImage = openedIndex >= 0 ? images[openedIndex] : null;

    // Focus goes back to the button that opened the dialog, or, for the
    // cropper that opened on its own, to the new image's Frame button.
    const onCloseAutoFocus = (event: Event) => {
      event.preventDefault();
      const target = returnFocus.current?.isConnected
        ? returnFocus.current
        : opened && action(opened.id, "crop");
      target?.focus();
    };

    const hint =
      labels.hint ??
      [
        typeNames(accept),
        maxSize ? `Max ${formatBytes(maxSize)}` : null,
        aspectRatio ? ratioName(aspectRatio) : null,
      ]
        .filter(Boolean)
        .join(" · ");

    return (
      <div
        ref={ref}
        role="group"
        aria-labelledby={legendId}
        aria-describedby={countId}
        aria-disabled={disabled || undefined}
        className={clsx("kozmos-image-field", className)}
        {...props}
      >
        <div className="kozmos-image-field-header">
          <span id={legendId} className="kozmos-field-label">
            {label}
          </span>
          <span
            id={countId}
            aria-live="polite"
            className="kozmos-image-field-count"
          >
            {labels.count(images.length, max)}
          </span>
        </div>

        {images.length > 0 ? (
          <ul ref={list} className="kozmos-image-field-list">
            {images.map((image, index) => {
              const position = index + 1;
              return (
                <li
                  key={image.id}
                  data-image-id={image.id}
                  className="kozmos-image-field-item"
                >
                  <div
                    className="kozmos-image-field-thumb"
                    style={
                      aspectRatio
                        ? { aspectRatio: String(aspectRatio) }
                        : undefined
                    }
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      draggable={false}
                      className="kozmos-image-field-thumb-image"
                      data-framed={image.crop && aspectRatio ? "" : undefined}
                      style={
                        image.crop && aspectRatio
                          ? framedStyle(image.crop)
                          : undefined
                      }
                    />
                  </div>
                  <Input
                    label={labels.altText(position)}
                    // Alt text is in whatever language the product writes:
                    // its first strong letter sets its direction.
                    dir="auto"
                    value={image.alt}
                    disabled={disabled}
                    wrapperClassName="kozmos-image-field-alt"
                    onChange={(event) =>
                      update(image.id, { alt: event.target.value })
                    }
                  />
                  <div className="kozmos-image-field-actions">
                    <IconButton
                      type="button"
                      data-action="preview"
                      aria-label={labels.preview(position)}
                      onClick={openWith("preview", image.id)}
                    >
                      <Eye aria-hidden="true" />
                    </IconButton>
                    {aspectRatio ? (
                      <IconButton
                        type="button"
                        data-action="crop"
                        aria-label={labels.frame(position)}
                        disabled={disabled}
                        onClick={openWith("crop", image.id)}
                      >
                        <Crop01 aria-hidden="true" />
                      </IconButton>
                    ) : null}
                    <IconButton
                      type="button"
                      data-action="remove"
                      aria-label={labels.remove(position)}
                      disabled={disabled}
                      onClick={() => remove(index)}
                    >
                      <Trash01 aria-hidden="true" />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        <FileUpload
          ref={upload}
          aria-label={labels.upload}
          accept={accept}
          // Always multiple, so FileUpload sets no count of its own: with
          // one slot left it said "Select up to 1 file." in English, before
          // the field's own tooMany in the product's words.
          multiple
          disabled={disabled || full}
          browseLabel={labels.browse}
          dropLabel={labels.drop}
          emptyDescription={hint}
          error={uploadError ?? undefined}
          value={[]}
          onFilesChange={onFiles}
        />

        <div className="kozmos-image-field-url">
          <Input
            ref={urlInput}
            type="url"
            inputMode="url"
            // A web address reads left to right on every page.
            dir="ltr"
            label={labels.urlLabel}
            placeholder={labels.urlPlaceholder}
            value={url}
            error={urlError ?? undefined}
            disabled={disabled || full}
            wrapperClassName="kozmos-image-field-url-input"
            onChange={(event) => {
              setUrl(event.target.value);
              if (urlError) setUrlError(null);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              addUrl();
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || full}
            className="kozmos-image-field-url-add"
            onClick={addUrl}
          >
            {labels.addUrl}
          </Button>
        </div>

        <Dialog
          open={!!openedImage}
          onOpenChange={(open) => {
            if (!open) setOpened(null);
          }}
        >
          {openedImage && opened?.kind === "preview" ? (
            <DialogContent
              closeLabel={labels.close}
              className="kozmos-image-field-preview"
              onCloseAutoFocus={onCloseAutoFocus}
            >
              <DialogHeader>
                <DialogTitle>
                  {labels.previewTitle(openedIndex + 1)}
                </DialogTitle>
                <DialogDescription>
                  {openedImage.alt || labels.noAlt}
                </DialogDescription>
              </DialogHeader>
              <img
                src={openedImage.src}
                alt={openedImage.alt}
                className="kozmos-image-field-preview-image"
              />
            </DialogContent>
          ) : null}
          {openedImage && opened?.kind === "crop" && aspectRatio ? (
            <DialogContent
              closeLabel={labels.close}
              className="kozmos-image-field-crop-dialog"
              onCloseAutoFocus={onCloseAutoFocus}
            >
              <Cropper
                image={openedImage}
                aspectRatio={aspectRatio}
                labels={labels}
                onCancel={() => setOpened(null)}
                onApply={(crop) => {
                  update(openedImage.id, { crop });
                  setOpened(null);
                }}
              />
            </DialogContent>
          ) : null}
        </Dialog>
      </div>
    );
  },
);
ImageField.displayName = "ImageField";

export { ImageField };
