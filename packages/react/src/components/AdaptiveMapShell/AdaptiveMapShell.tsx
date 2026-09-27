import React from "react";
import type {
  AdaptiveMapLayoutSnapshot,
  MapCollisionInsets,
  MapLayoutRect,
  MapPanelPresentation,
  MapReadiness,
} from "@kozmos-ds/product-contracts";
import { cn } from "../../utils";
import { surfaceClass, type SurfaceVariant } from "../Surface";
import {
  resolveAdaptiveMapLayout,
  resolveMapInsets,
} from "../../layout/adaptive-map-layout";
import {
  decidePanelDrag,
  nearestPanelDetent,
  orderPanelDetents,
  panelDetentDescription,
  panelDetentEquals,
  panelDetentHeight,
  PANEL_DRAG_SLOP,
  type PanelDetent,
  type PanelDragKind,
} from "./panel-detents";

/** Marks the row the sheet's smallest detent rests on: spread onto that element. */
export const panelPeekAnchorProps = { "data-kozmos-peek-anchor": "" } as const;

/** The detents a bottom sheet offers unless told otherwise; it rests at medium. */
export const DEFAULT_PANEL_DETENTS: readonly PanelDetent[] = [
  "collapsed",
  "medium",
  "large",
];

export type {
  AdaptiveMapLayoutSnapshot,
  MapLayoutRect,
  MapPanelPresentation,
} from "@kozmos-ds/product-contracts";

export interface AdaptiveMapShellProps extends React.HTMLAttributes<HTMLDivElement> {
  map: React.ReactNode;
  mapLabel?: string;
  mapStatus?: MapReadiness;
  mapStatusContent?: React.ReactNode;
  controls?: React.ReactNode;
  topBar?: React.ReactNode;
  panel?: React.ReactNode;
  /**
   * Drawn under the sheet's grip and above the panel's content, and not
   * scrolled with it: a search field, the assistant button, or a chosen
   * category stays put while the results under it scroll (row 73). Every
   * detent counts it: a sheet fitted to its content includes it, and a
   * collapsed sheet is always tall enough to show all of it — a header that
   * fits leaves the collapsed detent where it was, and a taller one raises
   * it. A peek anchor, in the header or the content, still decides where a
   * collapsed sheet rests.
   *
   * A vertical drag on it moves the sheet, whatever the content has
   * scrolled; a sideways one stays with the header, for a row of chips
   * that scrolls. Under a grab handle it keeps its first control clear of
   * the handle's target (WCAG 2.5.8). In a side panel it is the panel's
   * first row.
   */
  panelHeader?: React.ReactNode;
  panelLabel?: string;
  /**
   * The sheet handle's accessible name. It is a slider, and "Panel height" is
   * the only thing a screen reader has to go on — in English, whatever
   * language the interface is in.
   */
  panelHandleLabel?: string;
  panelPlacement?: "start" | "end";
  panelPresentation?: MapPanelPresentation;
  /**
   * Where a bottom sheet may rest: collapsed (a fifth of the shell, or the
   * content's peek anchor), medium (54 %), large (94 %), fitted to its
   * content, a fraction or a height. Dragged anywhere on the sheet, it snaps
   * to the nearest of these; its content scrolls only at the largest. Unset,
   * the sheet offers collapsed, medium and large and rests at medium.
   */
  panelDetents?: readonly PanelDetent[];
  /** The detent the sheet rests at: controlled, with `onPanelDetentChange`. */
  panelDetent?: PanelDetent;
  /** The detent an uncontrolled sheet starts at. */
  defaultPanelDetent?: PanelDetent;
  onPanelDetentChange?: (detent: PanelDetent) => void;
  /** A single-detent shorthand: the sheet rests at this fraction (0.12–0.94) and offers no other. */
  panelFraction?: number;
  /**
   * A single-detent shorthand: fitted to its content — as tall as what it
   * holds, between collapsed and large — for a sheet that holds a summary and
   * a row of buttons and nothing to scroll.
   */
  panelSizing?: "fraction" | "content";
  /** What the panel sits on: solid by default, glass where the product asks for it. */
  panelSurface?: SurfaceVariant;
  /** Minimum renderer padding. Combined with measured chrome using max, not addition. */
  collisionInsets?: Partial<MapCollisionInsets>;
  /**
   * Shell-local exclusions the map and the panel both keep out of, e.g. a
   * keyboard. The device's own safe areas (CSS env()) are not these: the map
   * runs under them and the chrome keeps them.
   */
  safeAreaInsets?: Partial<MapCollisionInsets>;
  /**
   * The device's own safe areas, which the chrome keeps out of and the map
   * runs under. Defaults to CSS `env(safe-area-inset-*)`, and the larger of
   * the two wins, so passing them can only ever add room.
   *
   * A prop because `env()` is not always the truth: inside a device frame on a
   * canvas, in a web view whose host draws its own bar, or anywhere system
   * chrome is painted over a page that reports zero, the controls end up under
   * the status bar with nothing able to say so (GAP-077).
   */
  deviceSafeAreaInsets?: Partial<MapCollisionInsets>;
  /**
   * Whether the floating controls pad the camera through
   * `onCollisionInsetsChange`. Off by default.
   *
   * Collision insets are four edge bands, so a 44px control column asked the
   * camera to give up the whole edge it sat on, at every height — measured at
   * 120px on a phone. A map following the visitor put them well off centre,
   * and the map shifted whenever the location button widened to show its mode
   * (GAP-079). A panel or a top bar really does span its edge; a small
   * floating cluster does not.
   *
   * The controls stay in the snapshot's `occlusions` with their true bounds,
   * so a product that wants to fit around them still can — and this stays a
   * boolean rather than a variant because it is camera behaviour, which no
   * Figma axis could ever carry.
   */
  controlsPadCamera?: boolean;
  /** Hinge-free physical rectangles in shell-local CSS pixels. Omit for a continuous host. */
  usableRegions?: readonly MapLayoutRect[];
  onCollisionInsetsChange?: (insets: MapCollisionInsets) => void;
  onLayoutChange?: (layout: AdaptiveMapLayoutSnapshot) => void;
}

const useLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;
const zero = { x: 0, y: 0, width: 0, height: 0 };
const mergeSafeInset = (css: number, supplied = 0) =>
  Math.max(css, Number.isFinite(supplied) ? supplied : 0);
/**
 * The peek anchor's bottom edge from the sheet's top, by layout position:
 * the anchor's box against the sheet's, with the content's scroll added back
 * so a scrolled sheet reports the same edge as one at its top. An anchor in
 * the panel header counts as one in the content does, and does not scroll.
 */
function measurePeekBottom(
  content: HTMLElement | null,
  header: HTMLElement | null,
): number {
  const sheet = content?.parentElement ?? header?.parentElement;
  if (!sheet) return 0;
  const top = sheet.getBoundingClientRect().top;
  const inHeader = header?.querySelector<HTMLElement>(
    "[data-kozmos-peek-anchor]",
  );
  const inContent = content?.querySelector<HTMLElement>(
    "[data-kozmos-peek-anchor]",
  );
  const bottom = inHeader
    ? inHeader.getBoundingClientRect().bottom - top
    : inContent && content
      ? inContent.getBoundingClientRect().bottom - top + content.scrollTop
      : 0;
  return Number.isFinite(bottom) && bottom > 0 ? bottom : 0;
}

/** The panel header's bottom edge from the sheet's top; 0 when there is none. */
function measureHeaderBottom(header: HTMLElement | null): number {
  const sheet = header?.parentElement;
  if (!header || !sheet) return 0;
  const bottom =
    header.getBoundingClientRect().bottom - sheet.getBoundingClientRect().top;
  return Number.isFinite(bottom) && bottom > 0 ? bottom : 0;
}
const position = (rect: MapLayoutRect): React.CSSProperties => ({
  position: "absolute",
  left: rect.x,
  top: rect.y,
  width: rect.width,
  height: rect.height,
});

const AdaptiveMapShell = React.forwardRef<
  HTMLDivElement,
  AdaptiveMapShellProps
