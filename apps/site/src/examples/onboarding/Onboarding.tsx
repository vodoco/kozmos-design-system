import "./Onboarding.css";
import { useState } from "react";
import {
  Alert,
  AlertDescription,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  ChipGroup,
  Heading,
  Icon,
  List,
  ListItem,
  Progress,
  RadioGroup,
  RadioGroupItem,
  SegmentedControl,
  Slider,
  Stack,
  Stepper,
  Switch,
  Text,
} from "@kozmos-ds/react";
import { useFocusOnChange } from "../focus";

const steps = ["Welcome", "Preferences", "Interests", "Location", "Ready"];

const interests = [
  "Shops",
  "Food and drink",
  "Events",
  "Transport",
  "Family",
  "Quiet places",
  "Step-free",
] as const;

const permissions = [
  {
    value: "while-using",
    label: "While using the app",
    detail: "The blue dot and turn-by-turn directions.",
  },
  {
    value: "always",
    label: "Always",
    detail: "Also a reminder where you parked, after you leave.",
  },
  {
    value: "never",
    label: "Not now",
    detail:
      "You can still search and browse; directions start from a place you pick.",
  },
] as const;

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [radius, setRadius] = useState([400]);
  const [stepFree, setStepFree] = useState(false);
  const [chosen, setChosen] = useState<readonly string[]>(["Shops"]);
  const [permission, setPermission] = useState<string>("while-using");
  const [done, setDone] = useState(false);
  // Each step replaces the last, so its heading takes focus; so does the
  // summary at the end (../focus.ts).
  const viewFocus = useFocusOnChange(done ? "done" : step);

  const last = steps.length - 1;

  function toggle(interest: string) {
    setChosen((list) =>
      list.includes(interest)
        ? list.filter((entry) => entry !== interest)
        : [...list, interest],
    );
  }

  function reset() {
    setStep(0);
    setUnits("metric");
    setRadius([400]);
    setStepFree(false);
    setChosen(["Shops"]);
    setPermission("while-using");
    setDone(false);
  }

  const distance =
    units === "metric"
      ? `${radius[0]} m`
      : `${Math.round(radius[0] * 3.281)} ft`;

  return (
    <Box className="ex-onboarding">
      <Card className="ex-onboarding-card">
        <CardContent>
          <Stack gap={6}>
            {!done ? (
              <Stack gap={3}>
                {/* Five labelled steps need 24rem, and Kozmos's Stepper has
                    no narrower form (GAPS.md, GAP-46): on a phone the
                    progress bar below carries the step on its own. */}
                <Box className="ex-onboarding-steps">
                  <Stepper steps={steps} currentStep={step} />
                </Box>
                <Progress
                  value={((step + 1) / steps.length) * 100}
                  aria-label={`Step ${step + 1} of ${steps.length}`}
                />
              </Stack>
            ) : null}

            {done ? (
              <Stack
                gap={4}
                ref={viewFocus}
                tabIndex={-1}
                className="ex-onboarding-focus"
              >
                {/* A confirmation is a status: polite, not an interruption. */}
                <Alert variant="success" live="polite">
                  <AlertDescription>
                    <Text as="span" weight="semibold">
                      You are set.
                    </Text>{" "}
                    The map opens on the nearest venue, with your interests
                    first.
                  </AlertDescription>
                </Alert>
                <Button variant="outline" onClick={reset}>
                  Start again
                </Button>
              </Stack>
            ) : step === 0 ? (
              <Stack gap={4}>
                <Icon name="map-01" size="xl" />
                <Heading
                  level={2}
                  ref={viewFocus}
                  tabIndex={-1}
                  className="ex-onboarding-focus"
                >
                  Welcome to Riverside
                </Heading>
                <Text color="muted">
                  Find shops, places and people across the centre, and get there
                  step by step. Four short questions make it yours.
                </Text>
              </Stack>
            ) : step === 1 ? (
              <Stack gap={4}>
                <Heading
                  level={2}
                  ref={viewFocus}
                  tabIndex={-1}
                  className="ex-onboarding-focus"
                >
                  How you like your directions
                </Heading>
                <SegmentedControl
                  label="Distances"
                  items={[
                    { value: "metric", label: "Metres" },
                    { value: "imperial", label: "Feet" },
                  ]}
                  value={units}
                  onValueChange={(next) => {
                    if (next === "metric" || next === "imperial")
                      setUnits(next);
                  }}
                />
                <Slider
                  label="Search around you"
                  min={100}
                  max={1000}
                  step={50}
                  value={radius}
                  onValueChange={setRadius}
                  formatValue={() => distance}
                />
                <Switch
                  label="Prefer step-free routes"
                  checked={stepFree}
                  onCheckedChange={setStepFree}
                />
              </Stack>
            ) : step === 2 ? (
              <Stack gap={4}>
                <Heading
                  level={2}
                  ref={viewFocus}
                  tabIndex={-1}
                  className="ex-onboarding-focus"
                >
                  What brings you here?
                </Heading>
                <Text color="muted">
                  Pick any. They come first in search and on the map.
                </Text>
                {/* GAP-32: ChipGroup is a plain div; the role makes the label count. */}
                <ChipGroup role="group" aria-label="Interests">
                  {interests.map((interest) => (
                    <Chip
                      key={interest}
                      selected={chosen.includes(interest)}
                      onClick={() => toggle(interest)}
                    >
                      {interest}
                    </Chip>
                  ))}
                </ChipGroup>
                <Text size="sm" color="muted" aria-live="polite">
                  {chosen.length === 0
                    ? "Nothing picked yet; that is fine."
                    : `${chosen.length} picked.`}
                </Text>
              </Stack>
            ) : step === 3 ? (
              <Stack gap={4}>
                <Heading
                  level={2}
                  ref={viewFocus}
                  tabIndex={-1}
                  className="ex-onboarding-focus"
                >
                  Your location
                </Heading>
                <RadioGroup
                  label="Use my location"
                  value={permission}
                  onValueChange={setPermission}
                >
                  {permissions.map((entry) => (
                    <RadioGroupItem
                      key={entry.value}
                      value={entry.value}
                      label={`${entry.label} — ${entry.detail}`}
                    />
                  ))}
                </RadioGroup>
                <Alert variant="info">
                  <AlertDescription>
                    Your position stays on your phone. The venue sees counts,
                    never people.
                  </AlertDescription>
                </Alert>
              </Stack>
            ) : (
              <Stack gap={4}>
                <Heading
                  level={2}
                  ref={viewFocus}
                  tabIndex={-1}
                  className="ex-onboarding-focus"
                >
                  Ready
                </Heading>
                <List aria-label="Your choices">
                  <ListItem>
                    <Text as="span">
                      Distances in {units === "metric" ? "metres" : "feet"};
                      search within {distance}
                      {stepFree ? "; step-free routes first" : ""}.
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text as="span">
                      {chosen.length > 0
                        ? `Interests: ${chosen.join(", ")}.`
                        : "No interests picked."}
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text as="span">
                      Location:{" "}
                      {permissions
                        .find((entry) => entry.value === permission)
                        ?.label.toLowerCase()}
                      .
                    </Text>
                  </ListItem>
                </List>
              </Stack>
            )}

            {!done ? (
              <Stack direction="row" justify="between" align="center" gap={2}>
                {step > 0 ? (
                  <Button variant="ghost" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setStep(last)}>
                    Skip
                  </Button>
                )}
                {step < last ? (
                  <Button onClick={() => setStep(step + 1)}>
                    {step === 0 ? "Let’s go" : "Next"}
                  </Button>
                ) : (
                  <Button onClick={() => setDone(true)}>Start exploring</Button>
                )}
              </Stack>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
