import { pageTitle } from "../../lib/site";
import { ExamplePage } from "../../site/ExamplePage";
import { getExample } from "../manifest";
import VenueExplorer from "./VenueExplorer";
import styles from "./VenueExplorer.css?raw";
import source from "./VenueExplorer.tsx?raw";
import data from "./data.ts?raw";
import focusSource from "../focus.ts?raw";

const example = getExample("venue-explorer");

export function meta() {
  return [
    { title: pageTitle(example.title) },
    { name: "description", content: example.summary },
  ];
}

export default function VenueExplorerExample() {
  return (
    <ExamplePage
      example={example}
      files={[
        { name: "VenueExplorer.tsx", code: source },
        { name: "data.ts", code: data },
        { name: "VenueExplorer.css", code: styles },
        { name: "focus.ts", code: focusSource },
      ]}
    >
      <VenueExplorer />
    </ExamplePage>
  );
}