>(
  (
    {
      className,
      map,
      mapLabel = "Map",
      mapStatus = "ready",
      mapStatusContent,
      controls,
      topBar,
      panel,
      panelHeader,
      panelLabel = "Map details",
      panelPlacement = "end",
      panelPresentation = "auto",
      panelDetents,
      panelDetent,
      defaultPanelDetent,
      onPanelDetentChange,
      panelFraction,
      panelSizing = "fraction",
      panelSurface = "solid",
      panelHandleLabel = "Panel height",
      collisionInsets,
      safeAreaInsets,
      deviceSafeAreaInsets,
      controlsPadCamera = false,
      usableRegions,
      onCollisionInsetsChange,
      onLayoutChange,
      style,
      ...props
    },
    ref,
  ) => {
    const root = React.useRef<HTMLDivElement>(null);
    const safeArea = React.useRef<HTMLDivElement>(null);
    const bar = React.useRef<HTMLDivElement>(null);
    const buttons = React.useRef<HTMLDivElement>(null);
    const panelContent = React.useRef<HTMLDivElement>(null);
    const panelHeaderElement = React.useRef<HTMLDivElement>(null);
    const handleElement = React.useRef<HTMLDivElement>(null);
    const hasPanelHeader = panelHeader !== undefined && panelHeader !== null;
    const panelElement = React.useRef<HTMLElement>(null);
    const [measured, setMeasured] = React.useState({
      ready: false,
      width: 0,
      height: 0,
      direction: "ltr" as "ltr" | "rtl",
      barHeight: 0,
      controlsWidth: 0,
      controlsHeight: 0,
      panelContentHeight: 0,
      panelHeaderHeight: 0,
      /** The panel header's bottom edge from the sheet's top; 0 when none. */
      headerBottom: 0,
      /** The grab handle's row, when the sheet draws one; 0 otherwise. */
      handleHeight: 0,
      /** The peek anchor's bottom edge from the sheet's top; 0 when none. */
      peekBottom: 0,
      safe: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    const [uncontrolledDetent, setUncontrolledDetent] = React.useState<
      PanelDetent | undefined
    >(defaultPanelDetent);
    /** The sheet's height while a finger holds it; null when settled. */
    const [dragHeight, setDragHeight] = React.useState<number | null>(null);
    /**
     * True while the sheet eases to a new detent. Only a detent change or a
     * drag's release animates; the sheet's first placement and a change of
     * the host's size are immediate, so it never flies in from the top.
     */
    const [settling, setSettling] = React.useState(false);
    /** The detent last requested, to tell a new request apart. */
    const [shownDetent, setShownDetent] = React.useState<string | null>(null);
    const [scrolled, setScrolled] = React.useState(false);
    const drag = React.useRef<{
      pointerId: number;
      startX: number;
      startY: number;
      startHeight: number;
      startScrollTop: number;
      kind: PanelDragKind | null;
      samples: [number, number][];
    } | null>(null);
    const suppressClick = React.useRef(false);
    React.useImperativeHandle(ref, () => root.current!, []);

    useLayoutEffect(() => {
      const element = root.current!;
      const measure = () => {
        const safeStyle = getComputedStyle(safeArea.current!);
        const next = {
          ready: true,
          width: element.clientWidth,
          height: element.clientHeight,
          direction:
            getComputedStyle(element).direction === "rtl"
              ? ("rtl" as const)
              : ("ltr" as const),
          barHeight: Math.max(
            bar.current?.offsetHeight ?? 0,
            bar.current?.scrollHeight ?? 0,
          ),
          controlsWidth: buttons.current?.offsetWidth ?? 0,
          controlsHeight: Math.max(
            buttons.current?.offsetHeight ?? 0,
            buttons.current?.scrollHeight ?? 0,
          ),
          // What the panel holds, not what it was given: the scroll height.
          panelContentHeight: panelContent.current?.scrollHeight ?? 0,
          panelHeaderHeight: panelHeaderElement.current?.offsetHeight ?? 0,
          headerBottom: measureHeaderBottom(panelHeaderElement.current),
          handleHeight: handleElement.current?.offsetHeight ?? 0,
          peekBottom: measurePeekBottom(
            panelContent.current,
            panelHeaderElement.current,
          ),
          safe: {
            top: parseFloat(safeStyle.paddingTop) || 0,
            right: parseFloat(safeStyle.paddingRight) || 0,
            bottom: parseFloat(safeStyle.paddingBottom) || 0,
            left: parseFloat(safeStyle.paddingLeft) || 0,
          },
        };
        setMeasured((previous) =>
          JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
        );
      };
      measure();
      const observer = new ResizeObserver(measure);
      [
        element,
        bar.current,
        buttons.current,
        panelContent.current,
        panelHeaderElement.current,
      ].forEach((node) => {
        if (node) observer.observe(node);
      });
      // The peek anchor moves when the sheet's content changes shape.
      const contentObserver = new MutationObserver(measure);
      for (const node of [panelContent.current, panelHeaderElement.current])
        if (node)
          contentObserver.observe(node, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["data-kozmos-peek-anchor", "style", "class"],
          });
      observer.observe(safeArea.current!, { box: "border-box" });
      // Inherited direction can change without a resize (including a host locale switch).
      const directionObserver = new MutationObserver(measure);
      for (
        let ancestor: HTMLElement | null = element;
        ancestor;
        ancestor = ancestor.parentElement
      ) {
        directionObserver.observe(ancestor, {
          attributes: true,
          attributeFilter: ["dir", "class", "style"],
        });
      }
      window.addEventListener("resize", measure);
      return () => {
        observer.disconnect();
        contentObserver.disconnect();
        directionObserver.disconnect();
        window.removeEventListener("resize", measure);
      };
    }, [Boolean(topBar), Boolean(controls), Boolean(panel), hasPanelHeader]);

    // The device's safe areas (CSS env()) are the chrome's: the map runs
    // under them, as the prototype's does. What the host supplies — a
    // keyboard — is an exclusion the map and the panel both keep out of.
    // `env()` is the floor, not the answer: a host that knows better can only
    // widen it.
    const chrome = {
      top: mergeSafeInset(measured.safe.top, deviceSafeAreaInsets?.top),
      right: mergeSafeInset(measured.safe.right, deviceSafeAreaInsets?.right),
      bottom: mergeSafeInset(
        measured.safe.bottom,
        deviceSafeAreaInsets?.bottom,
      ),
      left: mergeSafeInset(measured.safe.left, deviceSafeAreaInsets?.left),
    };
    const safe = {
      top: mergeSafeInset(0, safeAreaInsets?.top),
      right: mergeSafeInset(0, safeAreaInsets?.right),
      bottom: mergeSafeInset(0, safeAreaInsets?.bottom),
      left: mergeSafeInset(0, safeAreaInsets?.left),
    };
    // The sheet's detents, in the height the sheet can use — the shell less
    // its safe areas, as the layout resolves it. The content detent and the
    // peek anchor are measured a render late, as the chrome is.
    const sheetHeight = Math.max(0, measured.height - safe.top - safe.bottom);
    const detents: readonly PanelDetent[] =
      panelDetents ??
      (panelSizing === "content"
        ? ["content"]
        : panelFraction !== undefined && Number.isFinite(panelFraction)
          ? [{ fraction: panelFraction }]
          : DEFAULT_PANEL_DETENTS);
    // What the sheet holds, the header included. Whether it draws a handle is
    // decided on this, without the handle, so the handle's own height can
    // never fold two detents into one and take the handle away again.
    const held = measured.panelHeaderHeight + measured.panelContentHeight;
    const showsHandle =
      orderPanelDetents(detents, sheetHeight, {
        contentHeight: held,
        peekBottom: measured.peekBottom,
        headerBottom: measured.headerBottom,
      }).length > 1;
    const measures = {
      // A sheet fitted to its content holds its handle too, when it draws one:
      // iOS measures its fitted sheet with the grabber in it, and without it
      // the web's was the handle's height short and clipped its last line.
      contentHeight: held + (showsHandle ? measured.handleHeight : 0),
      peekBottom: measured.peekBottom,
      headerBottom: measured.headerBottom,
    };
    const ordered = orderPanelDetents(detents, sheetHeight, measures);
    const activeDetent: PanelDetent =
      panelDetent ??
      uncontrolledDetent ??
      (ordered.some((detent) => panelDetentEquals(detent, "medium"))
        ? "medium"
        : (ordered[Math.floor(ordered.length / 2)] ?? "medium"));
    const heightOf = (detent: PanelDetent) =>
      panelDetentHeight(detent, sheetHeight, measures);
    const smallest = ordered.length ? heightOf(ordered[0]!) : 0;
    const largest = ordered.length
      ? heightOf(ordered[ordered.length - 1]!)
      : sheetHeight;
    const clampToOffered = (height: number) =>
      Math.min(Math.max(height, smallest), largest);
    const settledHeight = clampToOffered(heightOf(activeDetent));
    const liveHeight =
      dragHeight === null ? settledHeight : clampToOffered(dragHeight);
    const atLargestDetent = settledHeight >= largest - 0.5;
    const activeIndex = Math.max(
      0,
      ordered.findIndex(
        (detent) => Math.round(heightOf(detent)) === Math.round(settledHeight),
      ),
    );
    const setDetent = (detent: PanelDetent) => {
      if (panelDetent === undefined) setUncontrolledDetent(detent);
      if (!panelDetentEquals(detent, activeDetent))
        onPanelDetentChange?.(detent);
    };
    const effectivePanelFraction =
      sheetHeight > 0 ? liveHeight / sheetHeight : undefined;
    const layout = resolveAdaptiveMapLayout({
      ...measured,
      hasPanel: Boolean(panel),
      panelPlacement,
      panelPresentation,
      panelFraction: effectivePanelFraction,
      // The sheet never covers the top bar; the controls yield to it instead
      // — their band above the sheet shrinks, and with none left they hide
      // (the iOS shell bounds them to the same band) — so the largest detent
      // is reachable with controls, as the prototype's full is.
      minimumMapHeight: topBar ? measured.barHeight + 32 : 0,
      safeAreaInsets: safe,
      chromeInsets: chrome,
      usableRegions,
    });
    const unavailable =
      measured.ready && (!layout.mapBounds.width || !layout.mapBounds.height);
    const rtl = measured.direction === "rtl";
    // Controls sit clear of a docked side panel. A bottom sheet spans the full
    // width, so there is nothing to sit clear of — and the rule, read from
    // panelPlacement alone, still fired and pushed them to the inline start:
    // the opposite side from every map app, and the wrong side for a thumb
    // (Olcay, on the US1 boards, 2026-09-27).
    const onRight = (panelPlacement === "end") !== rtl;
    // Two different questions, and only one of them is logical.
    //
    // Against a docked side panel the answer is physical: the far side from
    // wherever the panel actually is. Routing that through an inline side and
    // back inverts it in RTL, which is how a first cut put the panel and the
    // controls on the same edge there.
    //
    // Against a sheet it is logical, and mirrors: inline end, where a thumb
    // reaches — the same place iOS's `.bottom` placement already puts them.
    //
    // No prop to override it, deliberately. iOS already has a
    // `ControlsPlacement`, and it answers a different question (`.top` corner
    // versus `.bottom` band); a React prop of that name meaning "which side"
    // would be a worse bug than the one this fixes. An override, if it is ever
    // wanted, gets designed across the three platforms at once.
    const controlsOnLeft = layout.presentation === "bottom" ? rtl : onRight;
    const available = {
      x: layout.mapBounds.x + chrome.left,
      y: layout.mapBounds.y + chrome.top,
      width: Math.max(0, layout.mapBounds.width - chrome.left - chrome.right),
      height: Math.max(0, layout.mapBounds.height - chrome.top - chrome.bottom),
    };
    if (layout.panelBounds && layout.presentation === "side") {
      if (onRight) available.width = layout.panelBounds.x - available.x;
      else {
        available.x = layout.panelBounds.x + layout.panelBounds.width;
        available.width =
          layout.mapBounds.x + layout.mapBounds.width - available.x;
      }
    } else if (layout.panelBounds && layout.presentation === "bottom") {
      available.height = Math.max(0, layout.panelBounds.y - available.y);
    }
    const gap = Math.min(16, available.width / 4, available.height / 4);
    const chromeWidth = Math.max(0, available.width - 2 * gap);
    const chromeHeight = Math.max(0, available.height - 2 * gap);
    const barWidth = Math.min(672, chromeWidth);
    const barBounds = {
      x: available.x + (available.width - barWidth) / 2,
      y: available.y + gap,
      width: barWidth,
      height: topBar ? Math.min(measured.barHeight, chromeHeight) : 0,
    };
    const controlsY = barBounds.y + (topBar ? barBounds.height + gap : 0);
    // The band the controls keep above a bottom sheet. A sheet that takes it
    // all leaves them no room: they are hidden then, not drawn under the
    // sheet where a keyboard or a screen reader would still reach them, and
    // they no longer pad the camera.
    const controlsBand = Math.max(
      0,
      available.y + available.height - gap - controlsY,
    );
    const controlsOutOfRoom = measured.ready && controlsBand === 0;
    const controlsBounds = {
      x: controlsOnLeft
        ? available.x + gap
        : available.x + available.width - gap - measured.controlsWidth,
      y: controlsY,
      width: measured.controlsWidth,
      height: Math.min(measured.controlsHeight, controlsBand),
    };
    const occlusions: AdaptiveMapLayoutSnapshot["occlusions"] = [
      ...(layout.panelBounds
        ? [{ kind: "panel" as const, bounds: layout.panelBounds }]
        : []),
      ...(topBar ? [{ kind: "top-bar" as const, bounds: barBounds }] : []),
      ...(controls && !controlsOutOfRoom
        ? [{ kind: "controls" as const, bounds: controlsBounds }]
        : []),
    ];
    const insets = resolveMapInsets(
      layout.mapBounds,
      // The controls stay in `occlusions` whatever this says; what changes is
      // only whether they are allowed to pad the camera.
      occlusions
        .filter(
          (occlusion) => controlsPadCamera || occlusion.kind !== "controls",
        )
        .map((occlusion) => ({
          bounds: occlusion.bounds,
          edge:
            occlusion.kind === "top-bar"
              ? "top"
              : occlusion.kind === "controls"
                ? controlsOnLeft
                  ? "left"
                  : "right"
                : layout.presentation === "bottom"
                  ? "bottom"
                  : onRight
                    ? "right"
                    : "left",
        })),
      {
        top: Math.max(collisionInsets?.top ?? 0, chrome.top),
        right: Math.max(collisionInsets?.right ?? 0, chrome.right),
        bottom: Math.max(collisionInsets?.bottom ?? 0, chrome.bottom),
        left: Math.max(collisionInsets?.left ?? 0, chrome.left),
      },
    );
    const snapshot = JSON.stringify({
      ...layout,
      occlusions,
      collisionInsets: insets,
    });
    const callbacks = React.useRef({ onLayoutChange, onCollisionInsetsChange });
    useLayoutEffect(() => {
      callbacks.current = { onLayoutChange, onCollisionInsetsChange };
    });
    const previousInsets = React.useRef("");
    React.useEffect(() => {
      const value: AdaptiveMapLayoutSnapshot = JSON.parse(snapshot);
      const insetValue = { ...value.collisionInsets };
      const serializedInsets = JSON.stringify(insetValue);
      callbacks.current.onLayoutChange?.(value);
      if (previousInsets.current !== serializedInsets) {
        previousInsets.current = serializedInsets;
        callbacks.current.onCollisionInsetsChange?.(insetValue);
      }
    }, [snapshot]);

    const isSheet = layout.presentation === "bottom";
    const panelHidden = unavailable || (measured.ready && !layout.panelBounds);
    const drawsHandle = isSheet && showsHandle;
    // The handle is drawn only once the shell knows it is a sheet, a render
    // after its first measurement, so its row is measured when it appears
    // rather than whenever something else happens to resize.
    useLayoutEffect(() => {
      const handleHeight = handleElement.current?.offsetHeight ?? 0;
      setMeasured((previous) =>
        previous.handleHeight === handleHeight
          ? previous
          : { ...previous, handleHeight },
      );
    }, [drawsHandle]);
    // A newly requested detent — from a drag, the handle, the keyboard or
    // the host — marks the sheet settling in the same render as its new
    // height, so the transition is in place when the height changes. The
    // request, not the detent it resolves to: the default resolves again once
    // the shell is measured, and that first placement must not ease.
    const detentKey = JSON.stringify(panelDetent ?? uncontrolledDetent ?? null);
    if (shownDetent !== detentKey) {
      setShownDetent(detentKey);
      if (shownDetent !== null && isSheet) setSettling(true);
    }
    // Settled once the sheet's own transitions end, including one a newer
    // detent started meanwhile; with none running (reduced motion, or the
    // same height) at once.
    React.useEffect(() => {
      if (!settling) return;
      let cancelled = false;
      const wait = () => {
        if (cancelled) return;
        const element = panelElement.current;
        const running =
          element && typeof element.getAnimations === "function"
            ? element
                .getAnimations()
                .filter(
                  (animation) =>
                    typeof CSSTransition !== "undefined" &&
                    animation instanceof CSSTransition,
                )
            : [];
        if (running.length === 0) {
          setSettling(false);
          return;
        }
        void Promise.allSettled(
          running.map((animation) => animation.finished),
        ).then(wait);
      };
      const frame =
        typeof requestAnimationFrame === "function"
          ? requestAnimationFrame(wait)
          : null;
      if (frame === null) wait();
      return () => {
        cancelled = true;
        if (frame !== null) cancelAnimationFrame(frame);
      };
    }, [settling]);
    // The content scrolls only at the largest detent, and never while the
    // sheet is being dragged: the change mid-drag cancels the content's own
    // pan, so one finger never scrolls the list and moves the sheet at once.
    const scrollEnabled = !isSheet || (atLargestDetent && dragHeight === null);
    const onContentScroll = (event: React.UIEvent<HTMLDivElement>) => {
      const isScrolled = event.currentTarget.scrollTop > 0;
      if (isScrolled !== scrolled) setScrolled(isScrolled);
    };
    const onSheetPointerDown = (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      suppressClick.current = false;
      // A finger in a field selects text; on the handle the same drag works.
      if ((event.target as Element).closest("input, textarea, select")) return;
      drag.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startHeight: settledHeight,
        // The header does not scroll, so a drag that starts on it is the
        // sheet's whatever the content under it has scrolled.
        startScrollTop: panelHeaderElement.current?.contains(
          event.target as Node,
        )
          ? 0
          : (panelContent.current?.scrollTop ?? 0),
        kind: null,
        samples: [[event.timeStamp, event.clientY]],
      };
    };
    const onSheetPointerMove = (event: React.PointerEvent<HTMLElement>) => {
      const current = drag.current;
      if (!current || current.pointerId !== event.pointerId) return;
      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;
      if (current.kind === null) {
        if (Math.hypot(dx, dy) < PANEL_DRAG_SLOP) return;
        current.kind = decidePanelDrag({
          dx,
          dy,
          atLargestDetent,
          scrollTop: current.startScrollTop,
        });
        if (current.kind !== "sheet") return;
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // A synthetic pointer has nothing to capture.
        }
      }
      if (current.kind !== "sheet") return;
      current.samples.push([event.timeStamp, event.clientY]);
      setDragHeight(current.startHeight - dy);
    };
    const onSheetPointerUp = (event: React.PointerEvent<HTMLElement>) => {
      const current = drag.current;
      if (!current || current.pointerId !== event.pointerId) return;
      drag.current = null;
      if (current.kind !== "sheet") return;
      suppressClick.current = true;
      // The release eases to the detent, even back to the one it left.
      setSettling(true);
      const dy = event.clientY - current.startY;
      // The flick's velocity over its last 100 ms, projected 120 ms on, so a
      // fast short drag still lands on the detent it was aiming for.
      const recent = current.samples.filter(
        ([time]) => event.timeStamp - time <= 100,
      );
      const first = recent[0] ?? current.samples[current.samples.length - 1]!;
      const elapsed = event.timeStamp - first[0];
      const velocity = elapsed > 0 ? (event.clientY - first[1]) / elapsed : 0;
      const target = current.startHeight - dy - velocity * 120;
      setDragHeight(null);
      const nearest = nearestPanelDetent(
        ordered,
        target,
        sheetHeight,
        measures,
      );
      if (nearest) setDetent(nearest);
    };
    // A tap that ends a drag must not open what the finger stopped on.
    const onSheetClickCapture = (event: React.MouseEvent<HTMLElement>) => {
      if (!suppressClick.current) return;
      suppressClick.current = false;
      event.stopPropagation();
      event.preventDefault();
    };
    const stepDetent = (step: number) => {
      const next =
        ordered[Math.min(Math.max(activeIndex + step, 0), ordered.length - 1)];
      if (next) setDetent(next);
    };
    // Tapping the handle walks up the detents and wraps back to the shortest.
    const onHandleClick = () => {
      const next = ordered[(activeIndex + 1) % ordered.length];
      if (next) setDetent(next);
    };
    const onHandleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      const keys: Record<string, () => void> = {
        ArrowUp: () => stepDetent(1),
        ArrowDown: () => stepDetent(-1),
        Home: () => stepDetent(-ordered.length),
        End: () => stepDetent(ordered.length),
      };
      const action = keys[event.key];
      if (!action) return;
      event.preventDefault();
      action();
    };

    return (
      <div
        ref={root}
        className={cn(
          "relative isolate h-full min-h-0 w-full overflow-hidden bg-muted",
          className,
        )}
        data-map-status={mapStatus}
        data-panel-placement={panelPlacement}
        data-panel-presentation={layout.presentation}
        style={
          {
            "--kozmos-map-inset-top": `${insets.top}px`,
            "--kozmos-map-inset-right": `${insets.right}px`,
            "--kozmos-map-inset-bottom": `${insets.bottom}px`,
            "--kozmos-map-inset-left": `${insets.left}px`,
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        <div
          ref={safeArea}
          aria-hidden="true"
          style={{
            position: "absolute",
            visibility: "hidden",
            pointerEvents: "none",
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingRight: "env(safe-area-inset-right, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            paddingLeft: "env(safe-area-inset-left, 0px)",
          }}
        />
        <section
          aria-label={mapLabel}
          hidden={unavailable}
          style={position(layout.mapBounds)}
          className="overflow-hidden"
        >
          {map}
        </section>
        {mapStatus !== "ready" && mapStatusContent && (
          <div
            style={{
              ...position(layout.mapBounds),
              display: unavailable ? "none" : undefined,
            }}
            hidden={unavailable}
            className="z-20 flex items-center justify-center overflow-auto bg-background/80 p-6 text-center backdrop-blur-sm"
            role={mapStatus === "error" ? "alert" : "status"}
          >
            {mapStatusContent}
          </div>
        )}
        {topBar && (
          <div
            ref={bar}
            hidden={unavailable}
            className="absolute z-30 overflow-auto"
            style={{
              left: barBounds.x,
              top: barBounds.y,
              width: barWidth,
              maxHeight: chromeHeight,
            }}
          >
            {topBar}
          </div>
        )}
        {controls && (
          <div
            ref={buttons}
            hidden={unavailable || controlsOutOfRoom}
            className="absolute z-30 overflow-auto"
            style={{
              left: controlsOnLeft ? available.x + gap : undefined,
              right: controlsOnLeft
                ? undefined
                : measured.width - available.x - available.width + gap,
              top: controlsY,
              maxWidth: chromeWidth,
              maxHeight: controlsBand,
            }}
          >
            {controls}
          </div>
        )}
        {panel && (
          <aside
            ref={panelElement}
            aria-label={panelLabel}
            hidden={panelHidden}
            style={position(layout.panelBounds ?? zero)}
            className={cn(
              surfaceClass(panelSurface),
              "z-40 flex-col overflow-hidden shadow-overlay",
              // Its own display would outrank the hidden attribute and keep
              // a panel with no room drawn and in the accessibility tree.
              panelHidden ? undefined : "flex",
              layout.presentation === "bottom"
                ? "kozmos-map-sheet rounded-t-container"
                : "rounded-container",
            )}
            data-dragging={dragHeight !== null ? "" : undefined}
            data-settling={isSheet && settling ? "" : undefined}
            data-detent={
              isSheet ? panelDetentDescription(activeDetent) : undefined
            }
            // The whole sheet drags, not only its handle: the prototype's
            // rule, with the content's scroll handed off by `decidePanelDrag`.
            onPointerDown={isSheet ? onSheetPointerDown : undefined}
            onPointerMove={isSheet ? onSheetPointerMove : undefined}
            onPointerUp={isSheet ? onSheetPointerUp : undefined}
            onPointerCancel={isSheet ? onSheetPointerUp : undefined}
            onClickCapture={isSheet ? onSheetClickCapture : undefined}
          >
            {drawsHandle && (
              <div
                ref={handleElement}
                className="kozmos-map-sheet-handle"
                role="slider"
                tabIndex={0}
                aria-label={panelHandleLabel}
                aria-orientation="vertical"
                aria-valuemin={0}
                aria-valuemax={ordered.length - 1}
                aria-valuenow={activeIndex}
                aria-valuetext={panelDetentDescription(activeDetent)}
                onClick={onHandleClick}
                onKeyDown={onHandleKeyDown}
              >
                <span aria-hidden="true" className="kozmos-map-sheet-grip" />
              </div>
            )}
            {hasPanelHeader && (
              <div
                ref={panelHeaderElement}
                className={cn("flex-none", !isSheet && "pt-4")}
                data-kozmos-panel-header=""
                style={{
                  paddingLeft: isSheet ? chrome.left : undefined,
                  paddingRight: isSheet ? chrome.right : undefined,
                  // The handle is a 16px row, and a control directly under it
                  // - the search field a header usually starts with - leaves
                  // the handle's target a 16px clear space where WCAG 2.5.8
                  // asks 24. Half the shortfall keeps it clear, from the
                  // handle's own height token.
                  paddingTop: drawsHandle
                    ? "calc((24px - var(--primitives-layout-spacing-200) * 1px) / 2)"
                    : undefined,
                  // A vertical drag here is the sheet's; a sideways one stays
                  // with the header, for a row of chips that scrolls.
                  touchAction: isSheet ? "pan-x" : undefined,
                }}
              >
                {panelHeader}
              </div>
            )}
            <div
              ref={panelContent}
              className={cn(
                "min-h-0 flex-1 overscroll-contain",
                // A side panel has no grip, so nothing was making the space
                // the sheet's grip makes: the search field sat 1px under the
                // panel's top edge. 16 matches where the field starts below
                // the sheet's grip. A header takes that row when there is one.
                !isSheet && !hasPanelHeader && "pt-4",
              )}
              // A finger scrolls the list natively at the largest detent;
              // at the list's top only downward panning (into the list) is
              // native, so a finger pulling the other way reaches the sheet
              // as pointer events. Below the largest detent every touch is
              // the sheet's.
              style={{
                // The content keeps the device's safe areas inside the
                // sheet's edge-to-edge surface; scrolling content runs under
                // them to this padding.
                paddingBottom: isSheet ? chrome.bottom : undefined,
                paddingLeft: isSheet ? chrome.left : undefined,
                paddingRight: isSheet ? chrome.right : undefined,
                overflowY: scrollEnabled ? "auto" : "hidden",
                touchAction: scrollEnabled
                  ? scrolled
                    ? "pan-y"
                    : "pan-down"
                  : "none",
              }}
              onScroll={onContentScroll}
            >
              {panel}
            </div>
          </aside>
        )}
      </div>
    );
  },
);
AdaptiveMapShell.displayName = "AdaptiveMapShell";
export { AdaptiveMapShell };
