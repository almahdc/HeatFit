import posthog from "posthog-js";

/**
 * PostHog, wired for automatic collection only.
 *
 * No `posthog.capture(...)` calls exist anywhere in this codebase on
 * purpose: what ships today is pageviews and autocapture (clicks, form
 * submits) and nothing else. Add custom events deliberately, one at a time,
 * when a real question needs answering — not speculatively.
 *
 * Session replay is explicitly off rather than merely unconfigured, so a
 * project-side toggle in the PostHog dashboard can't silently start
 * recording sessions for a tool that collects a household's income band,
 * address and heating costs.
 */
export function initAnalytics(): void {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return; // No key configured (e.g. a fork without its own project): skip rather than error.

  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com",
    person_profiles: "identified_only", // Nothing here calls identify(), so this stays anonymous.
    disable_session_recording: true,
    respect_dnt: true,
  });
}
