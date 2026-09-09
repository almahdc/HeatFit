import { describe, expect, it } from "vitest";
import {
  calculateBaseline,
  calculateUserBaseline,
  coalHeatDelivered,
  coalShareOfHotWater,
  coolingElectricity,
  electricityCost,
  hotWaterLitres,
  waterEnergyKwh,
} from "../engines/baseline";
import * as S from "../data/sheet.constants";

/**
 * The sheet's SCENARIOS tab is the specification for this module, so its own
 * worked outputs are the tests. If one of these breaks, either a constant was
 * mistyped or someone changed a formula the sheet does not agree with.
 */
describe("reproduces the price_calculator sheet", () => {
  const H = S.SHEET_HOUSE_1;

  /**
   * The Miner60-71 family: coal is free (deputat), so the whole running cost is
   * electricity. That isolates the tariff and PV arithmetic from everything
   * else, which is why these are the scenarios worth pinning.
   *
   * Consumption = base electricity + cooling electricity.
   */
  const cases: Array<{
    name: string;
    coolingKwh: number;
    tariff: S.SheetTariff;
    pv: boolean;
    expectedPerMonth: number;
  }> = [
    {
      name: "Miner60",
      coolingKwh: 750,
      tariff: "Standard",
      pv: true,
      expectedPerMonth: 98.44,
    },
    {
      name: "Miner61",
      coolingKwh: 750,
      tariff: "Standard",
      pv: true,
      expectedPerMonth: 98.44,
    },
    {
      name: "Miner62",
      coolingKwh: 750,
      tariff: "Standard",
      pv: false,
      expectedPerMonth: 270.83,
    },
    {
      name: "Miner63",
      coolingKwh: 750,
      tariff: "Dynamic",
      pv: true,
      expectedPerMonth: 37.5,
    },
    {
      name: "Miner64",
      coolingKwh: 750,
      tariff: "Dynamic",
      pv: true,
      expectedPerMonth: 37.5,
    },
    {
      name: "Miner65",
      coolingKwh: 750,
      tariff: "Dynamic",
      pv: false,
      expectedPerMonth: 189.58,
    },
    {
      name: "Miner66",
      coolingKwh: 0,
      tariff: "Standard",
      pv: true,
      expectedPerMonth: 46.88,
    },
    {
      name: "Miner67",
      coolingKwh: 0,
      tariff: "Standard",
      pv: true,
      expectedPerMonth: 46.88,
    },
    {
      name: "Miner68",
      coolingKwh: 0,
      tariff: "Standard",
      pv: false,
      expectedPerMonth: 208.33,
    },
    {
      name: "Miner69",
      coolingKwh: 0,
      tariff: "Dynamic",
      pv: true,
      expectedPerMonth: 0,
    },
    {
      name: "Miner70",
      coolingKwh: 0,
      tariff: "Dynamic",
      pv: true,
      expectedPerMonth: 0,
    },
    {
      name: "Miner71",
      coolingKwh: 0,
      tariff: "Dynamic",
      pv: false,
      expectedPerMonth: 145.83,
    },
  ];

  // The sheet displays two decimals, so compare at two decimals. Miner66 is the
  // case that makes this matter: the exact figure is 46.875 and the sheet shows
  // 46.88.
  const round2 = (n: number) => Math.round(n * 100) / 100;

  it.each(cases)(
    "$name matches the sheet to the grosz",
    ({ coolingKwh, tariff, pv, expectedPerMonth }) => {
      const consumption = H.baseElectricityKwh + coolingKwh;
      const perMonth = electricityCost(consumption, tariff, pv) / 12;
      expect(round2(perMonth)).toBe(expectedPerMonth);
    },
  );

  it("derives House 1's cooling electricity from area and SEER", () => {
    const { demandKwh, electricityKwh } = coolingElectricity(H.areaM2, true);
    expect(demandKwh).toBe(H.coolingDemandKwh);
    expect(electricityKwh).toBe(S.SHEET_COOLING.AC.sheetElectricityKwh);
  });

  it("derives House 1's water energy from its litres, to within the sheet's own rounding", () => {
    // The sheet types 2 600 kWh where its own 0.05 kWh/l gives 2 500. Documented
    // in docs/baseline-model.md as an open question; asserted here so that if
    // the sheet is corrected, this test tells us.
    expect(waterEnergyKwh(H.hotWaterLitresPerYear)).toBe(2500);
    expect(H.waterEnergyKwh).toBe(2600);
  });

  it("reconstructs House 1's litres from a plausible shower count", () => {
    // 4 people x 6 showers/week x 40 l x 52 = 49 920, the basis for
    // LITRES_PER_SHOWER. Within 1% of the 50 000 the sheet types by hand, which
    // is as close as a round assumption gets.
    const litres = hotWaterLitres(H.people, 6);
    const error =
      Math.abs(litres - H.hotWaterLitresPerYear) / H.hotWaterLitresPerYear;
    expect(error).toBeLessThan(0.01);
  });
});

