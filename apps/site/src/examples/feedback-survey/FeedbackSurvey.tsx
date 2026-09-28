import "./FeedbackSurvey.css";
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
  FeedbackCard,
  Heading,
  Input,
  RadioGroup,
  RadioGroupItem,
  Slider,
  Stack,
  Switch,
  Text,
  Textarea,
} from "@kozmos-ds/react";
import { useFocusOnChange } from "../focus";

type Stage = "quick" | "more" | "thanks";

const ways = [
  { value: "map", label: "The map in the app" },
  { value: "signs", label: "Signs in the centre" },
  { value: "staff", label: "I asked someone" },
] as const;

const helps = [
  "Clearer signs at the lifts",
  "Step-free routes by default",
  "Opening hours on the map",
  "Where to find a toilet",
] as const;

const COMMENT_LIMIT = 300;

export default function FeedbackSurvey() {
  const [stage, setStage] = useState<Stage>("quick");
  // Each view replaces the last; its heading, or the thanks, takes focus
  // (../focus.ts).
  const viewFocus = useFocusOnChange(stage);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [recommend, setRecommend] = useState([8]);
  const [way, setWay] = useState<string>("map");
  const [chosen, setChosen] = useState<readonly string[]>([]);
  const [more, setMore] = useState("");
  const [contact, setContact] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emailProblem =
    contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? "Enter an email address, like name@example.com."
      : undefined;

  function toggle(help: string) {
    setChosen((list) =>
      list.includes(help)
        ? list.filter((entry) => entry !== help)
        : [...list, help],
    );
  }

  function finish() {
    setSubmitted(true);
    if (emailProblem) return;
    setStage("thanks");
  }

  function reset() {
    setStage("quick");
    setRating(0);
    setComment("");
    setRecommend([8]);
    setWay("map");
    setChosen([]);
    setMore("");
    setContact(false);
    setEmail("");
    setSubmitted(false);
  }

  return (
    <Box className="ex-survey">
      {stage === "quick" ? (
        <Stack gap={4}>
          <Stack gap={1}>
            <Heading
              level={2}
              ref={viewFocus}
              tabIndex={-1}
              className="ex-survey-focus"
            >
              How was your visit?
            </Heading>
            <Text color="muted">
              A rating takes a moment; two more questions help the next visitor.
            </Text>
          </Stack>
          <FeedbackCard
            title="Rate your visit"
            description="How was finding your way today?"
            onSubmitFeedback={(value, words) => {
              setRating(value);
              setComment(words);
              setStage("more");
            }}
            successMessage="Thanks — two more questions?"
          />
          <Button variant="link" onClick={() => setStage("more")}>
            Skip the rating
          </Button>
        </Stack>
      ) : stage === "more" ? (
        <Card>
          <CardHeader>
            <Heading
              level={2}
              ref={viewFocus}
              tabIndex={-1}
              className="ex-survey-focus"
            >
              Two more questions
            </Heading>
            <CardDescription>
              {rating > 0
                ? `You rated the visit ${rating} of 5.`
                : "Optional, every one of them."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="ex-survey-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                finish();
              }}
            >
              <Slider
                label="How likely are you to recommend the centre?"
                min={0}
                max={10}
                step={1}
                value={recommend}
                onValueChange={setRecommend}
                formatValue={(value) =>
                  value <= 6
                    ? `${value} — not likely`
                    : value <= 8
                      ? `${value} — maybe`
                      : `${value} — very likely`
                }
              />
              <RadioGroup
                label="How did you find your way?"
                value={way}
                onValueChange={setWay}
              >
                {ways.map((entry) => (
                  <RadioGroupItem
                    key={entry.value}
                    value={entry.value}
                    label={entry.label}
                  />
                ))}
              </RadioGroup>
              <Stack gap={2} role="group" aria-label="What would have helped">
                <Text weight="medium">What would have helped?</Text>
                {helps.map((help) => (
                  <Checkbox
                    key={help}
                    label={help}
                    checked={chosen.includes(help)}
                    onCheckedChange={() => toggle(help)}
                  />
                ))}
              </Stack>
              <Stack gap={1}>
                <Textarea
                  label="Anything else?"
                  rows={3}
                  maxLength={COMMENT_LIMIT}
                  value={more}
                  onChange={(event) => setMore(event.target.value)}
                />
                {/* Textarea has no helper text (GAPS.md, GAP-13). */}
                <Text size="sm" color="muted">
                  {more.length} of {COMMENT_LIMIT} characters.
                </Text>
              </Stack>
              <Switch
                label="Someone may contact me about this"
                checked={contact}
                onCheckedChange={setContact}
              />
              {contact ? (
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  error={submitted ? emailProblem : undefined}
                />
              ) : null}
              <Stack direction="row" justify="between" gap={2}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStage("quick")}
                >
                  Back
                </Button>
                <Button type="submit">Send</Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Stack
          gap={4}
          ref={viewFocus}
          tabIndex={-1}
          className="ex-survey-focus"
        >
          {/* Thanks are a status: polite, not an interruption. */}
          <Alert variant="success" live="polite">
            <AlertDescription>
              <Text as="span" weight="semibold">
                Thank you.
              </Text>{" "}
              {rating > 0 ? `${rating} of 5` : "No rating"}, {recommend[0]} of
              10 to recommend, found the way by{" "}
              {ways.find((entry) => entry.value === way)?.label.toLowerCase()}
              {chosen.length === 1
                ? "; one thing would help"
                : chosen.length > 1
                  ? `; ${chosen.length} things would help`
                  : ""}
              {comment.trim() || more.trim()
                ? "; your words are with the team"
                : ""}
              .
            </AlertDescription>
          </Alert>
          <Button variant="outline" onClick={reset}>
            Start again
          </Button>
        </Stack>
      )}
    </Box>
  );
}
