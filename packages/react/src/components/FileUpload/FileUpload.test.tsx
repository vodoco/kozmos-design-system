import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUpload } from "./FileUpload";
import { buttonVariants } from "../../recipes/button";
import { cn } from "../../utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

// GAP-270: New Client's logo. One image, shown once chosen as an avatar-sized
// thumbnail with Change and Remove, where the boards drew an Avatar, a Button
// and an IconButton beside a FileUpload that showed nothing.
describe("FileUpload preview=image", () => {
  let made: string[];
  let revoked: string[];
  const original = {
    create: URL.createObjectURL,
    revoke: URL.revokeObjectURL,
  };

  beforeEach(() => {
    made = [];
    revoked = [];
    URL.createObjectURL = vi.fn((file: Blob) => {
      const url = `blob:kozmos/${(file as File).name}/${made.length}`;
      made.push(url);
      return url;
    });
    URL.revokeObjectURL = vi.fn((url: string) => {
      revoked.push(url);
    });
  });

  afterEach(() => {
    URL.createObjectURL = original.create;
    URL.revokeObjectURL = original.revoke;
  });

  const logo = () => new File(["png"], "acme.png", { type: "image/png" });
  const input = (container: HTMLElement) =>
    container.querySelector('input[type="file"]') as HTMLInputElement;

  it("shows the chosen image as a thumbnail with a named Change and Remove", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FileUpload label="Logo" preview="image" previewAlt="Acme logo" />,
    );
    expect(input(container)).toHaveAttribute("accept", "image/*");
    expect(input(container)).not.toHaveAttribute("multiple");

    // As a browser does it: the drop area is pressed and keeps focus while
    // the system's picker is up, then the picker hands back the file.
    // (user.upload focuses the hidden input itself, which no browser does.)
    const dropzone = screen.getByRole("button", {
      name: "Click to upload: Logo",
    });
    await user.click(dropzone);
    expect(dropzone).toHaveFocus();
    fireEvent.change(input(container), { target: { files: [logo()] } });

    const image = screen.getByRole("img", { name: "Acme logo" });
    expect(image).toHaveAttribute("src", "blob:kozmos/acme.png/0");
    expect(
      screen.queryByRole("button", { name: /Click to upload/ }),
    ).not.toBeInTheDocument();
    const change = screen.getByRole("button", { name: "Change: acme.png" });
    expect(change).toHaveTextContent("Change");
    expect(change).toHaveFocus();
    expect(
      screen.getByRole("button", { name: "Remove file: acme.png" }),
    ).toBeInTheDocument();
    // The label names the control that now holds the field.
    expect(screen.getByText("Logo").closest("label")).toHaveAttribute(
      "for",
      change.id,
    );
  });

  it("names the image by its file when no alt is given", async () => {
    const user = userEvent.setup();
    const { container } = render(<FileUpload preview="image" />);
    await user.upload(input(container), logo());
    expect(screen.getByRole("img", { name: "acme.png" })).toBeInTheDocument();
  });

  it("Change opens the picker, and a new image replaces the old one's URL", async () => {
    const user = userEvent.setup();
    const handleFilesChange = vi.fn();
    const { container } = render(
      <FileUpload preview="image" onFilesChange={handleFilesChange} />,
    );
    await user.upload(input(container), logo());
    const click = vi.spyOn(input(container), "click");
    await user.click(screen.getByRole("button", { name: "Change: acme.png" }));
    expect(click).toHaveBeenCalledTimes(1);

    const next = new File(["jpg"], "acme-2.jpg", { type: "image/jpeg" });
    await user.upload(input(container), next);

    expect(handleFilesChange).toHaveBeenLastCalledWith([next]);
    expect(screen.getByRole("img", { name: "acme-2.jpg" })).toHaveAttribute(
      "src",
      "blob:kozmos/acme-2.jpg/1",
    );
    expect(revoked).toEqual(["blob:kozmos/acme.png/0"]);
  });

  it("Remove brings the drop area back, focused, and revokes the URL", async () => {
    const user = userEvent.setup();
    const handleFilesChange = vi.fn();
    const { container } = render(
      <FileUpload preview="image" onFilesChange={handleFilesChange} />,
    );
    await user.upload(input(container), logo());
    await user.click(
      screen.getByRole("button", { name: "Remove file: acme.png" }),
    );

    expect(handleFilesChange).toHaveBeenLastCalledWith([]);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Click to upload" }),
    ).toHaveFocus();
    expect(revoked).toEqual(["blob:kozmos/acme.png/0"]);
  });

  it("revokes the URL when the part goes", async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<FileUpload preview="image" />);
    await user.upload(input(container), logo());
    unmount();
    expect(revoked).toEqual(["blob:kozmos/acme.png/0"]);
  });

  it("turns away a dropped file that is not an image, and keeps the one shown", async () => {
    const user = userEvent.setup();
    const { container } = render(<FileUpload preview="image" />);
    await user.upload(input(container), logo());
    const pdf = new File(["pdf"], "plan.pdf", { type: "application/pdf" });
    fireEvent.drop(screen.getByRole("button", { name: "Change: acme.png" }), {
      dataTransfer: { files: [pdf] },
    });
    expect(screen.queryByText("plan.pdf is not an image.")).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Remove file: acme.png" }),
    );
    fireEvent.drop(screen.getByRole("button", { name: "Click to upload" }), {
      dataTransfer: { files: [pdf] },
    });
    expect(screen.getByText("plan.pdf is not an image.")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("keeps the image shown when a new pick is over maxSize", async () => {
    const user = userEvent.setup();
    const { container } = render(<FileUpload preview="image" maxSize={3} />);
    await user.upload(input(container), logo());
    const big = new File(["too large"], "big.png", { type: "image/png" });
    await user.upload(input(container), big);
    expect(screen.getByText("big.png exceeds 3 B.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "acme.png" })).toBeInTheDocument();
  });

  it("shows a controlled value's image, and disables both actions", () => {
    render(<FileUpload preview="image" value={[logo()]} disabled />);
    expect(screen.getByRole("img", { name: "acme.png" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Change: acme.png" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Remove file: acme.png" }),
    ).toBeDisabled();
  });

  it("takes no focus later when a controlled value ignored the pick", () => {
    const ignore = vi.fn();
    const { container, rerender } = render(
      <>
        <input aria-label="Client name" />
        <FileUpload preview="image" value={[]} onFilesChange={ignore} />
      </>,
    );
    fireEvent.change(input(container), { target: { files: [logo()] } });
    expect(ignore).toHaveBeenCalledTimes(1);
    const name = screen.getByRole("textbox", { name: "Client name" });
    name.focus();
    rerender(
      <>
        <input aria-label="Client name" />
        <FileUpload preview="image" value={[logo()]} onFilesChange={ignore} />
      </>,
    );
    expect(screen.getByRole("img", { name: "acme.png" })).toBeInTheDocument();
    expect(name).toHaveFocus();
  });

  it("takes a product's own words", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FileUpload
        preview="image"
        changeLabel="Ändern"
        removeLabel="Entfernen"
      />,
    );
    await user.upload(input(container), logo());
    expect(
      screen.getByRole("button", { name: "Ändern: acme.png" }),
    ).toHaveTextContent("Ändern");
    expect(
      screen.getByRole("button", { name: "Entfernen: acme.png" }),
    ).toBeInTheDocument();
  });
});

