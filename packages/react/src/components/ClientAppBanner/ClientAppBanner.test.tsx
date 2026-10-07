import { readFileSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import postcss, { type Rule } from "postcss";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ClientAppBanner, type ClientAppBannerProps } from "./ClientAppBanner";

// Paths from this file, not `new URL(literal, import.meta.url)`: Vite rewrites
// that form into a served asset URL, which `readFileSync` cannot open.
const here = dirname(fileURLToPath(import.meta.url));

/** Express's Client App Banner, as a customer sets it in Pointr Cloud. */
const EXPRESS: ClientAppBannerProps = {
  promotionText: "Get the app",
  appName: "Northfield Airport",
  description: "Live gate changes, step-free routes and your boarding pass.",
  appIconSrc: "https://example.com/icon.png",
  actionLabel: "Open",
  onAction: () => {},
};

/** Everything the banner says or offers, in the order a reader meets it. */
function reading(region: HTMLElement) {
  const walker = document.createTreeWalker(region, NodeFilter.SHOW_ELEMENT);
  const read: string[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node as HTMLElement;
    if (element.closest("[aria-hidden='true']")) continue;
    if (element.tagName === "BUTTON") {
      read.push(
        `button: ${element.getAttribute("aria-label") ?? element.textContent}`,
      );
    } else if (element.tagName === "P") {
      read.push(element.textContent ?? "");
    }
  }
  return read;
}

/** Physical sides a right-to-left interface would leave on the wrong edge. */
const PHYSICAL_CLASS =
  /(?:^|\s|:)-?(?:ml|mr|pl|pr|left|right|rounded-[lr]|rounded-[tb][lr]|border-[lr]|text-left|text-right|float-left|float-right)(?:-|\s|$)/;
const PHYSICAL_PROPERTY =
  /^(?:left|right|margin-(?:left|right)|padding-(?:left|right)|border-(?:left|right)(?:-.*)?|border-(?:top|bottom)-(?:left|right)-radius)$/;
/** Properties that are logical or physical by their value. */
const PHYSICAL_VALUE = /^(?:text-align|float|clear)$/;

