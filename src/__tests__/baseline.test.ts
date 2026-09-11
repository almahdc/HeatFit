import { describe, expect, it } from "vitest";
import {
  boilerEfficiency,
  calculateBaseline,
  calculateUserBaseline,
  coalHeatDelivered,
  coalShareOfHotWater,
  coolingElectricity,
  electricityCost,
  effectiveHotWaterLitres,
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
    // 4.5 t x 8056 kWh/t x 0.80 = 29 002 kWh, less the (blended) hot water, over 130 m².
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
    expect(b.assumptions.some((a) => a.code === "electricityUseModelled")).toBe(
      true,
    );
  });

  it("flags the litres-per-shower assumption on every run", () => {
    const b = calculateBaseline(teresa);
    expect(b.assumptions.some((a) => a.code === "hotWaterPerShower")).toBe(
      true,
    );
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

describe("boiler efficiency by emission class", () => {
  const base = {
    heatedAreaM2: 100,
    occupants: 2,
    showersBathsPerWeek: 4,
    acAvailable: false,
    coalType: "orzech" as const,
    coalTonnesPerSeason: 4,
    coalPricePerTonnePln: 1300,
    electricityTariff: "G11" as const,
    electricityBillPlnPerMonth: 200,
    waterHeating: "electricBoilerNew" as const,
  };

  it("maps each class to its agreed efficiency", () => {
    expect(boilerEfficiency("bezklasowy")).toBe(0.6);
    expect(boilerEfficiency("class3")).toBe(0.75);
    expect(boilerEfficiency("class4")).toBe(0.75);
    expect(boilerEfficiency("class5")).toBe(0.85);
    // Ecodesign is a separate EU standard, not a Polish class: its
    // combustion efficiency happens to sit just above class5's, but that
    // says nothing about whether the unit also carries a Class 5 rating
    // (see engines/regulatoryDeadlines.ts, which treats that as unconfirmed).
    expect(boilerEfficiency("ecodesign")).toBe(0.88);
  });

  it("returns undefined when no class was collected", () => {
    expect(boilerEfficiency(undefined)).toBeUndefined();
  });

  it("uses the class efficiency instead of the fuel row's flat 0.80", () => {
    const b = calculateBaseline({ ...base, boilerClass: "bezklasowy" });
    expect(b.energy.coalHeatDeliveredKwh).toBeCloseTo(4 * 8056 * 0.6, 6);
  });

  it("falls back to the sheet's flat figure when the class is absent", () => {
    const b = calculateBaseline(base);
    expect(b.energy.coalHeatDeliveredKwh).toBeCloseTo(4 * 8056 * 0.8, 6);
  });

  it("rates free coal by the same boiler, not the fuel row", () => {
    const b = calculateBaseline({
      ...base,
      boilerClass: "bezklasowy",
      freeCoalTonnes: 1,
    });
    expect(b.energy.coalHeatDeliveredKwh).toBeCloseTo(
      4 * 8056 * 0.6 + 1 * 7800 * 0.6,
      6,
    );
  });

  it("a worse boiler means less heat delivered from the same tonnage", () => {
    const bad = calculateBaseline({ ...base, boilerClass: "bezklasowy" });
    const good = calculateBaseline({ ...base, boilerClass: "class5" });
    expect(bad.energy.coalHeatDeliveredKwh).toBeLessThan(
      good.energy.coalHeatDeliveredKwh,
    );
    // ...which reads as a BETTER-insulated house, since the same rooms were
    // heated on less delivered energy. This is the whole reason class matters.
    expect(bad.energy.spaceHeatPerM2).toBeLessThan(good.energy.spaceHeatPerM2);
  });

  it("does not change what the household paid", () => {
    const bad = calculateBaseline({ ...base, boilerClass: "bezklasowy" });
    const good = calculateBaseline({ ...base, boilerClass: "class5" });
    expect(bad.cost.totalPlnPerYear).toBeCloseTo(good.cost.totalPlnPerYear, 6);
  });

  it("names the efficiency it used in the assumptions", () => {
    const b = calculateBaseline({ ...base, boilerClass: "class5" });
    expect(
      b.assumptions.some(
        (a) =>
          a.code === "boilerEfficiencyKnown" &&
          a.boilerClass === "class5" &&
          a.efficiencyPct === 85,
      ),
    ).toBe(true);
  });

  it("says so in the assumptions when the class was not given", () => {
    const b = calculateBaseline(base);
    expect(
      b.assumptions.some((a) => a.code === "boilerEfficiencyUnknown"),
    ).toBe(true);
  });

  it("names the electric water heater efficiency when one is used", () => {
    const b = calculateBaseline(base);
    expect(
      b.assumptions.some(
        (a) =>
          a.code === "electricWaterHeaterEfficiency" && a.efficiencyPct === 98,
      ),
    ).toBe(true);
  });

  it("omits the electric water line when the coal boiler makes all of it", () => {
    const b = calculateBaseline({
      ...base,
      waterHeating: "coalCentralAllYear",
    });
    expect(
      b.assumptions.some((a) => a.code === "electricWaterHeaterEfficiency"),
    ).toBe(false);
  });

  it("carries the persona's class through calculateUserBaseline", () => {
    // Krysia's boiler is bezklasowy; Marek's is class 3.
    const krysia = calculateUserBaseline("grandmaKrysia");
    expect(krysia.energy.coalHeatDeliveredKwh).toBeCloseTo(5 * 8056 * 0.6, 6);
    const marek = calculateUserBaseline("mrMarek");
    expect(marek.energy.coalHeatDeliveredKwh).toBeCloseTo(5.5 * 8056 * 0.75, 6);
  });
});

describe("hot water blending", () => {
  it("discounts the drawn volume before pricing it as energy", () => {
    expect(effectiveHotWaterLitres(1000)).toBeCloseTo(600, 6);
  });

  it("leaves the sheet-verbatim conversion untouched", () => {
    // waterEnergyKwh on its own still reproduces the sheet's formula exactly —
    // the blend is applied before this function is called, not inside it.
    expect(waterEnergyKwh(1000)).toBe(50);
  });

  it("reports the full drawn volume, not the blended one", () => {
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
    const b = calculateBaseline(teresa);
    const litres = hotWaterLitres(teresa.occupants, teresa.showersBathsPerWeek);
    expect(b.energy.hotWaterLitresPerYear).toBe(litres);
    // But the energy those litres cost is the blended figure, not the raw one.
    expect(b.energy.waterEnergyKwh).toBeCloseTo(
      waterEnergyKwh(effectiveHotWaterLitres(litres)),
      6,
    );
    expect(b.energy.waterEnergyKwh).toBeLessThan(waterEnergyKwh(litres));
  });

  it("still applies the blend for a smaller household", () => {
    // Grandma Krysia: 3 people x 5 showers/week. Unblended, that is
    // 3x5x40x52 = 31 200 l/y; the blend factor knocks it down to 60% the
    // same as it would for any other household size.
    const krysia = {
      heatedAreaM2: 125,
      occupants: 3,
      showersBathsPerWeek: 5,
      acAvailable: false,
      coalType: "orzech" as const,
      coalTonnesPerSeason: 5,
      coalPricePerTonnePln: 1300,
      electricityTariff: "G11" as const,
      electricityBillPlnPerMonth: 400,
      waterHeating: "electricBoilerNew" as const,
    };
    const b = calculateBaseline(krysia);
    const rawLitres = hotWaterLitres(3, 5);
    const naiveEnergy = waterEnergyKwh(rawLitres);
    expect(b.energy.waterEnergyKwh).toBeCloseTo(naiveEnergy * 0.6, 6);
    // At this household size the blended hot-water draw is modest, so her
    // 400 zł/mo bill (G11 -> 4 800 kWh/y) sits well above what the model
    // attributes to her: base load 2 500 kWh + blended water 936 kWh / 0.98
    // efficiency ≈ 3 455 kWh. gapKwh surfaces that ~1 345 kWh difference
    // rather than hiding it.
    const expectedModelledKwh =
      S.DEFAULT_BASE_ELECTRICITY_KWH +
      (naiveEnergy * 0.6) / S.ELECTRIC_BOILER_EFFICIENCY;
    expect(b.electricity.gapKwh).toBeCloseTo(4800 - expectedModelledKwh, 6);
  });

  it("names the blend in the assumptions", () => {
    const b = calculateBaseline({
      heatedAreaM2: 100,
      occupants: 2,
      showersBathsPerWeek: 4,
      acAvailable: false,
      coalType: "orzech" as const,
      coalTonnesPerSeason: 4,
      coalPricePerTonnePln: 1300,
      electricityTariff: "G11" as const,
      electricityBillPlnPerMonth: 200,
      waterHeating: "electricBoilerNew" as const,
    });
    expect(
      b.assumptions.some(
        (a) => a.code === "hotWaterPerShower" && a.heatedSharePct === 60,
      ),
    ).toBe(true);
  });
});
