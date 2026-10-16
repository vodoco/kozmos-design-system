"use client";
import * as React from "react";
import type { ThemeDensity } from "../components/ThemeProvider/ThemeProvider";
import { DensityContext } from "./density-context";

export interface DensityScopeProps {
  /** The control sizes inside the scope, its nested providers and its popovers. */
  density: ThemeDensity;
  /**
   * Mark the one child element instead of adding an element: the child must
   * pass a `data-*` attribute on to the element it renders. Anything but one
   * element, a fragment included, gets an element of its own, as without
   * `asChild`.
   */
  asChild?: boolean;
  children: React.ReactNode;
}

/**
 * One region at another density inside a provider (decision 82), such as a
 * compact editor's toolbar on a touch page. Its controls, the providers nested
 * in it and the popovers it opens take `density`, and the theme, its tokens
 * and the design configuration around it carry on unchanged. Every SDK part's
 * root is a touch scope, so it keeps the SDK's geometry on a compact page.
 */
export function DensityScope({
  density,
  asChild = false,
  children,
}: DensityScopeProps) {
  // One attribute needs no Slot: the child keeps its own props and its ref.
  return (
    <DensityContext.Provider value={density}>
      {asChild &&
      React.isValidElement(children) &&
      children.type !== React.Fragment ? (
        React.cloneElement(
          children as React.ReactElement<{
            "data-kozmos-density"?: ThemeDensity;
          }>,
          { "data-kozmos-density": density },
        )
      ) : (
        <div data-kozmos-density={density} style={{ display: "contents" }}>
          {children}
        </div>
      )}
    </DensityContext.Provider>
  );
}
