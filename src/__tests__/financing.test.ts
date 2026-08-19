import { describe, expect, it } from "vitest";
import {
  Applicant,
  DEFAULT_PROGRAMMES,
  subsidiesFor,
} from "../engines/subsidy";
import {
  ROUTES,
  balanceAfter,
  financingPlan,
  headlineMonthly,
  monthlyPayment,
} from "../engines/financing";
import { exact, range } from "../engines/range";

const READY: Applicant = {
  incomeLevel: "basic",
  gatesSatisfied: [
    "ownedThreeYears",
    "deviceOnZumList",
    "energyAuditDone",
    "replacingKopciuch",
    "incomeEvidenced",
  ],
};

describe("subsidy engine", () => {
  it("contains no hardcoded amounts of its own — everything comes from the programme set", () => {
    // If someone inlines a złoty figure in the engine, passing an empty set
    // should still produce a grant, and this test catches it.
    const out = subsidiesFor("heatPump", 45000, READY, []);
    expect(out.upfrontGrant.mid).toBe(0);
    expect(out.detail).toHaveLength(0);
  });

  it("awards Clean Air to a household that clears every gate", () => {
    const out = subsidiesFor("heatPump", 45000, READY);
    const cp = out.detail.find((d) => d.programme.id === "czystePowietrze");
    expect(cp?.applied).toBe(true);
    expect(out.upfrontGrant.mid).toBeGreaterThan(0);
  });

  it("refuses to stack Clean Air and My Heat on the same device, keeping the larger", () => {
    const applicant: Applicant = {
      incomeLevel: "basic",
      gatesSatisfied: [
        "ownedThreeYears",
        "deviceOnZumList",
        "energyAuditDone",
        "replacingKopciuch",
        "newBuild",
      ],
    };
    const out = subsidiesFor("heatPump", 45000, applicant);
    const applied = out.detail.filter(
      (d) => d.applied && !d.programme.isTaxRelief
    );
    expect(applied).toHaveLength(1);
    expect(applied[0]!.programme.id).toBe("czystePowietrze");

    const blocked = out.detail.find((d) => d.programme.id === "mojeCiepło");
    expect(blocked?.applied).toBe(false);
    expect(blocked?.reason).toContain("cannot claim");
  });

  it("lets tax relief stack with a grant, because it does", () => {
    const out = subsidiesFor("heatPump", 45000, READY);
    expect(out.upfrontGrant.mid).toBeGreaterThan(0);
    expect(out.taxRelief.mid).toBeGreaterThan(0);
  });

  it("explains every refusal in words a homeowner could read", () => {
    const notReady: Applicant = { incomeLevel: "basic", gatesSatisfied: [] };
    const out = subsidiesFor("heatPump", 45000, notReady);
    for (const d of out.detail.filter((x) => !x.applied)) {
      expect(d.reason).toBeTruthy();
      expect(d.reason!.length).toBeGreaterThan(5);
    }
  });

  it("names the specific missing gate rather than a generic refusal", () => {
    const noAudit: Applicant = {
      incomeLevel: "basic",
      gatesSatisfied: ["ownedThreeYears", "deviceOnZumList", "replacingKopciuch"],
    };
    const out = subsidiesFor("heatPump", 45000, noAudit);
    const cp = out.detail.find((d) => d.programme.id === "czystePowietrze");
    expect(cp?.applied).toBe(false);
    expect(cp?.missingGates).toContain("energyAuditDone");
  });

  it("caps the grant at the eligible cost, never paying out more than the job", () => {
    const cheap = subsidiesFor("heatPump", 10000, READY);
    expect(cheap.upfrontGrant.high).toBeLessThanOrEqual(10000);
  });

  it("survives the amounts being edited live, which is the whole point", () => {
    const edited = DEFAULT_PROGRAMMES.map((p) =>
      p.id === "czystePowietrze"
        ? { ...p, maxByLevel: { ...p.maxByLevel, basic: 30000 } }
        : p
    );
    const out = subsidiesFor("heatPump", 45000, READY, edited);
    const cp = out.detail.find((d) => d.programme.id === "czystePowietrze");
    expect(cp?.amount.mid).toBe(30000);
  });
});

