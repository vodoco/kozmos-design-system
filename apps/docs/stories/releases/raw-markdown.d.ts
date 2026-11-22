// Vite serves a file's text for an import ending in `?raw`.
declare module "*.md?raw" {
  const text: string;
  export default text;
}
