import { useState } from "react";
import { Loader2, Mail, X } from "lucide-react";
import { useT } from "../i18n";
import type { Dictionary } from "../i18n";

const CONTACT_EMAIL = "heatfit.hello@gmail.com";

/** Formspree form endpoint, created at formspree.io and pointed at
 *  heatfit.hello@gmail.com. Unset in an environment without one configured
 *  (see .env), in which case submitting falls back to a mailto: link rather
 *  than failing outright. */
const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT;

type ModalState = "closed" | "open" | "submitting" | "success" | "error";

/** Each value prop doubles as its own CTA, so a click carries which one the
 *  household actually wants, rather than one generic "get in touch". */
type Intent = "installers" | "grant" | "financing";

const INTENT_EMOJI: Record<Intent, string> = {
  installers: "🛠️",
  grant: "📜",
  financing: "🏦",
};

const INTENTS: Intent[] = ["installers", "grant", "financing"];

const intentLabel = (t: Dictionary, intent: Intent) =>
  `${INTENT_EMOJI[intent]} ${t.earlyAccess.valueProps[intent].title}`;

interface Submission {
  intent: Intent | null;
  name: string;
  contact: string;
  note: string;
}

/**
 * Posts the form to Formspree in the background. Formspree's AJAX contract
 * (https://help.formspree.io/hc/en-us/articles/360055613373) is a plain JSON
 * POST with an Accept header; no SDK needed. `_subject` is one of their
 * recognised special fields and sets the email's subject line.
 */
async function submitToFormEndpoint(
  t: Dictionary,
  { intent, name, contact, note }: Submission,
): Promise<boolean> {
  const ea = t.earlyAccess;
  const res = await fetch(FORM_ENDPOINT!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      _subject: ea.modal.emailSubject,
      intent: intent ? intentLabel(t, intent) : "",
      name: name.trim(),
      contact: contact.trim(),
      note: note.trim(),
    }),
  });
  return res.ok;
}

/** No endpoint configured: fall back to the visitor's own mail client rather
 *  than a submission that quietly goes nowhere. */
