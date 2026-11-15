import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { ImageCropper, type ImageCropperCrop } from "./ImageCropper";

beforeEach(() => {
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

const SRC = "https://cdn.example/logo.png";

/** The cropper, with its image loaded. */
function loaded() {
  const cropper = screen.getByRole("application", { name: "Image frame" });
  fireEvent.load(cropper.querySelector("img") as HTMLImageElement);
  return cropper;
}

const lastCrop = (onCrop: ReturnType<typeof vi.fn>) =>
  onCrop.mock.calls.at(-1)![0] as ImageCropperCrop;

describe("ImageCropper", () => {
  it("is one named, described tab stop, square by default, with a quiet live region", () => {
    render(<ImageCropper src={SRC} alt="Pointr logo" />);
    const cropper = loaded();
    expect(cropper).toHaveAttribute("tabindex", "0");
    expect(cropper).toHaveAttribute("aria-roledescription", "cropper");
    expect(cropper).toHaveAccessibleDescription(
      "Drag the image, or use the arrow keys to move the frame and plus and minus to zoom.",
    );
    expect(cropper).toHaveStyle({ aspectRatio: "1" });
    expect(screen.getByRole("img", { name: "Pointr logo" })).toBeVisible();
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("");
  });

  it("hands the starting frame to onImageLoad, not onCrop: it is no change", () => {
    const onCrop = vi.fn();
    const onImageLoad = vi.fn();
    render(
      <ImageCropper
        src={SRC}
        alt=""
        onCrop={onCrop}
        onImageLoad={onImageLoad}
      />,
    );
    expect(onImageLoad).not.toHaveBeenCalled();
    loaded();
    expect(onCrop).not.toHaveBeenCalled();
    // A square of 1200 in 1600: 0.75 wide and the whole height, centred.
    expect(onImageLoad).toHaveBeenCalledTimes(1);
    const crop = lastCrop(onImageLoad);
    expect(crop.x).toBeCloseTo(0.125);
    expect(crop.y).toBeCloseTo(0);
    expect(crop.width).toBeCloseTo(0.75);
    expect(crop.height).toBeCloseTo(1);
  });

  it("moves the frame by arrow keys and zooms by plus and minus, saying each change", async () => {
    const user = userEvent.setup();
    const onCrop = vi.fn();
    render(
      <ImageCropper src={SRC} alt="" aspectRatio={16 / 9} onCrop={onCrop} />,
    );
    const cropper = loaded();
    const status = screen.getByRole("status");
    // 1600 × 1200 at 16:9: the whole width and 3/4 of the height, 1/8 down.
    cropper.focus();
    await user.keyboard("{ArrowDown}");
    expect(status).toHaveTextContent(
      "Frame 0% from the left, 20% from the top, zoom 100%.",
    );
    // At the left edge already: it stays there, and says so.
    onCrop.mockClear();
    await user.keyboard("{ArrowLeft}");
    expect(status).toHaveTextContent("Frame 0% from the left");
    expect(onCrop).not.toHaveBeenCalled();
    await user.keyboard("+");
    expect(status).toHaveTextContent("zoom 125%");
    await user.keyboard("{ArrowRight}");
    await user.keyboard("-");
    await user.keyboard("=");
    // Zoomed about the middle: 0.8 × 0.6, at 0.1 and 0.275, then 0.08 right
    // (a tenth of 0.8). Zoomed out, the whole width is the frame, so it is
    // held at the left edge; zoomed in again about that middle, 0.1.
    const crop = lastCrop(onCrop);
    expect(crop.width).toBeCloseTo(0.8);
    expect(crop.height).toBeCloseTo(0.6);
    expect(crop.x).toBeCloseTo(0.1);
    expect(crop.y).toBeCloseTo(0.275);
  });

  it("moves the frame left on ArrowLeft right to left too: an image does not mirror", async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <ImageCropper src={SRC} alt="" />
      </div>,
    );
    const cropper = loaded();
    cropper.focus();
    // A square of 1200 in 1600: 0.75 wide, starting 0.125 in.
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Frame 5% from the left",
    );
  });

  it("zooms with buttons between 1 and maxZoom, keeping focus at the limits", async () => {
    const user = userEvent.setup();
    render(<ImageCropper src={SRC} alt="" maxZoom={2} />);
    loaded();
    const zoomOut = screen.getByRole("button", { name: "Zoom out" });
    const zoomIn = screen.getByRole("button", { name: "Zoom in" });
    expect(zoomOut).toHaveAttribute("aria-disabled", "true");
    for (let i = 0; i < 4; i += 1) await user.click(zoomIn);
    // At the limit it is unavailable, not disabled: focus stays on it.
    expect(zoomIn).toHaveAttribute("aria-disabled", "true");
    expect(zoomIn).toBeEnabled();
    expect(zoomIn).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("zoom 200%");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("zoom 200%");
    await user.click(zoomOut);
    for (let i = 0; i < 4; i += 1) await user.keyboard("{Enter}");
    expect(zoomOut).toHaveAttribute("aria-disabled", "true");
    expect(zoomOut).toHaveFocus();
    expect(zoomIn).not.toHaveAttribute("aria-disabled");
  });

  it("has a zoom Slider in percent that zooms about the middle and leaves the live region to the slider", async () => {
    const user = userEvent.setup();
    const onCrop = vi.fn();
    render(<ImageCropper src={SRC} alt="" onCrop={onCrop} />);
    loaded();
    const slider = screen.getByRole("slider", { name: "Zoom" });
    expect(slider).toHaveAttribute("aria-valuemin", "100");
    expect(slider).toHaveAttribute("aria-valuemax", "400");
    expect(slider).toHaveAttribute("aria-valuenow", "100");
    expect(slider).toHaveAttribute("aria-valuetext", "100%");
    slider.focus();
    await user.keyboard("{PageUp}");
    // Radix's PageUp is ten steps: 110%.
    expect(slider).toHaveAttribute("aria-valuetext", "110%");
    const crop = lastCrop(onCrop);
    expect(crop.width).toBeCloseTo(0.75 / 1.1);
    expect(crop.x + crop.width / 2).toBeCloseTo(0.5);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("can leave the zoom row out", () => {
    render(<ImageCropper src={SRC} alt="" showZoomControls={false} />);
    expect(
      screen.queryByRole("button", { name: "Zoom in" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("moves the frame when the image is dragged, and says where once it lets go", () => {
    const onCrop = vi.fn();
    render(
      <ImageCropper src={SRC} alt="" aspectRatio={16 / 9} onCrop={onCrop} />,
    );
    const cropper = loaded();
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
    expect(lastCrop(onCrop).y).toBeCloseTo(0.2);
    expect(screen.getByRole("status")).toHaveTextContent("");
    fireEvent.pointerUp(cropper, { pointerId: 1 });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Frame 0% from the left, 20% from the top, zoom 100%.",
    );
  });

  it("zooms when two pointers pinch", () => {
    const onCrop = vi.fn();
    render(<ImageCropper src={SRC} alt="" onCrop={onCrop} />);
    const cropper = loaded();
    vi.spyOn(cropper, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 0, 200, 200),
    );
    fireEvent.pointerDown(cropper, {
      pointerId: 1,
      button: 0,
      clientX: 80,
      clientY: 100,
    });
    fireEvent.pointerDown(cropper, {
      pointerId: 2,
      button: 0,
      clientX: 120,
      clientY: 100,
    });
    // The fingers twice as far apart about the same middle: zoom 200%.
    fireEvent.pointerMove(cropper, { pointerId: 1, clientX: 60, clientY: 100 });
    fireEvent.pointerMove(cropper, {
      pointerId: 2,
      clientX: 140,
      clientY: 100,
    });
    const crop = lastCrop(onCrop);
    expect(crop.width).toBeCloseTo(0.375);
    expect(crop.x + crop.width / 2).toBeCloseTo(0.5);
    fireEvent.pointerUp(cropper, { pointerId: 1 });
    fireEvent.pointerUp(cropper, { pointerId: 2 });
    expect(screen.getByRole("status")).toHaveTextContent("zoom 200%");
  });

  it("opens on the frame it is given, held to the ratio and the image", async () => {
    const user = userEvent.setup();
    render(
      <ImageCropper
        src={SRC}
        alt=""
        aspectRatio={16 / 9}
        defaultValue={{ x: 0.1, y: 0.2, width: 0.5, height: 0.375 }}
      />,
    );
    const cropper = loaded();
    cropper.focus();
    await user.keyboard("{ArrowUp}");
    // 0.2 less a tenth of 0.375.
    expect(screen.getByRole("status")).toHaveTextContent(
      "Frame 10% from the left, 16% from the top, zoom 200%.",
    );
  });

  it("follows a controlled value", async () => {
    const user = userEvent.setup();
    const onCrop = vi.fn();
    const { rerender } = render(
      <ImageCropper
        src={SRC}
        alt=""
        value={{ x: 0, y: 0, width: 0.375, height: 0.5 }}
        onCrop={onCrop}
      />,
    );
    const cropper = loaded();
    const image = cropper.querySelector("img") as HTMLImageElement;
    expect(image).toHaveStyle({ left: "0%", top: "0%", height: "200%" });
    cropper.focus();
    await user.keyboard("{ArrowRight}");
    // Asked to move, it says so, but draws the value until the product
    // passes the new one.
    expect(lastCrop(onCrop).x).toBeCloseTo(0.0375);
    expect(image).toHaveStyle({ left: "0%" });
    rerender(
      <ImageCropper
        src={SRC}
        alt=""
        value={lastCrop(onCrop)}
        onCrop={onCrop}
      />,
    );
    expect(image).toHaveStyle({ left: "-10%" });
  });

  it("frames the middle when a controlled value is null", async () => {
    const user = userEvent.setup();
    const onCrop = vi.fn();
    const { rerender } = render(
      <ImageCropper src={SRC} alt="" value={null} onCrop={onCrop} />,
    );
    const cropper = loaded();
    const image = cropper.querySelector("img") as HTMLImageElement;
    // 0.125 in, 0.75 wide: 16.6667% of the frame to the left.
    expect(image).toHaveStyle({ left: "-16.6667%" });
    cropper.focus();
    await user.keyboard("{ArrowRight}");
    rerender(
      <ImageCropper
        src={SRC}
        alt=""
        value={lastCrop(onCrop)}
        onCrop={onCrop}
      />,
    );
    expect(image).toHaveStyle({ left: "-26.6667%" });
    // Back to null: the middle again, not the frame last drawn.
    rerender(<ImageCropper src={SRC} alt="" value={null} onCrop={onCrop} />);
    expect(image).toHaveStyle({ left: "-16.6667%" });
  });

  it("frames a new image anew", () => {
    const onImageLoad = vi.fn();
    const { rerender } = render(
      <ImageCropper
        src={SRC}
        alt=""
        defaultValue={{ x: 0, y: 0, width: 0.375, height: 0.5 }}
        onImageLoad={onImageLoad}
      />,
    );
    loaded();
    expect(lastCrop(onImageLoad).x).toBeCloseTo(0);
    Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
      configurable: true,
      get: () => 1200,
    });
    rerender(
      <ImageCropper
        src="https://cdn.example/other.png"
        alt=""
        onImageLoad={onImageLoad}
      />,
    );
    expect(document.querySelector("img")).toHaveStyle({
      visibility: "hidden",
    });
    loaded();
    // A square image at 1:1 is the whole image.
    expect(lastCrop(onImageLoad)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });

  it("does nothing while disabled", async () => {
    const user = userEvent.setup();
    const onCrop = vi.fn();
    render(<ImageCropper src={SRC} alt="" disabled onCrop={onCrop} />);
    const cropper = loaded();
    onCrop.mockClear();
    expect(cropper).toHaveAttribute("aria-disabled", "true");
    expect(cropper).toHaveAttribute("tabindex", "-1");
    cropper.focus();
    await user.keyboard("{ArrowDown}+");
    fireEvent.pointerDown(cropper, { pointerId: 1, button: 0, clientX: 0 });
    fireEvent.pointerMove(cropper, { pointerId: 1, clientX: 50 });
    expect(onCrop).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
  });

  it("takes the product's words", async () => {
    const user = userEvent.setup();
    render(
      <ImageCropper
        src={SRC}
        alt=""
        label="Logo çerçevesi"
        instructions="Görseli sürükleyin."
        zoomInLabel="Yakınlaştır"
        zoomOutLabel="Uzaklaştır"
        zoomLabel="Yakınlık"
        statusLabel={({ left, top, zoom }) =>
          `Soldan %${left}, üstten %${top}, yakınlık %${zoom}.`
        }
      />,
    );
    const cropper = screen.getByRole("application", { name: "Logo çerçevesi" });
    fireEvent.load(cropper.querySelector("img") as HTMLImageElement);
    expect(cropper).toHaveAccessibleDescription("Görseli sürükleyin.");
    expect(screen.getByRole("slider", { name: "Yakınlık" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Yakınlaştır" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Soldan %20, üstten %10, yakınlık %125.",
    );
    expect(screen.getByRole("button", { name: "Uzaklaştır" })).toBeVisible();
  });
});
