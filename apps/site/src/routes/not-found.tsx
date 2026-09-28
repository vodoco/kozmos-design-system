import { StatusPage } from "../site/StatusPage";
import { pageTitle, SITE_INDEXABLE } from "../lib/site";

export function meta() {
  return [
    { title: pageTitle("Page not found") },
    // Until launch every page is noindex already (root.tsx).
    ...(SITE_INDEXABLE ? [{ name: "robots", content: "noindex" }] : []),
  ];
}

export default function NotFound() {
  return (
    <StatusPage
      title="Page not found"
      description="There is no page at this address."
    />
  );
}
