import { pageTitle } from "../../lib/site";
import { ExamplePage } from "../../site/ExamplePage";
import { getExample } from "../manifest";
import Dashboard from "./Dashboard";
import styles from "./Dashboard.css?raw";
import source from "./Dashboard.tsx?raw";
import data from "./data.ts?raw";
import focusSource from "../focus.ts?raw";

const example = getExample("dashboard");

export function meta() {
  return [
    { title: pageTitle(example.title) },
    { name: "description", content: example.summary },
  ];
}

export default function DashboardExample() {
  return (
    <ExamplePage
      example={example}
      files={[
        { name: "Dashboard.tsx", code: source },
        { name: "data.ts", code: data },
        { name: "Dashboard.css", code: styles },
        { name: "focus.ts", code: focusSource },
      ]}
    >
      <Dashboard />
    </ExamplePage>
  );
}
