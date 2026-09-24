import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Surface,
  Button,
  Input,
  Textarea,
  ThemeProvider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  DesignConfigProvider,
  buttonVariants,
  inputVariants,
  PasswordInput,
  NumberInput,
  MapControlButton,
  Listbox,
  Text,
  Heading,
  POIDetailPanel,
} from "@kozmos/react";

function Controls({ id }: { id: string }) {
  return (
    <section data-testid={id} style={{ width: 300 }}>
      <h1 className="consumer-heading" data-testid={`${id}-host-heading`}>
        Host heading
      </h1>
      <Heading level={2} data-testid={`${id}-heading`}>
        Library heading
      </Heading>
      <Text size="sm" weight="semibold" data-testid={`${id}-text`}>
        Library text
      </Text>
      <Text className="consumer-copy" data-testid={`${id}-host-copy`}>
        Product copy
      </Text>
      <Listbox
        aria-label={`${id} long list`}
        data-testid={`${id}-listbox`}
        options={Array.from({ length: 30 }, (_, index) => ({
          value: String(index),
          label: `Place ${index}`,
          description: `Description ${index}`,
        }))}
      />
      <Input
        label={`${id} name`}
        helperText="Helper text"
        data-testid={`${id}-input`}
      />
      <Input label={`${id} disabled`} disabled data-testid={`${id}-disabled`} />
      <Input
        label={`${id} invalid`}
        error="Invalid value"
        data-testid={`${id}-invalid`}
      />
      <Input
        label={`${id} warning`}
        status="warning"
        data-testid={`${id}-warning`}
      />
      <Input
        label={`${id} success`}
        status="success"
        data-testid={`${id}-success`}
      />
      <Input
        label={`${id} override`}
        className="consumer-control"
        data-testid={`${id}-override`}
      />
      <Input label={`${id} file`} type="file" data-testid={`${id}-file`} />
      <Textarea label={`${id} notes`} data-testid={`${id}-textarea`} />
      <Button data-testid={`${id}-button`}>Save</Button>
      <Button variant="outline" emotion="success" data-testid={`${id}-outline`}>
        Confirm
      </Button>
      <Button disabled data-testid={`${id}-disabled-button`}>
        Disabled
      </Button>
      <Button isLoading data-testid={`${id}-loading`}>
        Loading
      </Button>
      <Button data-testid={`${id}-icon-label`}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" />
        Navigate
      </Button>
      <Button variant="glass" data-testid={`${id}-glass`}>
        Glass
      </Button>
      <Surface
        variant="glass"
        data-testid={`${id}-glass-surface`}
        className="rounded-container p-2"
      >
        Glass surface
      </Surface>
      <Surface
        data-testid={`${id}-solid-surface`}
        className="rounded-container p-2"
      >
        Solid surface
      </Surface>
      <button
        className={buttonVariants({ size: "icon" })}
        data-testid={`${id}-helper-button`}
        aria-label={`${id} helper button`}
      >
        +
      </button>
      <input
        className={inputVariants({ status: "warning" })}
        data-testid={`${id}-helper-input`}
        aria-label={`${id} helper input`}
      />
      <input
        className={inputVariants({ status: "warning", error: true })}
        data-testid={`${id}-helper-error`}
        aria-label={`${id} helper error`}
      />
      <PasswordInput label={`${id} password`} data-testid={`${id}-password`} />
      <NumberInput label={`${id} number`} data-testid={`${id}-number`} />
      <PasswordInput
        label={`${id} disabled password`}
        disabled
        data-testid={`${id}-password-disabled`}
      />
      <NumberInput
        label={`${id} plain number`}
        showSteppers={false}
        data-testid={`${id}-number-plain`}
      />
      <NumberInput
        label={`${id} readonly number`}
        readOnly
        defaultValue={2}
        data-testid={`${id}-number-readonly`}
      />
      <NumberInput
        label={`${id} disabled number`}
        disabled
        defaultValue={2}
        data-testid={`${id}-number-disabled`}
      />
      {(["error", "warning", "success"] as const).map((status) => (
        <NumberInput
          key={status}
          label={`${id} ${status} number`}
          status={status}
          data-testid={`${id}-number-${status}`}
        />
      ))}
      <MapControlButton
        icon={<span aria-hidden="true">+</span>}
        label={`${id} map control`}
        emphasis="filled"
        pressed
        data-testid={`${id}-map-control`}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open {id}</Button>
        </PopoverTrigger>
        <PopoverContent data-testid={`${id}-popover`}>
          <Input
            label={`${id} portal input`}
            data-testid={`${id}-portal-input`}
          />
          <PopoverArrow data-testid={`${id}-arrow`} />
        </PopoverContent>
      </Popover>
      <div className="host-slot">
        <button className="host-slot-button">Host slot</button>
      </div>
      <POIDetailPanel
        data-testid={`${id}-poi`}
        poi={{
          id,
          name: "Terminal entrance",
          floorId: "1",
          floorLabel: "Floor 1",
          media: [],
          actions: ["navigate"],
        }}
        actionLabels={{
          navigate: "Go",
          share: "Share",
          favourite: "Favourite",
          bookmark: "Bookmark",
          order: "Order",
        }}
        onAction={() => undefined}
        onClose={() => undefined}
        details={{
          summary: [
            {
              id: "rating",
              kind: "rating",
              label: "Rating",
              value: "4.7 / 5",
              detail: "32 reviews",
            },
            {
              id: "access",
              kind: "accessibility",
              label: "Accessibility",
              value: "Step-free",
            },
            {
              id: "crowd",
              kind: "crowd",
              label: "Crowd",
              value: "Packed",
              detail: "25 min wait",
            },
          ],
          groups: [
            {
              id: "languages",
              heading: "Languages",
              items: [{ id: "en", label: "English" }],
            },
          ],
          openingHours: {
            label: "Hours",
            summary: "View opening hours",
            rows: [{ id: "mon", day: "Monday", hours: "09:00–17:00" }],
          },
        }}
      />
    </section>
  );
}
function Fixture() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  return (
    <>
      <button
        id="switch-theme"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        Switch theme
      </button>
      <ThemeProvider theme={theme} dir="rtl">
        <DesignConfigProvider
          initialConfig={{ glass: { enabled: true, frost: 70 } }}
        >
          <Controls id="outer" />
          <ThemeProvider theme="light">
            <Controls id="nested" />
          </ThemeProvider>
        </DesignConfigProvider>
      </ThemeProvider>
    </>
  );
}
createRoot(document.getElementById("fixture")!).render(<Fixture />);
