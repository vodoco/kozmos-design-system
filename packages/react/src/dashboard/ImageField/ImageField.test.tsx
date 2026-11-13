import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageField, type ImageFieldImage } from "./ImageField";

const jpeg = (name = "lobby.jpg", size = 10) =>
  new File(["x".repeat(size)], name, { type: "image/jpeg" });

let made = 0;
const created: string[] = [];
const revoked: string[] = [];

beforeEach(() => {
  made = 0;
  created.length = 0;
  revoked.length = 0;
  URL.createObjectURL = vi.fn(() => {
    made += 1;
    const url = `blob:image-${made}`;
    created.push(url);
    return url;
  });
  URL.revokeObjectURL = vi.fn((url: string) => {
    revoked.push(url);
  });
  // A 1600 × 1200 image, once it loads.
  Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
    configurable: true,
    get: () => 1600,
  });
  Object.defineProperty(HTMLImageElement.prototype, "naturalHeight", {
    configurable: true,
    get: () => 1200,
  });
});

afterEach(() => {
  delete (HTMLImageElement.prototype as { naturalWidth?: number }).naturalWidth;
  delete (HTMLImageElement.prototype as { naturalHeight?: number })
    .naturalHeight;
});

const fileInput = (container: HTMLElement) =>
  container.querySelector('input[type="file"]') as HTMLInputElement;

const stored: ImageFieldImage[] = [
  { id: "a", src: "https://cdn.example/a.jpg", alt: "Main entrance" },
  { id: "b", src: "https://cdn.example/b.jpg", alt: "" },
];

/** The cropper, with its image loaded. */
function loadedCropper() {
  const dialog = screen.getByRole("dialog");
  const cropper = within(dialog).getByRole("application", {
    name: "Image frame",
  });
  fireEvent.load(cropper.querySelector("img") as HTMLImageElement);
  return { dialog, cropper };
}

