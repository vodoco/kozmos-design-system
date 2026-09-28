import { pageTitle } from "../../lib/site";
import { ExamplePage } from "../../site/ExamplePage";
import { getExample } from "../manifest";
import AccountSettings from "./AccountSettings";
import styles from "./AccountSettings.css?raw";
import source from "./AccountSettings.tsx?raw";

const example = getExample("account-settings");

export function meta() {
  return [
    { title: pageTitle(example.title) },
    { name: "description", content: example.summary },
  ];
}

export default function AccountSettingsExample() {
  return (
    <ExamplePage
      example={example}
      files={[
        { name: "AccountSettings.tsx", code: source },
        { name: "AccountSettings.css", code: styles },
      ]}
    >
      <AccountSettings />
    </ExamplePage>
  );
}