describe("coal energy", () => {
  it("multiplies tonnes by calorific value and boiler efficiency", () => {
    // Orzech: 8056 kWh/t x 0.80
    expect(coalHeatDelivered(5, "Orzech")).toBeCloseTo(5 * 8056 * 0.8, 6);
  });

  it("rates muł far below the graded coals", () => {
    // 5300 x 0.55 = 2915 kWh/t against orzech's 6444. This is why the grade question matters.
    expect(coalHeatDelivered(1, "Mul")).toBeLessThan(
      coalHeatDelivered(1, "Orzech") / 2,
    );
  });
});

describe("hot water source", () => {
  it("puts all hot water inside the tonnage when the boiler runs all year", () => {
    expect(coalShareOfHotWater("coalCentralAllYear")).toBe(1);
  });

  it("puts none of it inside the tonnage when water is electric", () => {
    expect(coalShareOfHotWater("electricBoilerNew")).toBe(0);
    expect(coalShareOfHotWater("electricNightTariff")).toBe(0);
  });

  it("splits it when the boiler is shut for the summer", () => {
    const share = coalShareOfHotWater("electricSummerCoalWinter");
    expect(share).toBeGreaterThan(0);
    expect(share).toBeLessThan(1);
  });
});

describe("calculateBaseline", () => {
  // Mrs. Teresa: coal boiler lit year-round, 130 m², living alone.
  const teresa = {
    heatedAreaM2: 130,
    occupants: 1,
    showersBathsPerWeek: 4,
    acAvailable: false,
    coalType: "kostka" as const,
    coalTonnesPerSeason: 4.5,
    coalPricePerTonnePln: 1400,
    electricityTariff: "G11" as const,
    electricityBillPlnPerMonth: 150,
    waterHeating: "coalCentralAllYear" as const,
  };

  it("prices the coal at what the household actually paid", () => {
    const b = calculateBaseline(teresa);
    expect(b.cost.coalPlnPerYear).toBe(4.5 * 1400);
  });

  it("takes hot water out of the tonnage when the boiler makes it", () => {
    const b = calculateBaseline(teresa);
    expect(b.energy.waterEnergyFromCoalKwh).toBe(b.energy.waterEnergyKwh);
    expect(b.energy.waterElectricityKwh).toBe(0);
    expect(b.energy.spaceHeatKwh).toBeLessThan(b.energy.coalHeatDeliveredKwh);
  });

  it("reports a building-condition figure the subsidy scope gate can band", () => {
    const b = calculateBaseline(teresa);
    // 4.5 t x 8056 kWh/t x 0.80 = 29 002 kWh, less 416 kWh of hot water, over 130 m².
    expect(b.energy.spaceHeatPerM2).toBeGreaterThan(140);
  });

  it("prices electricity off the real bill, not the model", () => {
    const b = calculateBaseline(teresa);
    expect(b.cost.electricityPlnPerYear).toBeCloseTo(150 * 12, 6);
    expect(b.electricity.measuredKwh).toBeCloseTo(1800, 6); // 1800 zł / 1.00 zł/kWh
  });

  it("reports the gap between the bill and the modelled consumption", () => {
    const b = calculateBaseline(teresa);
    expect(b.electricity.gapKwh).toBeCloseTo(
      b.electricity.measuredKwh! - b.electricity.modelledKwh,
      6,
    );
    // She uses far less than the sheet's 2 500 kWh base. Living alone, and the
    // coal boiler makes her hot water, so nothing electric is heating anything.
    expect(b.electricity.gapKwh).toBeLessThan(0);
  });

  it("counts free coal as energy but not as cost", () => {
    const withFree = calculateBaseline({ ...teresa, freeCoalTonnes: 1 });
    const without = calculateBaseline(teresa);
    expect(withFree.cost.coalPlnPerYear).toBe(without.cost.coalPlnPerYear);
    expect(withFree.energy.coalHeatDeliveredKwh).toBeGreaterThan(
      without.energy.coalHeatDeliveredKwh,
    );
  });

  it("charges hot water to electricity when the boiler is off in summer", () => {
    const b = calculateBaseline({
      ...teresa,
      waterHeating: "electricSummerCoalWinter",
    });
    expect(b.energy.waterElectricityKwh).toBeGreaterThan(0);
    expect(b.energy.spaceHeatKwh).toBeGreaterThan(
      calculateBaseline(teresa).energy.spaceHeatKwh,
    );
  });

  it("falls back to the sheet's base consumption when no bill is given", () => {
    const { electricityBillPlnPerMonth: _omitted, ...noBill } = teresa;
    const b = calculateBaseline(noBill);
    expect(b.electricity.measuredKwh).toBeNull();
    expect(b.electricity.gapKwh).toBeNull();
    expect(b.electricity.modelledKwh).toBeGreaterThanOrEqual(
      S.DEFAULT_BASE_ELECTRICITY_KWH,
    );
    expect(b.assumptions.some((a) => a.includes("No electricity bill"))).toBe(
      true,
    );
  });

  it("flags the litres-per-shower assumption on every run", () => {
    const b = calculateBaseline(teresa);
    expect(b.assumptions.some((a) => a.includes("per shower"))).toBe(true);
  });

  it("adds a cooling load only when there is an AC unit", () => {
    const withAc = calculateBaseline({ ...teresa, acAvailable: true });
    expect(withAc.energy.coolingElectricityKwh).toBeCloseTo(
      (130 * S.COOLING_DEMAND_KWH_PER_M2) / 5,
      6,
    );
    expect(calculateBaseline(teresa).energy.coolingElectricityKwh).toBe(0);
  });
});

