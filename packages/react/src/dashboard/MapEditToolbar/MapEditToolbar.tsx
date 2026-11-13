import React from "react";
import { clsx } from "clsx";
import { DotsHorizontal, type KozmosIconComponent } from "@kozmos-ds/icons";
import { Surface } from "../../components/Surface/Surface";
import { ToggleButton } from "../../components/ToggleButton/ToggleButton";
import { Button } from "../../components/Button/Button";
import { Separator } from "../../components/Separator/Separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/Tooltip/Tooltip";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../../components/Menu/Menu";
import { fitMapEditToolbarItems } from "./fit";

/** What a tool or an action shows and says. */
interface MapEditToolbarControl {
  /** The product's id for it: what `value`, `onValueChange` and `onAction` carry. */
  id: string;
  /** The words under the icon, and its accessible name. */
  label: string;
  /** A named export of `@kozmos-ds/icons` (decision 121), drawn at 24. */
  icon: KozmosIconComponent;
  /**
   * Unavailable now. As every Kozmos button, a disabled item is skipped by
   * the keyboard and the pointer, and drawn at half strength.
   */
  disabled?: boolean;
  /**
   * More than the label says, shown on hover and keyboard focus ("Double
   * click to finish drawing"). Leave it unset where it would repeat the
   * label: the label is always drawn. A disabled item shows none.
   */
  tooltip?: string;
}

/**
 * A tool: a mode the map is in while it is chosen (Polygon, Adjust, Split).
 * One tool at most is chosen at a time; it is a ToggleButton, pressed.
 */
export interface MapEditToolbarTool extends MapEditToolbarControl {
  type: "tool";
}

/** An action: done once when pressed (Undo, Clear, Straighten). */
export interface MapEditToolbarAction extends MapEditToolbarControl {
  type: "action";
}

/** A line between two groups of items. */
export interface MapEditToolbarDivider {
  type: "divider";
}

export type MapEditToolbarItem =
  | MapEditToolbarTool
  | MapEditToolbarAction
  | MapEditToolbarDivider;

export interface MapEditToolbarProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange" | "children"
> {
  /** The toolbar's accessible name ("Geometry tools"). */
  label: string;
  /**
   * The items, in reading order: tools, actions and dividers. The product
   * decides which show in each mode; the toolbar draws them.
   */
  items: MapEditToolbarItem[];
  /** The chosen tool's id, or null for none. Controlled. */
  value?: string | null;
  /** The tool chosen at first, uncontrolled. */
  defaultValue?: string | null;
  /**
   * A tool was pressed: its id, or null when the chosen tool was pressed
   * again and let go. A controlled toolbar that must always have a tool
   * keeps its value.
   */
  onValueChange?: (value: string | null) => void;
  /** An action was pressed: its id. */
  onAction?: (id: string) => void;
  /**
   * Drawn in the card before the items, outside their arrow-key order: the
   * GeoJSON field of Cloud's JSON mode. Give it a label of its own.
   */
  field?: React.ReactNode;
  /** The overflow menu's button's label. */
  moreLabel?: string;
}

const isControl = (
  item: MapEditToolbarItem,
): item is MapEditToolbarTool | MapEditToolbarAction => item.type !== "divider";

// Layout effects measure before the frame paints; on a server there is no
// frame, and React 18 warns on each one it meets.
const useLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const px = (value: string) => Number.parseFloat(value) || 0;

/**
 * Pointr Cloud's map edit toolbar (CLOUD-UI-005): the one part behind its
 * seven geometry toolbars. A card on the map (radius 16, padding 6 and 8,
 * 60 tall) of 56 × 48 items, each a 24 icon over an 11/14 label: tools,
 * ToggleButtons with one at most pressed (decision 151), actions, and
 * dividers. The product decides which items each mode shows.
 *
 * It is one tab stop (role="toolbar"): the arrow keys move between its
 * items in the writing direction, and Home and End go to the first and the
 * last. On a map too narrow for it, the items that do not fit go, from the
 * end, into a More menu, never off-screen.
 *
 * A Dashboard module (decision 183): import it from
 * `@kozmos-ds/react/dashboard`, with `@kozmos-ds/react/dashboard.css` after
 * the package's style.css.
 */
