import { describe, expect, it } from "vitest";
import {
  ALTERNATIVE_HEATING_IDS,
  calculateAlternativeHeatingCost,
  calculateAllAlternativeHeatingCosts,
} from "../engines/alternativeHeating";
import {
  calculateBaseline,
  calculateUserBaseline,
  electricityCost,
} from "../engines/baseline";
import * as S from "../data/sheet.constants";

// The Ground Floor Manager (Pani Teresa): coal boiler lit year-round, 130 m², living alone, class 3.
const teresaInputs = {
  heatedAreaM2: 130,
  occupants: 1,
  showersBathsPerWeek: 4,
  acAvailable: false,
  coalType: "kostka" as const,
  boilerClass: "class3" as const,
  coalTonnesPerSeason: 4.5,
  coalPricePerTonnePln: 1400,
  electricityTariff: "G11" as const,
  electricityBillPlnPerMonth: 150,
  waterHeating: "coalCentralAllYear" as const,
};

describe("calculateAlternativeHeatingCost", () => {
  const baseline = calculateBaseline(teresaInputs);

  it("sizes the air-to-air heat pump off the coal system's own delivered heat", () => {
    const result = calculateAlternativeHeatingCost(
      "airToAirHp",
      baseline,
      "G11",
    );
    const expectedKwh = baseline.energy.spaceHeatKwh / 4.0; // COP 4.0
    expect(result.fuelPerYear).toBeCloseTo(expectedKwh, 6);
    expect(result.fuelUnit).toBe("kWh");
    expect(result.spaceHeatingPlnPerYear).toBeCloseTo(expectedKwh * 1.0, 6); // G11 = 1.00 zł/kWh
  });

  it("sizes the air-to-water heat pump at its own, lower COP", () => {
    const result = calculateAlternativeHeatingCost(
      "airToWaterHp",
      baseline,
      "G11",
    );
    const expectedKwh = baseline.energy.spaceHeatKwh / 3.0; // COP 3.0
    expect(result.fuelPerYear).toBeCloseTo(expectedKwh, 6);
    expect(result.spaceHeatingPlnPerYear).toBeCloseTo(expectedKwh * 1.0, 6);
  });

  it("a lower COP means more electricity for the same heat", () => {
    const airToAir = calculateAlternativeHeatingCost(
      "airToAirHp",
      baseline,
      "G11",
    );
    const airToWater = calculateAlternativeHeatingCost(
      "airToWaterHp",
      baseline,
      "G11",
    );
    expect(airToWater.fuelPerYear).toBeGreaterThan(airToAir.fuelPerYear);
    expect(airToWater.spaceHeatingPlnPerYear).toBeGreaterThan(
      airToAir.spaceHeatingPlnPerYear,
    );
  });

  it("prices the pellet boiler in tonnes, not kWh", () => {
    const result = calculateAlternativeHeatingCost("pellet", baseline, "G11");
    const expectedTonnes = baseline.energy.spaceHeatKwh / (4800 * 0.85); // Pellet: 4 800 kWh/t at 85%
    expect(result.fuelUnit).toBe("t");
    expect(result.fuelPerYear).toBeCloseTo(expectedTonnes, 6);
    expect(result.spaceHeatingPlnPerYear).toBeCloseTo(expectedTonnes * 1450, 6);
  });

  it("prices a heat pump off the household's own tariff", () => {
    const g11 = calculateAlternativeHeatingCost("airToAirHp", baseline, "G11");
    const g12 = calculateAlternativeHeatingCost("airToAirHp", baseline, "G12");
    // Same electricity, cheaper tariff (0.70 vs 1.00 zł/kWh) -> lower cost.
    expect(g11.fuelPerYear).toBeCloseTo(g12.fuelPerYear, 6);
    expect(g12.spaceHeatingPlnPerYear).toBeLessThan(g11.spaceHeatingPlnPerYear);
  });

  it("matches the baseline's electricity & cooling line when tariff and PV are unchanged", () => {
    const result = calculateAlternativeHeatingCost("pellet", baseline, "G11");
    expect(result.electricityAndCoolingPlnPerYear).toBe(
      baseline.cost.electricityAndCoolingPlnPerYear,
    );
  });

  it("re-homes coal-heated water onto a plain electric boiler once the coal boiler is replaced", () => {
    // Teresa's hot water is 100% coal today. Once that boiler is gone, this
    // model assumes a plain electric boiler takes over: pricier per kWh than
    // coal, so this line should rise even with nothing else about her usage
    // changed, and it should no longer match the baseline's coal-priced figure.
    const result = calculateAlternativeHeatingCost("pellet", baseline, "G11");
    const expected =
      (baseline.energy.waterEnergyFromCoalKwh / S.ELECTRIC_BOILER_EFFICIENCY) *
      S.SHEET_ELECTRICITY_PRICE.Standard;
    expect(result.waterHeatingPlnPerYear).toBeCloseTo(expected, 6);
    expect(result.waterHeatingPlnPerYear).toBeGreaterThan(
      baseline.cost.waterHeatingPlnPerYear,
    );
  });

  it("flags the coal-to-electric water heating switch as an assumption, with a cheaper heat-pump alternative", () => {
    const pellet = calculateAlternativeHeatingCost("pellet", baseline, "G11");
    const pelletAssumption = pellet.assumptions.find(
      (a) => a.code === "coalWaterHeatingSwitchesToElectric",
    );
    expect(pelletAssumption).toBeDefined();
    if (pelletAssumption?.code === "coalWaterHeatingSwitchesToElectric") {
      expect(pelletAssumption.heatPumpPlnPerYear).toBeNull();
    }

    const airToWater = calculateAlternativeHeatingCost(
      "airToWaterHp",
      baseline,
      "G11",
    );
    const hpAssumption = airToWater.assumptions.find(
      (a) => a.code === "coalWaterHeatingSwitchesToElectric",
    );
    expect(hpAssumption).toBeDefined();
    if (hpAssumption?.code === "coalWaterHeatingSwitchesToElectric") {
      expect(hpAssumption.heatPumpPlnPerYear).not.toBeNull();
      // Running it through the heat pump's own (lower) DHW efficiency should
      // cost less than the plain electric boiler fallback.
      expect(hpAssumption.heatPumpPlnPerYear!).toBeLessThan(
        hpAssumption.electricBoilerPlnPerYear,
      );
    }
  });

  it("does not flag the coal-to-electric switch for a household with no coal-heated water", () => {
    const electricWaterInputs = {
      ...teresaInputs,
      waterHeating: "electricBoilerNew" as const,
    };
    const electricWaterBaseline = calculateBaseline(electricWaterInputs);
    const result = calculateAlternativeHeatingCost(
      "pellet",
      electricWaterBaseline,
      "G11",
    );
    expect(
      result.assumptions.some(
        (a) => a.code === "coalWaterHeatingSwitchesToElectric",
      ),
    ).toBe(false);
  });

  it("re-prices electricity & cooling when switching to the dynamic tariff", () => {
    // Baseline stays on G11; the option is run as if the household switched.
    // Teresa's water heating is entirely coal-fired, so only the electric
    // "electricity & cooling" line has any price to move here.
    const g11 = calculateAlternativeHeatingCost("pellet", baseline, "G11");
    const g12 = calculateAlternativeHeatingCost("pellet", baseline, "G12");
    expect(g12.electricityAndCoolingPlnPerYear).toBeLessThan(
      g11.electricityAndCoolingPlnPerYear,
    );
  });

  it("re-prices electricity & cooling when adding solar", () => {
    // Baseline has no PV; the option is run as if solar were added.
    const withoutPv = calculateAlternativeHeatingCost(
      "pellet",
      baseline,
      "G11",
      undefined,
      false,
    );
    const withPv = calculateAlternativeHeatingCost(
      "pellet",
      baseline,
      "G11",
      undefined,
      true,
    );
    expect(withPv.electricityAndCoolingPlnPerYear).not.toBe(
      withoutPv.electricityAndCoolingPlnPerYear,
    );
  });

  it("re-prices water heating too, for a household whose hot water is electric", () => {
    const electricWaterInputs = {
      ...teresaInputs,
      waterHeating: "electricBoilerNew" as const,
      electricityBillPlnPerMonth: undefined,
    };
    const electricWaterBaseline = calculateBaseline(electricWaterInputs);
    const g11 = calculateAlternativeHeatingCost(
      "pellet",
      electricWaterBaseline,
      "G11",
    );
    const g12 = calculateAlternativeHeatingCost(
      "pellet",
      electricWaterBaseline,
      "G12",
    );
    expect(g12.waterHeatingPlnPerYear).toBeLessThan(g11.waterHeatingPlnPerYear);
  });

  it("sums its own three lines to its own total, without losing or inventing money", () => {
    for (const id of ALTERNATIVE_HEATING_IDS) {
      const result = calculateAlternativeHeatingCost(id, baseline, "G11");
      const sum =
        result.spaceHeatingPlnPerYear +
        result.waterHeatingPlnPerYear +
        result.electricityAndCoolingPlnPerYear;
      expect(sum).toBeCloseTo(result.totalPlnPerYear, 6);
    }
  });

  it("defines savings as baseline total minus the alternative's total", () => {
    const result = calculateAlternativeHeatingCost(
      "airToWaterHp",
      baseline,
      "G11",
    );
    expect(result.savingsPlnPerYear).toBeCloseTo(
      baseline.cost.totalPlnPerYear - result.totalPlnPerYear,
      6,
    );
    expect(result.savingsPlnPerMonth).toBeCloseTo(
      result.savingsPlnPerYear / 12,
      6,
    );
  });

  it("keeps the monthly total consistent with the annual one", () => {
    const result = calculateAlternativeHeatingCost(
      "airToAirHp",
      baseline,
      "G11",
    );
    expect(result.totalPlnPerMonth).toBeCloseTo(result.totalPlnPerYear / 12, 6);
  });

  it("lets a caller override the useful heat figure", () => {
    const doubled = calculateAlternativeHeatingCost(
      "airToAirHp",
      baseline,
      "G11",
      baseline.energy.spaceHeatKwh * 2,
    );
    const normal = calculateAlternativeHeatingCost(
      "airToAirHp",
      baseline,
      "G11",
    );
    expect(doubled.fuelPerYear).toBeCloseTo(normal.fuelPerYear * 2, 6);
  });
});

