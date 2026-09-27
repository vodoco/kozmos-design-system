import React from "react";
import { File01 as FileIcon, Upload01 as Upload, X } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { Button } from "../Button";
import { FieldWrapper, type FieldStatus } from "../FieldWrapper";

export interface FileUploadProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  accept?: string;
  browseLabel?: string;
  description?: React.ReactNode;
  disabled?: boolean;
  dropLabel?: string;
  emptyDescription?: string;
  error?: boolean | string;
  helperText?: string;
  label?: string;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
  onFileSelect?: (file: File) => void;
  onFilesChange?: (files: File[]) => void;
  removeLabel?: string;
  status?: FieldStatus;
  value?: File[];
  defaultFiles?: File[];
  wrapperClassName?: string;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${
    units[exponent]
  }`;
}

function filesFromList(files: FileList | File[]) {
  return Array.from(files);
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      accept,
      browseLabel = "Click to upload",
      className,
      defaultFiles,
      description,
      disabled,
      dropLabel = "or drag and drop",
      emptyDescription,
      error,
      helperText,
      id,
      label,
      maxFiles,
      maxSize,
      multiple,
      onFileSelect,
      onFilesChange,
      removeLabel = "Remove file",
      status = "default",
      value,
      wrapperClassName,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": callerDescribedBy,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { trackEvent } = useKozmosAnalytics();
    const defaultInputId = React.useId();
    const descriptionId = React.useId();
    const errorId = React.useId();
    const helperId = React.useId();
    const inputId = id || defaultInputId;
    const isControlled = Array.isArray(value);
    const [dragActive, setDragActive] = React.useState(false);
    const [internalError, setInternalError] = React.useState<string | null>(
      null,
    );
    const [uncontrolledFiles, setUncontrolledFiles] = React.useState<File[]>(
      defaultFiles || [],
    );
    const files = value ?? uncontrolledFiles;
    const resolvedError = internalError || error;
    const resolvedStatus: FieldStatus = resolvedError ? "error" : status;
    const resolvedMaxFiles = maxFiles ?? (multiple ? Infinity : 1);
    const describedBy = [
      description ? descriptionId : null,
      resolvedError && typeof resolvedError === "string"
        ? errorId
        : helperText
          ? helperId
          : null,
    ]
      .filter(Boolean)
      .join(" ");
    const canSelectMultiple = multiple || resolvedMaxFiles > 1;

    const updateFiles = React.useCallback(
      (nextFiles: File[]) => {
        if (!isControlled) {
          setUncontrolledFiles(nextFiles);
        }
        onFilesChange?.(nextFiles);
        if (nextFiles[0]) {
          onFileSelect?.(nextFiles[0]);
        }
      },
      [isControlled, onFileSelect, onFilesChange],
    );

    const validateFiles = React.useCallback(
      (nextFiles: File[]) => {
        if (
          Number.isFinite(resolvedMaxFiles) &&
          nextFiles.length > resolvedMaxFiles
        ) {
          return `Select up to ${resolvedMaxFiles} ${
            resolvedMaxFiles === 1 ? "file" : "files"
          }.`;
        }

        if (maxSize) {
          const oversized = nextFiles.find((file) => file.size > maxSize);
          if (oversized) {
            return `${oversized.name} exceeds ${formatBytes(maxSize)}.`;
          }
        }

        return null;
      },
      [maxSize, resolvedMaxFiles],
    );

    const handleFiles = React.useCallback(
      (selected: FileList | File[] | null) => {
        if (!selected || disabled) return;

        const selectedFiles = filesFromList(selected);
        const validationError = validateFiles(selectedFiles);
        setInternalError(validationError);

        if (validationError) return;

        const nextFiles = Number.isFinite(resolvedMaxFiles)
          ? selectedFiles.slice(0, resolvedMaxFiles)
          : selectedFiles;

        updateFiles(nextFiles);
        trackEvent("FileUpload", "files_selected", {
          count: nextFiles.length,
          names: nextFiles.map((file) => file.name),
        });
      },
      [disabled, resolvedMaxFiles, trackEvent, updateFiles, validateFiles],
    );

    const removeFile = (fileToRemove: File) => {
      const nextFiles = files.filter((file) => file !== fileToRemove);
      setInternalError(null);
      updateFiles(nextFiles);
      trackEvent("FileUpload", "file_removed", { name: fileToRemove.name });
      if (inputRef.current) inputRef.current.value = "";
    };

    const openPicker = () => {
      if (!disabled) inputRef.current?.click();
    };

    const handleDrag = (event: React.DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled) return;

      setDragActive(event.type === "dragenter" || event.type === "dragover");
    };

    const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);
      handleFiles(event.dataTransfer.files);
    };

    return (
      <FieldWrapper
        className={wrapperClassName}
        description={description}
        descriptionId={descriptionId}
        error={resolvedError}
        errorId={errorId}
        helperId={helperId}
        helperText={helperText}
        inputId={inputId}
        label={label}
        status={resolvedStatus}
      >
        <div ref={ref} className={cn("w-full", className)} {...props}>
          <input
            ref={inputRef}
            id={`${inputId}-file`}
            type="file"
            hidden
            accept={accept}
            multiple={canSelectMultiple}
            disabled={disabled}
            aria-describedby={describedBy || undefined}
            aria-invalid={resolvedStatus === "error" || undefined}
            onChange={(event) => handleFiles(event.target.files)}
          />
          <button
            type="button"
            id={inputId}
            disabled={disabled}
            aria-label={
              ariaLabel ?? (label ? `${browseLabel}: ${label}` : browseLabel)
            }
            aria-labelledby={ariaLabelledBy}
            aria-describedby={mergeAriaIds(callerDescribedBy, describedBy)}
            aria-invalid={resolvedStatus === "error" || undefined}
            className={cn(
              "flex min-h-36 w-full cursor-pointer flex-col items-center justify-center rounded-container border border-dashed bg-background px-4 py-6 text-center ring-offset-background transition-colors",
              "border-input hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              dragActive && "border-primary bg-primary/5",
              disabled &&
                "cursor-not-allowed bg-muted text-muted-foreground opacity-80 hover:bg-muted",
              resolvedStatus === "error" &&
                "border-destructive focus-visible:ring-destructive",
              resolvedStatus === "warning" &&
                "border-warning focus-visible:ring-warning",
              resolvedStatus === "success" &&
                "border-success focus-visible:ring-success",
            )}
            onClick={openPicker}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload
              aria-hidden="true"
              className="mb-3 h-7 w-7 text-muted-foreground"
            />
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {browseLabel}
              </span>{" "}
              {dropLabel}
            </span>
            {(emptyDescription || accept || maxSize) && (
              <span className="mt-1 text-xs leading-5 text-muted-foreground">
                {emptyDescription ||
                  [accept, maxSize ? `Max ${formatBytes(maxSize)}` : null]
                    .filter(Boolean)
                    .join(" · ")}
              </span>
            )}
          </button>
          {files.length > 0 && (
            <ul
              className="mt-3 grid min-w-0 grid-cols-1 gap-2"
              aria-label="Selected files"
            >
              {files.map((file) => (
                <li
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="flex min-h-11 min-w-0 items-center gap-3 rounded-container border bg-card px-3 py-2"
                >
                  <FileIcon
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`${removeLabel}: ${file.name}`}
                    disabled={disabled}
                    onClick={() => removeFile(file)}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </FieldWrapper>
    );
  },
);
FileUpload.displayName = "FileUpload";

const DropZone = FileUpload;

export { DropZone, FileUpload };
