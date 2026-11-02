// @vitest-environment node
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../ThemeProvider/ThemeProvider";
import { Toaster, toast } from "./Toaster";

afterEach(() => vi.restoreAllMocks());

describe("toast() and Toaster on the server", () => {
  it("renders a Toaster with no warning, in a provider and out of one, and no toast in it", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    toast("From a request");
    const html =
      renderToString(
        <ThemeProvider theme="light">
          <Toaster />
        </ThemeProvider>,
      ) + renderToString(<Toaster />);
    expect(error).not.toHaveBeenCalled();
    expect(html).not.toContain("From a request");
  });

  it("queues nothing: the server's module is every request's", () => {
    const dismissed = vi.fn();
    const id = toast("From a request", { onDismiss: dismissed });
    expect(id).toMatch(/^kozmos-toast-/);
    // A queued toast would be dismissed, and say so.
    toast.dismiss(id);
    toast.dismiss();
    expect(dismissed).not.toHaveBeenCalled();
  });
});
