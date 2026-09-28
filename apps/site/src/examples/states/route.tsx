import { pageTitle } from "../../lib/site";
import { ExamplePage } from "../../site/ExamplePage";
import { getExample } from "../manifest";
import States from "./States";
import styles from "./States.css?raw";
import source from "./States.tsx?raw";
import focusSource from "../focus.ts?raw";

const example = getExample("states");

export function meta() {
  return [
    { title: pageTitle(example.title) },
    { name: "description", content: example.summary },
  ];
}

export default function StatesExample() {
  return (
    <ExamplePage
      example={example}
      files={[
        { name: "States.tsx", code: source },
        { name: "States.css", code: styles },
        { name: "focus.ts", code: focusSource },
      ]}
    >
      <States />
    </ExamplePage>
  );
}
