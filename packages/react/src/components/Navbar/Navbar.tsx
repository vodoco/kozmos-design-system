import React from "react";
import { cn } from "../../utils";

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  /** Accessible name for the navigation landmark. */
  navigationLabel?: string;
  logo?: React.ReactNode;
  context?: React.ReactNode;
  /** @deprecated Use context instead. */
  site?: React.ReactNode;
  navigation?: React.ReactNode;
  /**
   * Where the navigation sits in the room between the leading slots and the
   * trailing ones (GAP-196). `"center"`, the default, centres it; `"start"`
   * sets it right after the logo, context and primary action; `"end"` beside
   * the actions, utilities and account, as Pointr Cloud draws its main
   * sections. Logical: start and end follow the reading direction, so
   * `"end"` is the left in right to left.
   */
  navigationAlign?: "start" | "center" | "end";
  primaryAction?: React.ReactNode;
  actions?: React.ReactNode;
  utilities?: React.ReactNode;
  account?: React.ReactNode;
}

const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  (
    {
      className,
      context,
      logo,
      site,
      navigation,
      navigationAlign = "center",
      primaryAction,
      actions,
      utilities,
      account,
      children,
      navigationLabel = "Main navigation",
      ...props
    },
    ref,
  ) => {
    const navigationContent = navigation ?? children;
    const contextContent = context ?? site;
    const hasTrailing = actions || utilities || account;

    return (
      <header
        ref={ref}
        data-slot="navbar"
        className={cn("kozmos-reset kozmos-navbar", className)}
        {...props}
      >
        <div
          data-slot="navbar-leading"
          className="kozmos-reset kozmos-navbar-leading"
        >
          {logo ? (
            <div
              data-slot="navbar-logo"
              className="kozmos-reset kozmos-navbar-logo"
            >
              {logo}
            </div>
          ) : null}
          {contextContent ? (
            <div
              data-slot="navbar-context"
              className="kozmos-reset kozmos-navbar-context"
            >
              {contextContent}
            </div>
          ) : null}
          {primaryAction ? (
            <div
              data-slot="navbar-primary-action"
              className="kozmos-reset kozmos-navbar-primary-action"
            >
              {primaryAction}
            </div>
          ) : null}
          {navigationContent ? (
            <nav
              data-slot="navbar-navigation"
              aria-label={navigationLabel}
              data-align={navigationAlign}
              className="kozmos-reset kozmos-navbar-navigation"
            >
              {navigationContent}
            </nav>
          ) : null}
        </div>
        {hasTrailing ? (
          <div
            data-slot="navbar-trailing"
            className="kozmos-reset kozmos-navbar-trailing"
          >
            {actions ? (
              <div data-slot="navbar-actions" className="contents">
                {actions}
              </div>
            ) : null}
            {utilities ? (
              <div data-slot="navbar-utilities" className="contents">
                {utilities}
              </div>
            ) : null}
            {account ? (
              <div data-slot="navbar-account" className="contents">
                {account}
              </div>
            ) : null}
          </div>
        ) : null}
      </header>
    );
  },
);
Navbar.displayName = "Navbar";

export { Navbar };
