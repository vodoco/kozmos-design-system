import type { Meta, StoryObj } from "@storybook/react";
import { Plus } from "@kozmos-ds/icons";
import { ThemeProvider, useTheme, type ThemeDensity } from "./ThemeProvider";
import { Button } from "../Button";
import { Combobox } from "../Combobox";
import { IconButton } from "../IconButton";
import { Input } from "../Input";
import { MultiSelect } from "../MultiSelect";
import { NumberInput } from "../NumberInput";
import { PasswordInput } from "../PasswordInput";
import { Select, SelectTrigger, SelectValue } from "../Select";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { DensityScope } from "../../theme/DensityScope";

const Demo = () => {
  const { setTheme } = useTheme();
  return (
    <div className="p-4 border rounded bg-background text-foreground">
      <p className="mb-4">Current Theme Demo</p>
      <div className="flex gap-2">
        <Button onClick={() => setTheme("light")}>Light</Button>
        <Button onClick={() => setTheme("dark")}>Dark</Button>
        <Button onClick={() => setTheme("system")}>System</Button>
      </div>
    </div>
  );
};

const meta: Meta<typeof ThemeProvider> = {
  id: "system-themeprovider",
  title: "Foundations/Theming/ThemeProvider",
  component: ThemeProvider,
};

export default meta;
type Story = StoryObj<typeof ThemeProvider>;

export const Default: Story = {
  render: () => (
    <ThemeProvider>
      <Demo />
    </ThemeProvider>
  ),
};

const views = [
  { value: "overview", label: "Overview" },
  { value: "details", label: "Details" },
];

// A region at another density is a DensityScope, which keeps the theme and
// the design configuration around it. The columns wrap on a narrow screen.
function DensityColumn({ density }: { density: ThemeDensity }) {
  return (
    <DensityScope density={density}>
      <Stack gap={3} style={{ width: 300, maxWidth: "100%" }}>
        <Text weight="semibold">
          {density === "touch" ? "Touch (default)" : "Compact"}
        </Text>
        <Stack direction="row" gap={2} align="center" wrap="wrap">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
        </Stack>
        <Stack direction="row" gap={2} align="center">
          <IconButton size="sm" aria-label="Add, small">
            <Plus />
          </IconButton>
          <IconButton aria-label="Add">
            <Plus />
          </IconButton>
          <IconButton size="lg" aria-label="Add, large">
            <Plus />
          </IconButton>
        </Stack>
        <Input aria-label="Name" placeholder="Name" />
        <Select>
          <SelectTrigger aria-label="Type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
        </Select>
        <Combobox
          label="View"
          options={views}
          defaultValue="overview"
          clearable
        />
        <MultiSelect label="Tools" options={views} />
        <NumberInput label="Capacity" defaultValue={2} showSteppers />
        <PasswordInput label="Password" />
      </Stack>
    </DensityScope>
  );
}

/**
 * Decision 82: the same controls at both densities. Touch keeps every control
 * at least 44 tall, as products and the SDK draw them; compact is for
 * pointer-first desktop tools such as Pointr Cloud.
 */
export const Density: Story = {
  render: () => (
    <Stack direction="row" gap={8} align="start" wrap="wrap">
      <DensityColumn density="touch" />
      <DensityColumn density="compact" />
    </Stack>
  ),
};
