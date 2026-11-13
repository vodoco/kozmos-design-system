import figma from "@figma/code-connect";
import { PropertyField } from "./PropertyField";

const propertyFieldUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD";

/**
 * Figma Code Connect: PropertyField, a Dashboard module (decision 183).
 * The set is not in the live file yet: its node id is a placeholder.
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD
 */
figma.connect(PropertyField, propertyFieldUrl, {
  variant: { Removable: "True" },
  props: { name: figma.string("Name") },
  example: ({ name }) => (
    <PropertyField
      name={name}
      info="What the property is."
      onRemove={onRemove}
    />
  ),
});

figma.connect(PropertyField, propertyFieldUrl, {
  variant: { Removable: "False" },
  props: { name: figma.string("Name") },
  example: ({ name }) => (
    <PropertyField name={name} info="What the property is." />
  ),
});

declare const onRemove: () => void;