function submitViaMailto(
  t: Dictionary,
  { intent, name, contact, note }: Submission,
): void {
  const ea = t.earlyAccess;
  const subject = encodeURIComponent(ea.modal.emailSubject);
  const bodyLines = [
    intent ? `${ea.modal.emailInterest}: ${intentLabel(t, intent)}` : null,
    `${ea.modal.emailName}: ${name.trim()}`,
    `${ea.modal.emailContact}: ${contact.trim()}`,
    note.trim() ? `${ea.modal.emailNote}: ${note.trim()}` : null,
  ].filter((line): line is string => line !== null);
  const body = encodeURIComponent(bodyLines.join("\n"));
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

/**
 * The conversion block: three value props: each one its own button: and a
 * contact form behind them. Submitting posts straight to Formspree in the
 * background (see submitToFormEndpoint) and shows a success state without
 * leaving the app; only when no endpoint is configured does it fall back to
 * handing off to the visitor's mail client.
 */
export function EarlyAccessBlock() {
  const t = useT();
  const ea = t.earlyAccess;

  const [modal, setModal] = useState<ModalState>("closed");
  const [intent, setIntent] = useState<Intent | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [attempted, setAttempted] = useState(false);
  // Which path last produced a success, so the confirmation text matches
  // what actually happened rather than always claiming direct delivery.
  const [deliveredVia, setDeliveredVia] = useState<"api" | "mailto" | null>(
    null,
  );

  // Deliberately no scroll-to-top here: this modal opens over content the
  // household is already looking at (an in-place choice, not a navigation
  // like a wizard step or the form-to-financials phase change), so jumping
  // the page would fight the click that just happened.
  const nameValid = name.trim() !== "";
  const contactValid = contact.trim() !== "";
  const showForm =
    modal === "open" || modal === "submitting" || modal === "error";

  const openModal = (selected: Intent) => {
    setIntent(selected);
    setModal("open");
  };

  const closeModal = () => {
    setModal("closed");
    setIntent(null);
    setAttempted(false);
    setName("");
    setContact("");
    setNote("");
    setDeliveredVia(null);
  };

  const submit = async () => {
    if (!nameValid || !contactValid) {
      setAttempted(true);
      return;
    }

    const submission: Submission = { intent, name, contact, note };

    if (!FORM_ENDPOINT) {
      submitViaMailto(t, submission);
      setDeliveredVia("mailto");
      setModal("success");
      return;
    }

    setModal("submitting");
    try {
      const ok = await submitToFormEndpoint(t, submission);
      if (!ok) throw new Error("Formspree responded with a non-2xx status");
      setDeliveredVia("api");
      setModal("success");
    } catch {
      setModal("error");
    }
  };

  return (
    <section className="rounded-[20px] border border-accent-tint2 bg-white p-6 shadow-block">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent text-white">
        <Mail className="h-5 w-5" aria-hidden />
      </div>
      <h2 className="text-[23px] font-bold tracking-tight text-ink">
        {ea.title}
      </h2>
      <p className="mt-2 text-base text-ink-soft">{ea.subtitle}</p>

      <ul className="mt-5 flex flex-col gap-3">
        {INTENTS.map((id) => {
          const { title, description } = ea.valueProps[id];
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => openModal(id)}
                className="flex w-full items-start gap-3 rounded-[14px] border border-line bg-[#fbfaf8] p-4 text-left transition-all duration-150 hover:border-accent/60 hover:bg-accent-tint active:scale-[0.99]"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-chip text-[18px]"
                  aria-hidden
                >
                  {INTENT_EMOJI[id]}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-ink">{title}</p>
                  <p className="text-[13px] text-ink-soft">{description}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-[12.5px] leading-relaxed text-ink-soft/80">
        {ea.disclaimer}
      </p>

      {modal !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={modal === "submitting" ? undefined : closeModal}
        >
          <div
            className="w-full max-w-md rounded-[20px] border border-line bg-white p-6 shadow-block"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[19px] font-bold tracking-tight text-ink">
                  {modal === "success" ? ea.modal.successTitle : ea.modal.title}
                </h3>
                {showForm && (
                  <>
                    <p className="mt-1 text-[13.5px] text-ink-soft">
                      {ea.modal.subtitle}
                    </p>
                    {intent && (
                      <span className="mt-2 inline-flex items-center rounded-full bg-accent-tint px-2.5 py-1 text-[12px] font-semibold text-accent-600">
                        {ea.modal.regarding(intentLabel(t, intent))}
                      </span>
                    )}
                  </>
                )}
              </div>
              {modal !== "submitting" && (
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label={ea.modal.close}
                  className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-chip hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>

            {modal === "success" ? (
              <p className="text-[14.5px] text-ink-soft">
                {deliveredVia === "mailto"
                  ? ea.modal.successBodyMailtoFallback(CONTACT_EMAIL)
                  : ea.modal.successBody}
              </p>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                {modal === "error" && (
                  <div className="rounded-[14px] border border-red-200 bg-red-50 p-3">
                    <p className="text-[13px] font-semibold text-red-700">
                      {ea.modal.errorTitle}
                    </p>
                    <p className="mt-0.5 text-[13px] text-red-700/90">
                      {ea.modal.errorBody(CONTACT_EMAIL)}
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-ink-soft">
                    {ea.modal.nameLabel}
                  </label>
                  <input
                    type="text"
                    disabled={modal === "submitting"}
                    className="w-full rounded-[14px] border border-line bg-white px-4 py-3 text-base text-ink outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40 disabled:opacity-60"
                    placeholder={ea.modal.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {attempted && !nameValid && (
                    <p className="mt-1.5 text-[12.5px] font-medium text-red-600">
                      {ea.modal.nameRequired}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-ink-soft">
                    {ea.modal.contactLabel}
                  </label>
                  <input
                    type="text"
                    disabled={modal === "submitting"}
                    className="w-full rounded-[14px] border border-line bg-white px-4 py-3 text-base text-ink outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40 disabled:opacity-60"
                    placeholder={ea.modal.contactPlaceholder}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                  {attempted && !contactValid && (
                    <p className="mt-1.5 text-[12.5px] font-medium text-red-600">
                      {ea.modal.contactRequired}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-ink-soft">
                    {ea.modal.noteLabel}
                  </label>
                  <textarea
                    rows={3}
                    disabled={modal === "submitting"}
                    className="w-full resize-none rounded-[14px] border border-line bg-white px-4 py-3 text-base text-ink outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40 disabled:opacity-60"
                    placeholder={ea.modal.notePlaceholder}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={modal === "submitting"}
                  className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-[14.5px] font-semibold text-white shadow-cta transition-colors hover:bg-accent-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {modal === "submitting" && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  )}
                  {modal === "submitting"
                    ? ea.modal.submitting
                    : ea.modal.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
