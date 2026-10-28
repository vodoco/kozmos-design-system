import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { HelpCircle, Pencil01, Star01 } from "@kozmos-ds/icons";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  IconButton,
  Input,
  ThemeProvider,
  type InputAction,
} from "@kozmos-ds/react";

/**
 * The 0.15.0 control props in the built package, for
 * scripts/check-control-props.mjs: IconButton's counter (GAP-197),
 * CardHeader's actions (GAP-169) and Input's copy and toggle actions
 * (GAP-154), each in a provider of the given theme, density and direction.
 * The clipboard is a stand-in that records what is written, so the copy is
 * read the same in every engine, secure context or not. `setAction` gives the
 * #switch field an action, or takes it away, as a product's state does.
 */
interface Mount {
  part: "iconbutton" | "card" | "input";
  theme: "light" | "dark";
  density: "touch" | "compact";
  dir: "ltr" | "rtl";
}

const copied: string[] = [];
Object.defineProperty(navigator, "clipboard", {
  configurable: true,
  value: {
    writeText: async (value: string) => {
      copied.push(value);
    },
  },
});

function Toggle() {
  const [featured, setFeatured] = useState(false);
  return (
    <Input
      id="name"
      label="Name"
      defaultValue="Gate B12"
      action={{
        kind: "toggle",
        label: "Featured",
        icon: <Star01 aria-hidden="true" />,
        pressed: featured,
        onPressedChange: setFeatured,
      }}
    />
  );
}

let setSwitchAction: (action: InputAction | undefined) => void = () => {};
function Switch() {
  const [action, setAction] = useState<InputAction | undefined>(undefined);
  useEffect(() => {
    setSwitchAction = setAction;
  }, []);
  return <Input id="switch" label="Notes" action={action} />;
}

function Part({ part }: Mount) {
  if (part === "iconbutton")
    return (
      <div style={{ display: "flex", gap: 24, padding: 24 }}>
        {(["sm", "icon", "lg"] as const).map((size) => (
          <IconButton
            key={size}
            id={`help-${size}`}
            aria-label="Help"
            counter={3}
            counterLabel={(count) => `${count} tours left`}
            size={size}
            variant="outline"
          >
            <HelpCircle aria-hidden="true" className="h-5 w-5" />
          </IconButton>
        ))}
        <IconButton
          id="ayuda"
          aria-label="Ayuda"
          counter={2}
          counterLabel={(count) => `${count} recorridos pendientes`}
        >
          <HelpCircle aria-hidden="true" className="h-5 w-5" />
        </IconButton>
        <span id="help-name" hidden>
          Help
        </span>
        <IconButton
          id="labelled"
          aria-labelledby="help-name"
          counter={4}
          counterLabel={(count) => `${count} tours left`}
        >
          <HelpCircle aria-hidden="true" className="h-5 w-5" />
        </IconButton>
        <IconButton
          id="herupu"
          aria-label="ヘルプ"
          counter={3}
          counterSeparator="、"
        >
          <HelpCircle aria-hidden="true" className="h-5 w-5" />
        </IconButton>
      </div>
    );
  if (part === "card")
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: 24 }}>
        <Card id="card" style={{ width: 360 }}>
          <CardHeader
            id="header"
            actions={
              <IconButton id="edit" aria-label="Edit Boston Logan Airport">
                <Pencil01 aria-hidden="true" className="h-5 w-5" />
              </IconButton>
            }
          >
            <CardTitle id="title">Boston Logan Airport International</CardTitle>
            <CardDescription>3 buildings, 11 levels</CardDescription>
          </CardHeader>
        </Card>
        <Card style={{ width: 360 }}>
          <CardHeader
            id="short"
            actions={
              <IconButton id="edit-short" aria-label="Edit Logan">
                <Pencil01 aria-hidden="true" className="h-5 w-5" />
              </IconButton>
            }
          >
            <CardTitle id="short-title">Logan</CardTitle>
          </CardHeader>
        </Card>
        <Card style={{ width: 360 }}>
          <CardHeader id="plain">
            <CardTitle>Logan</CardTitle>
          </CardHeader>
        </Card>
        {(["sm", "lg"] as const).map((size) => (
          <Card key={size} style={{ width: 240 }}>
            <CardHeader
              id={`short-${size}`}
              actions={
                <IconButton id={`edit-${size}`} size={size} aria-label="Close">
                  <Pencil01 aria-hidden="true" className="h-4 w-4" />
                </IconButton>
              }
            >
              <CardTitle id={`title-${size}`}>Gate</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  return (
    <div style={{ display: "grid", gap: 16, padding: 24, width: 360 }}>
      <Input
        id="fid"
        label="FID"
        readOnly
        defaultValue="5f0c2a7e-91d4-4b1e-a0f3-6c8e2d1b9a47-0000"
        action={{ kind: "copy", label: "Copy FID" }}
      />
      <Toggle />
      <Switch />
    </div>
  );
}

let root: Root | null = null;
function mount(props: Mount) {
  root?.unmount();
  copied.length = 0;
  root = createRoot(document.getElementById("fixture")!);
  flushSync(() =>
    root!.render(
      <ThemeProvider
        theme={props.theme}
        density={props.density}
        dir={props.dir}
      >
        <div id="surface" className="bg-background">
          <Part {...props} />
        </div>
      </ThemeProvider>,
    ),
  );
}

declare global {
  interface Window {
    controlProps: {
      mount: typeof mount;
      copied: string[];
      setAction: (action: InputAction | undefined) => void;
    };
  }
}
window.controlProps = {
  mount,
  copied,
  setAction: (action) => flushSync(() => setSwitchAction(action)),
};
