import figma from "@figma/code-connect";
import { TourStep } from "./TourStep";

const tourStepUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2307-10045";

// The position isn't mapped: the variant draws it, and in code it comes from
// `step` and `stepCount`. The parser takes each `props` written out in full.

/**
 * Figma Code Connect: TourStep
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2307-10045
 */
figma.connect(TourStep, tourStepUrl, {
  variant: { Content: "First step" },
  props: {
    tourLabel: figma.string("Tour Text"),
    title: figma.string("Title Text"),
    body: figma.string("Body Text"),
    instruction: figma.boolean("Instruction", {
      true: figma.string("Instruction Text"),
      false: undefined,
    }),
  },
  example: ({ tourLabel, title, body, instruction }) => (
    <TourStep
      target={controlRef}
      tourLabel={tourLabel}
      step={1}
      stepCount={4}
      title={title}
      body={body}
      instruction={instruction}
      onNext={next}
      onClose={close}
    />
  ),
});

figma.connect(TourStep, tourStepUrl, {
  variant: { Content: "Step" },
  props: {
    tourLabel: figma.string("Tour Text"),
    title: figma.string("Title Text"),
    body: figma.string("Body Text"),
    instruction: figma.boolean("Instruction", {
      true: figma.string("Instruction Text"),
      false: undefined,
    }),
  },
  example: ({ tourLabel, title, body, instruction }) => (
    <TourStep
      target={controlRef}
      tourLabel={tourLabel}
      step={2}
      stepCount={4}
      title={title}
      body={body}
      instruction={instruction}
      onBack={back}
      onNext={next}
      onClose={close}
    />
  ),
});

// MAP-64 D11: on a step its own action completes, Next is drawn disabled.
figma.connect(TourStep, tourStepUrl, {
  variant: { Content: "Last step" },
  props: {
    tourLabel: figma.string("Tour Text"),
    title: figma.string("Title Text"),
    body: figma.string("Body Text"),
    instruction: figma.boolean("Instruction", {
      true: figma.string("Instruction Text"),
      false: undefined,
    }),
  },
  example: ({ tourLabel, title, body, instruction }) => (
    <TourStep
      target={controlRef}
      tourLabel={tourLabel}
      step={4}
      stepCount={4}
      title={title}
      body={body}
      instruction={instruction}
      onBack={back}
      onNext={next}
      nextDisabled
      nextLabel="Done"
      onClose={close}
    />
  ),
});

figma.connect(TourStep, tourStepUrl, {
  variant: { Content: "Warning" },
  props: {
    tourLabel: figma.string("Tour Text"),
    title: figma.string("Title Text"),
    body: figma.string("Body Text"),
    instruction: figma.boolean("Instruction", {
      true: figma.string("Instruction Text"),
      false: undefined,
    }),
  },
  example: ({ tourLabel, title, body, instruction }) => (
    <TourStep
      target={controlRef}
      tourLabel={tourLabel}
      step={2}
      stepCount={4}
      title={title}
      body={body}
      instruction={instruction}
      instructionTone="warning"
      onBack={back}
      onSecondary={finish}
      secondaryLabel="Finish without adding"
      onClose={close}
    />
  ),
});

// A single hint beside a control (GAP-157): no `stepCount`, so no position and
// no progress, and closed by its button or Escape.
figma.connect(TourStep, tourStepUrl, {
  variant: { Content: "Coachmark" },
  props: {
    title: figma.string("Title Text"),
    body: figma.string("Body Text"),
  },
  example: ({ title, body }) => (
    <TourStep target={controlRef} title={title} body={body} onClose={close} />
  ),
});

// With no `onClose` there is no Close, and Escape leaves it open.
figma.connect(TourStep, tourStepUrl, {
  variant: { Content: "Welcome" },
  props: {
    tourLabel: figma.string("Tour Text"),
    title: figma.string("Title Text"),
    body: figma.string("Body Text"),
  },
  example: ({ tourLabel, title, body }) => (
    <TourStep
      target={controlRef}
      tourLabel={tourLabel}
      title={title}
      body={body}
      onDismiss={dismiss}
      onSecondary={later}
      onNext={next}
      nextLabel="Show me the tours"
    />
  ),
});

declare const controlRef: { current: HTMLElement | null };
declare const next: () => void;
declare const back: () => void;
declare const close: () => void;
declare const finish: () => void;
declare const later: () => void;
declare const dismiss: () => void;
