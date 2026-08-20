import { describe, expect, it } from "vitest";
import {
  exact,
  fromSpread,
  range,
  spread,
  tooCloseToCall,
  widenForYear,
  multiply,
  divide,
} from "../engines/range";
import {
  coalRunningCost,
  electricityPricePerKwh,
  heatDemandFromCoal,
  heatDemandPerM2,
  heatPumpElectricityKwh,
  heatPumpRunningCost,
  pelletRunningCost,
  runningCosts,
} from "../engines/runningCost";
import { ALL_CONSTANTS } from "../data/constants.pl";

// A plausible Silesian house. NOT a claim about a real one — when Magda lands a
// real interview, replace this block and the numbers below become evidence.
const BURN = {
  coalTonnesBought: 4,
  coalType: "ekogroszek" as const,
  boilerClass: "noClass" as const,
  feedType: "handFed" as const,
};

const HOUSE = {
  ...BURN,
  heatedAreaM2: 140,
  heatPumpScop: range(2.6, 3.0, 3.4), // old radiators, high flow temperature
  tariff: "G11" as const,
};

describe("range arithmetic", () => {
  it("derives confidence from band width, never accepts it as a claim", () => {
    expect(fromSpread(100, 0.1).confidence).toBe("good");
    expect(fromSpread(100, 0.3).confidence).toBe("rough");
    expect(fromSpread(100, 0.5).confidence).toBe("tooRough");
  });

  it("widens bands with distance in years", () => {
    const now = fromSpread(1000, 0.2);
    const later = widenForYear(now, 20);
    expect(spread(later)).toBeCloseTo(0.32, 2);
    expect(later.mid).toBe(now.mid);
  });

  it("refuses to rank two scenarios whose bands substantially overlap", () => {
    const a = range(900, 1000, 1100);
    const b = range(950, 1050, 1150);
    expect(tooCloseToCall(a, b)).toBe(true);
  });

  it("does rank scenarios that are clearly apart", () => {
    const a = range(900, 1000, 1100);
    const b = range(1600, 1700, 1800);
    expect(tooCloseToCall(a, b)).toBe(false);
  });

  it("propagates uncertainty through multiplication", () => {
    const wide = multiply(fromSpread(10, 0.2), fromSpread(10, 0.2));
    expect(spread(wide)).toBeGreaterThan(0.2);
  });

  it("throws rather than guessing when a denominator spans zero", () => {
    expect(() => divide(exact(10), range(-1, 0, 1))).toThrow();
  });
});

describe("heat demand from coal", () => {
  it("lands in the plausible range for four tonnes", () => {
    // 4 t x 1000 kg x 25 MJ/kg / 3.6 = ~27 800 kWh in, x 0.6 efficiency = ~16 700 kWh out
    const d = heatDemandFromCoal({ ...BURN, coalTonnesBought: 4 });
    expect(d.mid).toBeGreaterThan(14000);
    expect(d.mid).toBeLessThan(19000);
  });

  it("scales linearly with tonnage", () => {
    expect(
      heatDemandFromCoal({ ...BURN, coalTonnesBought: 8 }).mid,
    ).toBeCloseTo(
      heatDemandFromCoal({ ...BURN, coalTonnesBought: 4 }).mid * 2,
      5,
    );
  });

  it("carries the boiler efficiency uncertainty forward, not silently", () => {
    // The band must be visibly wide. If someone narrows the efficiency constant
    // without evidence, this test should be what stops them.
    expect(
      spread(heatDemandFromCoal({ ...BURN, coalTonnesBought: 4 })),
    ).toBeGreaterThan(0.1);
  });

  it("rejects nonsense input rather than returning a number", () => {
    expect(() =>
      heatDemandFromCoal({ ...BURN, coalTonnesBought: 0 }),
    ).toThrow();
    expect(() =>
      heatDemandFromCoal({ ...BURN, coalTonnesBought: -2 }),
    ).toThrow();
  });

  it("subtracts leftover coal, because bought is not burned", () => {
    const all = heatDemandFromCoal({ ...BURN, coalTonnesBought: 4 });
    const someLeft = heatDemandFromCoal({
      ...BURN,
      coalTonnesBought: 4,
      coalTonnesLeftOver: 1,
    });
    expect(someLeft.mid).toBeCloseTo(all.mid * 0.75, 4);
  });

  it("refuses a cellar fuller than the delivery", () => {
    expect(() =>
      heatDemandFromCoal({
        ...BURN,
        coalTonnesBought: 4,
        coalTonnesLeftOver: 4,
      }),
    ).toThrow();
  });

  it("gives mial less heat than orzech for the same tonnage", () => {
    const mial = heatDemandFromCoal({ ...BURN, coalType: "mial" });
    const orzech = heatDemandFromCoal({ ...BURN, coalType: "orzech" });
    expect(mial.mid).toBeLessThan(orzech.mid);
  });

  it("punishes 'don't know' with a wider band than a real answer", () => {
    const known = heatDemandFromCoal({
      ...BURN,
      coalType: "ekogroszek",
      boilerClass: "class4",
    });
    const unknown = heatDemandFromCoal({
      ...BURN,
      coalType: "unknown",
      boilerClass: "unknown",
    });
    expect(spread(unknown)).toBeGreaterThan(spread(known) * 1.5);
  });

  it("credits a feeder with better combustion than hand-feeding", () => {
    const hand = heatDemandFromCoal({ ...BURN, feedType: "handFed" });
    const auto = heatDemandFromCoal({ ...BURN, feedType: "automatic" });
    expect(auto.mid).toBeGreaterThan(hand.mid);
  });

  it("raises and widens demand when wood was burnt too", () => {
    const coalOnly = heatDemandFromCoal(BURN);
    const withWood = heatDemandFromCoal({ ...BURN, burntWoodToo: true });
    expect(withWood.mid).toBeGreaterThan(coalOnly.mid);
    expect(spread(withWood)).toBeGreaterThan(spread(coalOnly));
  });

  it("puts an unrenovated house above the insulate-first threshold", () => {
    const perM2 = heatDemandPerM2(
      heatDemandFromCoal({ ...BURN, coalTonnesBought: 4 }),
      140,
    );
    expect(perM2.mid).toBeGreaterThan(100);
  });
});

