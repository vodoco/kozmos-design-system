import { createRoot } from "react-dom/client";
import {
  AdaptiveMapShell,
  AICompanionPanel,
  AIInputBar,
  AIMessage,
  AIMessageList,
  ThemeProvider,
  UserMessage,
  type PanelDetent,
} from "@kozmos-ds/react";

type Config = {
  /** What the sheet holds: the assistant, which fills its panel, or a list. */
  content: "assistant" | "list";
  /** A second detent, so the sheet draws its grip. */
  grip: boolean;
  rtl: boolean;
  /** The assistant's conversation, in question-and-answer turns. */
  turns?: number;
  /** The assistant's header alone: no thread and no input. */
  bare?: boolean;
  /** The list's rows, 40px each. */
  rows?: number;
  /** The detent the sheet is asked for; `content` unless a check moves it. */
  detent?: PanelDetent;
  /** A fresh shell for each value: the same value keeps the shell mounted. */
  instance: string;
};
declare global {
  interface Window {
    renderFittedSheet: (config: Config) => void;
  }
}
const root = createRoot(document.getElementById("root")!);
window.renderFittedSheet = ({
  content,
  grip,
  rtl,
  turns = 1,
  bare = false,
  rows = 3,
  detent = "content",
  instance,
}) =>
  root.render(
    <ThemeProvider dir={rtl ? "rtl" : "ltr"} defaultTheme="light">
      <AdaptiveMapShell
        key={instance}
        style={{ width: 390, height: 800 }}
        map={<div>Map</div>}
        panelLabel="Fitted sheet"
        panelPresentation="bottom"
        panelDetents={grip ? ["content", "large"] : ["content"]}
        panelDetent={detent}
        panel={
          content === "assistant" ? (
            <AICompanionPanel open title="Assistant" onClose={() => {}}>
              {bare ? null : (
                <>
                  <AIMessageList>
                    {Array.from({ length: turns }, (_, i) => [
                      <UserMessage key={`u${i}`}>
                        Where is gate {i + 1}?
                      </UserMessage>,
                      <AIMessage key={`a${i}`}>
                        Gate {i + 1} is past security, on the left, about four
                        minutes from here.
                      </AIMessage>,
                    ])}
                  </AIMessageList>
                  <AIInputBar
                    value=""
                    onValueChange={() => {}}
                    onSubmit={() => {}}
                  />
                </>
              )}
            </AICompanionPanel>
          ) : (
            <ul data-fitted-list style={{ margin: 0, padding: 0 }}>
              {Array.from({ length: rows }, (_, i) => (
                <li key={i} style={{ height: 40, listStyle: "none" }}>
                  Result {i + 1}
                </li>
              ))}
            </ul>
          )
        }
      />
    </ThemeProvider>,
  );
