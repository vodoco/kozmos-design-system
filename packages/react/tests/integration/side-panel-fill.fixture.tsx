import { createRoot } from "react-dom/client";
import {
  AdaptiveMapShell,
  AICompanionPanel,
  AIMessageList,
  AIMessage,
  UserMessage,
  AIInputBar,
  ThemeProvider,
} from "@kozmos-ds/react";

interface Config {
  turns?: number;
  /** An ordinary list instead of the assistant, which keeps hugging its content. */
  list?: number;
  dir?: "ltr" | "rtl";
}
const root = createRoot(document.getElementById("root")!);
declare global {
  interface Window {
    renderSidePanelFill: (config: Config) => void;
  }
}
window.renderSidePanelFill = ({ turns = 1, list, dir = "ltr" }) =>
  root.render(
    <ThemeProvider dir={dir}>
      <AdaptiveMapShell
        style={{ width: 1200, height: 800 }}
        data-testid="shell"
        map={<div />}
        panelLabel="Assistant"
        panel={
          list ? (
            <ul data-testid="list">
              {Array.from({ length: list }, (_, i) => (
                <li key={i} style={{ height: 40 }}>
                  Result {i + 1}
                </li>
              ))}
            </ul>
          ) : (
            <AICompanionPanel open title="Assistant" onClose={() => {}}>
              <AIMessageList>
                {Array.from({ length: turns }, (_, i) => [
                  <UserMessage key={`u${i}`}>
                    Where is gate {i + 1}?
                  </UserMessage>,
                  <AIMessage key={`a${i}`}>
                    Gate {i + 1} is past security, on the left, about four
                    minutes from here. Follow the signs for the B gates.
                  </AIMessage>,
                ])}
              </AIMessageList>
              <AIInputBar
                value=""
                onValueChange={() => {}}
                onSubmit={() => {}}
              />
            </AICompanionPanel>
          )
        }
      />
    </ThemeProvider>,
  );
