import figma from "@figma/code-connect";
import {
  AICompanionPanel,
  type AICompanionPanelProps,
} from "./AICompanionPanel";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const closeAssistant: NonNullable<AICompanionPanelProps["onClose"]>;

/**
 * Figma Code Connect: AICompanionPanel (GAP-206)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-18482
 *
 * Title Text is title; Show Close is onClose; Show Banner shows the Banner
 * Slot, banner. Content picks the thread drawn: the AIMessageList and the
 * AIInputBar are instances, which show their own code. open, titleLevel and
 * the focus handlers are behaviour.
 */
figma.connect(
  AICompanionPanel,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-18482",
  {
    props: {
      title: figma.string("Title Text"),
      onClose: figma.boolean("Show Close", {
        true: () => closeAssistant(),
        false: undefined,
      }),
      banner: figma.boolean("Show Banner", {
        true: figma.slot("Banner Slot"),
        false: undefined,
      }),
      children: figma.children(["AIMessageList", "AIInputBar"]),
    },
    example: ({ title, onClose, banner, children }) => (
      <AICompanionPanel title={title} onClose={onClose} banner={banner} open>
        {children}
      </AICompanionPanel>
    ),
  },
);
