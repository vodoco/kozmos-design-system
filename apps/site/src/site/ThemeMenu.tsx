import {
  Button,
  Icon,
  Menu,
  MenuContent,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
  useTheme,
  type Theme,
} from "@kozmos/react";

const options: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function isTheme(value: string): value is Theme {
  return options.some((option) => option.value === value);
}

/**
 * The site's colour theme, as a menu behind one small button, so the header
 * stays one row on a phone. Words, not glyphs: the icon set has no sun, moon
 * or display (GAPS.md, GAP-07). The button's name starts with its visible
 * word and says the current choice.
 */
export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const current = options.find((option) => option.value === theme);
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Theme: ${current?.label ?? "System"}`}
        >
          Theme
          <Icon name="chevron-down" size="sm" />
        </Button>
      </MenuTrigger>
      <MenuContent align="end">
        <MenuLabel>Colour theme</MenuLabel>
        <MenuRadioGroup
          value={theme}
          onValueChange={(next) => {
            if (isTheme(next)) setTheme(next);
          }}
        >
          {options.map((option) => (
            <MenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}
