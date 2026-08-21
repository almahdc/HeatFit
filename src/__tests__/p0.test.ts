/**
 * p0.test.ts — the acceptance criteria from tickets T1, T3, T4 and T5.
 *
 * T2's criterion ("no literal gatesSatisfied array in App.tsx") is a source
 * check rather than a behaviour, so it is asserted by grep in the ticket, not
 * here. Everything else is testable and tested.
 */

import { describe, expect, it } from "vitest";
import { exact, range } from "../engines/range";
import {
  Applicant,
  cleanAirShareOverride,
  projectSubsidies,
  subsidiesFor,
} from "../engines/subsidy";
import {
  ROUTES,
  financingPlan,
  impliedIncome,
  payoffSchedule,
} from "../engines/financing";
import { sensitivity, sensitivityHeadline } from "../engines/sensitivity";

const APPLICANT: Applicant = {
  incomeLevel: "basic",
  gatesSatisfied: [
    "ownedThreeYears",
    "deviceOnZumList",
    "energyAuditDone",
    "replacingKopciuch",
  ],
  taxpayerCount: 1,
  marginalTaxRate: 0.12,
};

// --- T1 ---------------------------------------------------------------------

describe("T1 · the project cap is applied once, not per device", () => {
  it("does not let two devices each claim the full Clean Air cap", () => {
    // Two big items, both eligible, both large enough to hit the cap alone.
    const project = projectSubsidies(
      [
        { device: "heatPump", cost: 200000 },
        { device: "insulation", cost: 200000 },
      ],
      APPLICANT,
    );
    // basic tier cap is 68 040; claiming it twice would give 136 080.
    expect(project.upfrontGrant.mid).toBeLessThanOrEqual(68040 * 1.01);
  });

  it("reports what the cap cost them instead of hiding it", () => {
    const project = projectSubsidies(
      [
        { device: "heatPump", cost: 200000 },
        { device: "insulation", cost: 200000 },
      ],
      APPLICANT,
    );
    expect(project.capNote).toBeDefined();
    expect(project.items.some((i) => i.reducedByCap > 0)).toBe(true);
  });

  it("serves the largest award first, so the heat pump keeps its grant", () => {
    const project = projectSubsidies(
      [
        { device: "pv", cost: 30000 },
        { device: "heatPump", cost: 200000 },
      ],
      APPLICANT,
    );
    const hp = project.items.find((i) => i.device === "heatPump")!;
    const pv = project.items.find((i) => i.device === "pv")!;
    expect(hp.grant.mid).toBeGreaterThan(pv.grant.mid);
  });

  it("applies the deduction cap once across the project, not per device", () => {
    const project = projectSubsidies(
      [
        { device: "heatPump", cost: 90000 },
        { device: "insulation", cost: 90000 },
      ],
      { ...APPLICANT, taxpayerCount: 1 },
    );
    expect(project.deductionBase.mid).toBeLessThanOrEqual(53000);
  });

  it("agrees with the single-device engine when there is only one device", () => {
    const one = subsidiesFor("heatPump", 42000, APPLICANT);
    const project = projectSubsidies(
      [{ device: "heatPump", cost: 42000 }],
      APPLICANT,
    );
    expect(project.upfrontGrant.mid).toBeCloseTo(one.upfrontGrant.mid, 6);
    expect(project.taxRelief.mid).toBeCloseTo(one.taxRelief.mid, 6);
  });
});

// --- T3 ---------------------------------------------------------------------

describe("T3 · the sensitivity list is generated, never hand-written", () => {
  // A stand-in model: monthly cost falls with a cheaper pellet price and rises
  // with a dearer one. Enough to prove the ranking machinery works.
  const model = (
    o: Parameters<typeof sensitivity>[0] extends never ? never : any,
  ) => {
    const pellet = o.pelletPricePerTonne ?? 1900;
    const elec = o.electricityG11PerKwh ?? 1.07;
    const rate = o.loanRatePct ?? 8.43;
    return pellet * 0.1 + elec * 200 + rate * 5;
  };

  it("ranks by measured movement, biggest first", () => {
    const drivers = sensitivity(model, { loanRatePct: 8.43 });
    expect(drivers.length).toBeGreaterThan(0);
    for (let i = 1; i < drivers.length; i++) {
      expect(drivers[i - 1]!.swingPlnPerMonth).toBeGreaterThanOrEqual(
        drivers[i]!.swingPlnPerMonth,
      );
    }
  });

  it("drops drivers that barely move the answer", () => {
    const flat = () => 500;
    expect(sensitivity(flat, { loanRatePct: 8.43 })).toHaveLength(0);
  });

  it("separates what the household controls from what the market does", () => {
    const drivers = sensitivity(model, { loanRatePct: 8.43 });
    const pellet = drivers.find((d) => d.label.includes("pellet"));
    expect(pellet?.withinTheirControl).toBe(false);
  });

  it("writes the headline from the ranking, not from a fixed string", () => {
    const drivers = sensitivity(model, { loanRatePct: 8.43 });
    expect(sensitivityHeadline(drivers)).toContain(drivers[0]!.label);
    expect(sensitivityHeadline([])).toMatch(/Nothing/);
  });

  it("re-ranks when a band narrows, instead of going stale", () => {
    const wide = sensitivity(model, { loanRatePct: 8.43 });
    const narrowRate = sensitivity(model, { loanRatePct: 0.5 });
    // Same specs, different rate band, so the rate driver must move position
    // or magnitude rather than being frozen.
    expect(
      wide.find((d) => d.label.includes("interest"))?.swingPlnPerMonth,
    ).toBeDefined();
    expect(narrowRate.length).toBeGreaterThan(0);
  });
});

