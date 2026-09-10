import { en } from "./en";

/**
 * Every dictionary has exactly the shape of `en`. Because this is derived
 * rather than hand-written, a key added to en.ts becomes a compile error in
 * every other language file until it is translated, and a key removed from
 * en.ts becomes a compile error where it is still defined.
 */
export type Dictionary = typeof en;

export const LANGUAGES = ["en", "pl"] as const;
export type Language = (typeof LANGUAGES)[number];
