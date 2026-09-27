import { useId } from "react";
import {
  Box,
  Button,
  FieldWrapper,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function AroundASelect() {
  const id = useId();
  return (
    <Box className="site-demo-column">
      <FieldWrapper
        label="Language"
        inputId={id}
        helperText="SelectTrigger takes no label of its own (GAP-13); the wrapper supplies it."
      >
        <Select defaultValue="en">
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="tr">Türkçe</SelectItem>
            <SelectItem value="ar">العربية</SelectItem>
          </SelectContent>
        </Select>
      </FieldWrapper>
    </Box>
  );
}

function States() {
  const a = useId();
  const b = useId();
  const c = useId();
  return (
    <Box className="site-demo-column">
      <FieldWrapper
        label="Required"
        inputId={a}
        required
        status="success"
        helperText="Looks good."
      >
        <Select defaultValue="one">
          <SelectTrigger id={a}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one">One</SelectItem>
          </SelectContent>
        </Select>
      </FieldWrapper>
      <FieldWrapper
        label="Optional"
        inputId={b}
        optionalText="optional"
        labelAction={
          <Button size="sm" variant="link">
            Why?
          </Button>
        }
      >
        <Select>
          <SelectTrigger id={b}>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one">One</SelectItem>
          </SelectContent>
        </Select>
      </FieldWrapper>
      <FieldWrapper label="Broken" inputId={c} error="Choose a value.">
        <Select>
          <SelectTrigger id={c} error>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one">One</SelectItem>
          </SelectContent>
        </Select>
      </FieldWrapper>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Around a select",
    description:
      "Label, helper text and error for any control that does not draw its own.",
    Component: AroundASelect,
  },
  {
    title: "Required, optional, error",
    description:
      "required marks the label; optionalText says so instead; labelAction sits at the label’s end.",
    Component: States,
  },
];
