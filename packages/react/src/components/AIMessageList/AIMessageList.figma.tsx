import figma from "@figma/code-connect";
import { AIMessageList } from "./AIMessageList";

/**
 * Figma Code Connect: AIMessageList (GAP-206)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-18038
 *
 * Content picks the conversation drawn; its turns are AIMessage and
 * UserMessage instances, which show their own code. label names the log and
 * draws nothing; followLatest is behaviour.
 */
figma.connect(
  AIMessageList,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-18038",
  {
    props: { children: figma.children(["Turn 1", "Turn 2", "Turn 3"]) },
    example: ({ children }) => <AIMessageList>{children}</AIMessageList>,
  },
);