// GAP-274: a Button-sized trigger for a field with no room for a drop area,
// New Client's "Add logo", picking and validating as the drop area does.
describe("FileUpload variant=button", () => {
  it("is an outline Button with the upload icon and its words, opening the picker", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FileUpload variant="button" browseLabel="Add logo" />,
    );
    const trigger = screen.getByRole("button", { name: "Add logo" });
    expect(trigger).toHaveAttribute("data-kozmos-file-trigger", "button");
    expect(trigger.className).toBe(cn(buttonVariants({ variant: "outline" })));
    expect(trigger.className).not.toContain("border-dashed");
    expect(trigger.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByText("or drag and drop")).not.toBeInTheDocument();
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const opened = vi.spyOn(input, "click");
    await user.click(trigger);
    expect(opened).toHaveBeenCalledTimes(1);
  });

  it("says Choose file with no words of the product's, and names the field with its label", () => {
    const { unmount } = render(<FileUpload variant="button" />);
    expect(
      screen.getByRole("button", { name: "Choose file" }),
    ).toBeInTheDocument();
    unmount();
    render(<FileUpload variant="button" browseLabel="Add logo" label="Logo" />);
    expect(
      screen.getByRole("button", { name: "Add logo: Logo" }),
    ).toBeInTheDocument();
  });

  it("validates as the drop area does: a file over maxSize is turned away", async () => {
    const user = userEvent.setup();
    const handleFilesChange = vi.fn();
    const { container } = render(
      <FileUpload
        variant="button"
        browseLabel="Add logo"
        maxSize={2}
        onFilesChange={handleFilesChange}
      />,
    );
    const input = container.querySelector('input[type="file"]');
    const file = new File(["too large"], "logo.png", { type: "image/png" });
    await user.upload(input as HTMLInputElement, file);
    expect(screen.getByText("logo.png exceeds 2 B.")).toBeInTheDocument();
    expect(handleFilesChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Add logo" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("takes a file dropped on it, and lists what was chosen", () => {
    const handleFilesChange = vi.fn();
    render(
      <FileUpload
        variant="button"
        browseLabel="Add logo"
        onFilesChange={handleFilesChange}
      />,
    );
    const file = new File(["hello"], "plan.pdf", { type: "application/pdf" });
    fireEvent.drop(screen.getByRole("button", { name: "Add logo" }), {
      dataTransfer: { files: [file] },
    });
    expect(handleFilesChange).toHaveBeenCalledWith([file]);
    expect(screen.getByText("plan.pdf")).toBeInTheDocument();
  });

  it("with preview=image, the chosen image takes the button's place, and removing it brings the button back", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FileUpload variant="button" preview="image" browseLabel="Add logo" />,
    );
    const input = container.querySelector('input[type="file"]');
    const file = new File(["png"], "logo.png", { type: "image/png" });
    await user.upload(input as HTMLInputElement, file);
    expect(
      screen.queryByRole("button", { name: "Add logo" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Remove file: logo.png" }),
    );
    expect(screen.getByRole("button", { name: "Add logo" })).toHaveFocus();
  });

  it("is disabled with the field", () => {
    render(<FileUpload variant="button" browseLabel="Add logo" disabled />);
    expect(screen.getByRole("button", { name: "Add logo" })).toBeDisabled();
  });

  describe("its messages, one-file picking and its input (GAP-258)", () => {
    const files = (...names: string[]) =>
      names.map((name) => new File(["x"], name, { type: "text/plain" }));

    it("says the count refusal in the product's words", () => {
      render(
        <FileUpload
          label="Plans"
          maxFiles={2}
          tooManyFilesLabel={(max) => `Höchstens ${max} Dateien.`}
        />,
      );
      fireEvent.drop(screen.getByRole("button", { name: /Plans/ }), {
        dataTransfer: { files: files("a.txt", "b.txt", "c.txt") },
      });
      expect(screen.getByText("Höchstens 2 Dateien.")).toBeInTheDocument();
    });

    it("says the size refusal in the product's words, with the limit written", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <FileUpload
          maxSize={2048}
          tooLargeLabel={(name, limit) => `${name} ist größer als ${limit}.`}
        />,
      );
      await user.upload(
        container.querySelector('input[type="file"]') as HTMLInputElement,
        new File(["x".repeat(4096)], "plan.pdf"),
      );
      expect(
        screen.getByText("plan.pdf ist größer als 2.0 KB."),
      ).toBeInTheDocument();
    });

    it("says the image refusal in the product's words", () => {
      render(
        <FileUpload
          label="Logo"
          preview="image"
          notImageLabel={(name) => `${name} ist kein Bild.`}
        />,
      );
      fireEvent.drop(screen.getByRole("button", { name: /Logo/ }), {
        dataTransfer: { files: files("plan.txt") },
      });
      expect(screen.getByText("plan.txt ist kein Bild.")).toBeInTheDocument();
    });

    it("opens a one-file picker with no count check of its own", () => {
      const onFilesChange = vi.fn();
      const { container } = render(
        <FileUpload
          label="Images"
          multiple={false}
          maxFiles={Infinity}
          onFilesChange={onFilesChange}
        />,
      );
      expect(container.querySelector('input[type="file"]')).not.toHaveAttribute(
        "multiple",
      );
      // A drop can still carry several: the product's own check counts them.
      fireEvent.drop(screen.getByRole("button", { name: /Images/ }), {
        dataTransfer: { files: files("a.txt", "b.txt") },
      });
      expect(onFilesChange).toHaveBeenCalledWith([
        expect.objectContaining({ name: "a.txt" }),
        expect.objectContaining({ name: "b.txt" }),
      ]);
      expect(screen.queryByText(/Select up to/)).not.toBeInTheDocument();
    });

    it("keeps multiple={false} a one-file picker even with maxFiles over 1", () => {
      const { container } = render(
        <FileUpload multiple={false} maxFiles={3} />,
      );
      expect(container.querySelector('input[type="file"]')).not.toHaveAttribute(
        "multiple",
      );
    });

    it("still opens a picker of several when maxFiles is over 1 and multiple is unset", () => {
      const { container } = render(<FileUpload maxFiles={3} />);
      expect(container.querySelector('input[type="file"]')).toHaveAttribute(
        "multiple",
      );
    });

    it("hands the product its input through inputRef, its box through ref", () => {
      const inputRef = React.createRef<HTMLInputElement>();
      const ref = React.createRef<HTMLDivElement>();
      const { container } = render(
        <FileUpload ref={ref} inputRef={inputRef} />,
      );
      expect(inputRef.current).toBe(
        container.querySelector('input[type="file"]'),
      );
      expect(ref.current?.tagName).toBe("DIV");
    });
  });
});
