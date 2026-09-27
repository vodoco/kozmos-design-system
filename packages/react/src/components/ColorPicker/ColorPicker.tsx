import React from "react";
import { ChevronDown, ChevronUp } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { FieldWrapper } from "../FieldWrapper";
import { inputVariants, type InputStatus } from "../Input/Input";

const DEFAULT_PRESETS = [
  "#135BEC",
  "#8FB4FF",
  "#7C3AED",
  "#0F766E",
  "#1492A6",
  "#2E97CC",
  "#0EA5E9",
  "#38BDF8",
  "#C2410C",
  "#B91C1C",
  "#A16207",
  "#CA8A04",
  "#15803D",
  "#22C55E",
  "#BE185D",
  "#EC4899",
  "#4F46E5",
  "#6366F1",
  "#7E22CE",
  "#A855F7",
  "#111827",
  "#374151",
  "#747B8B",
  "#C7CAD1",
];

export type ColorPickerFormat = "hex" | "rgb" | "hsl";

export interface ColorPickerProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "defaultValue" | "onChange" | "type" | "value"
> {
  alpha?: number;
  defaultAlpha?: number;
  defaultFormat?: ColorPickerFormat;
  defaultOpen?: boolean;
  defaultValue?: string;
  description?: React.ReactNode;
  error?: boolean | string;
  format?: ColorPickerFormat;
  helperText?: string;
  label?: string;
  onAlphaChange?: (alpha: number) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onFormatChange?: (format: ColorPickerFormat) => void;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: string) => void;
  open?: boolean;
  paletteLabel?: string;
  presets?: string[];
  showPickerPanel?: boolean;
  showPresets?: boolean;
  status?: InputStatus;
  value?: string;
  wrapperClassName?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHexColor(value: string | undefined, fallback = "#135BEC") {
  const raw = typeof value === "string" ? value.trim() : "";
  const hex = raw.replace(/^#/, "");

  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex
      .split("")
      .map((part) => part + part)
      .join("")
      .toUpperCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toUpperCase()}`;
  }

  return fallback;
}

function isHexColor(value: string | undefined) {
  const raw = typeof value === "string" ? value.trim() : "";
  const hex = raw.replace(/^#/, "");
  return /^[0-9a-fA-F]{3}$/.test(hex) || /^[0-9a-fA-F]{6}$/.test(hex);
}

function hexToRgb(value: string) {
  const hex = normalizeHexColor(value).slice(1);
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function componentToHex(value: number) {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(
    b,
  )}`.toUpperCase();
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l: Math.round(lightness * 100) };
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;
  if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
  if (max === green) hue = (blue - red) / delta + 2;
  if (max === blue) hue = (red - green) / delta + 4;

  return {
    h: Math.round(hue * 60),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

function hslToRgb({ h, s, l }: { h: number; s: number; l: number }) {
  const hue = (((h % 360) + 360) % 360) / 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;

  if (saturation === 0) {
    const value = Math.round(lightness * 255);
    return { r: value, g: value, b: value };
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  const hueToRgb = (offset: number) => {
    let t = hue + offset;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  return {
    r: Math.round(hueToRgb(1 / 3) * 255),
    g: Math.round(hueToRgb(0) * 255),
    b: Math.round(hueToRgb(-1 / 3) * 255),
  };
}

function fieldDescriptionIds({
  description,
  descriptionId,
  error,
  errorId,
  helperId,
  helperText,
}: {
  description?: React.ReactNode;
  descriptionId?: string;
  error?: boolean | string;
  errorId?: string;
  helperId?: string;
  helperText?: string;
}) {
  return [
    description ? descriptionId : null,
    error && typeof error === "string" ? errorId : helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  (
    {
      alpha,
      className,
      defaultAlpha = 100,
      defaultFormat = "hsl",
      defaultOpen = false,
      defaultValue = "#135BEC",
      description,
      disabled,
      error,
      format,
      helperText,
      id,
      label,
      onAlphaChange,
      onChange,
      onFormatChange,
      onOpenChange,
      onValueChange,
      open,
      paletteLabel = "Kozmos Design System 2.0",
      presets = DEFAULT_PRESETS,
      readOnly,
      required,
      showPickerPanel = true,
      showPresets = true,
      status = "default",
      value,
      wrapperClassName,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    const defaultInputId = React.useId();
    const descriptionId = React.useId();
    const errorId = React.useId();
    const helperId = React.useId();
    const panelId = React.useId();
    const inputId = id || defaultInputId;
    const hasError = !!error;
    const resolvedStatus: InputStatus = hasError ? "error" : status;
    const isInvalid = resolvedStatus === "error";
    const isControlled = value !== undefined;
    const isAlphaControlled = alpha !== undefined;
    const isOpenControlled = open !== undefined;
    const isFormatControlled = format !== undefined;
    const [internalValue, setInternalValue] = React.useState(
      normalizeHexColor(defaultValue),
    );
    const [internalAlpha, setInternalAlpha] = React.useState(
      clamp(defaultAlpha, 0, 100),
    );
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const [internalFormat, setInternalFormat] =
      React.useState<ColorPickerFormat>(defaultFormat);
    const textValue = isControlled ? value || "" : internalValue;
    const currentValue = normalizeHexColor(textValue);
    const currentAlpha = clamp(alpha ?? internalAlpha, 0, 100);
    const currentFormat = format ?? internalFormat;
    const isOpen = Boolean(open ?? internalOpen);
    const currentRgb = hexToRgb(currentValue);
    const currentHsl = rgbToHsl(hexToRgb(currentValue));
    const hueColor = rgbToHex(hslToRgb({ h: currentHsl.h, s: 100, l: 50 }));
    const compactControlClassName =
      "h-9 min-w-0 rounded-control border border-input bg-background px-2 text-sm";
    const describedBy = fieldDescriptionIds({
      description,
      descriptionId,
      error,
      errorId,
      helperId,
      helperText,
    });
    const presetValues = presets.map((preset) => normalizeHexColor(preset));
    const pickerDisabled = disabled || readOnly;

    const commitValue = (nextValue: string) => {
      const normalized = normalizeHexColor(nextValue, currentValue);
      if (!isControlled) {
        setInternalValue(normalized);
      }
      trackEvent("ColorPicker", "color_changed", { value: normalized });
      onValueChange?.(normalized);
    };

    const setOpen = (nextOpen: boolean) => {
      if (!isOpenControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    };

    const setAlpha = (nextAlpha: number) => {
      const safeAlpha = clamp(Math.round(nextAlpha), 0, 100);
      if (!isAlphaControlled) {
        setInternalAlpha(safeAlpha);
      }
      onAlphaChange?.(safeAlpha);
    };

    const setFormat = (nextFormat: ColorPickerFormat) => {
      if (!isFormatControlled) {
        setInternalFormat(nextFormat);
      }
      onFormatChange?.(nextFormat);
    };

    const commitHsl = (nextHsl: { h: number; s: number; l: number }) => {
      commitValue(rgbToHex(hslToRgb(nextHsl)));
    };

    const commitRgb = (nextRgb: { r: number; g: number; b: number }) => {
      commitValue(
        rgbToHex({
          r: clamp(nextRgb.r, 0, 255),
          g: clamp(nextRgb.g, 0, 255),
          b: clamp(nextRgb.b, 0, 255),
        }),
      );
    };

    const updateFromColorArea = (
      event: React.PointerEvent<HTMLButtonElement>,
    ) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const nextSaturation = clamp(
        ((event.clientX - rect.left) / rect.width) * 100,
        0,
        100,
      );
      const nextLightness = clamp(
        100 - ((event.clientY - rect.top) / rect.height) * 100,
        0,
        100,
      );
      commitHsl({
        h: currentHsl.h,
        s: Math.round(nextSaturation),
        l: Math.round(nextLightness),
      });
    };

    return (
      <FieldWrapper
        className={wrapperClassName}
        description={description}
        descriptionId={descriptionId}
        error={error}
        errorId={errorId}
        helperId={helperId}
        helperText={helperText}
        inputId={inputId}
        label={label}
        required={required}
        status={resolvedStatus}
      >
        <div className="w-full min-w-0 space-y-2">
          <div className="relative flex w-full min-w-0 items-center">
            <input
              type="color"
              aria-label={label ? `${label} color` : "Choose color"}
              className="absolute left-2 z-10 h-8 w-8 cursor-pointer rounded-control border border-input bg-transparent p-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={currentValue}
              disabled={pickerDisabled}
              onChange={(event) => commitValue(event.currentTarget.value)}
            />
            <input
              ref={ref}
              id={inputId}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              spellCheck={false}
              value={textValue}
              aria-describedby={mergeAriaIds(ariaDescribedBy, describedBy)}
              aria-invalid={isInvalid || ariaInvalid}
              className={cn(
                inputVariants({ status: resolvedStatus }),
                "min-w-0 font-mono uppercase pl-12 pr-12",
                className,
              )}
              disabled={disabled}
              readOnly={readOnly}
              required={required}
              pattern="^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"
              onChange={(event) => {
                const nextValue = event.currentTarget.value;
                if (!isControlled) {
                  setInternalValue(nextValue);
                }
                onChange?.(event);
                if (isHexColor(nextValue)) {
                  const normalized = normalizeHexColor(nextValue);
                  trackEvent("ColorPicker", "color_changed", {
                    value: normalized,
                  });
                  onValueChange?.(normalized);
                }
              }}
              {...props}
            />
            {showPickerPanel && (
              <button
                type="button"
                aria-label={isOpen ? "Hide color picker" : "Show color picker"}
                aria-controls={panelId}
                aria-expanded={isOpen}
                className="absolute right-1 inline-flex h-9 w-9 items-center justify-center rounded-control text-muted-foreground ring-offset-background transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled}
                onClick={() => setOpen(!isOpen)}
              >
                {isOpen ? (
                  <ChevronUp aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <ChevronDown aria-hidden="true" className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {showPickerPanel && isOpen && (
            <div
              id={panelId}
              className="w-full min-w-0 space-y-3 rounded-control border bg-popover p-3 text-popover-foreground shadow-overlay"
            >
              {/* Nested inside the popover at p-3 plus its 1px border, so the area's
                  radius is the popover's minus 13 — R_outer = R_inner + padding, see
                  docs/nested-radius.md. Figma derives the same number. */}
              <button
                type="button"
                aria-label="Choose saturation and lightness"
                className="relative h-36 w-full overflow-hidden rounded-[calc(var(--semantics-radius-control)*1px_-_13px)] border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={pickerDisabled}
                style={{
                  background: `linear-gradient(to top, #000000, transparent), linear-gradient(to right, #ffffff, ${hueColor})`,
                }}
                onPointerDown={(event) => {
                  updateFromColorArea(event);
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (event.buttons === 1) updateFromColorArea(event);
                }}
                onKeyDown={(event) => {
                  const step = event.shiftKey ? 10 : 1;
                  if (event.key === "ArrowRight") {
                    event.preventDefault();
                    commitHsl({
                      ...currentHsl,
                      s: clamp(currentHsl.s + step, 0, 100),
                    });
                  } else if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    commitHsl({
                      ...currentHsl,
                      s: clamp(currentHsl.s - step, 0, 100),
                    });
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    commitHsl({
                      ...currentHsl,
                      l: clamp(currentHsl.l + step, 0, 100),
                    });
                  } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    commitHsl({
                      ...currentHsl,
                      l: clamp(currentHsl.l - step, 0, 100),
                    });
                  }
                }}
              >
                <span
                  aria-hidden="true"
                  className="absolute h-5 w-5 rounded-pill border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)]"
                  style={{
                    left: `${currentHsl.s}%`,
                    top: `${100 - currentHsl.l}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </button>

              <label className="block space-y-1 text-sm text-muted-foreground">
                <span>Hue</span>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={currentHsl.h}
                  disabled={pickerDisabled}
                  aria-label="Hue"
                  className="block h-5 w-full min-w-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    accentColor: currentValue,
                    background:
                      "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                  }}
                  onChange={(event) =>
                    commitHsl({
                      ...currentHsl,
                      h: Number(event.currentTarget.value),
                    })
                  }
                />
              </label>

              <label className="block space-y-1 text-sm text-muted-foreground">
                <span>Opacity</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={currentAlpha}
                  disabled={pickerDisabled}
                  aria-label="Opacity"
                  className="block h-5 w-full min-w-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    accentColor: currentValue,
                    background: `linear-gradient(to right, transparent, ${currentValue})`,
                  }}
                  onChange={(event) =>
                    setAlpha(Number(event.currentTarget.value))
                  }
                />
              </label>

              <div
                className="grid w-full min-w-0 gap-2"
                style={{
                  gridTemplateColumns:
                    currentFormat === "hex"
                      ? "repeat(auto-fit, minmax(6rem, 1fr))"
                      : "repeat(auto-fit, minmax(3.5rem, 1fr))",
                }}
              >
                <select
                  aria-label="Color format"
                  className={compactControlClassName}
                  value={currentFormat}
                  disabled={pickerDisabled}
                  onChange={(event) =>
                    setFormat(event.currentTarget.value as ColorPickerFormat)
                  }
                >
                  <option value="hex">HEX</option>
                  <option value="rgb">RGB</option>
                  <option value="hsl">HSL</option>
                </select>

                {currentFormat === "hex" ? (
                  <input
                    type="text"
                    aria-label="Hex value"
                    inputMode="text"
                    autoCapitalize="characters"
                    spellCheck={false}
                    value={textValue}
                    disabled={disabled}
                    readOnly={readOnly}
                    className={cn(
                      compactControlClassName,
                      "font-mono uppercase",
                    )}
                    pattern="^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"
                    onChange={(event) => {
                      const nextValue = event.currentTarget.value;
                      if (!isControlled) {
                        setInternalValue(nextValue);
                      }
                      if (isHexColor(nextValue)) {
                        const normalized = normalizeHexColor(nextValue);
                        trackEvent("ColorPicker", "color_changed", {
                          value: normalized,
                        });
                        onValueChange?.(normalized);
                      }
                    }}
                  />
                ) : currentFormat === "rgb" ? (
                  <>
                    <input
                      type="number"
                      aria-label="Red value"
                      className={compactControlClassName}
                      min={0}
                      max={255}
                      value={currentRgb.r}
                      disabled={pickerDisabled}
                      onChange={(event) =>
                        commitRgb({
                          ...currentRgb,
                          r: Number(event.currentTarget.value),
                        })
                      }
                    />
                    <input
                      type="number"
                      aria-label="Green value"
                      className={compactControlClassName}
                      min={0}
                      max={255}
                      value={currentRgb.g}
                      disabled={pickerDisabled}
                      onChange={(event) =>
                        commitRgb({
                          ...currentRgb,
                          g: Number(event.currentTarget.value),
                        })
                      }
                    />
                    <input
                      type="number"
                      aria-label="Blue value"
                      className={compactControlClassName}
                      min={0}
                      max={255}
                      value={currentRgb.b}
                      disabled={pickerDisabled}
                      onChange={(event) =>
                        commitRgb({
                          ...currentRgb,
                          b: Number(event.currentTarget.value),
                        })
                      }
                    />
                  </>
                ) : (
                  <>
                    <input
                      type="number"
                      aria-label="Hue value"
                      className={compactControlClassName}
                      min={0}
                      max={360}
                      value={currentHsl.h}
                      disabled={pickerDisabled}
                      onChange={(event) =>
                        commitHsl({
                          ...currentHsl,
                          h: Number(event.currentTarget.value),
                        })
                      }
                    />
                    <input
                      type="number"
                      aria-label="Saturation value"
                      className={compactControlClassName}
                      min={0}
                      max={100}
                      value={currentHsl.s}
                      disabled={pickerDisabled}
                      onChange={(event) =>
                        commitHsl({
                          ...currentHsl,
                          s: Number(event.currentTarget.value),
                        })
                      }
                    />
                    <input
                      type="number"
                      aria-label="Lightness value"
                      className={compactControlClassName}
                      min={0}
                      max={100}
                      value={currentHsl.l}
                      disabled={pickerDisabled}
                      onChange={(event) =>
                        commitHsl({
                          ...currentHsl,
                          l: Number(event.currentTarget.value),
                        })
                      }
                    />
                  </>
                )}
                <input
                  type="number"
                  aria-label="Opacity value"
                  className={compactControlClassName}
                  min={0}
                  max={100}
                  value={currentAlpha}
                  disabled={pickerDisabled}
                  onChange={(event) =>
                    setAlpha(Number(event.currentTarget.value))
                  }
                />
              </div>

              <select
                aria-label="Color palette"
                className={cn(compactControlClassName, "w-full")}
                value={paletteLabel}
                disabled={pickerDisabled}
                onChange={() => undefined}
              >
                <option value={paletteLabel}>{paletteLabel}</option>
              </select>

              {showPresets && presetValues.length > 0 && (
                <div
                  className="grid gap-2"
                  role="group"
                  aria-label={label ? `${label} presets` : "Color presets"}
                  style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(2rem, 1fr))",
                  }}
                >
                  {presetValues.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      aria-label={`Use ${preset}`}
                      aria-pressed={preset === currentValue}
                      className={cn(
                        "h-8 w-full min-w-8 rounded-control border border-input ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        preset === currentValue &&
                          "ring-2 ring-ring ring-offset-2",
                      )}
                      style={{ backgroundColor: preset }}
                      disabled={pickerDisabled}
                      onClick={() => commitValue(preset)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </FieldWrapper>
    );
  },
);

ColorPicker.displayName = "ColorPicker";