describe("ImageField", () => {
  it("is a named group with a live count of max", async () => {
    const user = userEvent.setup();
    const { container } = render(<ImageField label="Images" max={7} />);
    const group = screen.getByRole("group", { name: "Images" });
    const count = screen.getByText("0 of 7 images");
    expect(count).toHaveAttribute("aria-live", "polite");
    expect(group).toHaveAccessibleDescription("0 of 7 images");

    await user.upload(fileInput(container), jpeg());
    expect(screen.getByText("1 of 7 images")).toBe(count);
  });

  it("limits the picker to the allowed types and hands the product the file", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <ImageField label="Images" max={7} onChange={onChange} />,
    );
    expect(fileInput(container)).toHaveAttribute(
      "accept",
      "image/jpeg,image/png",
    );
    expect(
      screen.getByRole("button", { name: "Upload an image" }),
    ).toBeInTheDocument();

    const file = jpeg();
    await user.upload(fileInput(container), file);
    expect(onChange).toHaveBeenCalledTimes(1);
    const [images] = onChange.mock.calls[0];
    expect(images).toEqual([
      { id: expect.any(String), src: "blob:image-1", alt: "", file },
    ]);
    // No alt text yet, so the thumbnail is not an image to a reader.
    const item = screen.getByRole("listitem");
    expect(item.querySelector("img")).toHaveAttribute("src", "blob:image-1");
  });

  it("checks the type again after a pick or a drop, with an error", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onChange = vi.fn();
    const { container } = render(
      <ImageField label="Images" max={7} onChange={onChange} />,
    );
    await user.upload(
      fileInput(container),
      new File(["%PDF"], "plan.pdf", { type: "application/pdf" }),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByText("plan.pdf is not one of JPG, PNG."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload an image" }),
    ).toHaveAttribute("aria-invalid", "true");
  });

  it("refuses a file over maxSize, saying the limit", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <ImageField
        label="Images"
        max={7}
        maxSize={2 * 1024 * 1024}
        onChange={onChange}
      />,
    );
    await user.upload(
      fileInput(container),
      jpeg("huge.jpg", 2 * 1024 * 1024 + 1),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("huge.jpg is larger than 2 MB.")).toBeVisible();
  });

  it("refuses more files than it has room for", () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <ImageField
        label="Images"
        max={4}
        defaultValue={stored}
        onChange={onChange}
      />,
    );
    // Two left: the picker takes several, and three are too many.
    expect(fileInput(container)).toHaveAttribute("multiple");
    fireEvent.drop(screen.getByRole("button", { name: "Upload an image" }), {
      dataTransfer: { files: [jpeg("1.jpg"), jpeg("2.jpg"), jpeg("3.jpg")] },
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Add 2 more images at most.")).toBeVisible();
    // One left: the picker takes one file at a time.
    rerender(
      <ImageField
        label="Images"
        max={3}
        defaultValue={stored}
        onChange={onChange}
      />,
    );
    expect(fileInput(container)).not.toHaveAttribute("multiple");
  });

  it("says the types, the size limit and the ratio under the drop zone", () => {
    render(
      <ImageField
        label="Images"
        max={7}
        maxSize={2 * 1024 * 1024}
        aspectRatio={16 / 9}
      />,
    );
    expect(screen.getByText("JPG, PNG · Max 2 MB · 16:9")).toBeVisible();
  });

  it("adds an image by URL, by button or Enter, and checks the address", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ImageField label="Images" max={7} onChange={onChange} />);
    const field = screen.getByRole("textbox", { name: "Image URL" });

    await user.type(field, "not a url");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(field).toHaveAccessibleDescription(
      "Enter a web address that starts with https:// or http://.",
    );

    await user.clear(field);
    await user.type(field, "javascript:alert(1){Enter}");
    expect(onChange).not.toHaveBeenCalled();

    await user.clear(field);
    await user.type(field, "https://cdn.example/hall.png{Enter}");
    expect(onChange).toHaveBeenLastCalledWith([
      { id: expect.any(String), src: "https://cdn.example/hall.png", alt: "" },
    ]);
    expect(field).toHaveValue("");
    expect(field).not.toHaveAccessibleDescription(
      "Enter a web address that starts with https:// or http://.",
    );
  });

  it("stops taking images at max", () => {
    render(<ImageField label="Logo" max={2} defaultValue={stored} />);
    expect(screen.getByText("2 of 2 images")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Upload an image" }),
    ).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Image URL" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  it("removes an image by a named button, focus moving to the next", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ImageField
        label="Images"
        max={7}
        defaultValue={stored}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Remove image 1" }));
    expect(onChange).toHaveBeenLastCalledWith([stored[1]]);
    // What was image 2 is image 1 now, and its Remove has focus.
    expect(
      screen.getByRole("button", { name: "Remove image 1" }),
    ).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole("textbox", { name: "Image URL" })).toHaveFocus();
  });

  it("revokes the object URL it made when that image is removed", async () => {
    const user = userEvent.setup();
    const { container } = render(<ImageField label="Images" max={7} />);
    await user.upload(fileInput(container), jpeg());
    expect(revoked).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Remove image 1" }));
    expect(revoked).toEqual(["blob:image-1"]);
  });

  it("edits each image's alt text", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ImageField
        label="Images"
        max={7}
        defaultValue={stored}
        onChange={onChange}
      />,
    );
    const alt = screen.getByRole("textbox", { name: "Alt text, image 2" });
    await user.type(alt, "Café");
    expect(onChange).toHaveBeenLastCalledWith([
      stored[0],
      { ...stored[1], alt: "Café" },
    ]);
    expect(screen.getAllByRole("img")[1]).toHaveAttribute("alt", "Café");
  });

  it("previews an image in a dialog with its alt text; Escape closes and focus returns", async () => {
    const user = userEvent.setup();
    render(<ImageField label="Images" max={7} defaultValue={stored} />);
    const open = screen.getByRole("button", { name: "Preview image 1" });
    await user.click(open);

    const dialog = screen.getByRole("dialog", { name: "Image 1" });
    expect(dialog).toHaveAccessibleDescription("Main entrance");
    expect(
      within(dialog).getByRole("img", { name: "Main entrance" }),
    ).toHaveAttribute("src", "https://cdn.example/a.jpg");
    expect(dialog).toHaveClass("kozmos-image-field-preview");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(open).toHaveFocus();
  });

  it("says when a previewed image has no alt text", async () => {
    const user = userEvent.setup();
    render(<ImageField label="Images" max={7} defaultValue={stored} />);
    await user.click(screen.getByRole("button", { name: "Preview image 2" }));
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
      "No alt text yet.",
    );
  });

  it("has no cropper without an aspect ratio", () => {
    render(<ImageField label="Images" max={7} defaultValue={stored} />);
    expect(
      screen.queryByRole("button", { name: "Frame image 1" }),
    ).not.toBeInTheDocument();
  });

  it("opens the cropper when one image is added, and frames it by keyboard", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <ImageField
        label="Images"
        max={7}
        aspectRatio={16 / 9}
        onChange={onChange}
      />,
    );
    await user.upload(fileInput(container), jpeg());
    const { dialog, cropper } = loadedCropper();
    expect(dialog).toHaveAccessibleName("Frame the image");
    expect(cropper).toHaveAttribute("tabindex", "0");
    expect(cropper).toHaveAccessibleDescription(
      "Drag the image, or use the arrow keys to move the frame and plus and minus to zoom.",
    );
    const status = within(dialog).getByRole("status");
    expect(status).toHaveTextContent("");

    // 1600 × 1200 at 16:9: the frame is the whole width and 3/4 of the
    // height, starting in the middle, 1/8 down.
    cropper.focus();
    await user.keyboard("{ArrowDown}");
    expect(status).toHaveTextContent(
      "Frame 0% from the left, 20% from the top, zoom 100%.",
    );
    // At the left edge already: it stays there.
    await user.keyboard("{ArrowLeft}");
    expect(status).toHaveTextContent("Frame 0% from the left");
    await user.keyboard("+");
    expect(status).toHaveTextContent("zoom 125%");
    await user.keyboard("{ArrowRight}");
    await user.keyboard("-");
    await user.keyboard("+");

    await user.click(within(dialog).getByRole("button", { name: "Apply" }));
    const [[image]] = onChange.mock.calls.at(-1)!;
    // Zoomed about the middle: 0.8 × 0.6, at 0.1 and 0.275, then 0.08 right
    // (a tenth of 0.8). Zoomed out, the whole width is the frame, so it is
    // held at the left edge; zoomed in again about that middle, 0.1.
    expect(image.crop.width).toBeCloseTo(0.8);
    expect(image.crop.height).toBeCloseTo(0.6);
    expect(image.crop.x).toBeCloseTo(0.1);
    expect(image.crop.y).toBeCloseTo(0.275);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Focus lands on the new image's Frame button.
    expect(screen.getByRole("button", { name: "Frame image 1" })).toHaveFocus();
  });

  it("zooms with buttons, between 1 and 4", async () => {
    const user = userEvent.setup();
    render(
      <ImageField
        label="Images"
        max={7}
        aspectRatio={16 / 9}
        defaultValue={stored}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Frame image 1" }));
    const { dialog } = loadedCropper();
    const zoomOut = within(dialog).getByRole("button", { name: "Zoom out" });
    const zoomIn = within(dialog).getByRole("button", { name: "Zoom in" });
    expect(zoomOut).toBeDisabled();
    for (let i = 0; i < 7; i += 1) await user.click(zoomIn);
    expect(zoomIn).toBeDisabled();
    expect(within(dialog).getByRole("status")).toHaveTextContent("zoom 400%");
  });

  it("moves the frame when the image is dragged", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ImageField
        label="Images"
        max={7}
        aspectRatio={16 / 9}
        defaultValue={stored}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Frame image 1" }));
    const { dialog, cropper } = loadedCropper();
    vi.spyOn(cropper, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 0, 320, 180),
    );
    // Dragging the image up by a tenth of the box shows more of its bottom:
    // the frame moves down by a tenth of its own height, 0.075.
    fireEvent.pointerDown(cropper, {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(cropper, { pointerId: 1, clientX: 100, clientY: 82 });
    fireEvent.pointerUp(cropper, { pointerId: 1 });
    expect(within(dialog).getByRole("status")).toHaveTextContent(
      "Frame 0% from the left, 20% from the top",
    );
    await user.click(within(dialog).getByRole("button", { name: "Apply" }));
    expect(onChange.mock.calls.at(-1)![0][0].crop.y).toBeCloseTo(0.2);
  });

  it("opens on the frame an image already has, and Cancel keeps it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const crop = { x: 0.1, y: 0.2, width: 0.5, height: 0.375 };
    render(
      <ImageField
        label="Images"
        max={7}
        aspectRatio={16 / 9}
        defaultValue={[{ ...stored[0], crop }]}
        onChange={onChange}
      />,
    );
    const open = screen.getByRole("button", { name: "Frame image 1" });
    await user.click(open);
    const { dialog, cropper } = loadedCropper();
    cropper.focus();
    await user.keyboard("{ArrowUp}");
    // 0.2 less a tenth of 0.375.
    expect(within(dialog).getByRole("status")).toHaveTextContent(
      "Frame 10% from the left, 16% from the top, zoom 200%.",
    );
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(open).toHaveFocus();
  });

  it("draws a framed thumbnail at the ratio", () => {
    render(
      <ImageField
        label="Images"
        max={7}
        aspectRatio={16 / 9}
        defaultValue={[
          {
            ...stored[0],
            crop: { x: 0.25, y: 0.5, width: 0.5, height: 0.25 },
          },
        ]}
      />,
    );
    const image = screen.getByRole("img", { name: "Main entrance" });
    expect(image.parentElement).toHaveStyle({ aspectRatio: String(16 / 9) });
    expect(image).toHaveStyle({
      width: "200%",
      height: "400%",
      left: "-50%",
      top: "-200%",
    });
  });

  it("moves the frame left on ArrowLeft right to left too: an image does not mirror", async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <ImageField
          label="Images"
          max={7}
          aspectRatio={1}
          defaultValue={stored}
        />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "Frame image 1" }));
    const { dialog, cropper } = loadedCropper();
    cropper.focus();
    // A square of 1200 in 1600: 0.75 wide, starting 0.125 in.
    await user.keyboard("{ArrowLeft}");
    expect(within(dialog).getByRole("status")).toHaveTextContent(
      "Frame 5% from the left",
    );
  });

  it("keeps a web address left to right, and lets alt text take its own direction", () => {
    render(
      <div dir="rtl">
        <ImageField label="Images" max={7} defaultValue={stored} />
      </div>,
    );
    expect(screen.getByRole("textbox", { name: "Image URL" })).toHaveAttribute(
      "dir",
      "ltr",
    );
    expect(
      screen.getByRole("textbox", { name: "Alt text, image 1" }),
    ).toHaveAttribute("dir", "auto");
  });

  it("takes the product's words", async () => {
    const user = userEvent.setup();
    render(
      <ImageField
        label="Görseller"
        max={7}
        defaultValue={stored}
        labels={{
          count: (n, max) => `${n}/${max} görsel`,
          remove: (n) => `Görsel ${n} kaldır`,
          upload: "Görsel yükle",
        }}
      />,
    );
    expect(screen.getByText("2/7 görsel")).toBeVisible();
    expect(screen.getByRole("button", { name: "Görsel yükle" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Görsel 1 kaldır" }));
    expect(screen.getByText("1/7 görsel")).toBeVisible();
  });

  it("disabled, takes nothing and removes nothing, but still previews", () => {
    render(
      <ImageField label="Images" max={7} defaultValue={stored} disabled />,
    );
    expect(screen.getByRole("group")).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByRole("button", { name: "Upload an image" }),
    ).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Image URL" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Remove image 1" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("textbox", { name: "Alt text, image 1" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Preview image 1" }),
    ).toBeEnabled();
  });

  it("is controlled when given a value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ImageField label="Images" max={7} value={stored} onChange={onChange} />,
    );
    await user.click(screen.getByRole("button", { name: "Remove image 1" }));
    expect(onChange).toHaveBeenCalledWith([stored[1]]);
    // The product has not changed its value: both are still drawn.
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    await act(async () => {});
  });
});
