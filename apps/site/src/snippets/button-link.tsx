import { Link } from "react-router";
import { buttonVariants } from "@kozmos-ds/react";

// Button always renders a <button>. For navigation, style your router's
// link instead; the variant changes how it looks, not what it is.
export function BrowseLocations() {
  return (
    <Link to="/locations" className={buttonVariants({ variant: "outline" })}>
      Browse locations
    </Link>
  );
}
