import { pageTitle } from "../../lib/site";
import { ExamplePage } from "../../site/ExamplePage";
import { getExample } from "../manifest";
import PhoneSearch from "./PhoneSearch";
import styles from "./PhoneSearch.css?raw";
import source from "./PhoneSearch.tsx?raw";
import data from "./data.ts?raw";
import focusSource from "../focus.ts?raw";

const example = getExample("phone-search");

export function meta() {
  return [
    { title: pageTitle(example.title) },
    { name: "description", content: example.summary },
  ];
}

export default function PhoneSearchExample() {
  return (
    <ExamplePage
      example={example}
      files={[
        { name: "PhoneSearch.tsx", code: source },
        { name: "data.ts", code: data },
        { name: "PhoneSearch.css", code: styles },
        { name: "focus.ts", code: focusSource },
      ]}
    >
      <PhoneSearch />
    </ExamplePage>
  );
}
