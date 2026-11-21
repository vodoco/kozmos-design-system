import figma from "@figma/code-connect";
import { RouteSetupPanel, type RouteSetupPanelProps } from "./RouteSetupPanel";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const continueRoute: RouteSetupPanelProps["onContinue"];
declare const closeSetup: RouteSetupPanelProps["onClose"];

/**
 * Figma Code Connect: RouteSetupPanel (GAP-206)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17873
 *
 * State is ready and pending: Incomplete is not ready, Ready is ready,
 * Pending is ready while the route is worked out. Presentation is
 * presentation. Title Text is title, Description Text description (Show
 * Description), and the Continue Button's Label Text continueLabel. The two
 * fields are RouteLocationField instances, which show their own code.
 */
figma.connect(
  RouteSetupPanel,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17873",
  {
    props: {
      ready: figma.enum("State", {
        Incomplete: false,
        Ready: true,
        Pending: true,
      }),
      pending: figma.enum("State", { Pending: true }),
      presentation: figma.enum("Presentation", {
        Hosted: undefined,
        Standalone: "standalone",
      }),
      title: figma.string("Title Text"),
      description: figma.boolean("Show Description", {
        true: figma.string("Description Text"),
        false: undefined,
      }),
      continueButton: figma.nestedProps("Continue Button", {
        label: figma.string("Label Text"),
      }),
      fields: figma.children(["Start Field", "Destination Field"]),
    },
    example: ({
      ready,
      pending,
      presentation,
      title,
      description,
      continueButton,
      fields,
    }) => (
      <RouteSetupPanel
        ready={ready}
        pending={pending}
        presentation={presentation}
        title={title}
        description={description}
        continueLabel={continueButton.label}
        onContinue={() => continueRoute()}
        onClose={() => closeSetup()}
      >
        {fields}
      </RouteSetupPanel>
    ),
  },
);
