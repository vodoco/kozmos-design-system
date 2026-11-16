import React from "react";
import { File01 as FileIcon, Upload01 as Upload, X } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { Button } from "../Button";
import { FieldWrapper, type FieldStatus } from "../FieldWrapper";
import { WithoutGenericClick } from "../../utils/generic-click";

export interface FileUploadProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  accept?: string;
  browseLabel?: string;
  /**
   * The Change button's words in `preview="image"`, "Change" by default; its
   * spoken name adds the file's name, as the remove button's does.
   */
  changeLabel?: string;
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
  /**
   * `"image"`: one image, shown once chosen as an avatar-sized thumbnail with
   * Change and Remove in place of the drop area (GAP-270). It holds one file,
   * takes `image/*` unless `accept` says otherwise, and turns away a file
   * that is not an image, as it turns away one over `maxSize`.
   */
  preview?: "image";
  /** The thumbnail's alt text in `preview="image"`; the file's name by default. */
  previewAlt?: string;
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

/**
 * An object URL for `file` while it is shown, revoked when the file changes
 * or the part goes. Made in an effect, so a server render makes none.
 */
function useObjectUrl(file: File | undefined) {
  const [url, setUrl] = React.useState<string>();
  React.useEffect(() => {
    if (!file || typeof URL.createObjectURL !== "function") {
      setUrl(undefined);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      accept,
      browseLabel = "Click to upload",
      changeLabel = "Change",
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
      preview,
      previewAlt,
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
    const dropzoneRef = React.useRef<HTMLButtonElement>(null);
    const changeRef = React.useRef<HTMLButtonElement>(null);
    // Where focus goes once a pick or a removal has redrawn the part: the
    // control it was on is gone (the drop area gives way to the preview,
    // and the preview to the drop area).
    const pendingFocus = React.useRef<"change" | "dropzone" | null>(null);
    const isImagePreview = preview === "image";
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
    const previewFile = isImagePreview ? files[0] : undefined;
    const previewUrl = useObjectUrl(previewFile);
    const resolvedError = internalError || error;
    const resolvedStatus: FieldStatus = resolvedError ? "error" : status;
    const resolvedMaxFiles = isImagePreview
      ? 1
      : (maxFiles ?? (multiple ? Infinity : 1));
    const resolvedAccept = accept ?? (isImagePreview ? "image/*" : undefined);
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
    const canSelectMultiple =
      !isImagePreview && (multiple || resolvedMaxFiles > 1);

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

        if (isImagePreview) {
          // A drop skips the picker's `accept`, so the preview checks what
          // it was given: it can show only an image.
          const notImage = nextFiles.find(
            (file) => !file.type.startsWith("image/"),
          );
          if (notImage) {
            return `${notImage.name} is not an image.`;
          }
        }

        if (maxSize) {
          const oversized = nextFiles.find((file) => file.size > maxSize);
          if (oversized) {
            return `${oversized.name} exceeds ${formatBytes(maxSize)}.`;
          }
        }

        return null;
      },
      [isImagePreview, maxSize, resolvedMaxFiles],
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

        if (isImagePreview && nextFiles.length > 0) {
          pendingFocus.current = "change";
        }
        updateFiles(nextFiles);
        trackEvent("FileUpload", "files_selected", {
          count: nextFiles.length,
          names: nextFiles.map((file) => file.name),
        });
      },
      [
        disabled,
        isImagePreview,
        resolvedMaxFiles,
        trackEvent,
        updateFiles,
        validateFiles,
      ],
    );

    // The picker keeps no selection of its own: once FileUpload has copied
    // the chosen files out, the input is emptied, so choosing the same file
    // again fires `change` again (a browser fires none for an unchanged
    // selection). A drop never fills the input, so it has nothing to empty.
    // The input has no `name` and submits nothing with a form: the files
    // live in FileUpload's state and reach the host by its callbacks.
    const clearInput = () => {
      if (inputRef.current) inputRef.current.value = "";
    };

    const removeFile = (fileToRemove: File) => {
      const nextFiles = files.filter((file) => file !== fileToRemove);
      setInternalError(null);
      if (isImagePreview) pendingFocus.current = "dropzone";
      updateFiles(nextFiles);
      trackEvent("FileUpload", "file_removed", { name: fileToRemove.name });
      clearInput();
    };

    const openPicker = () => {
      if (!disabled) inputRef.current?.click();
    };

    // Runs after every render, so a flag a pick left (one a controlled
    // `value` never took up) lasts one render only. Focus is moved only when
    // it was lost with the control it was on, never taken from elsewhere.
    React.useEffect(() => {
      const target = pendingFocus.current;
      pendingFocus.current = null;
      if (!target || typeof document === "undefined") return;
      const active = document.activeElement;
      if (active && active !== document.body) return;
      (target === "change" ? changeRef : dropzoneRef).current?.focus();
    });

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
            accept={resolvedAccept}
            multiple={canSelectMultiple}
            disabled={disabled}
            aria-describedby={describedBy || undefined}
            aria-invalid={resolvedStatus === "error" || undefined}
            onChange={(event) => {
              handleFiles(event.target.files);
              clearInput();
            }}
          />
          {previewFile ? (
            <div
              className={cn(
                "flex min-h-11 min-w-0 items-center gap-3 rounded-container border bg-card px-3 py-2",
                resolvedStatus === "error" && "border-destructive",
                resolvedStatus === "warning" && "border-warning",
                resolvedStatus === "success" && "border-success",
              )}
              data-kozmos-file-preview="image"
            >
              <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-pill bg-muted">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt={previewAlt ?? previewFile.name}
                    className="aspect-square h-full w-full object-cover"
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {previewFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(previewFile.size)}
                </p>
              </div>
              <WithoutGenericClick>
                <Button
                  ref={changeRef}
                  type="button"
                  variant="outline"
                  size="sm"
                  id={inputId}
                  aria-label={`${changeLabel}: ${previewFile.name}`}
                  aria-describedby={mergeAriaIds(
                    callerDescribedBy,
                    describedBy,
                  )}
                  aria-invalid={resolvedStatus === "error" || undefined}
                  disabled={disabled}
                  onClick={openPicker}
                >
                  {changeLabel}
                </Button>
              </WithoutGenericClick>
              <WithoutGenericClick>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`${removeLabel}: ${previewFile.name}`}
                  disabled={disabled}
                  onClick={() => removeFile(previewFile)}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </WithoutGenericClick>
            </div>
          ) : (
            <button
              ref={dropzoneRef}
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
                "border-input hover:bg-hover-fill/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
          )}
          {!isImagePreview && files.length > 0 && (
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
                  <WithoutGenericClick>
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
                  </WithoutGenericClick>
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
