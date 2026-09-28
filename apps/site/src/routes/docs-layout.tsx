import { Outlet, useLocation } from "react-router";
import { foundationsSection } from "../foundations/nav";
import { componentsSection } from "../reference/nav";
import { DocsShell } from "../site/DocsShell";

/** The reference frame; which section's sidebar it shows follows the URL. */
export default function DocsLayout() {
  const { pathname } = useLocation();
  const section = pathname.startsWith("/components")
    ? componentsSection
    : foundationsSection;
  return (
    <DocsShell section={section}>
      <Outlet />
    </DocsShell>
  );
}
