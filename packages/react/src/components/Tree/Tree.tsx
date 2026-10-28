import React from "react";
import {
  ChevronDown,
  ChevronRight,
  File01 as File,
  Folder,
} from "@kozmos-ds/icons";
import { cn } from "../../utils";

export type TreeDensity = "default" | "compact";
export type TreeActivationMode = "select" | "toggle" | "select-toggle";

export interface TreeItemRenderContext {
  item: TreeItem;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  toggle: (force?: boolean) => void;
  select: () => void;
}

export type TreeItemSlot =
  | React.ReactNode
  | ((context: TreeItemRenderContext) => React.ReactNode);

export interface TreeItem {
  id: string;
  name: React.ReactNode;
  children?: TreeItem[];
  disabled?: boolean;
  icon?: TreeItemSlot;
  count?: TreeItemSlot;
  meta?: TreeItemSlot;
  actions?: TreeItemSlot;
  className?: string;
}

export interface TreeProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  data?: TreeItem[];
  children?: React.ReactNode;
  ariaLabel?: string;
  density?: TreeDensity;
  /**
   * A stroke under every row and an open parent row on a surface of its own
   * (GAP-201): a list of records, as Pointr Cloud's Map Content tree draws
   * its buildings and levels, rather than a navigation tree. The stroke sits
   * under the row, so a divided row is a pixel taller; the hover and
   * selected fills keep their corners, inside the stroke and over the
   * surface, and the focus ring is drawn inside the row. Rows composed as
   * children take it from here too.
   */
  divided?: boolean;
  /**
   * How far a divided row's stroke and an open row's surface reach past the
   * tree on each side, so they run to the panel's edges while the rows stay
   * where they are: the panel's own inline padding, 16 in a
   * `Container inset="panel"`. A number is pixels. 0 by default, the tree's
   * own edges.
   */
  bleed?: number | string;
  indent?: number;
  activationMode?: TreeActivationMode;
  defaultExpandedIds?: string[];
  expandedIds?: string[];
  onExpandedChange?: (ids: string[]) => void;
  defaultSelectedId?: string;
  selectedId?: string;
  onSelectionChange?: (item: TreeItem) => void;
  renderIcon?: (context: TreeItemRenderContext) => React.ReactNode;
  renderMeta?: (context: TreeItemRenderContext) => React.ReactNode;
  renderActions?: (context: TreeItemRenderContext) => React.ReactNode;
}

export interface TreeItemRowProps extends React.HTMLAttributes<HTMLDivElement> {
  name: React.ReactNode;
  actions?: React.ReactNode;
  actionsVisibility?: "auto" | "always";
  count?: React.ReactNode;
  density?: TreeDensity;
  depth?: number;
  disabled?: boolean;
  /**
   * As Tree's `divided`: a stroke under the row, and an open parent row on a
   * surface, both reaching the Tree's `bleed` past it. Defaults to the
   * Tree's.
   */
  divided?: boolean;
  expanded?: boolean;
  focusVisible?: boolean;
  hasChildren?: boolean;
  icon?: React.ReactNode;
  indent?: number;
  meta?: React.ReactNode;
  onDisclosureClick?: (event: React.MouseEvent<HTMLSpanElement>) => void;
  selected?: boolean;
}

interface VisibleTreeItem {
  item: TreeItem;
  depth: number;
  parentId?: string;
}

/** A Tree's `divided`, for the rows composed in it as children. */
const TreeDividedContext = React.createContext(false);

