import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { en } from "./en";
import { pl } from "./pl";
import { LANGUAGES, type Dictionary, type Language } from "./types";

const DICTIONARIES: Record<Language, Dictionary> = { en, pl };

const STORAGE_KEY = "heatfit.language";

interface I18nValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

const isLanguage = (value: string | null): value is Language =>
  value !== null && (LANGUAGES as readonly string[]).includes(value);

/**
 * Stored choice first, then Polish.
 *
 * This tool is scoped to Polish addresses and Polish subsidy programmes, so
 * Polish is the default regardless of the browser's own language: a visitor
 * with an English browser is not assumed to want English any more than a
 * Polish one is.
 */
function initialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // Private mode or blocked site data: fall through to the default.
  }
  return "pl";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Preference just will not survive a reload; nothing else breaks.
    }
  }, [lang]);

  const setLang = useCallback((next: Language) => setLangState(next), []);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: DICTIONARIES[lang] }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside an I18nProvider");
  return ctx;
}

/** The common case: a component only needs the strings. */
export function useT(): Dictionary {
  return useI18n().t;
}

/** EN / PL segmented switch. Language can be changed at any point in the flow. */
export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();

  return (
    <div
      className="inline-flex items-center rounded-full border border-line bg-white p-0.5 shadow-card"
      role="radiogroup"
      aria-label={t.language.label}
    >
      {LANGUAGES.map((code) => {
        const selected = code === lang;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={
              code === "en"
                ? t.language.switchToEnglish
                : t.language.switchToPolish
            }
            onClick={() => setLang(code)}
            className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              selected ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {t.language[code]}
          </button>
        );
      })}
    </div>
  );
}