describe("ClientAppBanner", () => {
  it("is a region named by the app, holding the customer's five fields and its action", () => {
    render(<ClientAppBanner {...EXPRESS} onDismiss={() => {}} />);

    const region = screen.getByRole("region", { name: "Northfield Airport" });
    expect(region.tagName).toBe("SECTION");
    expect(within(region).getByText("Get the app")).toBeInTheDocument();
    expect(within(region).getByText("Northfield Airport")).toBeInTheDocument();
    expect(
      within(region).getByText(
        "Live gate changes, step-free routes and your boarding pass.",
      ),
    ).toBeInTheDocument();
    expect(
      within(region).getByRole("button", { name: "Open" }),
    ).toBeInTheDocument();
    expect(
      within(region).getByRole("button", { name: "Dismiss" }),
    ).toBeInTheDocument();
  });

  it("reads promotion, name, description, then the action, then dismiss", () => {
    render(<ClientAppBanner {...EXPRESS} onDismiss={() => {}} />);
    expect(reading(screen.getByRole("region"))).toEqual([
      "Get the app",
      "Northfield Airport",
      "Live gate changes, step-free routes and your boarding pass.",
      "button: Open",
      "button: Dismiss",
    ]);
  });

  it("names the action by its visible words, and the dismiss button by its label", () => {
    render(
      <ClientAppBanner
        {...EXPRESS}
        actionLabel="Öffnen"
        dismissLabel="Schließen"
        onDismiss={() => {}}
      />,
    );
    const action = screen.getByRole("button", { name: "Öffnen" });
    // Label in name (WCAG 2.5.3): what is seen is what is said.
    expect(action).not.toHaveAttribute("aria-label");
    expect(action.textContent).toBe("Öffnen");
    const dismiss = screen.getByRole("button", { name: "Schließen" });
    expect(dismiss.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("asks the product to act and to dismiss, once each, and never hides itself", () => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();
    render(
      <ClientAppBanner
        {...EXPRESS}
        onAction={onAction}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledTimes(1);
    // Dismissal is the product's: it decides whether to remove the banner
    // and for how long, so the banner stays until it does.
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("offers no dismiss button when the product cannot dismiss it", () => {
    render(<ClientAppBanner {...EXPRESS} />);
    const region = screen.getByRole("region", { name: "Northfield Airport" });
    expect(within(region).getAllByRole("button")).toHaveLength(1);
    expect(
      within(region).queryByRole("button", { name: "Dismiss" }),
    ).toBeNull();
  });

  it("takes a product's own name for the region in place of the app's", () => {
    render(<ClientAppBanner {...EXPRESS} aria-label="Our app" />);
    expect(screen.getByRole("region", { name: "Our app" })).toBeInTheDocument();
  });

  it("leaves out the optional fields rather than drawing them empty", () => {
    render(
      <ClientAppBanner
        appName="Northfield Airport"
        actionLabel="Open"
        onAction={() => {}}
      />,
    );
    expect(reading(screen.getByRole("region"))).toEqual([
      "Northfield Airport",
      "button: Open",
    ]);
  });

  it("draws the app's initial where there is no icon, kept from the reader", () => {
    const { container } = render(
      <ClientAppBanner
        appName="northfield Airport"
        actionLabel="Open"
        onAction={() => {}}
      />,
    );
    const icon = container.querySelector<HTMLElement>(
      ".kozmos-client-app-banner-icon",
    );
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon?.textContent).toBe("N");
    expect(icon?.querySelector("img")).toBeNull();
  });

  it("names its icon only when the product says the icon says more than the name", () => {
    const { container, rerender } = render(<ClientAppBanner {...EXPRESS} />);
    const icon = () =>
      container.querySelector<HTMLElement>(".kozmos-client-app-banner-icon");
    // Beside the app's name, the icon is decoration.
    expect(icon()).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).toBeNull();
    // Named, it is one image, loaded or not: the initial standing in for it
    // is not read as a letter.
    rerender(<ClientAppBanner {...EXPRESS} appIconAlt="Northfield logo" />);
    expect(icon()).not.toHaveAttribute("aria-hidden");
    expect(screen.getByRole("img", { name: "Northfield logo" })).toBe(icon());
  });

  it("moves no focus of its own", () => {
    render(<ClientAppBanner {...EXPRESS} onDismiss={() => {}} />);
    expect(document.activeElement).toBe(document.body);
  });

  it("has no axe violations, with and without a dismiss button", async () => {
    const { container, rerender } = render(
      <ClientAppBanner {...EXPRESS} onDismiss={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
    rerender(<ClientAppBanner {...EXPRESS} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sets out its sides logically, so right-to-left mirrors it", () => {
    const { container } = render(
      <div dir="rtl">
        <ClientAppBanner {...EXPRESS} onDismiss={() => {}} />
      </div>,
    );
    for (const element of container.querySelectorAll<HTMLElement>("[class]")) {
      expect(
        element.getAttribute("class"),
        `${element.tagName} carries a physical side`,
      ).not.toMatch(PHYSICAL_CLASS);
    }

    const css = readFileSync(
      resolvePath(here, "../../styles/owned-client-app-banner.css"),
      "utf8",
    );
    const rules: Rule[] = [];
    postcss.parse(css).walkRules((rule) => {
      if (rule.selector.includes("kozmos-client-app-banner")) rules.push(rule);
    });
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      rule.walkDecls((declaration) => {
        expect(
          declaration.prop,
          `${rule.selector} sets a physical side`,
        ).not.toMatch(PHYSICAL_PROPERTY);
        if (PHYSICAL_VALUE.test(declaration.prop))
          expect(
            declaration.value,
            `${rule.selector} ${declaration.prop}`,
          ).not.toMatch(/\b(?:left|right)\b/);
      });
    }
  });

  it("puts the action under the words when they would not fit beside it", () => {
    // The stack is CSS, with no measuring: the words ask for 10rem before
    // they share their line, and the action, wrapped onto a line of its own,
    // grows to fill it. Beside the words it barely grows (9999 to 1).
    const css = readFileSync(
      resolvePath(here, "../../styles/owned-client-app-banner.css"),
      "utf8",
    );
    const declared = (selector: string) => {
      const found: Record<string, string> = {};
      postcss.parse(css).walkRules((rule) => {
        if (rule.selector === selector)
          rule.walkDecls((d) => {
            found[d.prop] = d.value;
          });
      });
      return found;
    };
    expect(declared(".kozmos-client-app-banner-body")).toMatchObject({
      display: "flex",
      "flex-wrap": "wrap",
    });
    expect(declared(".kozmos-client-app-banner-text")).toMatchObject({
      flex: "9999 1 10rem",
    });
    expect(declared(".kozmos-client-app-banner-action")).toMatchObject({
      flex: "1 0 auto",
    });
    // At most two lines of description; the rest is still read.
    expect(declared(".kozmos-client-app-banner-description")).toMatchObject({
      "-webkit-line-clamp": "2",
      overflow: "hidden",
    });

    const { container } = render(<ClientAppBanner {...EXPRESS} />);
    const body = container.querySelector(".kozmos-client-app-banner-body");
    expect(body?.children[0]).toHaveClass("kozmos-client-app-banner-text");
    expect(body?.children[1]).toHaveClass("kozmos-client-app-banner-action");
  });
});
