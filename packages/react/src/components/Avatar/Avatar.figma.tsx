import figma from "@figma/code-connect";
import { Avatar, AvatarImage, AvatarFallback } from "./Avatar";
figma.connect(
  Avatar,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-272",
  {
    props: {
      src: figma.string("Image URL"),
      alt: figma.string("Alt Text"),
      fallback: figma.string("Fallback"),
      // Decision 221: Sm is 24, for a row that keeps its own height, such
      // as an option's media. Default names no size.
      size: figma.enum("Size", {
        Default: undefined,
        Sm: "sm",
      }),
    },
    example: (props) => (
      <Avatar size={props.size}>
        <AvatarImage src={props.src} alt={props.alt} />
        <AvatarFallback>{props.fallback}</AvatarFallback>
      </Avatar>
    ),
  },
);
