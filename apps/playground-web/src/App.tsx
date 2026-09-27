import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AnalyticsProvider } from "@kozmos-ds/react";
import {
  RoutingInputGroup,
  MapControlsGroup,
  DynamicIsland,
  RouteSummary,
  SaveLocationCard,
  FeedbackCard,
  Button,
  KozmosTheme,
} from "@kozmos-ds/react";
import {
  NavigationPointer01 as Navigation,
  ArrowRight,
  CornerRightUp,
} from "@kozmos-ds/icons";

function App() {
  const [points, setPoints] = useState([
    { id: "1", value: "Reception" },
    { id: "2", value: "", placeholder: "Add a Stop..." },
    { id: "3", value: "Marketing Dept" },
  ]);

  const [islandState, setIslandState] = useState<
    "minimal" | "compact" | "expanded"
  >("compact");

  // Component Visibility Toggles
  const [viz, setViz] = useState({
    island: true,
    routing: false,
    controls: true,
    saveLocation: false,
    summary: false,
    feedback: false,
    inspector: true,
  });

  const toggleViz = (key: keyof typeof viz) =>
    setViz((prev) => ({ ...prev, [key]: !prev[key] }));

  // White-Label Theme State
  const [themeTokens, setThemeTokens] = useState<Record<string, string>>({});

  const applyTheme = (preset: "default" | "corporate" | "cyberpunk") => {
    if (preset === "default") {
      // Reset to CSS defaults from tokens file (Apple Glass)
      setThemeTokens({
        "--primitives-colors-theme-500": "#135bec",
        "--primitives-colors-background-0": "#ffffff",
        "--primitives-colors-foreground-0": "#000000",
        "--primitives-radius-2xl": "2rem", // 32px
      });
    } else if (preset === "corporate") {
      setThemeTokens({
        "--primitives-colors-theme-500": "#2563eb", // Cobalt blue
        "--primitives-colors-background-0": "#f8fafc", // Slight blue-gray back
        "--primitives-colors-foreground-0": "#1e293b",
        "--primitives-radius-2xl": "0.5rem", // Sharper edges
      });
    } else if (preset === "cyberpunk") {
      setThemeTokens({
        "--primitives-colors-theme-500": "#00ff41", // Neon green matrix
        "--primitives-colors-background-0": "#0d0d0d", // Pure black
        "--primitives-colors-foreground-0": "#00ff41", // Neon text everywhere!
        "--primitives-radius-2xl": "0rem", // Brutalist block
      });
    }
  };

  return (
    <AnalyticsProvider>
      <KozmosTheme tokens={themeTokens}>
        <div
          style={{
            position: "relative",
            width: "100vw",
            height: "100vh",
            backgroundColor: "#171717",
            overflow: "hidden",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* Mock Map Background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              backgroundImage:
                "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=2000&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.4,
              mixBlendMode: "luminosity",
            }}
          ></div>

          {/* --- DYNAMIC COMPONENTS --- */}
          <AnimatePresence>
            {/* Dynamic Island */}
            {viz.island && (
              <motion.div
                key="island"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                style={{
                  position: "absolute",
                  top: 0,
                  width: "100%",
                  zIndex: 100,
                  display: "flex",
                  justifyContent: "center",
                  padding: "16px",
                }}
              >
                <DynamicIsland
                  islandState={islandState}
                  compactLeading={
                    <Navigation width={16} height={16} color="#4ade80" />
                  }
                  compactTrailing={
                    <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                      1.2m
                    </span>
                  }
                  expandedContent={
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        padding: "8px",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#4ade80",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                          }}
                        >
                          In 300ft
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "rgba(255,255,255,0.5)",
                          }}
                        >
                          {islandState === "expanded" ? "Tap to close" : ""}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          marginTop: "8px",
                        }}
                      >
                        <CornerRightUp width={32} height={32} color="white" />
                        <span
                          style={{
                            fontSize: "1.25rem",
                            fontWeight: 500,
                            letterSpacing: "-0.025em",
                          }}
                        >
                          Turn Right on Main Corridor
                        </span>
                      </div>
                    </div>
                  }
                  minimalContent={
                    <Navigation width={20} height={20} color="#4ade80" />
                  }
                />
              </motion.div>
            )}

            {/* Routing Input Group */}
            {viz.routing && (
              <motion.div
                key="routing"
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "96px",
                  zIndex: 50,
                  width: "340px",
                }}
              >
                <RoutingInputGroup
                  points={points}
                  onPointChange={(id: string, value: string) =>
                    setPoints(
                      points.map((p) => (p.id === id ? { ...p, value } : p)),
                    )
                  }
                  onAddPoint={() =>
                    setPoints([
                      ...points,
                      {
                        id: Date.now().toString(),
                        value: "",
                        placeholder: "New Stop",
                      },
                    ])
                  }
                  onRemovePoint={(id: string) =>
                    setPoints(points.filter((p) => p.id !== id))
                  }
                />
              </motion.div>
            )}

            {/* Map Controls Group */}
            {viz.controls && (
              <motion.div
                key="controls"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 50,
                }}
              >
                <MapControlsGroup
                  onZoomIn={() => {}}
                  onZoomOut={() => {}}
                  onCompassReset={() => {}}
                  onMyLocation={() => {}}
                  compassBearing={45}
                />
              </motion.div>
            )}

            {/* Feedback Card */}
            {viz.feedback && (
              <motion.div
                key="feedback"
                initial={{ y: 300, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 300, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                style={{
                  position: "absolute",
                  bottom: "16px",
                  right: "16px",
                  zIndex: 50,
                  width: "340px",
                }}
              >
                <FeedbackCard />
              </motion.div>
            )}

            {/* Bottom Left Features (Save Location + Route Summary) */}
            {(viz.saveLocation || viz.summary) && (
              <motion.div
                key="bottom-panel"
                initial={{ y: 300, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 300, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "16px",
                  zIndex: 50,
                  width: "340px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {viz.saveLocation && <SaveLocationCard isSaved={false} />}
                {viz.summary && (
                  <RouteSummary
                    etaText="7 min"
                    distanceText="0.4 mi"
                    state="preview"
                    transportModeIcon={<ArrowRight />}
                    onEndRoute={() => {}}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- MASTER INSPECTOR PANEL --- */}
          <div
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 90,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(20px)",
              padding: "16px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                marginBottom: "8px",
                letterSpacing: "1px",
              }}
            >
              Kozmos Inspector
            </span>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                paddingBottom: "8px",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}
              >
                ISLAND PHYSICS
              </span>
              <Button
                size="sm"
                variant="ghost"
                style={{
                  backgroundColor:
                    islandState === "minimal"
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                  color: "white",
                  justifyContent: "flex-start",
                }}
                onClick={() => setIslandState("minimal")}
              >
                State: Minimal
              </Button>
              <Button
                size="sm"
                variant="ghost"
                style={{
                  backgroundColor:
                    islandState === "compact"
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                  color: "white",
                  justifyContent: "flex-start",
                }}
                onClick={() => setIslandState("compact")}
              >
                State: Compact
              </Button>
              <Button
                size="sm"
                variant="ghost"
                style={{
                  backgroundColor:
                    islandState === "expanded"
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                  color: "white",
                  justifyContent: "flex-start",
                }}
                onClick={() => setIslandState("expanded")}
              >
                State: Expanded
              </Button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <span
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}
              >
                MOUNT PRIMITIVES
              </span>
              <Button
                size="sm"
                variant={viz.island ? "default" : "outline"}
                onClick={() => toggleViz("island")}
                style={{ justifyContent: "flex-start" }}
              >
                Dynamic Island
              </Button>
              <Button
                size="sm"
                variant={viz.routing ? "default" : "outline"}
                onClick={() => toggleViz("routing")}
                style={{ justifyContent: "flex-start" }}
              >
                Routing Input
              </Button>
              <Button
                size="sm"
                variant={viz.controls ? "default" : "outline"}
                onClick={() => toggleViz("controls")}
                style={{ justifyContent: "flex-start" }}
              >
                Map Controls
              </Button>
              <Button
                size="sm"
                variant={viz.saveLocation ? "default" : "outline"}
                onClick={() => toggleViz("saveLocation")}
                style={{ justifyContent: "flex-start" }}
              >
                Save Location
              </Button>
              <Button
                size="sm"
                variant={viz.summary ? "default" : "outline"}
                onClick={() => toggleViz("summary")}
                style={{ justifyContent: "flex-start" }}
              >
                Route Summary
              </Button>
              <Button
                size="sm"
                variant={viz.feedback ? "default" : "outline"}
                onClick={() => toggleViz("feedback")}
                style={{ justifyContent: "flex-start" }}
              >
                Feedback Card
              </Button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                marginTop: "4px",
              }}
            >
              <span
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}
              >
                WHITE-LABEL THEME
              </span>
              <Button
                size="sm"
                variant="ghost"
                style={{
                  backgroundColor: "rgba(100,100,100,0.2)",
                  color: "white",
                  justifyContent: "flex-start",
                }}
                onClick={() => applyTheme("default")}
              >
                Apple Glass (Default)
              </Button>
              <Button
                size="sm"
                variant="ghost"
                style={{
                  backgroundColor: "hsla(220, 80%, 50%, 0.4)",
                  color: "white",
                  justifyContent: "flex-start",
                }}
                onClick={() => applyTheme("corporate")}
              >
                Corporate Cobalt
              </Button>
              <Button
                size="sm"
                variant="ghost"
                style={{
                  backgroundColor: "hsla(140, 100%, 50%, 0.3)",
                  color: "#4ade80",
                  justifyContent: "flex-start",
                }}
                onClick={() => applyTheme("cyberpunk")}
              >
                Neon Cyberpunk
              </Button>
            </div>
          </div>
        </div>
      </KozmosTheme>
    </AnalyticsProvider>
  );
}

export default App;