const Tree = React.forwardRef<HTMLDivElement, TreeProps>(
  (
    {
      ariaLabel = "Tree",
      activationMode = "select-toggle",
      children,
      className,
      data = [],
      density = "default",
      divided,
      bleed,
      defaultExpandedIds = [],
      expandedIds,
      indent = 20,
      onExpandedChange,
      defaultSelectedId,
      selectedId,
      onSelectionChange,
      renderIcon,
      renderMeta,
      renderActions,
      ...props
    },
    ref,
  ) => {
    const [internalExpandedIds, setInternalExpandedIds] = React.useState(
      () => new Set(defaultExpandedIds),
    );
    const [internalSelectedId, setInternalSelectedId] =
      React.useState(defaultSelectedId);
    const [focusedId, setFocusedId] = React.useState(
      () => defaultSelectedId ?? findFirstEnabledTreeItemId(data),
    );
    const itemRefs = React.useRef(new Map<string, HTMLDivElement>());
    const expandedSet = React.useMemo(
      () => new Set(expandedIds ?? Array.from(internalExpandedIds)),
      [expandedIds, internalExpandedIds],
    );
    const currentSelectedId = selectedId ?? internalSelectedId;
    const visibleItems = React.useMemo(
      () => flattenTreeItems(data, expandedSet),
      [data, expandedSet],
    );

    const setExpandedSet = React.useCallback(
      (next: Set<string>) => {
        if (expandedIds === undefined) {
          setInternalExpandedIds(next);
        }
        onExpandedChange?.(Array.from(next));
      },
      [expandedIds, onExpandedChange],
    );

    const toggleExpanded = React.useCallback(
      (item: TreeItem, force?: boolean) => {
        if (!item.children?.length || item.disabled) return;

        const next = new Set(expandedSet);
        const shouldExpand = force ?? !next.has(item.id);

        if (shouldExpand) {
          next.add(item.id);
        } else {
          next.delete(item.id);
        }

        setExpandedSet(next);
      },
      [expandedSet, setExpandedSet],
    );

    const selectItem = React.useCallback(
      (item: TreeItem) => {
        if (item.disabled) return;

        if (selectedId === undefined) {
          setInternalSelectedId(item.id);
        }
        onSelectionChange?.(item);
      },
      [onSelectionChange, selectedId],
    );

    const focusItem = React.useCallback((id: string) => {
      setFocusedId(id);
      itemRefs.current.get(id)?.focus();
    }, []);

    const activateItem = React.useCallback(
      (item: TreeItem) => {
        if (item.disabled) return;

        if (activationMode === "select" || activationMode === "select-toggle") {
          selectItem(item);
        }

        if (
          (activationMode === "toggle" || activationMode === "select-toggle") &&
          item.children?.length
        ) {
          toggleExpanded(item);
        }
      },
      [activationMode, selectItem, toggleExpanded],
    );

    const handleItemKeyDown = React.useCallback(
      (item: TreeItem, event: React.KeyboardEvent<HTMLDivElement>) => {
        if (item.disabled) return;

        const currentIndex = visibleItems.findIndex(
          (visible) => visible.item.id === item.id,
        );
        const enabledItems = visibleItems.filter(
          (visible) => !visible.item.disabled,
        );
        const currentEnabledIndex = enabledItems.findIndex(
          (visible) => visible.item.id === item.id,
        );
        const hasChildren = Boolean(item.children?.length);
        const isOpen = expandedSet.has(item.id);

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activateItem(item);
          return;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          const next = enabledItems[currentEnabledIndex + 1];
          if (next) focusItem(next.item.id);
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          const previous = enabledItems[currentEnabledIndex - 1];
          if (previous) focusItem(previous.item.id);
          return;
        }

        if (event.key === "Home") {
          event.preventDefault();
          const first = enabledItems[0];
          if (first) focusItem(first.item.id);
          return;
        }

        if (event.key === "End") {
          event.preventDefault();
          const last = enabledItems[enabledItems.length - 1];
          if (last) focusItem(last.item.id);
          return;
        }

        if (event.key === "ArrowRight" && hasChildren) {
          event.preventDefault();
          if (!isOpen) {
            toggleExpanded(item, true);
          } else {
            const nextVisible = visibleItems[currentIndex + 1];
            if (
              nextVisible &&
              nextVisible.depth > visibleItems[currentIndex].depth
            ) {
              focusItem(nextVisible.item.id);
            }
          }
          return;
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          if (hasChildren && isOpen) {
            toggleExpanded(item, false);
            return;
          }

          const parentId = visibleItems[currentIndex]?.parentId;
          if (parentId) focusItem(parentId);
        }
      },
      [activateItem, expandedSet, focusItem, toggleExpanded, visibleItems],
    );

    React.useEffect(() => {
      if (
        focusedId &&
        visibleItems.some((visible) => visible.item.id === focusedId)
      )
        return;
      setFocusedId(
        currentSelectedId &&
          visibleItems.some((visible) => visible.item.id === currentSelectedId)
          ? currentSelectedId
          : visibleItems.find((visible) => !visible.item.disabled)?.item.id,
      );
    }, [currentSelectedId, focusedId, visibleItems]);

    return (
      <div
        ref={ref}
        role="tree"
        aria-label={ariaLabel}
        className={cn("w-full text-sm", className)}
        {...props}
        style={
          bleed === undefined
            ? props.style
            : ({
                "--kozmos-tree-bleed":
                  typeof bleed === "number" ? `${bleed}px` : bleed,
                ...props.style,
              } as React.CSSProperties)
        }
      >
        <TreeDividedContext.Provider value={!!divided}>
          {children ??
            data.map((item) => (
              <TreeNode
                key={item.id}
                item={item}
                depth={0}
                density={density}
                divided={divided}
                expandedSet={expandedSet}
                focusedId={focusedId}
                indent={indent}
                itemRefs={itemRefs}
                selectedId={currentSelectedId}
                onActivate={activateItem}
                onFocusItem={setFocusedId}
                onKeyDown={handleItemKeyDown}
                onSelect={selectItem}
                onToggle={toggleExpanded}
                renderActions={renderActions}
                renderIcon={renderIcon}
                renderMeta={renderMeta}
              />
            ))}
        </TreeDividedContext.Provider>
      </div>
    );
  },
);
Tree.displayName = "Tree";

