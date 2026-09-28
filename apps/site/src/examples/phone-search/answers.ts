/**
 * What the example's assistant says. It is not a model: it matches the words
 * of a question against the centre's places, as the search field does, and
 * answers from what it finds. A product's assistant comes from its AI
 * service; the thread, the answer's places and the hand-off to the sheet are
 * the SDK's.
 */
import { venueName, type Place } from "./data";

/** The first turn, which says what the assistant is and is not. */
export const greeting = `Hello! Ask me about ${venueName}: a shop, a service, a way home. I answer from this example’s places. Talk to me if you like — the voice conversation here is a script, and nothing listens to your microphone.`;

/** The question the scripted voice conversation "hears". */
export const spokenQuestion = "Is there somewhere with Wi-Fi?";

export interface Answer {
  text: string;
  places: readonly Place[];
}

/** Words that say how a question is asked, not what it is about. */
const ASKING = new Set([
  "a",
  "an",
  "and",
  "any",
  "are",
  "at",
  "buy",
  "can",
  "do",
  "does",
  "find",
  "for",
  "get",
  "go",
  "have",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "near",
  "nearest",
  "of",
  "on",
  "please",
  "some",
  "somewhere",
  "the",
  "there",
  "to",
  "what",
  "where",
  "which",
  "with",
]);

/** Lower case, no hyphens or punctuation: "Wi-Fi" and "wifi" are one word. */
function plain(text: string) {
  return text
    .toLowerCase()
    .replace(/-/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ");
}

/** The words of a question that name what the visitor is after. */
export function topicWords(question: string) {
  return plain(question)
    .split(/\s+/)
    .filter((word) => word.length > 1 && !ASKING.has(word))
    .map((word) => (word.length > 3 ? word.replace(/s$/, "") : word));
}

/** The places a question is about, nearest first. */
export function placesFor(question: string, places: readonly Place[]) {
  const words = topicWords(question);
  if (words.length === 0) return [];
  return places
    .filter((place) => {
      const about = plain(
        [
          place.poi.name,
          place.poi.categoryLabel ?? "",
          place.poi.description ?? "",
        ].join(" "),
      );
      return words.some((word) => about.includes(word));
    })
    .sort((a, b) => a.minutes - b.minutes);
}

/** The answer to a question: a sentence, and the places it is about. */
export function answerFor(question: string, places: readonly Place[]): Answer {
  const found = placesFor(question, places).slice(0, 3);
  const [first] = found;
  if (!first) {
    return {
      text: `I couldn’t find that in ${venueName}. Try a shop’s name, or what you need: books, a taxi, Wi-Fi.`,
      places: [],
    };
  }
  const where = `on the ${(first.poi.floorLabel ?? "").toLowerCase()}, ${first.minutes} min on foot`;
  return {
    text:
      found.length === 1
        ? `${first.poi.name} is ${where}.`
        : `I found ${found.length} places. The nearest, ${first.poi.name}, is ${where}.`,
    places: found,
  };
}
