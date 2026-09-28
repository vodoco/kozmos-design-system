import { pageTitle } from "../../lib/site";
import { ExamplePage } from "../../site/ExamplePage";
import { getExample } from "../manifest";
import KioskDirectory from "./KioskDirectory";
import styles from "./KioskDirectory.css?raw";
import source from "./KioskDirectory.tsx?raw";
import focusSource from "../focus.ts?raw";

const example = getExample("kiosk-directory");

export function meta() {
  return [
    { title: pageTitle(example.title) },
    { name: "description", content: example.summary },
  ];
}

export default function KioskDirectoryExample() {
  return (
    <ExamplePage
      example={example}
      files={[
        { name: "KioskDirectory.tsx", code: source },
        { name: "KioskDirectory.css", code: styles },
        { name: "focus.ts", code: focusSource },
      ]}
    >
      <KioskDirectory />
    </ExamplePage>
  );
}
