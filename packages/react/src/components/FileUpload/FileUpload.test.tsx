import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUpload } from "./FileUpload";
import { describe, expect, it, vi } from "vitest";

describe("FileUpload", () => {
  it("exposes one named native picker button with the owned helper description", async () => {
    const user = userEvent.setup();
    render(
      <FileUpload
        label="Documents"
        helperText="Three files maximum"
        aria-describedby="external"
      />,
    );
    const button = screen.getByRole("button", {
      name: "Click to upload: Documents",
    });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute(
      "aria-describedby",
      `external ${screen.getByText("Three files maximum").id}`,
    );
    await user.tab();
    expect(button).toHaveFocus();
  });
  it("renders upload area", () => {
    render(<FileUpload />);
    expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
  });

  it("emits selected files and renders the file list", async () => {
    const user = userEvent.setup();
    const handleFilesChange = vi.fn();
    const { container } = render(
      <FileUpload multiple maxFiles={2} onFilesChange={handleFilesChange} />,
    );
    const input = container.querySelector('input[type="file"]');
    const file = new File(["hello"], "report.csv", { type: "text/csv" });

    await user.upload(input as HTMLInputElement, file);

    expect(handleFilesChange).toHaveBeenCalledWith([file]);
    expect(screen.getByText("report.csv")).toBeInTheDocument();
  });

  it("shows a validation error when a file exceeds max size", async () => {
    const user = userEvent.setup();
    const { container } = render(<FileUpload maxSize={2} />);
    const input = container.querySelector('input[type="file"]');
    const file = new File(["too large"], "large.txt", { type: "text/plain" });

    await user.upload(input as HTMLInputElement, file);

    expect(screen.getByText("large.txt exceeds 2 B.")).toBeInTheDocument();
  });

  it("hears the same file chosen twice: the input is emptied after each pick", async () => {
    const user = userEvent.setup();
    const handleFilesChange = vi.fn();
    const { container } = render(
      <FileUpload onFilesChange={handleFilesChange} />,
    );
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["hello"], "plan.pdf", { type: "application/pdf" });

    await user.upload(input, file);
    expect(handleFilesChange).toHaveBeenLastCalledWith([file]);
    expect(input.value).toBe("");
    expect(input.files).toHaveLength(0);

    await user.upload(input, file);
    expect(handleFilesChange).toHaveBeenCalledTimes(2);
    expect(handleFilesChange).toHaveBeenLastCalledWith([file]);
  });

  it("takes the same file again after its host removed it", async () => {
    const user = userEvent.setup();
    const file = new File(["hello"], "plan.pdf", { type: "application/pdf" });
    const handleFilesChange = vi.fn();
    function Host() {
      const [files, setFiles] = React.useState<File[]>([]);
      return (
        <>
          <FileUpload
            value={files}
            onFilesChange={(next) => {
              handleFilesChange(next);
              setFiles(next);
            }}
          />
          <button type="button" onClick={() => setFiles([])}>
            Clear from host
          </button>
        </>
      );
    }
    const { container } = render(<Host />);
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(input, file);
    expect(screen.getByText("plan.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear from host" }));
    expect(screen.queryByText("plan.pdf")).not.toBeInTheDocument();

    await user.upload(input, file);
    expect(handleFilesChange).toHaveBeenCalledTimes(2);
    expect(screen.getByText("plan.pdf")).toBeInTheDocument();
  });

  it("leaves the input empty after a drop, and the dropped files reach the host", () => {
    const handleFilesChange = vi.fn();
    const { container } = render(
      <FileUpload onFilesChange={handleFilesChange} />,
    );
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["hello"], "plan.pdf", { type: "application/pdf" });

    fireEvent.drop(screen.getByRole("button", { name: "Click to upload" }), {
      dataTransfer: { files: [file] },
    });

    expect(handleFilesChange).toHaveBeenCalledWith([file]);
    expect(input.value).toBe("");
  });

  it("submits nothing with a form: the input has no name, the host gets files by callback", async () => {
    const user = userEvent.setup();
    const handleFilesChange = vi.fn();
    const { container } = render(
      <form>
        <FileUpload onFilesChange={handleFilesChange} />
      </form>,
    );
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["hello"], "plan.pdf", { type: "application/pdf" });

    await user.upload(input, file);

    expect(input).not.toHaveAttribute("name");
    expect([...new FormData(container.querySelector("form")!).keys()]).toEqual(
      [],
    );
    expect(handleFilesChange).toHaveBeenCalledWith([file]);
  });
});
