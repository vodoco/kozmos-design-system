import React from "react";
import { SearchMd as SearchIcon } from "@kozmos-ds/icons";
import { inputVariants } from "../Input/Input";
import { cn, mergeAriaIds } from "../../utils";
import { FieldWrapper } from "../FieldWrapper";

export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean | string;
  wrapperClassName?: string;
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  (
    {
      className,
      wrapperClassName,
      error,
      label,
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const errorId = React.useId();
    // Called on every render: `id || React.useId()` skipped the hook when a
    // caller passed an id, and a caller's id coming or going broke the hook
    // order.
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const hasError = !!error;

    return (
      <FieldWrapper
        error={error}
        errorId={errorId}
        label={label}
        inputId={inputId}
        className={wrapperClassName}
      >
        <div className="relative flex items-center">
          {/* The icon is at the inline start, left or right as the field
              reads, and the text clears it there (owned CSS on
              kozmos-search-input): a physical left-3 / pl-9 kept both on the
              left in a right-to-left field. */}
          <SearchIcon className="absolute start-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ error: hasError }),
              "kozmos-search-input",
              className,
            )}
            type="search"
            {...props}
            // The caller's description is joined with the error's, and a
            // caller cannot clear an error the field is showing.
            aria-invalid={hasError || ariaInvalid}
            aria-describedby={mergeAriaIds(
              ariaDescribedBy,
              hasError && typeof error === "string" ? errorId : undefined,
            )}
          />
        </div>
      </FieldWrapper>
    );
  },
);
Search.displayName = "Search";

export { Search };
