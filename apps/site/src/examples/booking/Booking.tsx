import "./Booking.css";
import { useState } from "react";
import {
  Alert,
  AlertDescription,
  Box,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Checkbox,
  DatePicker,
  Heading,
  Input,
  List,
  ListItem,
  MetaStrip,
  MetaStripItem,
  NumberInput,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Stack,
  Stepper,
  Text,
  Textarea,
  TimePicker,
} from "@kozmos-ds/react";
import { useFocusOnChange } from "../focus";

const steps = ["When", "Details", "Confirm"];

const rooms = [
  { id: "huddle", label: "Huddle room · 4 people" },
  { id: "meeting", label: "Meeting room · 10 people" },
  { id: "boardroom", label: "Boardroom · 20 people" },
] as const;

const PURPOSE_LIMIT = 200;

interface Form {
  date: string;
  start: string;
  hours: number;
  room: string;
  name: string;
  email: string;
  purpose: string;
  catering: boolean;
  policy: boolean;
}

const empty: Form = {
  date: "",
  start: "",
  hours: 1,
  room: "meeting",
  name: "",
  email: "",
  purpose: "",
  catering: false,
  policy: false,
};

function whenErrors(form: Form) {
  return {
    date: form.date ? undefined : "Choose a date.",
    start: form.start ? undefined : "Choose a start time.",
  };
}

function detailErrors(form: Form) {
  return {
    name: form.name.trim() ? undefined : "Enter your name.",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
      ? undefined
      : "Enter an email address, like name@example.com.",
    policy: form.policy ? undefined : "The room policy has to be accepted.",
  };
}

function longDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export default function Booking() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(empty);
  const [submitted, setSubmitted] = useState(false);
  const [booked, setBooked] = useState(false);
  // Each step is its own form and replaces the last, so its heading takes
  // focus; so does the booking once it is made (../focus.ts).
  const viewFocus = useFocusOnChange(booked ? "booked" : step);

  const update = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const when = whenErrors(form);
  const details = detailErrors(form);
  const room = rooms.find((entry) => entry.id === form.room);

  function next() {
    setSubmitted(true);
    if (step === 0 && (when.date || when.start)) return;
    if (step === 1 && (details.name || details.email || details.policy)) return;
    setSubmitted(false);
    setStep(step + 1);
  }

  function back() {
    setSubmitted(false);
    setStep(Math.max(0, step - 1));
  }

  function reset() {
    setForm(empty);
    setStep(0);
    setSubmitted(false);
    setBooked(false);
  }

  return (
    <Box className="ex-booking">
      <Card className="ex-booking-card">
        <CardHeader>
          <Heading level={2}>Book a room at Lakeside Offices</Heading>
          <CardDescription>
            Three steps; nothing is booked until you confirm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Stack gap={6}>
            {!booked ? (
              <Stack gap={3}>
                <Stepper steps={steps} currentStep={step} />
                <Progress
                  value={((step + 1) / steps.length) * 100}
                  aria-label={`Step ${step + 1} of ${steps.length}`}
                />
              </Stack>
            ) : null}

            {booked ? (
              <Stack
                gap={4}
                ref={viewFocus}
                tabIndex={-1}
                className="ex-booking-focus"
              >
                {/* A confirmation is a status: polite, not an interruption. */}
                <Alert variant="success" live="polite">
                  <AlertDescription>
                    <Text as="span" weight="semibold">
                      Booked.
                    </Text>{" "}
                    {room?.label.split(" · ")[0]} on {longDate(form.date)} at{" "}
                    {form.start}, for {form.hours}{" "}
                    {form.hours === 1 ? "hour" : "hours"}. Reference LK-2041; a
                    confirmation goes to {form.email.trim()}.
                  </AlertDescription>
                </Alert>
                <Button variant="outline" onClick={reset}>
                  Book another room
                </Button>
              </Stack>
            ) : step === 0 ? (
              <form
                className="ex-booking-form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  next();
                }}
              >
                <Heading
                  level={3}
                  ref={viewFocus}
                  tabIndex={-1}
                  className="ex-booking-focus"
                >
                  When
                </Heading>
                <DatePicker
                  label="Date"
                  value={form.date}
                  onChange={(event) => update("date", event.target.value)}
                  error={submitted ? when.date : undefined}
                  helperText="Rooms can be booked up to 30 days ahead."
                />
                <Box className="ex-booking-row">
                  <TimePicker
                    label="Start"
                    value={form.start}
                    onChange={(event) => update("start", event.target.value)}
                    error={submitted ? when.start : undefined}
                  />
                  <NumberInput
                    label="Hours"
                    min={1}
                    max={8}
                    value={form.hours}
                    onValueChange={(value) => update("hours", value ?? 1)}
                  />
                </Box>
                <RadioGroup
                  label="Room"
                  value={form.room}
                  onValueChange={(value) => update("room", value)}
                >
                  {rooms.map((entry) => (
                    <RadioGroupItem
                      key={entry.id}
                      value={entry.id}
                      label={entry.label}
                    />
                  ))}
                </RadioGroup>
                <Stack direction="row" justify="end" gap={2}>
                  <Button type="submit">Next</Button>
                </Stack>
              </form>
            ) : step === 1 ? (
              <form
                className="ex-booking-form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  next();
                }}
              >
                <Heading
                  level={3}
                  ref={viewFocus}
                  tabIndex={-1}
                  className="ex-booking-focus"
                >
                  Details
                </Heading>
                <Input
                  label="Your name"
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  error={submitted ? details.name : undefined}
                />
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  error={submitted ? details.email : undefined}
                  helperText="The confirmation goes here."
                />
                <Stack gap={1}>
                  <Textarea
                    label="Purpose"
                    rows={3}
                    maxLength={PURPOSE_LIMIT}
                    value={form.purpose}
                    onChange={(event) => update("purpose", event.target.value)}
                  />
                  {/* Textarea has no helper text (GAPS.md, GAP-13). */}
                  <Text size="sm" color="muted">
                    Optional. {form.purpose.length} of {PURPOSE_LIMIT}{" "}
                    characters.
                  </Text>
                </Stack>
                <Checkbox
                  label="Add coffee and water for the room"
                  checked={form.catering}
                  onCheckedChange={(value) =>
                    update("catering", value === true)
                  }
                />
                <Checkbox
                  label="I have read the room policy: leave it as you found it."
                  checked={form.policy}
                  onCheckedChange={(value) => update("policy", value === true)}
                  error={submitted ? details.policy : undefined}
                />
                <Stack direction="row" justify="between" gap={2}>
                  <Button type="button" variant="ghost" onClick={back}>
                    Back
                  </Button>
                  <Button type="submit">Next</Button>
                </Stack>
              </form>
            ) : (
              <Stack gap={4}>
                <Heading
                  level={3}
                  ref={viewFocus}
                  tabIndex={-1}
                  className="ex-booking-focus"
                >
                  Confirm
                </Heading>
                <MetaStrip aria-label="The booking">
                  <MetaStripItem label="Date" showLabel>
                    {longDate(form.date)}
                  </MetaStripItem>
                  <MetaStripItem label="Start" showLabel>
                    {form.start}
                  </MetaStripItem>
                  <MetaStripItem label="Hours" showLabel>
                    {form.hours}
                  </MetaStripItem>
                  <MetaStripItem label="Room" showLabel>
                    {room?.label.split(" · ")[0]}
                  </MetaStripItem>
                </MetaStrip>
                <List density="compact" aria-label="Details">
                  <ListItem>
                    <Text as="span">{form.name.trim()}</Text>
                  </ListItem>
                  <ListItem>
                    <Text as="span">{form.email.trim()}</Text>
                  </ListItem>
                  <ListItem>
                    <Text as="span">
                      {form.catering
                        ? "Coffee and water for the room"
                        : "No catering"}
                    </Text>
                  </ListItem>
                  {form.purpose.trim() ? (
                    <ListItem>
                      <Text as="span">{form.purpose.trim()}</Text>
                    </ListItem>
                  ) : null}
                </List>
                <Stack direction="row" justify="between" gap={2}>
                  <Button variant="ghost" onClick={back}>
                    Back
                  </Button>
                  <Button onClick={() => setBooked(true)}>
                    Confirm booking
                  </Button>
                </Stack>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
