import { pageTitle } from "../../lib/site";
import { ExamplePage } from "../../site/ExamplePage";
import { getExample } from "../manifest";
import Wayfinding from "./Wayfinding";
import styles from "./Wayfinding.css?raw";
import source from "./Wayfinding.tsx?raw";
import data from "./data.ts?raw";
import focusSource from "../focus.ts?raw";

const example = getExample("wayfinding");

export function meta() {
  return [
    { title: pageTitle(example.title) },
    { name: "description", content: example.summary },
  ];
}

export default function WayfindingExample() {
  return (
    <ExamplePage
      example={example}
      files={[
        { name: "Wayfinding.tsx", code: source },
        { name: "data.ts", code: data },
        { name: "Wayfinding.css", code: styles },
        { name: "focus.ts", code: focusSource },
      ]}
    >
      <Wayfinding />
    </ExamplePage>
  );
}