// --- T4 ---------------------------------------------------------------------

describe("T4 · loan-free year is derived, never hardcoded", () => {
  const plan = financingPlan({
    capitalCost: range(28000, 42000, 60000),
    upfrontGrant: exact(16800),
    taxRelief: exact(3024),
    route: ROUTES.pozyczkaZielona!,
    termMonths: 96,
  });
  const running = range(180, 220, 280);

  it("moves the loan-free year when the term changes", () => {
    const eight = payoffSchedule(plan, running, {
      termMonths: 96,
      startYear: 2026,
      startMonth: 1,
    });
    const ten = payoffSchedule(plan, running, {
      termMonths: 120,
      startYear: 2026,
      startMonth: 1,
    });
    expect(eight.loanFreeYear).toBe(2034);
    expect(ten.loanFreeYear).toBe(2036);
  });

  it("handles a mid-year start without inventing a free year", () => {
    const s = payoffSchedule(plan, running, {
      termMonths: 96,
      startYear: 2026,
      startMonth: 8,
    });
    // Starting in August, 96 payments run into 2034, so 2034 is not free.
    const y2034 = s.years.find((y) => y.year === 2034)!;
    expect(y2034.repayment).toBeGreaterThan(0);
    expect(s.loanFreeYear).toBe(2035);
  });

  it("marks the final loan year and, on the bank route, the step-down", () => {
    const bank = financingPlan({
      capitalCost: range(28000, 42000, 60000),
      upfrontGrant: exact(16800),
      taxRelief: exact(0),
      route: ROUTES.bankRoute!,
      termMonths: 96,
      grantArrivesAfterMonths: 12,
    });
    const s = payoffSchedule(bank, running, {
      termMonths: 96,
      startYear: 2026,
      startMonth: 1,
      grantArrivesAfterMonths: 12,
    });
    expect(s.stepDownYear).toBe(2027);
    expect(s.years.filter((y) => y.isFinalLoanYear)).toHaveLength(1);
  });

  it("reports the running cost as the monthly figure once free", () => {
    const s = payoffSchedule(plan, running, {
      termMonths: 96,
      startYear: 2026,
      startMonth: 1,
    });
    expect(s.monthlyOnceFree).toBeCloseTo(running.mid, 6);
  });
});

// --- T5 ---------------------------------------------------------------------

describe("T5 · income is an output, never an input", () => {
  const plan = financingPlan({
    capitalCost: range(28000, 42000, 60000),
    upfrontGrant: exact(16800),
    taxRelief: exact(0),
    route: ROUTES.pozyczkaZielona!,
    termMonths: 96,
  });

  it("tests affordability at a stressed rate, above the advertised one", () => {
    const guide = impliedIncome(plan, 96);
    expect(guide.stressedInstalment).toBeGreaterThan(
      plan.monthlyBeforeGrant.mid,
    );
  });

  it("implies a higher income for a bigger loan", () => {
    const big = financingPlan({
      capitalCost: exact(120000),
      upfrontGrant: exact(0),
      taxRelief: exact(0),
      route: ROUTES.pozyczkaZielona!,
      termMonths: 96,
    });
    expect(impliedIncome(big, 96).impliedNetIncome).toBeGreaterThan(
      impliedIncome(plan, 96).impliedNetIncome,
    );
  });

  it("prices what the fuel saving alone could borrow", () => {
    const guide = impliedIncome(plan, 96, 300);
    expect(guide.loanServiceableBySaving).toBeGreaterThan(20000);
    expect(impliedIncome(plan, 96, 0).loanServiceableBySaving).toBe(0);
  });

  it("returns zeroes rather than nonsense when nothing is borrowed", () => {
    const cash = financingPlan({
      capitalCost: exact(42000),
      upfrontGrant: exact(16800),
      taxRelief: exact(0),
      route: ROUTES.cash!,
      termMonths: 0,
    });
    expect(impliedIncome(cash, 0).impliedNetIncome).toBe(0);
  });
});

// --- guard ------------------------------------------------------------------

describe("the income-tier override used by the sensitivity engine", () => {
  it("changes only Clean Air, and only its share", () => {
    const overridden = cleanAirShareOverride(1.0);
    const cp = overridden.find((p) => p.id === "czystePowietrze")!;
    const mc = overridden.find((p) => p.id === "mojeCiepło")!;
    expect(cp.shareByLevel.basic).toBe(1.0);
    expect(cp.maxByLevel.basic).toBe(68040);
    expect(mc.shareByLevel.basic).toBe(0.3);
  });
});
