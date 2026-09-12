import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { useI18n } from "../i18n";
import type { ReportSnapshot } from "./reportSnapshot";

type Status = "idle" | "generating" | "error";

/**
 * A standalone "Download PDF report" action, for anywhere on the financials
 * screen a household might want their own copy without going through the
 * contact-us flow (see EarlyAccessBlock, which generates and offers the same
 * PDF a second way, tied to a submission). generateReportPdf is dynamically
 * imported so its embedded fonts (see ./fonts) only ever load for a visitor
 * who actually clicks this.
 */
export function DownloadReportButton({
  reportSnapshot,
}: {
  reportSnapshot: ReportSnapshot;
}) {
  const { t, lang } = useI18n();
  const [status, setStatus] = useState<Status>("idle");

  const download = async () => {
    setStatus("generating");
    try {
      const { generateReportPdf } = await import("./generateReportPdf");
      const { doc, filename } = generateReportPdf(t, lang, reportSnapshot);
      doc.save(filename);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={download}
        disabled={status === "generating"}
        className="flex items-center justify-center gap-2 rounded-xl border border-accent-tint2 bg-accent-tint px-5 py-2.5 text-[13.5px] font-semibold text-accent-600 transition-colors hover:bg-accent-tint2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "generating" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <FileDown className="h-4 w-4" aria-hidden />
        )}
        {status === "generating"
          ? t.earlyAccess.modal.pdfGenerating
          : t.earlyAccess.modal.downloadPdf}
      </button>
      {status === "error" && (
        <p className="mt-1.5 text-[12.5px] font-medium text-red-600">
          {t.report.downloadError}
        </p>
      )}
    </div>
  );
}
