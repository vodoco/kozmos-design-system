import figma from "@figma/code-connect";
import { Button } from "../Button";
import { Notice } from "./Notice";

/**
 * Figma Code Connect: Notice (GAP-160)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD
 *
 * The set is new in 0.16.0: its node id is filled in after the importer's
 * Build. Tone is Notice.tone, Status its status (None names none), Show Icon
 * false is icon={false}, Show Detail the detail, shown, and Show Action the
 * action under the text.
 */
figma.connect(
  Notice,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD",
  {
    props: {
      // Warning is the default, so it names no tone.
      tone: figma.enum("Tone", {
        Warning: undefined,
        Info: "info",
        Critical: "critical",
        Success: "success",
      }),
      status: figma.enum("Status", {
        None: undefined,
        Progress: "progress",
        Done: "done",
      }),
      summary: figma.string("Summary"),
      icon: figma.boolean("Show Icon", {
        true: undefined,
        false: false,
      }),
      detail: figma.boolean("Show Detail", {
        true: figma.string("Detail"),
        false: undefined,
      }),
      expanded: figma.boolean("Show Detail", {
        true: true,
        false: undefined,
      }),
      action: figma.boolean("Show Action", {
        true: (
          <Button size="sm" variant="outline">
            Action
          </Button>
        ),
        false: undefined,
      }),
    },
    example: (props) => (
      <Notice
        tone={props.tone}
        status={props.status}
        icon={props.icon}
        summary={props.summary}
        defaultExpanded={props.expanded}
        action={props.action}
      >
        {props.detail}
      </Notice>
    ),
  },
);
