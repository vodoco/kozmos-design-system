import { cva } from "class-variance-authority";

// Input's recipe and its status, shared by every field drawn on it, in a
// module of their own: a field that shares them (PasswordInput, DatePicker,
// Search and the rest) bundles the classes alone and never Input's action
// (GAP-154). Input re-exports both, so the package exports them as before.

export type InputStatus = "default" | "error" | "warning" | "success";

export const inputVariants = cva("kozmos-reset kozmos-input", {
  variants: {
    status: {
      default: "",
      error: "kozmos-input-error",
      warning: "kozmos-input-warning",
      success: "kozmos-input-success",
    },
    error: {
      true: "kozmos-input-error",
    },
  },
});
