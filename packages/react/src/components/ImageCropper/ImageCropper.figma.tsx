import figma from "@figma/code-connect";
import { ImageCropper } from "./ImageCropper";

// GAP-273: the ImageCropper set, built by the importer in the live file.
figma.connect(
  ImageCropper,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2516-15104",
  {
    props: {
      aspectRatio: figma.enum("Ratio", {
        Square: 1,
        // 16 / 9, written out: Code Connect keeps a literal, not an expression.
        Landscape: 1.7777777777777777,
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
