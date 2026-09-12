/**
 * generateReportPdf.ts: renders a ReportSnapshot (see reportSnapshot.ts) as a
 * printable PDF, in whichever language the household is looking at the app
 * in. Every number here is read straight off the snapshot: this file only
 * decides layout and wording, never recomputes anything.
 *
 * Uses jsPDF directly rather than a React-to-PDF renderer: the document is
 * a handful of tables and paragraphs, not a component tree, and jsPDF keeps
 * the output small and dependency-light. Polish diacritics (ą ć ę ł ń ó ś ź
 * ż) are outside jsPDF's built-in WinAnsi fonts, so DejaVu Sans is embedded
 * (see ./fonts) and used for every string, English included, so the two
 * language outputs share one code path.
 */

import { jsPDF } from "jspdf";
import { DEJAVU_SANS_NORMAL_BASE64 } from "./fonts/DejaVuSans-normal";
import { DEJAVU_SANS_BOLD_BASE64 } from "./fonts/DejaVuSans-bold";
import { assumptionText } from "../wizard/BaselineSummary";
import { CONTACT_EMAIL } from "../constants";
import {
  TAX_RELIEF_CAP_PLN,
  TAX_RELIEF_CARRY_FORWARD_YEARS,
} from "../engines/taxRelief";
import { ZUM_DATABASE_URL } from "../engines/capex";
import { zl, formatReportDate } from "./format";
import type { Dictionary, Language } from "../i18n";
import type { ReportSnapshot } from "./reportSnapshot";
import type { AlternativeHeatingCost } from "../engines/alternativeHeating";

// --- palette (matches tailwind.config.js) -------------------------------

const COLOR = {
  ink: "#1c2027",
  inkSoft: "#5b6270",
  line: "#e7e4dd",
  chip: "#f1efe9",
  accent: "#33508f",
  accent600: "#2a4272",
  accentTint: "#eef1fa",
  savings700: "#1f7a3d",
  savingsTint: "#eafbec",
  white: "#ffffff",
} as const;

const PAGE = { width: 210, height: 297 } as const;
const MARGIN = { left: 16, right: 16, top: 18, bottom: 20 } as const;
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

const FONT = "DejaVuSans";

/** Thin wrapper around jsPDF that tracks a cursor and breaks pages itself. */
class ReportDoc {
  doc: jsPDF;
  y: number = MARGIN.top;

  constructor() {
    this.doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    this.doc.addFileToVFS("DejaVuSans.ttf", DEJAVU_SANS_NORMAL_BASE64);
    this.doc.addFont("DejaVuSans.ttf", FONT, "normal");
    this.doc.addFileToVFS("DejaVuSans-Bold.ttf", DEJAVU_SANS_BOLD_BASE64);
    this.doc.addFont("DejaVuSans-Bold.ttf", FONT, "bold");
    this.doc.setFont(FONT, "normal");
  }

  /** Advances past the header band on every page but the first. */
  ensureSpace(height: number) {
    if (this.y + height > PAGE.height - MARGIN.bottom) {
      this.doc.addPage();
      this.y = MARGIN.top;
    }
  }

  gap(mm: number) {
    this.y += mm;
  }

  text(
    str: string,
    x: number,
    opts: {
      size?: number;
      weight?: "normal" | "bold";
      color?: string;
      maxWidth?: number;
      lineHeight?: number;
      align?: "left" | "right" | "center";
    } = {},
  ): number {
    const {
      size = 10,
      weight = "normal",
      color = COLOR.ink,
      maxWidth = CONTENT_WIDTH,
      lineHeight = size * 0.42,
      align = "left",
    } = opts;
    this.doc.setFont(FONT, weight);
    this.doc.setFontSize(size);
    this.doc.setTextColor(color);
    const lines = this.doc.splitTextToSize(str, maxWidth) as string[];
    const blockHeight = lines.length * lineHeight;
    this.ensureSpace(blockHeight);
    this.doc.text(lines, x, this.y + lineHeight * 0.75, { align });
    this.y += blockHeight;
    return blockHeight;
  }

