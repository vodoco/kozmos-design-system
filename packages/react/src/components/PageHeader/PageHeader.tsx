import React from "react";
import { cn } from "../../utils";
import { Container, type ContainerProps } from "../Container/Container";
import { Heading } from "../Heading/Heading";
import { Text } from "../Text/Text";

// A page's header (GAP-036, decision 135): a breadcrumb, the page's title with
// an info button beside it, a description and the page's actions, on a tinted
// band that spans the page. Its content sits in a Container, so it lines up
// with the page under it, and takes Container's block inset (GAP-116): 32
// above and 24 below.

export interface PageHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /** The page's title: the page's one `h1`. */
  title: React.ReactNode;
  /** Above the title: the page's place, a Kozmos `Breadcrumb`. */
  breadcrumb?: React.ReactNode;
  /**
   * Beside the title: a button that says more about the page, as an
   * `IconButton` with its own label, often opening a `Popover` or `Tooltip`.
   */
  info?: React.ReactNode;
  /** Under the title, in the muted small text. */
  description?: React.ReactNode;
  /**
   * At the end of the title's line: the page's buttons. They wrap under the
   * title where the page is too narrow for both, at the left in right to
   * left.
   */
  actions?: React.ReactNode;
  /**
   * `subtle`, the default, paints the band in the pale theme tint, as
   * CardHeader's subtle strip is; `default` paints none, for a page whose
   * header sits on the page's own background.
   */
  tone?: "subtle" | "default";
  /**
   * The title's size: `lg` is Heading 2's (30/36), for a landing page such
   * as Home; `md`, the default, is Heading 3's (24/32), for a page within a
   * section, such as Settings. Either way the title is an `h1`.
   */
  size?: "lg" | "md";
  /** The content's side padding, as Container's `inset`. */
  inset?: ContainerProps["inset"];
  /** Whether the content is centred at Container's widest, as Container's `centered`. */
  centered?: boolean;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      className,
      title,
      breadcrumb,
      info,
      description,
      actions,
      tone = "subtle",
      size = "md",
      inset = "window",
      centered = true,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      data-slot="page-header"
      data-tone={tone}
      data-size={size}
      className={cn(
        "kozmos-page-header",
        tone === "subtle" && "kozmos-page-header-subtle",
        className,
      )}
      {...props}
    >
      <Container
        inset={inset}
        centered={centered}
        block={{ start: "lg", end: "md" }}
      >
        {breadcrumb ? (
          <div
            data-slot="page-header-breadcrumb"
            className="kozmos-page-header-breadcrumb"
          >
            {breadcrumb}
          </div>
        ) : null}
        <div className="kozmos-page-header-row">
          <div className="kozmos-page-header-text">
            <div className="kozmos-page-header-title">
              <Heading as="h1" level={size === "lg" ? 2 : 3}>
                {title}
              </Heading>
              {info ? (
                <div
                  data-slot="page-header-info"
                  className="kozmos-page-header-info"
                >
                  {info}
                </div>
              ) : null}
            </div>
            {description ? (
              <Text
                as="p"
                size="sm"
                color="muted"
                data-slot="page-header-description"
              >
                {description}
              </Text>
            ) : null}
          </div>
          {actions ? (
            <div
              data-slot="page-header-actions"
              className="kozmos-page-header-actions"
            >
              {actions}
            </div>
          ) : null}
        </div>
      </Container>
    </div>
  ),
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
