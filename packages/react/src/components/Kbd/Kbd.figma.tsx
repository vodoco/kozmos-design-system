import figma from "@figma/code-connect";
import { Kbd } from "./Kbd";

const kbdUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2407-11942";

// GAP-156: Keys is the form. Single is one cap, its key the children;
// Combination is caps joined by a "+", Modifier Text the first of `keys` and
// Key Text the last.
figma.connect(Kbd, kbdUrl, {
  variant: { Keys: "Single" },
  props: {
    keyText: figma.string("Key Text"),
  },
  example: ({ keyText }) => <Kbd>{keyText}</Kbd>,
});

figma.connect(Kbd, kbdUrl, {
  variant: { Keys: "Combination" },
  props: {
    keyText: figma.string("Key Text"),
    modifierText: figma.string("Modifier Text"),
  },
  // Read through `props.`: the parser fills a destructured name only in JSX
  // and in object values, so `[modifierText, keyText]` reached Dev Mode as
  // those words.
  example: (props) => <Kbd keys={[props.modifierText, props.keyText]} />,
});
