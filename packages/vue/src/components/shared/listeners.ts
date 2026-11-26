type Handler = (event: Event) => void;

/**
 * An app's listener, one or many as Vue's attrs hold them, called in order:
 * a part that handles an event itself calls the app's first, as Radix's
 * composeEventHandlers does, and skips its own once the app prevented the
 * default. Internal: the package exports none of it.
 */
export function callAll(handler: unknown, event: Event) {
  for (const each of ([] as unknown[]).concat(handler ?? []))
    if (typeof each === "function") (each as Handler)(event);
}
