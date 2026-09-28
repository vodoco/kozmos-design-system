import { Outlet } from "react-router";
import { SiteShell } from "../site/SiteShell";

export default function SiteLayout() {
  return (
    <SiteShell>
      <Outlet />
    </SiteShell>
  );
}