describe("calculateAllAlternativeHeatingCosts", () => {
  it("returns exactly the three offered options, in the offered order", () => {
    const baseline = calculateBaseline(teresaInputs);
    const results = calculateAllAlternativeHeatingCosts(baseline, "G11");
    expect(results.map((r) => r.id)).toEqual([
      "airToAirHp",
      "airToWaterHp",
      "pellet",
    ]);
  });

  it("every persona gets a sane, positive running cost for every option", () => {
    for (const presetId of [
      "warmthGuardian",
      "methodicalPlanner",
      "groundFloorManager",
      "nightWatch",
    ]) {
      const baseline = calculateUserBaseline(presetId);
      const results = calculateAllAlternativeHeatingCosts(baseline, "G11");
      for (const r of results) {
        expect(r.totalPlnPerYear).toBeGreaterThan(0);
        expect(r.fuelPerYear).toBeGreaterThan(0);
      }
    }
  });
});

describe("PV", () => {
  // Same household as above, but now with panels.
  const pvInputs = { ...teresaInputs, hasPvPanels: true };
  const baselineNoPv = calculateBaseline(teresaInputs);
  const baselineWithPv = calculateBaseline(pvInputs);

  it("does not change a heat pump's price when the household has no PV", () => {
    const result = calculateAlternativeHeatingCost(
      "airToAirHp",
      baselineNoPv,
      "G11",
      undefined,
      false,
    );
    const kwh = baselineNoPv.energy.spaceHeatKwh / 4.0;
    expect(result.spaceHeatingPlnPerYear).toBeCloseTo(kwh * 1.0, 6);
    expect(result.pvSavingsOnSpaceHeatingPlnPerYear).toBe(0);
  });

  it("prices the new kWh as the marginal cost against the household's existing meter", () => {
    const result = calculateAlternativeHeatingCost(
      "airToAirHp",
      baselineWithPv,
      "G11",
      undefined,
      true,
    );
    const kwh = baselineWithPv.energy.spaceHeatKwh / 4.0;
    const existing =
      baselineWithPv.electricity.measuredKwh ??
      baselineWithPv.electricity.modelledKwh;
    const expectedMarginal =
      electricityCost(existing + kwh, "Standard", true) -
      electricityCost(existing, "Standard", true);
    expect(result.spaceHeatingPlnPerYear).toBeCloseTo(expectedMarginal, 6);
  });

  it("charges less than the flat rate once PV is added", () => {
    const withoutPv = calculateAlternativeHeatingCost(
      "airToAirHp",
      baselineNoPv,
      "G11",
      undefined,
      false,
    );
    const withPv = calculateAlternativeHeatingCost(
      "airToAirHp",
      baselineWithPv,
      "G11",
      undefined,
      true,
    );
    // Same useful heat, same COP, same tariff: only PV differs.
    expect(withPv.spaceHeatingPlnPerYear).toBeLessThan(
      withoutPv.spaceHeatingPlnPerYear,
    );
    expect(withPv.pvSavingsOnSpaceHeatingPlnPerYear).toBeGreaterThan(0);
  });

  it("reports the PV saving as exactly flat cost minus what was actually charged", () => {
    const result = calculateAlternativeHeatingCost(
      "airToWaterHp",
      baselineWithPv,
      "G11",
      undefined,
      true,
    );
    const kwh = baselineWithPv.energy.spaceHeatKwh / 3.0;
    const flat = kwh * 1.0;
    expect(result.pvSavingsOnSpaceHeatingPlnPerYear).toBeCloseTo(
      flat - result.spaceHeatingPlnPerYear,
      6,
    );
  });

  it("never nets PV against the pellet boiler's fuel cost", () => {
    const result = calculateAlternativeHeatingCost(
      "pellet",
      baselineWithPv,
      "G11",
      undefined,
      true,
    );
    expect(result.pvSavingsOnSpaceHeatingPlnPerYear).toBe(0);
    const tonnes = baselineWithPv.energy.spaceHeatKwh / (4800 * 0.85);
    expect(result.spaceHeatingPlnPerYear).toBeCloseTo(tonnes * 1450, 6);
  });

  it("still sums its three lines to its total, with PV in the mix", () => {
    for (const id of ALTERNATIVE_HEATING_IDS) {
      const result = calculateAlternativeHeatingCost(
        id,
        baselineWithPv,
        "G11",
        undefined,
        true,
      );
      const sum =
        result.spaceHeatingPlnPerYear +
        result.waterHeatingPlnPerYear +
        result.electricityAndCoolingPlnPerYear;
      expect(sum).toBeCloseTo(result.totalPlnPerYear, 6);
    }
  });

  it("passes hasPvPanels through calculateAllAlternativeHeatingCosts", () => {
    const withPv = calculateAllAlternativeHeatingCosts(
      baselineWithPv,
      "G11",
      true,
    );
    const withoutPv = calculateAllAlternativeHeatingCosts(
      baselineWithPv,
      "G11",
      false,
    );
    const heatPumpWithPv = withPv.find((r) => r.id === "airToAirHp")!;
    const heatPumpWithoutPv = withoutPv.find((r) => r.id === "airToAirHp")!;
    expect(heatPumpWithPv.spaceHeatingPlnPerYear).toBeLessThan(
      heatPumpWithoutPv.spaceHeatingPlnPerYear,
    );
  });
});

describe("independent longhand check against the sheet's own FUEL rows", () => {
  it("matches SHEET_FUELS exactly for every replacement option", () => {
    // Not a call into the engine's own constants: read straight off the
    // transcribed sheet table, the same way scripts/verify-baseline.ts does.
    expect(S.SHEET_FUELS["air-to-air HP"].efficiency).toBe(4.0);
    expect(S.SHEET_FUELS["air-to-water HP"].efficiency).toBe(3.0);
    expect(S.SHEET_FUELS.Pellet.efficiency).toBe(0.85);
    expect(S.SHEET_FUELS.Pellet.kwhPerUnit).toBe(4800);
    expect(S.SHEET_FUELS.Pellet.plnPerUnit).toBe(1450);
  });
});
