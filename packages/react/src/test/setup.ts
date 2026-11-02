import "@testing-library/jest-dom";
import * as matchers from "vitest-axe/matchers";
import { expect } from "vitest";

expect.extend(matchers);

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom supplies DOMRect. Do not replace it with a shape whose edges always
// equal zero: geometry tests must see left/right/top/bottom derived from x/y/size.

// jsdom implements no pointer capture, and Radix calls it on pointerdown for
// every draggable primitive — Slider, Toggle, anything with a knob. Without
// these the drag still "works" and the test still passes, while an unhandled
// TypeError is thrown past the assertion. A suite that is green with an
// unhandled error in it is a suite people stop reading. A suite run in Node
// (`@vitest-environment node`, for a bundler that jsdom's globals break) has
// no Element to patch.
if (typeof Element !== "undefined" && !Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function setPointerCapture() {};
  Element.prototype.releasePointerCapture = function releasePointerCapture() {};
  Element.prototype.hasPointerCapture = function hasPointerCapture() {
    return false;
  };
}
