import figma from "@figma/code-connect";
import { BrandLoader } from "./BrandLoader";

/**
 * Figma Code Connect: BrandLoader, a Dashboard module (decision 183).
 * The set is not in the live file yet: its node id is a placeholder.
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD
 */
figma.connect(
  BrandLoader,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD",
  {
    props: {
      overlay: figma.enum("Overlay", {
        False: false,
        True: true,
      }),
    },
    example: (props) => <BrandLoader label="Loading Pointr Cloud" {...props} />,
  },
);