describe("cost breakdown by end use", () => {
  const teresa = {
    heatedAreaM2: 130,
    occupants: 1,
    showersBathsPerWeek: 4,
    acAvailable: true,
    coalType: "kostka" as const,
    coalTonnesPerSeason: 4.5,
    coalPricePerTonnePln: 1400,
    electricityTariff: "G11" as const,
    electricityBillPlnPerMonth: 150,
    waterHeating: "electricSummerCoalWinter" as const,
  };

  it("splits the total three ways without losing or inventing money", () => {
    const { cost } = calculateBaseline(teresa);
    const byEndUse =
      cost.spaceHeatingPlnPerYear +
      cost.waterHeatingPlnPerYear +
      cost.electricityAndCoolingPlnPerYear;
    expect(byEndUse).toBeCloseTo(cost.totalPlnPerYear, 6);
    expect(cost.coalPlnPerYear + cost.electricityPlnPerYear).toBeCloseTo(
      cost.totalPlnPerYear,
      6,
    );
  });

  it("charges hot water to both fuels when the boiler is off in summer", () => {
    const { cost } = calculateBaseline(teresa);
    // Some coal (winter) and some electricity (summer) both went into the taps.
    expect(cost.waterHeatingPlnPerYear).toBeGreaterThan(0);
    expect(cost.spaceHeatingPlnPerYear).toBeLessThan(cost.coalPlnPerYear);
  });

  it("puts nothing in water heating when all coal goes to space heat", () => {
    const { cost } = calculateBaseline({
      ...teresa,
      waterHeating: "electricBoilerNew",
    });
    expect(cost.spaceHeatingPlnPerYear).toBeCloseTo(cost.coalPlnPerYear, 6);
  });

  it("keeps the monthly figure consistent with the annual one", () => {
    const { cost } = calculateBaseline(teresa);
    expect(cost.totalPlnPerMonth).toBeCloseTo(cost.totalPlnPerYear / 12, 6);
  });
});

describe("calculateUserBaseline", () => {
  it("computes a persona straight from its id", () => {
    const b = calculateUserBaseline("mrsTeresa");
    // 4.5 t kostka at 1400 zł/t, exactly as the persona records it.
    expect(b.cost.coalPlnPerYear).toBe(4.5 * 1400);
  });

  it("lets a custom input override the persona", () => {
    const stock = calculateUserBaseline("mrsTeresa");
    const edited = calculateUserBaseline("mrsTeresa", {
      coalTonnesPerSeason: 6,
    });
    expect(edited.cost.coalPlnPerYear).toBe(6 * 1400);
    expect(edited.energy.spaceHeatKwh).toBeGreaterThan(
      stock.energy.spaceHeatKwh,
    );
  });

  it("keeps every field the caller did not override", () => {
    const stock = calculateUserBaseline("mrMarek");
    const edited = calculateUserBaseline("mrMarek", { occupants: 4 });
    // Marek already has 4 occupants, so nothing should move.
    expect(edited.cost.totalPlnPerYear).toBeCloseTo(
      stock.cost.totalPlnPerYear,
      6,
    );
  });

  it("ignores undefined overrides rather than blanking an answer", () => {
    const stock = calculateUserBaseline("mrsTeresa");
    const withUndefined = calculateUserBaseline("mrsTeresa", {
      coalTonnesPerSeason: undefined,
    });
    expect(withUndefined.cost.totalPlnPerYear).toBeCloseTo(
      stock.cost.totalPlnPerYear,
      6,
    );
  });

  it("falls back to the blank household when the id is unknown", () => {
    const b = calculateUserBaseline("", { coalTonnesPerSeason: 4 });
    expect(b.cost.totalPlnPerYear).toBeGreaterThan(0);
  });

  it("counts a persona's free coal as energy but not as cost", () => {
    // Grandpa Janek gets 1 t from a relative's farm.
    const janek = calculateUserBaseline("grandpaJanek");
    const noFree = calculateUserBaseline("grandpaJanek", {
      freeCoalReceived: false,
    });
    expect(janek.cost.coalPlnPerYear).toBe(noFree.cost.coalPlnPerYear);
    expect(janek.energy.coalHeatDeliveredKwh).toBeGreaterThan(
      noFree.energy.coalHeatDeliveredKwh,
    );
  });
});
