import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Icon } from "./Icon";
import { Home01 as Home } from "@kozmos-ds/icons";

describe("Icon", () => {
  it("renders svg", () => {
    const { container } = render(<Icon icon={Home} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders a registry icon by name", () => {
    const { container } = render(<Icon name="home-line" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies size classes", () => {
    const { container } = render(<Icon icon={Home} size="xl" />);
    expect(container.querySelector("svg")).toHaveClass("h-8");
    expect(container.querySelector("svg")).toHaveClass("w-8");
  });

  it("applies color classes", () => {
    const { container } = render(<Icon icon={Home} color="primary" />);
    expect(container.querySelector("svg")).toHaveClass("text-primary");
  });

  it("renders nothing when no icon source is provided", () => {
    const { container } = render(<Icon />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});
