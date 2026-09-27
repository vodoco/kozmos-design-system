import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  DesignConfigProvider,
  KozmosTheme,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ThemeProvider,
  useDesignConfig,
} from "@kozmos-ds/react";

function Controls({ id }: { id: string }) {
  const { updateGlassConfig, updateConfig, injectRuntimeTokens } =
    useDesignConfig();
  return (
    <div data-testid={`${id}-module`} style={{ padding: 32 }}>
      {/* Button's glass variant is the glass role (1f10259): the token's
          numbers in every module. The design config's own glass — blur from
          frost and refraction, noise, texture, bevel, spotlight — is the
          glass class the surface below and the overlay carry. */}
      <Button variant="glass" data-testid={`${id}-glass-button`}>
        {id} glass
      </Button>
      <div
        className="glass glass-spotlight glass-bevel"
        data-testid={`${id}-glass`}
      >
        {id} glass surface
      </div>
      <Button onClick={() => updateGlassConfig({ refraction: 80 })}>
        {id} refraction
      </Button>
      <Button
        onClick={() =>
          updateConfig({
            accessibility: { reduceTransparency: true, reduceMotion: true },
          })
        }
      >
        {id} simplify
      </Button>
      <Button
        onClick={() =>
          injectRuntimeTokens({
            "--primitives-colors-background-0": "rgb(10, 20, 30)",
          })
        }
      >
        {id} override
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button>{id} open</Button>
        </PopoverTrigger>
        <PopoverContent
          className="glass glass-spotlight glass-bevel"
          data-testid={`${id}-overlay`}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {id} overlay
        </PopoverContent>
      </Popover>
      <div className="bg-background" data-testid={`${id}-surface`}>
        Token surface
      </div>
    </div>
  );
}
function App() {
  const [tokens, setTokens] = useState<Record<string, string>>({
    "--primitives-colors-background-0": "rgb(40, 50, 60)",
  });
  const [visible, setVisible] = useState(true);
  return (
    <>
      <button onClick={() => setTokens({})}>Remove declarative tokens</button>
      <button onClick={() => setVisible(false)}>Unmount modules</button>
      {visible && (
        <>
          <ThemeProvider defaultTheme="dark">
            <DesignConfigProvider>
              <Controls id="left" />
            </DesignConfigProvider>
          </ThemeProvider>
          <KozmosTheme
            defaultTheme="light"
            initialConfig={{ glass: { frost: 50 }, noise: false }}
            tokens={tokens}
          >
            <Controls id="right" />
          </KozmosTheme>
        </>
      )}
    </>
  );
}
createRoot(document.getElementById("fixture")!, {
  identifierPrefix: "config:",
}).render(<App />);
