import figma from "@figma/code-connect";
import { ArrivalPanel, type ArrivalPanelProps } from "./ArrivalPanel";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const destinationPhoto: ArrivalPanelProps["destinationImage"];
declare const finishRoute: ArrivalPanelProps["onDone"];

/**
 * Figma Code Connect: ArrivalPanel (GAP-206)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17956
 *
 * State is pending; Presentation is presentation. Title, Destination,
 * Location and Message Text are title, destination, locationText and
 * message, each optional one shown by its Show property. Show Metrics shows
 * the journey as travelled: Duration and Distance Text with their labels.
 * Show Image is the destination's picture, the product's. The Done Button's
 * Label Text is doneLabel.
 */
figma.connect(
  ArrivalPanel,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17956",
  {
    props: {
      pending: figma.enum("State", { Default: undefined, Pending: true }),
      presentation: figma.enum("Presentation", {
        Hosted: undefined,
        Standalone: "standalone",
      }),
      title: figma.string("Title Text"),
      destination: figma.string("Destination Text"),
      destinationImage: figma.boolean("Show Image", {
        true: destinationPhoto,
        false: undefined,
      }),
      locationText: figma.boolean("Show Location", {
        true: figma.string("Location Text"),
        false: undefined,
      }),
      message: figma.boolean("Show Message", {
        true: figma.string("Message Text"),
        false: undefined,
      }),
      actualDurationText: figma.boolean("Show Metrics", {
        true: figma.string("Duration Text"),
        false: undefined,
      }),
      actualDistanceText: figma.boolean("Show Metrics", {
        true: figma.string("Distance Text"),
        false: undefined,
      }),
      durationLabel: figma.string("Duration Label Text"),
      distanceLabel: figma.string("Distance Label Text"),
      doneButton: figma.nestedProps("Done Button", {
        label: figma.string("Label Text"),
      }),
    },
    example: ({
      pending,
      presentation,
      title,
      destination,
      destinationImage,
      locationText,
      message,
      actualDurationText,
      actualDistanceText,
      durationLabel,
      distanceLabel,
      doneButton,
    }) => (
      <ArrivalPanel
        pending={pending}
        presentation={presentation}
        title={title}
        destination={destination}
        destinationImage={destinationImage}
        locationText={locationText}
        message={message}
        actualDurationText={actualDurationText}
        actualDistanceText={actualDistanceText}
        durationLabel={durationLabel}
        distanceLabel={distanceLabel}
        doneLabel={doneButton.label}
        onDone={() => finishRoute()}
      />
    ),
  },
);
