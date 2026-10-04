import type { Meta, StoryObj } from "@storybook/react";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { Button } from "../Button";

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