interface TreeNodeProps {
  item: TreeItem;
  depth: number;
  density: TreeDensity;
  divided?: boolean;
  expandedSet: Set<string>;
  focusedId?: string;
  indent: number;
  itemRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  selectedId?: string;
  onActivate: (item: TreeItem) => void;
  onFocusItem: (id: string) => void;
  onKeyDown: (
    item: TreeItem,
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => void;
  onSelect: (item: TreeItem) => void;
  onToggle: (item: TreeItem, force?: boolean) => void;
  renderIcon?: (context: TreeItemRenderContext) => React.ReactNode;
  renderMeta?: (context: TreeItemRenderContext) => React.ReactNode;
  renderActions?: (context: TreeItemRenderContext) => React.ReactNode;
}

const TreeNode = ({
  item,
  depth,
  density,
  divided,
  expandedSet,
  focusedId,
  indent,
  itemRefs,
  selectedId,
  onActivate,
  onFocusItem,
  onKeyDown,
  onSelect,
  onToggle,
  renderIcon,
  renderMeta,
  renderActions,
}: TreeNodeProps) => {
  const hasChildren = Boolean(item.children?.length);
  const isOpen = expandedSet.has(item.id);
  const isSelected = selectedId === item.id;
  const isFocused = focusedId === item.id;
  const isDisabled = Boolean(item.disabled);

  const select = () => {
    onSelect(item);
  };

  const toggle = (force?: boolean) => {
    onToggle(item, force);
  };

  const context: TreeItemRenderContext = {
    item,
    depth,
    hasChildren,
    expanded: isOpen,
    selected: isSelected,
    focused: isFocused,
    disabled: isDisabled,
    toggle,
    select,
  };
  const itemIcon = resolveTreeSlot(item.icon, context);
  const icon =
    itemIcon !== undefined
      ? itemIcon
      : (renderIcon?.(context) ??
        (hasChildren ? (
          <Folder aria-hidden="true" className="h-4 w-4" />
        ) : (
          <File aria-hidden="true" className="h-4 w-4" />
        )));
  const count = resolveTreeSlot(item.count, context);
  const itemMeta = resolveTreeSlot(item.meta, context);
  const meta = itemMeta !== undefined ? itemMeta : renderMeta?.(context);
  const itemActions = resolveTreeSlot(item.actions, context);
  const actions =
    itemActions !== undefined ? itemActions : renderActions?.(context);
  const registerItem = (node: HTMLDivElement | null) => {
    if (node) {
      itemRefs.current.set(item.id, node);
    } else {
      itemRefs.current.delete(item.id);
    }
  };

  return (
    <>
      <TreeItemRow
        ref={registerItem}
        role="treeitem"
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-selected={isSelected}
        aria-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : isFocused ? 0 : -1}
        actions={actions}
        count={count}
        density={density}
        depth={depth}
        disabled={isDisabled}
        divided={divided}
        expanded={isOpen}
        hasChildren={hasChildren}
        icon={icon}
        indent={indent}
        meta={meta}
        name={item.name}
        selected={isSelected}
        className={item.className}
        onClick={() => onActivate(item)}
        onDisclosureClick={(event) => {
          if (!hasChildren) return;
          event.stopPropagation();
          onToggle(item);
        }}
        onFocus={() => onFocusItem(item.id)}
        onKeyDown={(event) => onKeyDown(item, event)}
      />
      {isOpen && hasChildren && (
        <div role="group">
          {item.children?.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              depth={depth + 1}
              density={density}
              divided={divided}
              expandedSet={expandedSet}
              focusedId={focusedId}
              indent={indent}
              itemRefs={itemRefs}
              selectedId={selectedId}
              onActivate={onActivate}
              onFocusItem={onFocusItem}
              onKeyDown={onKeyDown}
              onSelect={onSelect}
              onToggle={onToggle}
              renderActions={renderActions}
              renderIcon={renderIcon}
              renderMeta={renderMeta}
            />
          ))}
        </div>
      )}
    </>
  );
};

