import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";
import * as Tokens from "@kozmos-ds/tokens";

const meta: Meta = {
  title: "Design System/Tokens/Map",
};

export default meta;

type Story = StoryObj;
type TokenEntry = [string, string];

const stringTokens = Object.entries(Tokens).filter(
  (entry): entry is TokenEntry => typeof entry[1] === "string",
);

const isColorValue = (value: string) =>
  value.startsWith("#") ||
  value.startsWith("rgb") ||
  value.startsWith("hsl") ||
  value === "transparent";

const primitiveColors = stringTokens.filter(([key]) =>
  key.startsWith("PrimitivesColors"),
);

const semanticAndComponentColors = stringTokens.filter(
  ([key, value]) =>
    (key.startsWith("Semantics") || key.startsWith("Components")) &&
    isColorValue(value),
);

const radiusTokens = stringTokens.filter(([key]) =>
  key.startsWith("PrimitivesRadius"),
);

const spacingTokens = stringTokens.filter(([key]) =>
  key.startsWith("PrimitivesSpacing"),
);

const typographyTokens = stringTokens.filter(([key]) =>
  key.startsWith("PrimitivesTypography"),
);

const TokenPage = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <div
    style={{
      padding: "20px",
      fontFamily: "sans-serif",
      color: "#0f172a",
      background: "#f8fafc",
      minHeight: "100vh",
    }}
  >
    <h1 style={{ margin: 0 }}>{title}</h1>
    <p style={{ color: "#64748b", marginBottom: "32px" }}>{description}</p>
    {children}
  </div>
);

const ColorCard = ({ name, value }: { name: string; value: string }) => (
  <div
    style={{
      border: "1px solid #e2e8f0",
      padding: "16px",
      borderRadius: "8px",
      background: "#fff",
    }}
  >
    <div
      style={{
        width: "100%",
        height: "60px",
        backgroundColor: value,
        border: "1px solid #cbd5e1",
        borderRadius: "4px",
        marginBottom: "12px",
      }}
    />
    <div
      style={{
        fontSize: "13px",
        fontWeight: "bold",
        color: "#0f172a",
        wordBreak: "break-all",
      }}
    >
      {name}
    </div>
    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
      {value}
    </div>
  </div>
);

const ColorGrid = ({ tokens }: { tokens: TokenEntry[] }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
      gap: "20px",
    }}
  >
    {tokens.map(([key, value]) => (
      <ColorCard key={key} name={key} value={value} />
    ))}
  </div>
);

const SectionHeading = ({ children }: { children: ReactNode }) => (
  <h2
    style={{
      marginTop: "40px",
      borderBottom: "1px solid #e2e8f0",
      paddingBottom: "10px",
    }}
  >
    {children}
  </h2>
);

export const PrimitiveColors: Story = {
  render: () => (
    <TokenPage
      title="Kozmos Primitive Colors"
      description="Raw palette exports generated from the token pipeline."
    >
      <ColorGrid tokens={primitiveColors} />
    </TokenPage>
  ),
};

export const SemanticAndComponentColors: Story = {
  render: () => (
    <TokenPage
      title="Kozmos Semantic & Component Colors"
      description="Mode-aware semantic and component color exports that map design decisions into runtime code."
    >
      <ColorGrid tokens={semanticAndComponentColors} />
    </TokenPage>
  ),
};

export const ShapeAndSpacing: Story = {
  render: () => (
    <TokenPage
      title="Kozmos Shape & Spacing"
      description="Radius and spacing primitives used across component layout."
    >
      <SectionHeading>Primitives: Radius</SectionHeading>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {radiusTokens.map(([key, value]) => (
          <div
            key={key}
            style={{
              border: "1px solid #e2e8f0",
              padding: "16px",
              borderRadius: "8px",
              width: "180px",
              background: "#fff",
            }}
          >
            <div
              style={{
                height: "60px",
                background: "#0f172a",
                borderRadius: value,
                marginBottom: "12px",
              }}
            />
            <div
              style={{ fontSize: "13px", fontWeight: "bold", color: "#0f172a" }}
            >
              {key}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>{value}</div>
          </div>
        ))}
      </div>

      <SectionHeading>Primitives: Spacing</SectionHeading>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {spacingTokens.map(([key, value]) => (
          <div
            key={key}
            style={{ display: "flex", alignItems: "center", gap: "16px" }}
          >
            <div
              style={{
                width: value,
                height: "24px",
                background: "#3b82f6",
                borderRadius: "4px",
              }}
            />
            <span
              style={{
                fontSize: "13px",
                fontWeight: "bold",
                color: "#0f172a",
                width: "250px",
              }}
            >
              {key}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>{value}</span>
          </div>
        ))}
      </div>
    </TokenPage>
  ),
};

export const Typography: Story = {
  render: () => (
    <TokenPage
      title="Kozmos Typography"
      description="Typography token exports with live text samples."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {typographyTokens.map(([key, value]) => (
          <div
            key={key}
            style={{
              border: "1px solid #e2e8f0",
              padding: "16px",
              borderRadius: "8px",
              background: "#fff",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: "#64748b",
                marginBottom: "8px",
              }}
            >
              {key}
            </div>
            <div
              style={{
                fontFamily: key.includes("Family") ? value : "inherit",
                fontSize: key.includes("Size")
                  ? value.endsWith("rem") || value.endsWith("px")
                    ? value
                    : `${value}px`
                  : "16px",
                fontWeight: key.includes("Weight") ? value : "normal",
              }}
            >
              The quick brown fox jumps over the lazy dog. Sphinx of black
              quartz, judge my vow.
            </div>
            <div
              style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}
            >
              Value: {value}
            </div>
          </div>
        ))}
      </div>
    </TokenPage>
  ),
};
