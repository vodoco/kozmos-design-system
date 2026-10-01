import { createRoot } from "react-dom/client";
import { MapBrowseFlow } from "../../../../apps/docs/stories/examples/MapBrowseFlow";
const root = createRoot(document.getElementById("root")!);
declare global {
  interface Window {
    renderInfo: (width: number, dir: "ltr" | "rtl") => void;
  }
}
window.renderInfo = (width, dir) =>
  root.render(
    <MapBrowseFlow
      key={`${width}-${dir}`}
      width={width}
      height={720}
      dir={dir}
    />,
  );
