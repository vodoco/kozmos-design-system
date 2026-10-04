import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { InfoCircle } from "@kozmos-ds/icons";
import { MapControlButton } from "../MapControlButton";
import { createThemePortal } from "../../theme/ThemePortal";
import { cn } from "../../utils";
import { MapInfoPanel, type MapInfoPanelProps } from "./MapInfoPanel";
import { MapInfoDialogTitle } from "./map-info-title";

const Portal = createThemePortal(Dialog.Portal);
const DialogHeading = ({ children }: { children: React.ReactElement }) => (
  <Dialog.Title asChild>{children}</Dialog.Title>
);
const useLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;
export interface MapInfoProps extends Omit<
  MapInfoPanelProps,
  | "onClose"
  | "closeButtonRef"
  | "titleId"
  | "expandedFAQ"
  | "onExpandedFAQChange"
> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The existing map shell. Kept mounted when Info opens, closes or changes presentation. */
  children: React.ReactNode;
  triggerLabel?: string;
  /** Hide the capability without hiding map content. */
  available?: boolean;
}

/** Non-modal logical-end panel on wide hosts; full-viewport modal on compact hosts. */
export const MapInfo = React.forwardRef<HTMLDivElement, MapInfoProps>(
  (
    {
      open,
      onOpenChange,
      children,
      triggerLabel = "Information",
      available = true,
      className,
      style,
      ...panelProps
    },
    ref,
  ) => {
    const root = React.useRef<HTMLDivElement>(null);
    const trigger = React.useRef<HTMLButtonElement>(null);
    const close = React.useRef<HTMLButtonElement>(null);
    const pane = React.useRef<HTMLDivElement>(null);
    const [wide, setWide] = React.useState(false);
    const [faq, setFAQ] = React.useState("");
    const shown = open && available;
    React.useImperativeHandle(ref, () => root.current!, []);
    useLayoutEffect(() => {
      const node = root.current!;
      // Keep the nested shell above its 720px side-panel threshold. The info
      // pane scales with text, so enlarged text must also get more room.
      const measure = () => {
        const paneWidth =
          24 * parseFloat(getComputedStyle(document.documentElement).fontSize);
        setWide(
          Math.min(node.clientWidth, window.innerWidth) >= 720 + paneWidth,
        );
      };
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      if (node.firstElementChild) observer.observe(node.firstElementChild);
      window.addEventListener("resize", measure);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", measure);
      };
    }, []);
    return (
      <Dialog.Root open={shown} onOpenChange={onOpenChange} modal={!wide}>
        <div
          ref={root}
          tabIndex={-1}
          className={cn("kozmos-map-info-host", className)}
          style={style}
          data-info-open={shown}
          data-info-presentation={wide ? "side" : "full-screen"}
        >
          <div className="kozmos-map-info-map">{children}</div>
          {available && (
            <div className="kozmos-map-info-trigger" hidden={shown}>
              <Dialog.Trigger asChild>
                <MapControlButton
                  ref={trigger}
                  icon={<InfoCircle />}
                  label={triggerLabel}
                />
              </Dialog.Trigger>
            </div>
          )}
          <Portal container={wide ? root.current : undefined}>
            {!wide && <Dialog.Overlay className="kozmos-map-info-backdrop" />}
            <Dialog.Content
              ref={pane}
              className="kozmos-map-info-dialog"
              data-presentation={wide ? "side" : "full-screen"}
              aria-modal={wide ? undefined : true}
              aria-describedby={undefined}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                close.current?.focus();
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                // Focus that was in the closed pane is now on the page body.
                // Focus anywhere else is the visitor's: leave it there.
                const active = document.activeElement;
                if (active && active !== document.body) return;
                (trigger.current ?? root.current)?.focus();
              }}
              onEscapeKeyDown={(event) => {
                // Beside the map the pane is not modal: an Escape typed in the
                // map's search or controls is theirs, not a request to close.
                const active = document.activeElement;
                if (
                  wide &&
                  active &&
                  active !== document.body &&
                  !pane.current?.contains(active)
                )
                  event.preventDefault();
              }}
              onInteractOutside={(event) => {
                if (wide) event.preventDefault();
              }}
            >
              <MapInfoDialogTitle.Provider value={DialogHeading}>
                <MapInfoPanel
                  {...panelProps}
                  closeButtonRef={close}
                  expandedFAQ={faq}
                  onExpandedFAQChange={setFAQ}
                  onClose={() => onOpenChange(false)}
                />
              </MapInfoDialogTitle.Provider>
            </Dialog.Content>
          </Portal>
        </div>
      </Dialog.Root>
    );
  },
);
MapInfo.displayName = "MapInfo";
