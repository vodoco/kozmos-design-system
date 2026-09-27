import { createRef } from "react";
import {
  Button,
  IconButton,
  buttonVariants,
  type ButtonProps,
} from "@kozmos-ds/react";

const buttonRef = createRef<HTMLButtonElement>();
const anchorRef = createRef<HTMLAnchorElement>();
<Button
  ref={buttonRef}
  type="submit"
  form="search"
  onClick={(event) => {
    event.currentTarget.disabled = true;
  }}
>
  Submit
</Button>;
<a
  ref={anchorRef}
  href="#destination"
  className={buttonVariants({ variant: "outline" })}
>
  Destination
</a>;
const validProps: ButtonProps = { type: "reset", disabled: true };
<Button {...validProps}>Reset</Button>;

// @ts-expect-error Button is a native button, not a slot.
<Button asChild>
  <a href="#destination">Invalid nesting</a>
</Button>;
// @ts-expect-error The native-button wrapper must not reintroduce asChild.
<IconButton asChild>
  <a href="#destination">Invalid nesting</a>
</IconButton>;
// @ts-expect-error Navigation props belong to anchors, not buttons.
<Button href="#destination">Invalid destination</Button>;
// @ts-expect-error The forwarded ref always points to a native button.
<Button ref={anchorRef}>Invalid ref</Button>;
// @ts-expect-error The public props type also rejects unsupported composition.
const invalidProps: ButtonProps = { asChild: true };
void invalidProps;