  /** A section heading: a small accent rule, then a bold title. */
  sectionTitle(title: string) {
    this.gap(4);
    this.ensureSpace(14);
    this.doc.setFillColor(COLOR.accent);
    this.doc.rect(MARGIN.left, this.y, 9, 1.4, "F");
    this.gap(4);
    this.text(title, MARGIN.left, {
      size: 14,
      weight: "bold",
      color: COLOR.accent600,
    });
    this.gap(3);
  }

  /**
   * A bold subsection label within a section (e.g. "Building" inside "Your
   * details"), always followed by a factGrid or bullet list. Reserves room
   * for a first row of that content too, not just the heading's own line,
   * so a page break can never strand the heading alone at the page bottom
   * with its content pushed to the next page.
   */
  subheading(title: string) {
    this.ensureSpace(18);
    this.text(title, MARGIN.left, {
      size: 10,
      weight: "bold",
      color: COLOR.ink,
    });
    this.gap(1);
  }

  paragraph(str: string, opts: { size?: number; color?: string } = {}) {
    this.text(str, MARGIN.left, {
      size: opts.size ?? 9.5,
      color: opts.color ?? COLOR.inkSoft,
      lineHeight: (opts.size ?? 9.5) * 0.48,
    });
    this.gap(2);
  }

  /** A tinted callout box, used for the executive-summary verdict. */
  callout(lines: string[], opts: { bg?: string; accentBar?: string } = {}) {
    const { bg = COLOR.accentTint, accentBar = COLOR.accent } = opts;
    const size = 10.5;
    const lineHeight = size * 0.48;
    const padding = 5;
    const wrapped = lines.flatMap(
      (l) =>
        this.doc.splitTextToSize(
          l,
          CONTENT_WIDTH - padding * 2 - 3,
        ) as string[],
    );
    const boxHeight = wrapped.length * lineHeight + padding * 2;
    this.ensureSpace(boxHeight + 3);
    this.doc.setFillColor(bg);
    this.doc.roundedRect(
      MARGIN.left,
      this.y,
      CONTENT_WIDTH,
      boxHeight,
      2,
      2,
      "F",
    );
    this.doc.setFillColor(accentBar);
    this.doc.rect(MARGIN.left, this.y, 1.4, boxHeight, "F");
    this.doc.setFont(FONT, "normal");
    this.doc.setFontSize(size);
    this.doc.setTextColor(COLOR.ink);
    const textY = this.y + padding + lineHeight * 0.75;
    this.doc.text(wrapped, MARGIN.left + padding + 2, textY, {
      lineHeightFactor: 1.35,
    });
    this.y += boxHeight + 5;
  }

  /** A label/value grid, two columns of pairs, for "entered data" sections. */
  factGrid(pairs: [string, string][]) {
    const colWidth = CONTENT_WIDTH / 2 - 3;
    const rows = Math.ceil(pairs.length / 2);
    const rowHeight = 10;
    this.ensureSpace(rowHeight);
    for (let r = 0; r < rows; r++) {
      this.ensureSpace(rowHeight);
      const rowY = this.y;
      for (let c = 0; c < 2; c++) {
        const pair = pairs[r * 2 + c];
        if (!pair) continue;
        const x = MARGIN.left + c * (colWidth + 6);
        this.doc.setFont(FONT, "normal");
        this.doc.setFontSize(7.5);
        this.doc.setTextColor(COLOR.inkSoft);
        this.doc.text(pair[0].toUpperCase(), x, rowY + 3);
        this.doc.setFont(FONT, "bold");
        this.doc.setFontSize(9.5);
        this.doc.setTextColor(COLOR.ink);
        const valueLines = this.doc.splitTextToSize(
          pair[1],
          colWidth,
        ) as string[];
        this.doc.text(valueLines, x, rowY + 7.5);
      }
      this.y = rowY + rowHeight;
    }
    this.gap(2);
  }

