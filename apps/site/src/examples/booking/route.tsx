import { pageTitle } from "../../lib/site";
import { ExamplePage } from "../../site/ExamplePage";
import { getExample } from "../manifest";
import Booking from "./Booking";
import styles from "./Booking.css?raw";
import source from "./Booking.tsx?raw";
import focusSource from "../focus.ts?raw";

const example = getExample("booking");

export function meta() {
  return [
    { title: pageTitle(example.title) },
    { name: "description", content: example.summary },
  ];
}

export default function BookingExample() {
  return (
    <ExamplePage
      example={example}
      files={[
        { name: "Booking.tsx", code: source },
        { name: "Booking.css", code: styles },
        { name: "focus.ts", code: focusSource },
      ]}
    >
      <Booking />
    </ExamplePage>
  );
}
