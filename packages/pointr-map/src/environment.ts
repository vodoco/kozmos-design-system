/**
 * What the page must offer before the SDK starts, checked first so that a
 * missing one is a status, not a blank map or an uncaught error.
 */

/** Whether the browser gives a WebGL context; the probe's context is released at once. */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl || typeof gl !== "object") return false;
    gl.getExtension?.("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Whether `localStorage` can be read. In a sandbox without
 * `allow-same-origin` reading it throws, and the SDK reads it unguarded as it
 * starts ("Failed to authenticate SecurityError", measured).
 */
export function hasStorage(): boolean {
  try {
    window.localStorage.getItem("kozmos-pointr-map");
    return true;
  } catch {
    return false;
  }
}

/** Whether the browser says it is offline. */
export function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Counts one SDK session, so the Cloud's onboarding card, which the SDK shows
 * while `localStorage.sessionCount` is 0, stays closed: Kozmos draws any
 * first-visit help itself. The SDK reads the count as it starts.
 */
export function skipFirstVisitCard() {
  try {
    if (!Number(window.localStorage.getItem("sessionCount")))
      window.localStorage.setItem("sessionCount", "1");
  } catch {
    /* no storage: hasStorage has already refused to start */
  }
}