  /** A simple striped table: header row + body rows, columns given as widths (mm). */
  table(
    headers: string[],
    rows: string[][],
    colWidths: number[],
    opts: {
      boldLastRow?: boolean;
      align?: ("left" | "right")[];
      noHeader?: boolean;
      /** Row index -> tint/text color, for rows that carry the same
       *  green-savings / blue-accent meaning they have on the web. */
      highlightRows?: Record<number, { bg: string; text: string }>;
    } = {},
  ) {
    const headerHeight = 8;
    const rowHeight = 7.5;
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);

    const drawHeader = () => {
      if (opts.noHeader) return;
      this.doc.setFillColor(COLOR.accent600);
      this.doc.rect(MARGIN.left, this.y, totalWidth, headerHeight, "F");
      this.doc.setFont(FONT, "bold");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(COLOR.white);
      let x = MARGIN.left + 2.5;
      headers.forEach((h, i) => {
        const width = colWidths[i]!;
        const align = opts.align?.[i] ?? "left";
        this.doc.text(h, align === "right" ? x + width - 5 : x, this.y + 5.3, {
          align,
        });
        x += width;
      });
      this.y += headerHeight;
    };

    this.ensureSpace((opts.noHeader ? 0 : headerHeight) + rowHeight);
    drawHeader();

    rows.forEach((row, rIdx) => {
      this.ensureSpace(rowHeight);
      if (this.y === MARGIN.top) drawHeader();
      const highlight = opts.highlightRows?.[rIdx];
      const isLast = opts.boldLastRow && rIdx === rows.length - 1;
      if (highlight) {
        this.doc.setFillColor(highlight.bg);
        this.doc.rect(MARGIN.left, this.y, totalWidth, rowHeight, "F");
      } else if (isLast) {
        this.doc.setFillColor(COLOR.chip);
        this.doc.rect(MARGIN.left, this.y, totalWidth, rowHeight, "F");
      } else if (rIdx % 2 === 1) {
        this.doc.setFillColor("#fbfaf8");
        this.doc.rect(MARGIN.left, this.y, totalWidth, rowHeight, "F");
      }
      this.doc.setFont(FONT, isLast || highlight ? "bold" : "normal");
      this.doc.setFontSize(9);
      this.doc.setTextColor(highlight ? highlight.text : COLOR.ink);
      let x = MARGIN.left + 2.5;
      row.forEach((cell, i) => {
        const width = colWidths[i]!;
        const align = opts.align?.[i] ?? "left";
        this.doc.text(cell, align === "right" ? x + width - 5 : x, this.y + 5, {
          align,
        });
        x += width;
      });
      this.y += rowHeight;
    });

    this.doc.setDrawColor(COLOR.line);
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN.left, this.y, MARGIN.left + totalWidth, this.y);
    this.gap(5);
  }

  divider() {
    this.ensureSpace(4);
    this.doc.setDrawColor(COLOR.line);
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN.left, this.y, PAGE.width - MARGIN.right, this.y);
    this.gap(4);
  }

  bulletList(items: string[]) {
    items.forEach((item) => {
      const bulletIndent = 4;
      const size = 9;
      const lineHeight = size * 0.48;
      const lines = this.doc.splitTextToSize(
        item,
        CONTENT_WIDTH - bulletIndent,
      ) as string[];
      const height = lines.length * lineHeight;
      this.ensureSpace(height);
      this.doc.setFont(FONT, "normal");
      this.doc.setFontSize(size);
      this.doc.setTextColor(COLOR.inkSoft);
      this.doc.text("•", MARGIN.left, this.y + lineHeight * 0.75);
      this.doc.text(
        lines,
        MARGIN.left + bulletIndent,
        this.y + lineHeight * 0.75,
      );
      this.y += height + 1.5;
    });
    this.gap(2);
  }
}

// --- the document --------------------------------------------------------

