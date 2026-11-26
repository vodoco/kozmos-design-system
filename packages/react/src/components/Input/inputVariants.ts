// Input's recipe and its status, shared by every field drawn on it, in a
// module of their own: a field that shares them (PasswordInput, DatePicker,
// Search and the rest) bundles the classes alone and never Input's action
// (GAP-154). They live in recipes/input.ts, shared with Vue; Input
// re-exports both, so the package exports them as before.

export { inputVariants, type InputStatus } from "../../recipes/input";
