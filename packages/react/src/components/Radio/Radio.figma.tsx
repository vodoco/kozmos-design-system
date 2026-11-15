import figma from "@figma/code-connect";
import { Map01 } from "@kozmos-ds/icons";
import { Icon } from "../Icon";
import { RadioGroup, RadioGroupItem } from "./Radio";

/**
 * Figma Code Connect: Radio
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1436
 *
 * One set, three presentations (GAP-158): Variant=Default is the ring and its
 * label, Card and Tile the boxes. Each maps its own example.
 */
const RADIO_URL =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1436";

const shared = {
  defaultValue: figma.enum("Checked", {
    Unchecked: "",
    Checked: "option",
  }),
  disabled: figma.enum("State", {
    Default: false,
    Disabled: true,
    Error: false,
  }),
  error: figma.enum("State", {
    Default: false,
    Disabled: false,
    Error: true,
  }),
  label: figma.string("Label Text"),
  // GAP-162: the line under the label or the title, read as its description.
  description: figma.boolean("Show Description", {
    true: figma.string("Description Text"),
    false: undefined,
  }),
};

figma.connect(RadioGroupItem, RADIO_URL, {
  variant: { Variant: "Default" },
  props: shared,
  example: ({ defaultValue, disabled, error, label, description }) => (
    <RadioGroup defaultValue={defaultValue}>
      <RadioGroupItem
        value="option"
        disabled={disabled}
        error={error}
        label={label}
        description={description}
      />
    </RadioGroup>
  ),
});

figma.connect(RadioGroupItem, RADIO_URL, {
  variant: { Variant: "Card" },
  props: {
    ...shared,
    // GAP-158: the card's image, shown or not.
    media: figma.boolean("Show Media", {
      true: <img src="/map-style.png" alt="" />,
      false: undefined,
    }),
  },
  example: ({ defaultValue, disabled, error, label, description, media }) => (
    <RadioGroup defaultValue={defaultValue}>
      <RadioGroupItem
        value="option"
        variant="card"
        disabled={disabled}
        error={error}
        label={label}
        description={description}
        media={media}
      />
    </RadioGroup>
  ),
});

figma.connect(RadioGroupItem, RADIO_URL, {
  variant: { Variant: "Tile" },
  props: {
    ...shared,
    // GAP-158: the tile's icon, shown or not.
    media: figma.boolean("Show Media", {
      true: <Icon icon={Map01} size="lg" />,
      false: undefined,
    }),
  },
  example: ({ defaultValue, disabled, error, label, description, media }) => (
    <RadioGroup defaultValue={defaultValue}>
      <RadioGroupItem
        value="option"
        variant="tile"
        disabled={disabled}
        error={error}
        label={label}
        description={description}
        media={media}
      />
    </RadioGroup>
  ),
});