const TreeItemRow = React.forwardRef<HTMLDivElement, TreeItemRowProps>(
  (
    {
      actions,
      actionsVisibility = "auto",
      className,
      count,
      density = "default",
      depth = 0,
      disabled = false,
      divided: dividedProp,
      expanded = false,
      focusVisible = false,
      hasChildren = false,
      icon,
      indent = 20,
      meta,
      name,
      onDisclosureClick,
      selected = false,
      style,
      ...props
    },
    ref,
  ) => {
    const stopActionPropagation = (event: React.SyntheticEvent) => {
      event.stopPropagation();
    };
    const treeDivided = React.useContext(TreeDividedContext);
    const divided = dividedProp ?? treeDivided;

    const row = (
      <div
        ref={ref}
        data-depth={depth}
        data-expanded={hasChildren ? expanded : undefined}
        data-selected={selected || undefined}
        data-focus-visible={focusVisible || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          "group/treeitem flex w-full cursor-pointer items-center gap-2 rounded-control px-2 text-start outline-none transition-colors",
          density === "compact" ? "min-h-8 py-1" : "min-h-10 py-1.5",
          "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Divided, the ring is drawn inside the row: outside it, the next
          // row's surface covered it, and a panel's edge could cut it.
          divided && "focus-visible:ring-inset focus-visible:ring-offset-0",
          selected && "bg-muted text-foreground",
          focusVisible &&
            (divided
              ? "ring-2 ring-inset ring-ring"
              : "ring-2 ring-ring ring-offset-2 ring-offset-background"),
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        style={{ paddingInlineStart: depth * indent + 8, ...style }}
        {...props}
      >
        <span
          aria-hidden="true"
          className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground"
          onClick={onDisclosureClick}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            ) : (
              <ChevronRight
                aria-hidden="true"
                className="kozmos-rtl-mirror h-4 w-4"
              />
            )
          ) : null}
        </span>
        {icon !== null && (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">
            {icon}
          </span>
        )}
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="min-w-0 truncate">{name}</span>
          {count !== undefined && count !== null && (
            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-pill border border-border bg-muted px-1.5 text-xs font-medium leading-none text-foreground">
              {count}
            </span>
          )}
        </span>
        {meta !== undefined && meta !== null && (
          <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>
        )}
        {actions !== undefined && actions !== null && (
          <span
            className={cn(
              "ms-auto flex shrink-0 items-center gap-1 transition-opacity",
              actionsVisibility === "auto" &&
                "opacity-0 group-hover/treeitem:opacity-100 group-focus-within/treeitem:opacity-100 group-data-[focus-visible=true]/treeitem:opacity-100 group-data-[selected=true]/treeitem:opacity-100 motion-reduce:transition-none",
              actionsVisibility === "always" && "opacity-100",
            )}
            onClick={stopActionPropagation}
            onDoubleClick={stopActionPropagation}
            onKeyDown={stopActionPropagation}
            onPointerDown={stopActionPropagation}
          >
            {actions}
          </span>
        )}
      </div>
    );
    // Divided (GAP-201): the stroke under the row and an open parent's
    // surface, on a box that reaches the Tree's bleed past it on each side,
    // to the panel's edges, while the row and its fills stay where they are.
    // The stroke is outside the row's height: a row and its stroke, as the
    // design draws a row and a separator.
    return divided ? (
      <div
        data-tree-divider=""
        className={cn(
          "border-b border-border",
          hasChildren &&
            expanded &&
            "bg-[var(--primitives-colors-background-50)]",
        )}
        style={{
          marginInline: "calc(var(--kozmos-tree-bleed, 0px) * -1)",
          paddingInline: "var(--kozmos-tree-bleed, 0px)",
        }}
      >
        {row}
      </div>
    ) : (
      row
    );
  },
);
TreeItemRow.displayName = "TreeItemRow";

