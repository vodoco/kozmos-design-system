import figma from "@figma/code-connect";
import { PersonaMark, PersonaMarkGroup } from "./PersonaMark";

// GAP-106: a new set, so its node id is written once the importer has built
// it in the live file; until then this file stays out of
// figma.linked.config.json.
const personaMarkUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD";

// Form is the mark's form. Single is one persona's diamond; Group is the
// diamonds of the personas a row is visible to. The colour is the persona's,
// product data that Figma holds as the diamond's fill, not as a property.
figma.connect(PersonaMark, personaMarkUrl, {
  variant: { Form: "Single" },
  example: () => <PersonaMark color="#FF9800" />,
});

figma.connect(PersonaMarkGroup, personaMarkUrl, {
  variant: { Form: "Group" },
  example: () => (
    <PersonaMarkGroup
      personas={[
        { name: "Customer", color: "#FF9800" },
        { name: "Visitor", color: "#2196F3" },
        { name: "Staff", color: "#4CAF50" },
      ]}
    />
  ),
});
