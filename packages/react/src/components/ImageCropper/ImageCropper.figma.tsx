import figma from "@figma/code-connect";
import { ImageCropper } from "./ImageCropper";

// GAP-273: the ImageCropper set. Its node id is a placeholder until the set
// is built in the live file, so this file stays out of figma.linked.config.json.
figma.connect(
  ImageCropper,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD",
  {
    props: {
      aspectRatio: figma.enum("Ratio", {
        Square: 1,
        Landscape: 16 / 9,
      }),
      showZoomControls: figma.boolean("Zoom Controls"),
    },
    example: ({ aspectRatio, showZoomControls }) => (
      <ImageCropper
        src="/logo.png"
        alt="Client logo"
        aspectRatio={aspectRatio}
        showZoomControls={showZoomControls}
        onCrop={(crop) => console.log(crop)}
      />
    ),
  },
);