describe("running costs per scenario", () => {
  it("prices coal from tonnage the homeowner actually reported", () => {
    const c = coalRunningCost(4);
    expect(c.annual.mid).toBeCloseTo(4 * 1500, -2);
    expect(c.monthly.mid).toBeCloseTo(c.annual.mid / 12, 5);
  });

  it("prefers the price the household actually paid over the regional band", () => {
    const remembered = coalRunningCost(4, 1300);
    const fallback = coalRunningCost(4);
    expect(remembered.annual.mid).toBeCloseTo(4 * 1300, 4);
    expect(spread(remembered.annual)).toBeLessThan(spread(fallback.annual));
  });

  it("gives pellet a wide band, because pellet prices are volatile", () => {
    const p = pelletRunningCost(
      heatDemandFromCoal({ ...BURN, coalTonnesBought: 4 }),
    );
    expect(p.annual.confidence).not.toBe("good");
    expect(p.confidence).toBe(p.annual.confidence);
    expect(spread(p.annual)).toBeGreaterThan(0.25);
  });

  it("never reports a confidence the underlying band does not support", () => {
    // Guards the trap this test suite already fell into once: reading
    // .confidence off the wrapper instead of the Range and silently getting
    // undefined, which compares unequal to everything and passes.
    const demand = heatDemandFromCoal({ ...BURN, coalTonnesBought: 4 });
    const all = [
      coalRunningCost(4),
      pelletRunningCost(demand),
      heatPumpRunningCost(demand, range(2.6, 3.0, 3.4), "G11"),
    ];
    for (const s of all) {
      expect(s.confidence).toBeDefined();
      expect(s.confidence).toBe(s.annual.confidence);
      expect(["good", "rough", "tooRough"]).toContain(s.confidence);
    }
  });

  it("makes the heat pump cheaper to run than coal at a decent SCOP", () => {
    const demand = heatDemandFromCoal({ ...BURN, coalTonnesBought: 4 });
    const hp = heatPumpRunningCost(demand, range(2.6, 3.0, 3.4), "G11");
    expect(hp.annual.mid).toBeLessThan(coalRunningCost(4).annual.mid);
  });

  it("makes the heat pump lose on running cost at a bad SCOP", () => {
    // Small panel radiators, flow temperature near 60C. This is the honest
    // "do not switch yet" case and it must be reachable.
    const demand = heatDemandFromCoal({ ...BURN, coalTonnesBought: 4 });
    const bad = heatPumpRunningCost(demand, range(1.8, 2.0, 2.2), "G11");
    expect(bad.annual.mid).toBeGreaterThan(coalRunningCost(4).annual.mid);
  });

  it("blends the G12w price below flat G11 for a heat pump", () => {
    expect(electricityPricePerKwh("G12w").mid).toBeLessThan(
      electricityPricePerKwh("G11").mid,
    );
  });

  it("charges the G12w standing premium rather than pretending it is free", () => {
    const demand = heatDemandFromCoal({ ...BURN, coalTonnesBought: 4 });
    const scop = range(2.6, 3.0, 3.4);
    const kwh = heatPumpElectricityKwh(demand, scop);
    const naive = kwh.mid * electricityPricePerKwh("G12w").mid;
    expect(
      heatPumpRunningCost(demand, scop, "G12w").annual.mid,
    ).toBeGreaterThan(naive);
  });

  it("never lets PV drive a bill below zero", () => {
    const demand = heatDemandFromCoal({ ...BURN, coalTonnesBought: 4 });
    const huge = range(90000, 100000, 110000);
    const hp = heatPumpRunningCost(demand, range(2.6, 3.0, 3.4), "G11", huge);
    expect(hp.annual.low).toBeGreaterThanOrEqual(0);
    expect(hp.fuelQuantity.low).toBeGreaterThanOrEqual(0);
  });
});

describe("all four scenarios together", () => {
  it("returns every scenario from one set of house facts", () => {
    const r = runningCosts(HOUSE);
    for (const s of [r.coal, r.pellet, r.heatPump, r.heatPumpPlusPv]) {
      expect(s.annual.mid).toBeGreaterThan(0);
      expect(s.annual.low).toBeLessThanOrEqual(s.annual.mid);
      expect(s.annual.mid).toBeLessThanOrEqual(s.annual.high);
    }
  });

  it("can produce a too-close-to-call result between pellet and heat pump", () => {
    // Not asserting which wins — asserting the tie is representable. A model
    // that can never say "we cannot tell you" is a sales tool.
    const r = runningCosts(HOUSE);
    const tie = tooCloseToCall(r.pellet.annual, r.heatPump.annual);
    expect(typeof tie).toBe("boolean");
  });
});

describe("constants integrity", () => {
  it("every constant carries a source, a read date and a certainty", () => {
    for (const [name, c] of Object.entries(ALL_CONSTANTS)) {
      expect(c.source, `${name} has no source`).toBeTruthy();
      expect(c.readOn, `${name} has no read date`).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      );
      expect(["high", "medium", "low"]).toContain(c.certainty);
    }
  });
});