export function generateReportPdf(
  t: Dictionary,
  lang: Language,
  snapshot: ReportSnapshot,
): { doc: jsPDF; filename: string } {
  const R = t.report;
  const A = t.alternatives;
  const h = snapshot.household;
  const optionName = A.options[snapshot.selection.heatingId].name;
  const bestOptionName = A.options[snapshot.bestHeatingId].name;
  const savingMonthly = snapshot.runningCost.selected.savingsPlnPerMonth;
  const savingYearly = snapshot.runningCost.selected.savingsPlnPerYear;
  const isSaving = savingYearly >= 0;

  const pdf = new ReportDoc();
  const doc = pdf.doc;

  // --- masthead ------------------------------------------------------
  doc.setFillColor(COLOR.accent600);
  doc.rect(0, 0, PAGE.width, 30, "F");
  pdf.y = 0;
  doc.setFont(FONT, "bold");
  doc.setFontSize(18);
  doc.setTextColor(COLOR.white);
  doc.text("HeatFit", MARGIN.left, 13);
  doc.setFont(FONT, "normal");
  doc.setFontSize(10.5);
  doc.text(R.docTitle, MARGIN.left, 21);
  doc.setFontSize(8.5);
  doc.setTextColor("#c7d1e8");
  const preparedFor = snapshot.region
    ? R.preparedForWithRegion(snapshot.postalCode || "—", snapshot.region)
    : R.preparedFor(snapshot.postalCode || "—");
  doc.text(
    `${preparedFor}   ·   ${R.generatedOn(formatReportDate(snapshot.generatedAt, lang))}`,
    MARGIN.left,
    27,
  );
  pdf.y = 38;

  pdf.paragraph(R.docSubtitle, { size: 9.5, color: COLOR.inkSoft });
  pdf.gap(1);

  // --- executive summary ----------------------------------------------
  pdf.sectionTitle(R.sections.executiveSummary);
  const verdictLines = [
    R.verdict.currentSpend(
      zl(snapshot.baseline.cost.totalPlnPerMonth),
      zl(snapshot.baseline.cost.totalPlnPerYear),
    ),
    isSaving
      ? R.verdict.saving(
          optionName,
          zl(Math.abs(savingMonthly)),
          zl(Math.abs(savingYearly)),
        )
      : R.verdict.costing(
          optionName,
          zl(Math.abs(savingMonthly)),
          zl(Math.abs(savingYearly)),
        ),
    R.verdict.netCostLine(zl(snapshot.taxRelief.finalNetCostPln)),
    R.verdict.trueCostLine(
      zl(snapshot.trueCost.truePlnPerMonth),
      snapshot.loan.years,
    ),
  ];
  pdf.callout(verdictLines, {
    bg: isSaving ? COLOR.savingsTint : COLOR.accentTint,
    accentBar: isSaving ? COLOR.savings700 : COLOR.accent,
  });
  if (snapshot.bestHeatingId !== snapshot.selection.heatingId) {
    pdf.paragraph(R.verdict.bestOption(bestOptionName));
  }

  // --- your details -----------------------------------------------------
  pdf.sectionTitle(R.sections.yourDetails);

  pdf.subheading(R.details.location);
  pdf.factGrid([
    [R.details.postalCode, snapshot.postalCode || "—"],
    [R.details.region, snapshot.region ?? "—"],
  ]);

  pdf.subheading(R.details.building);
  pdf.factGrid([
    [t.summary.houseType, t.options.houseKind[h.houseKind].label],
    [t.summary.insulation, t.options.insulation[h.insulation].label],
    [t.summary.windowFrames, t.options.windowFrame[h.windowFrame].label],
    [t.summary.totalArea, t.summary.totalAreaValue(h.totalAreaM2)],
    [
      h.wholeHouseHeated ? t.summary.heatedArea : t.summary.estimatedHeatedArea,
      t.summary.heatedAreaValue(h.heatedAreaM2),
    ],
    [t.summary.radiators, t.options.radiatorType[h.radiatorType].label],
    [t.summary.occupants, String(h.occupants)],
    [t.summary.acAvailable, h.acAvailable ? t.summary.yes : t.summary.no],
  ]);

  pdf.subheading(R.details.currentHeating);
  pdf.factGrid([
    [t.summary.coalType, t.options.coalType[h.coalType].label],
    [
      t.summary.boiler,
      t.summary.boilerValue(
        t.options.boilerClass[h.boilerClass].label,
        h.boilerYear,
      ),
    ],
    [
      t.summary.coalBought,
      t.summary.coalBoughtValue(h.coalTonnesPerSeason, h.coalPricePerTonnePln),
    ],
    [t.summary.alsoBurnsWood, h.usesWoodToo ? t.summary.yes : t.summary.no],
    [
      t.summary.freeCoal,
      h.freeCoalReceived
        ? t.summary.freeCoalValue(h.freeCoalTonnes)
        : t.summary.no,
    ],
    [
      t.summary.replacementPreference,
      t.options.replacementPreference[h.replacementPreference].label,
    ],
    [
      t.summary.gasConnection,
      h.gasConnectionAvailable ? t.summary.yes : t.summary.no,
    ],
    [
      t.summary.districtHeating,
      h.districtHeatingAvailable ? t.summary.yes : t.summary.no,
    ],
  ]);

  pdf.subheading(R.details.electricityWater);
  pdf.factGrid([
    [
      t.summary.electricity,
      t.summary.electricityValue(
        t.options.electricityTariff[h.electricityTariff].label,
        h.electricityBillPlnPerMonth,
      ),
    ],
    [t.summary.waterHeating, t.options.waterHeating[h.waterHeating].label],
    [t.summary.showers, String(h.showersBathsPerWeek)],
    [
      t.summary.pvBatteryStorage,
      [
        h.hasPvPanels && t.summary.pv,
        h.hasBattery && t.summary.battery,
        h.hasHeatStorage && t.summary.heatStorage,
      ]
        .filter(Boolean)
        .join(", ") || t.summary.none,
    ],
  ]);

  pdf.subheading(R.details.yourSelections);
  pdf.factGrid([
    [R.details.selectedOption, optionName],
    [
      R.details.addSolar,
      snapshot.selection.addSolar ? t.summary.yes : t.summary.no,
    ],
    [R.details.incomeLevel, A.grants.tiers[snapshot.selection.tier]],
    [R.details.loanTerm, A.trueCost.years(snapshot.loan.years)],
    [
      R.details.taxRateUsed,
      A.taxRelief.rates[snapshot.selection.taxRate].label,
    ],
  ]);

  // --- running cost comparison ------------------------------------------
  pdf.sectionTitle(R.sections.runningCosts);
  const RT = R.runningCostsTable;
  const costRow = (
    label: string,
    baselineValuePln: number,
    pick: (c: AlternativeHeatingCost) => number,
  ): string[] => [
    label,
    zl(baselineValuePln),
    zl(pick(snapshot.runningCost.withoutPv)),
    zl(pick(snapshot.runningCost.withPv)),
  ];
  const optionWithSolarLabel =
    optionName + (snapshot.selection.addSolar ? " + PV" : "");
  pdf.paragraph(R.financials.optionLabel(optionWithSolarLabel), {
    size: 9,
    color: COLOR.inkSoft,
  });
  pdf.table(
    ["", RT.columnBaseline, RT.columnWithoutPv, RT.columnWithPv],
    [
      costRow(
        RT.rowSpaceHeating,
        snapshot.baseline.cost.spaceHeatingPlnPerYear,
        (c) => c.spaceHeatingPlnPerYear,
      ),
      costRow(
        RT.rowWaterHeating,
        snapshot.baseline.cost.waterHeatingPlnPerYear,
        (c) => c.waterHeatingPlnPerYear,
      ),
      costRow(
        RT.rowElectricityAndCooling,
        snapshot.baseline.cost.electricityAndCoolingPlnPerYear,
        (c) => c.electricityAndCoolingPlnPerYear,
      ),
      [
        RT.rowTotalPerYear,
        zl(snapshot.baseline.cost.totalPlnPerYear),
        zl(snapshot.runningCost.withoutPv.totalPlnPerYear),
        zl(snapshot.runningCost.withPv.totalPlnPerYear),
      ],
      [
        RT.rowTotalPerMonth,
        zl(snapshot.baseline.cost.totalPlnPerMonth),
        zl(snapshot.runningCost.withoutPv.totalPlnPerMonth),
        zl(snapshot.runningCost.withPv.totalPlnPerMonth),
      ],
      [
        RT.rowSavingsPerYear,
        "—",
        zl(snapshot.runningCost.withoutPv.savingsPlnPerYear),
        zl(snapshot.runningCost.withPv.savingsPlnPerYear),
      ],
    ],
    [CONTENT_WIDTH - 3 * 42, 42, 42, 42],
    {
      align: ["left", "right", "right", "right"],
      highlightRows: {
        5: { bg: COLOR.savingsTint, text: COLOR.savings700 },
      },
    },
  );
  pdf.paragraph(RT.note, { size: 8, color: COLOR.inkSoft });

  // --- financial breakdown ----------------------------------------------
  pdf.sectionTitle(R.sections.financialBreakdown);
  const F = R.financials;
  pdf.paragraph(F.optionLabel(optionWithSolarLabel), {
    size: 9,
    color: COLOR.inkSoft,
  });
  pdf.table(
    [],
    [
      [F.grossCapex, zl(snapshot.capex.total.midPln)],
      [F.grant, `– ${zl(snapshot.grant.totalGrantPln)}`],
      [F.netCapex, zl(snapshot.loan.netCapexPln)],
      [F.taxRelief, `– ${zl(snapshot.taxRelief.cashBackPln)}`],
      [F.finalNetCost, zl(snapshot.taxRelief.finalNetCostPln)],
      [
        F.loanAmount(
          snapshot.loan.years,
          Math.round(snapshot.loan.annualInterest * 100),
        ),
        zl(snapshot.loan.netCapexPln),
      ],
      [F.monthlyLoanRepayment, zl(snapshot.trueCost.capexPlnPerMonth)],
      [F.runningCostPerMonth, zl(snapshot.trueCost.runningPlnPerMonth)],
      [F.trueMonthlyCost, zl(snapshot.trueCost.truePlnPerMonth)],
      [F.afterLoanMonthlyCost, zl(snapshot.trueCost.afterLoanPlnPerMonth)],
    ],
    [CONTENT_WIDTH - 50, 50],
    {
      noHeader: true,
      align: ["left", "right"],
      highlightRows: {
        2: { bg: COLOR.accentTint, text: COLOR.accent600 },
        4: { bg: COLOR.savingsTint, text: COLOR.savings700 },
        8: { bg: COLOR.savingsTint, text: COLOR.savings700 },
      },
    },
  );

  // --- assumptions & sources ---------------------------------------------
  pdf.sectionTitle(R.sections.assumptions);
  pdf.paragraph(R.assumptions.intro);

  pdf.subheading(R.assumptions.yourAnswers);
  if (snapshot.baseline.assumptions.length > 0) {
    pdf.bulletList(
      snapshot.baseline.assumptions.map((a) => assumptionText(t, a)),
    );
  } else {
    pdf.paragraph(R.assumptions.noAssumptions);
  }

  pdf.subheading(R.assumptions.referenceData);
  pdf.bulletList([
    R.assumptions.baselineModel,
    R.assumptions.capexSource(snapshot.capex.heating.source),
    R.assumptions.grantProgramme,
    R.assumptions.zum(ZUM_DATABASE_URL),
    R.assumptions.taxReliefRule(
      zl(TAX_RELIEF_CAP_PLN),
      TAX_RELIEF_CARRY_FORWARD_YEARS,
    ),
    R.assumptions.loanTerms,
  ]);

  // --- footer on every page ----------------------------------------------
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(COLOR.line);
    doc.setLineWidth(0.2);
    doc.line(
      MARGIN.left,
      PAGE.height - MARGIN.bottom + 4,
      PAGE.width - MARGIN.right,
      PAGE.height - MARGIN.bottom + 4,
    );
    doc.setFont(FONT, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR.inkSoft);
    doc.text(R.confidential, MARGIN.left, PAGE.height - MARGIN.bottom + 9, {
      maxWidth: CONTENT_WIDTH * 0.62,
    });
    doc.text(
      `${R.contactFooter(CONTACT_EMAIL)}   ·   ${R.pageFooter(i, pageCount)}`,
      PAGE.width - MARGIN.right,
      PAGE.height - MARGIN.bottom + 9,
      { align: "right" },
    );
  }

  return { doc, filename: R.filename };
}
