import { pageTitle } from "../../lib/site";
import { ExamplePage } from "../../site/ExamplePage";
import { getExample } from "../manifest";
import SignIn from "./SignIn";
import styles from "./SignIn.css?raw";
import source from "./SignIn.tsx?raw";
import focusSource from "../focus.ts?raw";

const example = getExample("sign-in");

export function meta() {
  return [
    { title: pageTitle(example.title) },
    { name: "description", content: example.summary },
  ];
}

export default function SignInExample() {
  return (
    <ExamplePage
      example={example}
      files={[
        { name: "SignIn.tsx", code: source },
        { name: "SignIn.css", code: styles },
        { name: "focus.ts", code: focusSource },
      ]}
    >
      <SignIn />
    </ExamplePage>
  );
}
