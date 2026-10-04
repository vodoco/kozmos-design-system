import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/react";
import { expect, it } from "vitest";
import * as stories from "./AICompanionPanel.stories";

const { Conversation } = composeStories(stories);

it("the conversation reports the number of result cards it actually offers", () => {
  render(<Conversation />);
  const results = screen.getAllByRole("button", { name: /Restroom East Wing/ });
  expect(results).toHaveLength(1);
  expect(screen.getByText(`${results.length} result`)).toBeInTheDocument();
  expect(screen.queryByText("2 results")).not.toBeInTheDocument();
});
