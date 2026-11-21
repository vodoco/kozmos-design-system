import figma from "@figma/code-connect";
import {
  LanguageSwitcher,
  type LanguageSwitcherProps,
} from "./LanguageSwitcher";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const requestLocale: LanguageSwitcherProps["onLocaleRequest"];
declare const retryLocale: NonNullable<LanguageSwitcherProps["onRetry"]>;

/**
 * Figma Code Connect: LanguageSwitcher (GAP-206, SDK-UI-003)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-19224
 *
 * State is pending (Pending), error with onRetry (Failed) and disabled
 * (Disabled). Language Text is the selected language's label; Pending Text
 * is pendingLabel, Error Text error. The open list is Select's.
 */
figma.connect(
  LanguageSwitcher,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-19224",
  {
    props: {
      language: figma.string("Language Text"),
      pending: figma.enum("State", { Pending: true }),
      disabled: figma.enum("State", { Disabled: true }),
      pendingLabel: figma.string("Pending Text"),
      error: figma.enum("State", { Failed: figma.string("Error Text") }),
      onRetry: figma.enum("State", { Failed: () => retryLocale() }),
    },
    example: ({
      language,
      pending,
      disabled,
      pendingLabel,
      error,
      onRetry,
    }) => (
      <LanguageSwitcher
        languages={[
          { id: "en", label: language },
          { id: "de", label: "Deutsch" },
          { id: "ar", label: "العربية", direction: "rtl" },
        ]}
        selectedLocale="en"
        onLocaleRequest={(locale) => requestLocale(locale)}
        pending={pending}
        pendingLabel={pendingLabel}
        disabled={disabled}
        error={error}
        onRetry={onRetry}
      />
    ),
  },
);
