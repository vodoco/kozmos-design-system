import { pageTitle } from "../../lib/site";
import { ExamplePage } from "../../site/ExamplePage";
import { getExample } from "../manifest";
import Onboarding from "./Onboarding";
import styles from "./Onboarding.css?raw";
import source from "./Onboarding.tsx?raw";
import focusSource from "../focus.ts?raw";

const example = getExample("onboarding");

export function meta() {
  return [
    { title: pageTitle(example.title) },
    { name: "description", content: example.summary },
  ];
}

export default function OnboardingExample() {
  return (
    <ExamplePage
      example={example}
      files={[
        { name: "Onboarding.tsx", code: source },
        { name: "Onboarding.css", code: styles },
        { name: "focus.ts", code: focusSource },
      ]}
    >
      <Onboarding />
    </ExamplePage>
  );
}
