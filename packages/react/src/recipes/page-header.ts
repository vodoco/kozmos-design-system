/**
 * PageHeader's recipe: the classes a Kozmos page header draws with, the
 * Container its content sits in, and its title's heading level, for every
 * framework that draws one. React's `PageHeader` and Vue's
 * `KozmosPageHeader` build their elements from it. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import type { ContainerBlock } from "./container";

export type PageHeaderTone = "subtle" | "default";
export type PageHeaderSize = "lg" | "md";

/** The band's classes, before a caller's: tinted when `subtle`. */
export function pageHeaderClasses(tone: PageHeaderTone) {
  return [
    "kozmos-page-header",
    tone === "subtle" && "kozmos-page-header-subtle",
  ];
}

/** The content's Container's block inset (GAP-116): 32 above and 24 below. */
export const PAGE_HEADER_BLOCK: ContainerBlock = { start: "lg", end: "md" };

/**
 * The title's Heading level, for its size: `lg` Heading 2's (30/36), `md`
 * Heading 3's (24/32). Either way the title is an `h1`.
 */
export function pageHeaderTitleLevel(size: PageHeaderSize): 2 | 3 {
  return size === "lg" ? 2 : 3;
}

/** The header's boxes' classes, from its breadcrumb to its actions. */
export const PAGE_HEADER_BREADCRUMB_CLASS = "kozmos-page-header-breadcrumb";
export const PAGE_HEADER_ROW_CLASS = "kozmos-page-header-row";
export const PAGE_HEADER_TEXT_CLASS = "kozmos-page-header-text";
export const PAGE_HEADER_TITLE_CLASS = "kozmos-page-header-title";
export const PAGE_HEADER_TITLE_ADDON_CLASS = "kozmos-page-header-title-addon";
export const PAGE_HEADER_INFO_CLASS = "kozmos-page-header-info";
export const PAGE_HEADER_ACTIONS_CLASS = "kozmos-page-header-actions";
