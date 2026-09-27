import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Box,
  Text,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const questions = [
  {
    id: "hours",
    question: "When is the centre open?",
    answer:
      "Every day from 09:00. Shops close at 20:00 on weekdays and 17:00 on Sundays.",
  },
  {
    id: "parking",
    question: "Where can I park?",
    answer:
      "The car park is under the building, with lifts to every floor. The first two hours are free.",
  },
  {
    id: "access",
    question: "Is it step-free?",
    answer:
      "Yes. Every floor is reached by lift, and the routes the app offers can avoid stairs and escalators.",
  },
];

// A second set for the second demo: each open panel is a region named by its
// question, and two regions on one page must not share a name.
const services = [
  {
    id: "wifi",
    question: "Is there wifi?",
    answer: "Free on every floor; the network is Riverside Guest, no password.",
  },
  {
    id: "lost",
    question: "Where is lost property?",
    answer:
      "At the information desk on the ground floor, open until the shops close.",
  },
  {
    id: "children",
    question: "Are there baby-changing rooms?",
    answer: "On every floor, beside the lifts.",
  },
];

function SingleOpen() {
  return (
    <Box className="site-demo-column">
      <Accordion type="single" collapsible defaultValue="hours">
        {questions.map((entry) => (
          <AccordionItem key={entry.id} value={entry.id}>
            <AccordionTrigger>{entry.question}</AccordionTrigger>
            <AccordionContent>
              <Text size="sm">{entry.answer}</Text>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  );
}

function SeveralOpen() {
  return (
    <Box className="site-demo-column">
      <Accordion type="multiple" defaultValue={["wifi", "children"]}>
        {services.map((entry) => (
          <AccordionItem key={entry.id} value={entry.id}>
            <AccordionTrigger>{entry.question}</AccordionTrigger>
            <AccordionContent>
              <Text size="sm">{entry.answer}</Text>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "One open at a time",
    description:
      'type="single" with collapsible: opening one closes the other, and the open one can be closed.',
    Component: SingleOpen,
  },
  {
    title: "Several open",
    description: 'type="multiple" keeps each item independent.',
    Component: SeveralOpen,
  },
];
