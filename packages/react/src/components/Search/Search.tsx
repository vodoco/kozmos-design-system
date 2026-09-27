import React from "react";
import { SearchMd as SearchIcon } from "@kozmos-ds/icons";
import { inputVariants } from "../Input/Input";
import { cn } from "../../utils";
import { FieldWrapper } from "../FieldWrapper";

export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean | string;
  wrapperClassName?: string;
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ className, wrapperClassName, error, label, id, ...props }, ref) => {
    const errorId = React.useId();
    const inputId = id || React.useId();
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
          <SearchIcon className="absolute left-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ error: hasError }),
              "pl-9",
              className,
            )}
            type="search"
            aria-invalid={hasError}
            aria-describedby={
              hasError && typeof error === "string" ? errorId : undefined
            }
            {...props}
          />
        </div>
      </FieldWrapper>
    );
  },
);
Search.displayName = "Search";

export { Search };