const MapEditToolbar = React.forwardRef<HTMLDivElement, MapEditToolbarProps>(
  (
    {
      className,
      label,
      items,
      value: valueProp,
      defaultValue = null,
      onValueChange,
      onAction,
      field,
      moreLabel = "More",
      ...props
    },
    ref,
  ) => {
    const [uncontrolled, setUncontrolled] = React.useState<string | null>(
      defaultValue,
    );
    const value = valueProp !== undefined ? valueProp : uncontrolled;
    const choose = (id: string, pressed: boolean) => {
      const next = pressed ? id : null;
      if (valueProp === undefined) setUncontrolled(next);
      onValueChange?.(next);
    };

    // --- Overflow -------------------------------------------------------
    const frame = React.useRef<HTMLDivElement>(null);
    const card = React.useRef<HTMLDivElement | null>(null);
    const strip = React.useRef<HTMLDivElement>(null);
    const fieldBox = React.useRef<HTMLDivElement>(null);
    const [shown, setShown] = React.useState(items.length);
    // Each item's width, read while every item is drawn: the items are a
    // fixed size, so a narrower map needs no new reading.
    const widths = React.useRef<number[] | null>(null);

    // What the items are, as a key: a product that passes a new array of
    // the same items on every render is not measured again.
    const signature = items
      .map((item) =>
        item.type === "divider" ? "|" : `${item.type}:${item.id}:${item.label}`,
      )
      .join("\n");
    const latest = React.useRef(items);
    latest.current = items;

    const fit = React.useCallback(() => {
      const items = latest.current;
      const box = frame.current;
      const row = strip.current;
      if (!box || !card.current || !row || !widths.current) return;
      const style = getComputedStyle(card.current);
      const chrome =
        px(style.paddingInlineStart || style.paddingLeft) +
        px(style.paddingInlineEnd || style.paddingRight) +
        px(style.borderInlineStartWidth || style.borderLeftWidth) +
        px(style.borderInlineEndWidth || style.borderRightWidth);
      const cardGap = px(style.columnGap);
      const fieldWidth = fieldBox.current
        ? fieldBox.current.getBoundingClientRect().width + cardGap
        : 0;
      const available = box.clientWidth - chrome - fieldWidth;
      const gap = px(getComputedStyle(row).columnGap);
      const firstControl = items.findIndex(isControl);
      const moreWidth = firstControl >= 0 ? widths.current[firstControl] : 0;
      let count = fitMapEditToolbarItems(
        widths.current,
        available,
        moreWidth,
        gap,
      );
      while (count > 0 && items[count - 1].type === "divider") count--;
      setShown(count);
    }, []);

    // New items: draw them all, read their widths before the frame paints,
    // then fit.
    useLayoutEffect(() => {
      widths.current = null;
      setShown(latest.current.length);
    }, [signature]);
    useLayoutEffect(() => {
      const row = strip.current;
      if (widths.current || !row || shown !== items.length) return;
      // An item takes its box and its inline margins (the divider's 4 + 4):
      // the box alone let the strip run past the card.
      widths.current = Array.from(row.children, (child) => {
        const margins = getComputedStyle(child);
        return (
          (child as HTMLElement).getBoundingClientRect().width +
          px(margins.marginLeft) +
          px(margins.marginRight)
        );
      }).slice(0, items.length);
      fit();
    });
    React.useEffect(() => {
      const box = frame.current;
      if (!box || typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(() => fit());
      observer.observe(box);
      return () => observer.disconnect();
    }, [fit]);

    const visible = items.slice(0, shown);
    let hidden = items.slice(shown);
    // A divider is between two groups: none leads the menu, none doubles.
    hidden = hidden.filter(
      (item, index) =>
        item.type !== "divider" ||
        (index > 0 &&
          hidden[index - 1].type !== "divider" &&
          index < hidden.length - 1),
    );
    const overflowing = hidden.some(isControl);

    // --- Roving focus ---------------------------------------------------
    const MORE = "\u0000more";
    const stops = [
      ...visible.filter(isControl).filter((item) => !item.disabled),
    ].map((item) => item.id);
    if (overflowing) stops.push(MORE);
    const [focusId, setFocusId] = React.useState<string | null>(null);
    const tabStop =
      focusId !== null && stops.includes(focusId)
        ? focusId
        : value !== null && stops.includes(value)
          ? value
          : (stops[0] ?? null);
    const nodes = React.useRef(new Map<string, HTMLElement>());
    const hintId = React.useId();
    const register = (id: string) => (node: HTMLElement | null) => {
      if (node) nodes.current.set(id, node);
      else nodes.current.delete(id);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      const current = stops.find(
        (id) => nodes.current.get(id) === event.target,
      );
      if (current === undefined) return;
      // Left and right are the writing direction's: right to left, the
      // first item is on the right, and ArrowLeft goes forward.
      const row = strip.current;
      const rtl =
        !!row &&
        (row.closest("[dir]")?.getAttribute("dir") === "rtl" ||
          getComputedStyle(row).direction === "rtl");
      const index = stops.indexOf(current);
      let next: number;
      switch (event.key) {
        case rtl ? "ArrowLeft" : "ArrowRight":
          next = (index + 1) % stops.length;
          break;
        case rtl ? "ArrowRight" : "ArrowLeft":
          next = (index - 1 + stops.length) % stops.length;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = stops.length - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      setFocusId(stops[next]);
      nodes.current.get(stops[next])?.focus();
    };

    const control = (item: MapEditToolbarTool | MapEditToolbarAction) => {
      const Glyph = item.icon;
      const content = (
        <>
          <Glyph
            aria-hidden="true"
            focusable="false"
            width={24}
            height={24}
            className="kozmos-map-edit-toolbar-icon"
          />
          <span className="kozmos-map-edit-toolbar-label">{item.label}</span>
        </>
      );
      const shared = {
        ref: register(item.id),
        className: "kozmos-map-edit-toolbar-item",
        disabled: item.disabled,
        tabIndex: tabStop === item.id ? 0 : -1,
        onFocus: () => setFocusId(item.id),
        "data-item": item.id,
        "aria-describedby":
          item.tooltip && !item.disabled ? `${hintId}-${item.id}` : undefined,
      };
      const button =
        item.type === "tool" ? (
          <ToggleButton
            {...shared}
            pressed={value === item.id}
            onPressedChange={(pressed) => choose(item.id, pressed)}
          >
            {content}
          </ToggleButton>
        ) : (
          <Button
            {...shared}
            variant="ghost"
            onClick={() => onAction?.(item.id)}
          >
            {content}
          </Button>
        );
      if (!item.tooltip || item.disabled) return button;
      // The tooltip's trigger is a box round the button, not the button: a
      // trigger drawn asChild writes its own data-state over the
      // ToggleButton's, and a pressed tool lost its pressed look. Focus
      // reaches the box from the button inside it, so the keyboard still
      // opens it; the button is described by a hidden copy of the words beside it, as
      // the tooltip's own copy describes the box.
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="kozmos-map-edit-toolbar-tip">
              {button}
              <span id={`${hintId}-${item.id}`} hidden>
                {item.tooltip}
              </span>
            </span>
          </TooltipTrigger>
          <TooltipContent>{item.tooltip}</TooltipContent>
        </Tooltip>
      );
    };

    return (
      <div ref={frame} className="kozmos-map-edit-toolbar-frame">
        <TooltipProvider>
          <Surface
            ref={(node) => {
              card.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            role="toolbar"
            aria-label={label}
            aria-orientation="horizontal"
            className={clsx("kozmos-map-edit-toolbar", className)}
            {...props}
          >
            {field ? (
              <div ref={fieldBox} className="kozmos-map-edit-toolbar-field">
                {field}
              </div>
            ) : null}
            <div
              ref={strip}
              className="kozmos-map-edit-toolbar-items"
              onKeyDown={onKeyDown}
            >
              {visible.map((item, index) =>
                item.type === "divider" ? (
                  <Separator
                    key={`divider-${index}`}
                    orientation="vertical"
                    className="kozmos-map-edit-toolbar-divider"
                  />
                ) : (
                  <React.Fragment key={item.id}>{control(item)}</React.Fragment>
                ),
              )}
              {overflowing ? (
                <Menu>
                  <MenuTrigger asChild>
                    <Button
                      ref={register(MORE)}
                      variant="ghost"
                      className="kozmos-map-edit-toolbar-item"
                      tabIndex={tabStop === MORE ? 0 : -1}
                      onFocus={() => setFocusId(MORE)}
                      data-item="more"
                    >
                      <DotsHorizontal
                        aria-hidden="true"
                        focusable="false"
                        width={24}
                        height={24}
                        className="kozmos-map-edit-toolbar-icon"
                      />
                      <span className="kozmos-map-edit-toolbar-label">
                        {moreLabel}
                      </span>
                    </Button>
                  </MenuTrigger>
                  <MenuContent align="end" side="top">
                    {hidden.map((item, index) => {
                      if (item.type === "divider")
                        return <MenuSeparator key={`divider-${index}`} />;
                      const Glyph = item.icon;
                      const words = (
                        <>
                          <Glyph
                            aria-hidden="true"
                            focusable="false"
                            width={16}
                            height={16}
                            className="kozmos-map-edit-toolbar-menu-icon"
                          />
                          {item.label}
                        </>
                      );
                      return item.type === "tool" ? (
                        <MenuCheckboxItem
                          key={item.id}
                          checked={value === item.id}
                          disabled={item.disabled}
                          onCheckedChange={(checked) =>
                            choose(item.id, checked === true)
                          }
                        >
                          {words}
                        </MenuCheckboxItem>
                      ) : (
                        <MenuItem
                          key={item.id}
                          disabled={item.disabled}
                          onSelect={() => onAction?.(item.id)}
                        >
                          {words}
                        </MenuItem>
                      );
                    })}
                  </MenuContent>
                </Menu>
              ) : null}
            </div>
          </Surface>
        </TooltipProvider>
      </div>
    );
  },
);
MapEditToolbar.displayName = "MapEditToolbar";

export { MapEditToolbar };
