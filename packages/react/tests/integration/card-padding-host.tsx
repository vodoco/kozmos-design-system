import { createRoot } from "react-dom/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  ThemeProvider,
  type CardPadding,
} from "@kozmos-ds/react";

/**
 * Cards in the built package, for scripts/check-card-padding.mjs (GAP-194):
 * each shape a product builds, in both paddings. Every part holds one block,
 * `data-probe`, whose top is where the part's content starts, so the check
 * measures what is drawn rather than a class.
 */
const Probe = ({ name }: { name: string }) => (
  <div data-probe={name}>{name}</div>
);

function Cases({ padding }: { padding: CardPadding }) {
  const at = (shape: string) => ({ "data-case": `${shape}-${padding}` });
  return (
    <div style={{ display: "grid", gap: 16, width: 320 }}>
      <Card padding={padding} {...at("header-led")}>
        <CardHeader>
          <CardTitle>
            <Probe name="header" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Probe name="content" />
        </CardContent>
        <CardFooter>
          <Probe name="footer" />
        </CardFooter>
      </Card>
      <Card padding={padding} {...at("content-only")}>
        <CardContent>
          <Probe name="content" />
        </CardContent>
      </Card>
      <Card padding={padding} {...at("content-footer")}>
        <CardContent>
          <Probe name="content" />
        </CardContent>
        <CardFooter>
          <Probe name="footer" />
        </CardFooter>
      </Card>
      <Card padding={padding} {...at("footer-only")}>
        <CardFooter>
          <Probe name="footer" />
        </CardFooter>
      </Card>
      {/* A form around a header-led card's parts, as the site's account
          settings have it: the content is not the card's first child. */}
      <Card padding={padding} {...at("form-header-led")}>
        <form>
          <CardHeader>
            <Probe name="header" />
          </CardHeader>
          <CardContent>
            <Probe name="content" />
          </CardContent>
        </form>
      </Card>
      <Card padding={padding} {...at("caller-p-0")}>
        <CardContent className="p-0">
          <Probe name="content" />
        </CardContent>
      </Card>
      <Card padding={padding} {...at("caller-pt-2")}>
        <CardContent className="pt-2">
          <Probe name="content" />
        </CardContent>
      </Card>
      {/* A header-led card inside a header-less one's content: the inner
          content takes nothing from the outer card's first child. */}
      <Card padding={padding} {...at("nested")}>
        <CardContent>
          <Probe name="content" />
          <Card padding={padding} data-inner="">
            <CardHeader>
              <Probe name="inner-header" />
            </CardHeader>
            <CardContent>
              <Probe name="inner-content" />
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

createRoot(document.getElementById("fixture")!).render(
  <ThemeProvider theme="light">
    <main style={{ display: "flex", gap: 24, padding: 16 }}>
      <Cases padding="default" />
      <Cases padding="compact" />
    </main>
  </ThemeProvider>,
);
