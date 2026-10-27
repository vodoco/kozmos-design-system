import figma from "@figma/code-connect";
import { Backdrop } from "./Backdrop";

const backdropUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=613-4791";

/**
 * Figma Code Connect: Backdrop
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=613-4791
 */
figma.connect(Backdrop, backdropUrl, {
  variant: { Target: "None" },
  props: {
    visible: figma.enum("Visibility", {
      Visible: true,
      Hidden: false,
    }),
  },
  example: ({ visible }) => <Backdrop visible={visible} />,
});

// GAP-189: Cut-out lights the control a tour's step points at. The variant
// draws an example control's place; in code, `target` is that control's ref,
// element, rect or list.
figma.connect(Backdrop, backdropUrl, {
  variant: { Visibility: "Visible", Target: "Cut-out" },
  example: () => <Backdrop target={controlRef} />,
});

declare const controlRef: { current: HTMLElement | null };
