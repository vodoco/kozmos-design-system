import { pageTitle } from "../../lib/site";
import { ExamplePage } from "../../site/ExamplePage";
import { getExample } from "../manifest";
import Notifications from "./Notifications";
import styles from "./Notifications.css?raw";
import source from "./Notifications.tsx?raw";
import data from "./data.ts?raw";
import focusSource from "../focus.ts?raw";

const example = getExample("notifications");

export function meta() {
  return [
    { title: pageTitle(example.title) },
    { name: "description", content: example.summary },
  ];
}

export default function NotificationsExample() {
  return (
    <ExamplePage
      example={example}
      files={[
        { name: "Notifications.tsx", code: source },
        { name: "data.ts", code: data },
        { name: "Notifications.css", code: styles },
        { name: "focus.ts", code: focusSource },
      ]}
    >
      <Notifications />
    </ExamplePage>
  );
}
