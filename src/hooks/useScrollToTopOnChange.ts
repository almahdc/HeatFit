import { useEffect } from "react";

/**
 * Scrolls back to the top whenever `value` changes, smoothly where the
 * browser actually supports the smooth-scroll options object and instantly
 * where it does not (older Safari/WebKit silently ignores the options
 * object rather than falling back gracefully on its own, so this checks
 * before relying on it).
 *
 * Sets `window.scrollTo` plus `documentElement`/`body.scrollTop` directly.
 * Belt and suspenders: depending on the page's doctype and the browser,
 * the element that actually holds the scroll position is not always the
 * one `window.scrollTo` is guaranteed to move.
 */
function scrollToTop(): void {
  if (typeof window === "undefined" || typeof window.scrollTo !== "function") {
    // No window to scroll (should not happen in this SPA, but cheap to guard).
    return;
  }

  const supportsSmoothBehavior =
    typeof document !== "undefined" &&
    "scrollBehavior" in document.documentElement.style;

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: supportsSmoothBehavior ? "smooth" : "auto",
  });

  // window.scrollTo with the options object silently does nothing on old
  // WebKit rather than falling back on its own — jump straight there if the
  // browser did not tell us it understands the smooth-scroll options object.
  if (!supportsSmoothBehavior && typeof document !== "undefined") {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
}

/**
 * Point this at state that changes on a Continue/Back-style navigation — a
 * wizard's step index, the top-level form/financials phase — so that
 * transition always lands the user at the top of the new screen instead of
 * wherever they happened to be scrolled to on the old one. One hook, reused
 * at every such transition, rather than a scrollTo call hand-copied into
 * each navigation handler.
 *
 * Deliberately NOT used for in-place choices on an already-visible screen
 * (an option card, a toggle, a picker) — jumping the whole page for those
 * fights the user right as they are looking at what they just clicked.
 */
export function useScrollToTopOnChange(value: unknown): void {
  useEffect(() => {
    scrollToTop();
    // `value` stands in for "the thing that just changed" — the effect body
    // never reads it, only reacts to it changing.
  }, [value]);
}
