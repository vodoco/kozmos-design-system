import { createRoot } from "react-dom/client";
import { MapBrowseFlow } from "../../../../apps/docs/stories/examples/MapBrowseFlow";
const root = createRoot(document.getElementById("root")!);
declare global {
  interface Window {
    renderBrowse: (width: number, dir?: "ltr" | "rtl") => void;
  }
}
window.renderBrowse = (width, dir = "ltr") =>
  root.render(<MapBrowseFlow key={width + dir} width={width} dir={dir} />);