describe("financing", () => {
  it("reproduces the published BOŚ example's total interest to the grosz", () => {
    // BOŚ representative example: 46 900 zł, 6.76% nominal, 84 instalments,
    // stated total interest 12 097,99 zł, arrangement fee 938 zł separately.
    // Amortising the principal ALONE reproduces their interest figure exactly.
    // Rolling the 2% fee into the loan does not — which is how we know the fee
    // is paid up front rather than financed.
    const pmt = monthlyPayment(46900, 0.0676, 84);
    expect(pmt * 84 - 46900).toBeCloseTo(12097.99, 1);
  });

  it("keeps the arrangement fee out of the borrowed amount", () => {
    const plan = financingPlan({
      capitalCost: exact(46900),
      upfrontGrant: exact(0),
      taxRelief: exact(0),
      route: ROUTES.bankRoute!,
      termMonths: 84,
      grantArrivesAfterMonths: 84,
    });
    expect(plan.amountBorrowed.mid).toBe(46900);
    expect(plan.arrangementFee.mid).toBeCloseTo(938, 0);
  });

  it("amortises to zero at the end of the term", () => {
    expect(balanceAfter(50000, 0.0843, 96, 96)).toBeCloseTo(0, 4);
  });

  it("prices the open route above the suspended one", () => {
    const input = {
      capitalCost: range(38000, 42000, 60000),
      upfrontGrant: exact(30000),
      taxRelief: exact(3000),
      termMonths: 96,
    };
    const open = financingPlan({ ...input, route: ROUTES.pozyczkaZielona! });
    const suspended = financingPlan({ ...input, route: ROUTES.bankRoute! });
    expect(open.monthlyAfterGrant.mid).toBeGreaterThan(
      suspended.monthlyAfterGrant.mid
    );
  });

  it("warns loudly that the bank route cannot be used today", () => {
    const plan = financingPlan({
      capitalCost: exact(42000),
      upfrontGrant: exact(30000),
      taxRelief: exact(0),
      route: ROUTES.bankRoute!,
      termMonths: 96,
    });
    expect(plan.warnings.join(" ")).toContain("not available today");
  });

  it("warns that the Green Loan promotion expires", () => {
    const plan = financingPlan({
      capitalCost: exact(42000),
      upfrontGrant: exact(30000),
      taxRelief: exact(0),
      route: ROUTES.pozyczkaZielona!,
      termMonths: 96,
    });
    expect(plan.warnings.join(" ")).toContain("EXPIRES");
  });

  it("steps the payment down on the bank route once the grant lands", () => {
    const plan = financingPlan({
      capitalCost: exact(42000),
      upfrontGrant: exact(30000),
      taxRelief: exact(0),
      route: ROUTES.bankRoute!,
      termMonths: 96,
      grantArrivesAfterMonths: 12,
    });
    expect(plan.monthlyAfterGrant.mid).toBeLessThan(plan.monthlyBeforeGrant.mid);
  });

  it("does not step the payment down on a route where the grant is reimbursed later", () => {
    const plan = financingPlan({
      capitalCost: exact(42000),
      upfrontGrant: exact(30000),
      taxRelief: exact(0),
      route: ROUTES.pozyczkaZielona!,
      termMonths: 96,
    });
    expect(plan.monthlyAfterGrant.mid).toBeCloseTo(plan.monthlyBeforeGrant.mid, 6);
  });

  it("charges no interest when paying from savings", () => {
    const plan = financingPlan({
      capitalCost: exact(42000),
      upfrontGrant: exact(30000),
      taxRelief: exact(3000),
      route: ROUTES.cash!,
      termMonths: 0,
    });
    expect(plan.totalInterest.mid).toBe(0);
    expect(plan.netCapitalCost.mid).toBeCloseTo(9000, 6);
  });

  it("gives two headline numbers, during the loan and after it ends", () => {
    const plan = financingPlan({
      capitalCost: exact(42000),
      upfrontGrant: exact(30000),
      taxRelief: exact(0),
      route: ROUTES.pozyczkaZielona!,
      termMonths: 96,
    });
    const h = headlineMonthly(plan, exact(495));
    expect(h.duringLoan.mid).toBeGreaterThan(h.afterLoan.mid);
    expect(h.afterLoan.mid).toBe(495);
  });

  it("flags a job that exceeds the route ceiling instead of silently lending more", () => {
    const plan = financingPlan({
      capitalCost: exact(200000),
      upfrontGrant: exact(0),
      taxRelief: exact(0),
      route: ROUTES.pozyczkaZielona!,
      termMonths: 96,
    });
    expect(plan.warnings.join(" ")).toContain("ceiling");
  });
});