type TreeParentItemRowProps = Omit<TreeItemRowProps, "hasChildren">;

const TreeParentItemRow = React.forwardRef<
  HTMLDivElement,
  TreeParentItemRowProps
>((props, ref) => <TreeItemRow ref={ref} {...props} hasChildren />);
TreeParentItemRow.displayName = "TreeParentItemRow";

type TreeChildItemRowProps = Omit<TreeItemRowProps, "hasChildren" | "expanded">;

const TreeChildItemRow = React.forwardRef<
  HTMLDivElement,
  TreeChildItemRowProps
>((props, ref) => (
  <TreeItemRow ref={ref} {...props} hasChildren={false} expanded={false} />
));
TreeChildItemRow.displayName = "TreeChildItemRow";

const flattenTreeItems = (
  items: TreeItem[],
  expandedSet: Set<string>,
  depth = 0,
  parentId?: string,
): VisibleTreeItem[] =>
  items.flatMap((item) => {
    const current = { item, depth, parentId };
    if (!item.children?.length || !expandedSet.has(item.id)) return [current];
    return [
      current,
      ...flattenTreeItems(item.children, expandedSet, depth + 1, item.id),
    ];
  });

const findFirstEnabledTreeItemId = (items: TreeItem[]): string | undefined => {
  for (const item of items) {
    if (!item.disabled) return item.id;
    const childId = item.children
      ? findFirstEnabledTreeItemId(item.children)
      : undefined;
    if (childId) return childId;
  }
  return undefined;
};

const resolveTreeSlot = (
  slot: TreeItemSlot | undefined,
  context: TreeItemRenderContext,
): React.ReactNode | undefined => {
  if (slot === undefined) return undefined;
  return typeof slot === "function" ? slot(context) : slot;
};

export { Tree, TreeChildItemRow, TreeItemRow, TreeParentItemRow };
export type { TreeChildItemRowProps, TreeParentItemRowProps };
