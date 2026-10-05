import { describe, expect, it } from "vitest";
import { safeHref } from "./safe-href";

describe("safeHref", () => {
  it("links http and https with a host", () => {
    for (const href of ["https://example.com", "http://example.com/a?b=c#d"])
      expect(safeHref(href)).toBe(href);
  });

  it("links mailto and tel only where a contact link belongs", () => {
    for (const href of ["mailto:support@example.com", "tel:+4412345678"]) {
      expect(safeHref(href, { contact: true })).toBe(href);
      expect(safeHref(href)).toBeUndefined();
    }
  });

  it("refuses credentials, whitespace, control characters and other schemes", () => {
    for (const contact of [false, true])
      for (const href of [
        undefined,
        "",
        "/relative",
        "javascript:alert(1)",
        "data:text/html,bad",
        "https://user:secret@example.com",
        "https://maps.example@evil.example",
        "https://example.com/a b",
        " https://example.com",
        "https://example.com/\ttab",
        "https://exa\u0000mple.com",
        "mailto:",
        "tel:",
      ])
        expect(safeHref(href, { contact })).toBeUndefined();
  });
});
