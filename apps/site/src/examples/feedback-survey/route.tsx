import { pageTitle } from "../../lib/site";
import { ExamplePage } from "../../site/ExamplePage";
import { getExample } from "../manifest";
import FeedbackSurvey from "./FeedbackSurvey";
import styles from "./FeedbackSurvey.css?raw";
import source from "./FeedbackSurvey.tsx?raw";
import focusSource from "../focus.ts?raw";

const example = getExample("feedback-survey");

export function meta() {
  return [
    { title: pageTitle(example.title) },
    { name: "description", content: example.summary },
  ];
}

export default function FeedbackSurveyExample() {
  return (
    <ExamplePage
      example={example}
      files={[
        { name: "FeedbackSurvey.tsx", code: source },
        { name: "FeedbackSurvey.css", code: styles },
        { name: "focus.ts", code: focusSource },
      ]}
    >
      <FeedbackSurvey />
    </ExamplePage>
  );
}
