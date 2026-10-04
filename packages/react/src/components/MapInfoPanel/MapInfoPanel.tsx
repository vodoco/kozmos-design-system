import React from "react";
import { X } from "@kozmos-ds/icons";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../Accordion";
import { Button } from "../Button";
import { Link } from "../Link";
import { cn } from "../../utils";
import { MapInfoDialogTitle } from "./map-info-title";

export interface MapInfoEntry {
  id: string;
  label: string;
  href?: string;
}
export interface MapInfoFAQ {
  id: string;
  question: string;
  answer: string;
}
export interface MapInfoVersion {
  id: string;
  label: string;
  value: string;
}
/** Localized, host-owned content. No HTML, provider inference, legal copy or version defaults. */
export interface MapInfoContent {
  title: string;
  introduction?: string;
  faqs?: readonly MapInfoFAQ[];
  credits?: readonly MapInfoEntry[];
  links?: readonly MapInfoEntry[];
  versions?: readonly MapInfoVersion[];
}

/** Allow navigation and contact links, never script/data URLs or embedded credentials. */
export function safeMapInfoHref(href?: string): string | undefined {
  if (
    !href ||
    Array.from(href).some((character) => character.charCodeAt(0) <= 32)
  )
    return undefined;
  try {
    const url = new URL(href);
    if (url.username || url.password) return undefined;
    if (["http:", "https:"].includes(url.protocol) && url.hostname) return href;
    if (["mailto:", "tel:"].includes(url.protocol) && url.pathname) return href;
  } catch {
    /* Unsupported destinations stay readable as text. */
  }
  return undefined;
}

export interface MapInfoPanelProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "content" | "title"
> {
  content: MapInfoContent;
  /** Optional approved artwork. Caller supplies an accessible label for meaningful logos. */
  brand?: React.ReactNode;
  onClose: () => void;
  closeLabel?: string;
  faqLabel?: string;
  copyrightLabel?: string;
  /** Optional controlled FAQ ID, retained by MapInfo across presentation changes. */
  expandedFAQ?: string;
  onExpandedFAQChange?: (id: string) => void;
  closeButtonRef?: React.Ref<HTMLButtonElement>;
  titleId?: string;
}

export const MapInfoPanel = React.forwardRef<HTMLElement, MapInfoPanelProps>(
  (
    {
      content,
      brand,
      onClose,
      closeLabel = "Close information",
      faqLabel = "Frequently asked questions",
      copyrightLabel = "Copyright",
      expandedFAQ,
      onExpandedFAQChange,
      closeButtonRef,
      titleId,
      className,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const headingId = titleId ?? generatedId;
    const DialogTitle = React.useContext(MapInfoDialogTitle);
    const heading = (
      <h2
        // Inside the dialog its title gives the id; even an undefined id here
        // would override it.
        {...(DialogTitle ? {} : { id: headingId })}
        className="m-0 text-xl font-semibold text-foreground"
      >
        {content.title}
      </h2>
    );
    const entry = (item: MapInfoEntry) => {
      const href = safeMapInfoHref(item.href);
      return href ? (
        <Link href={href} className="underline">
          {item.label}
        </Link>
      ) : (
        <span>{item.label}</span>
      );
    };
    const footer = Boolean(
      content.credits?.length ||
      content.links?.length ||
      content.versions?.length,
    );
    return (
      <section
        ref={ref}
        className={cn("kozmos-map-info-panel", className)}
        aria-labelledby={DialogTitle ? undefined : headingId}
        {...props}
      >
        <div className="kozmos-map-info-close">
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <div className="kozmos-map-info-heading">
          {brand != null && (
            <div className="kozmos-map-info-brand">{brand}</div>
          )}
          {DialogTitle ? <DialogTitle>{heading}</DialogTitle> : heading}
        </div>
        {content.introduction && (
          <p className="m-0 text-sm text-muted-foreground whitespace-pre-line">
            {content.introduction}
          </p>
        )}
        {!!content.faqs?.length && (
          <div className="kozmos-map-info-faq">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {faqLabel}
            </h3>
            <Accordion
              type="single"
              collapsible
              value={expandedFAQ}
              onValueChange={onExpandedFAQChange}
            >
              {content.faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="gap-3 text-start text-sm">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground whitespace-pre-line">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
        {footer && (
          <footer className="kozmos-map-info-footer">
            {!!content.credits?.length && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  {copyrightLabel}
                </h3>
                <ul className="m-0 list-none p-0 text-sm">
                  {content.credits.map((item) => (
                    <li key={item.id}>{entry(item)}</li>
                  ))}
                </ul>
              </div>
            )}
            {!!content.links?.length && (
              <ul className="m-0 flex flex-wrap gap-x-4 gap-y-2 list-none p-0 text-sm">
                {content.links.map((item) => (
                  <li key={item.id}>{entry(item)}</li>
                ))}
              </ul>
            )}
            {content.versions?.map((version) => (
              <p key={version.id} className="m-0 text-xs text-muted-foreground">
                {version.label}: {version.value}
              </p>
            ))}
          </footer>
        )}
      </section>
    );
  },
);
MapInfoPanel.displayName = "MapInfoPanel";
