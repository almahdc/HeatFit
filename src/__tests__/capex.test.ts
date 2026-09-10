import { describe, expect, it } from "vitest";
import {
  calculateCapexBreakdown,
  calculateSolarAddOn,
  ZUM_DATABASE_URL,
} from "../engines/capex";
import { ALTERNATIVE_HEATING_OPTIONS } from "../engines/alternativeHeating";
import * as C from "../data/constants.pl";
import * as S from "../data/sheet.constants";

describe("calculateCapexBreakdown", () => {
  it("sums hardware and installation to the total, band for band, for every option", () => {
    for (const option of ALTERNATIVE_HEATING_OPTIONS) {
      const b = calculateCapexBreakdown(option.id);
      expect(b.hardware.lowPln + b.installation.lowPln).toBeCloseTo(
        b.totalGross.lowPln,
        6,
      );
      expect(b.hardware.midPln + b.installation.midPln).toBeCloseTo(
        b.totalGross.midPln,
        6,
      );
      expect(b.hardware.highPln + b.installation.highPln).toBeCloseTo(
        b.totalGross.highPln,
        6,
      );
    }
  });

  it("keeps low <= mid <= high on every line, for every option", () => {
    for (const option of ALTERNATIVE_HEATING_OPTIONS) {
      const b = calculateCapexBreakdown(option.id);
      for (const line of [b.hardware, b.installation, b.totalGross]) {
        expect(line.lowPln).toBeLessThanOrEqual(line.midPln);
        expect(line.midPln).toBeLessThanOrEqual(line.highPln);
      }
    }
  });

  it("air-to-air: hardware and installation come straight from their own sourced bands", () => {
    const b = calculateCapexBreakdown("airToAirHp");
    expect(b.hardware.lowPln).toBe(C.AIR_TO_AIR_HP_HARDWARE_COST.low);
    expect(b.hardware.midPln).toBe(C.AIR_TO_AIR_HP_HARDWARE_COST.mid);
    expect(b.hardware.highPln).toBe(C.AIR_TO_AIR_HP_HARDWARE_COST.high);
    expect(b.installation.midPln).toBe(C.AIR_TO_AIR_HP_INSTALLATION_COST.mid);
  });

  it("air-to-water: total is exactly HEAT_PUMP_INSTALLED_COST, untouched by the split", () => {
    const b = calculateCapexBreakdown("airToWaterHp");
    expect(b.totalGross.lowPln).toBe(C.HEAT_PUMP_INSTALLED_COST.low);
    expect(b.totalGross.midPln).toBe(C.HEAT_PUMP_INSTALLED_COST.mid);
    expect(b.totalGross.highPln).toBe(C.HEAT_PUMP_INSTALLED_COST.high);
  });

  it("air-to-water: installation is the sourced share of the total, hardware is the rest", () => {
    const b = calculateCapexBreakdown("airToWaterHp");
    const share = C.HEAT_PUMP_INSTALL_SHARE_OF_TOTAL.value;
    expect(b.installation.midPln).toBeCloseTo(
      C.HEAT_PUMP_INSTALLED_COST.mid * share,
      6,
    );
    expect(b.hardware.midPln).toBeCloseTo(
      C.HEAT_PUMP_INSTALLED_COST.mid * (1 - share),
      6,
    );
  });

  it("pellet: total is exactly PELLET_BOILER_INSTALLED_COST, untouched by the split", () => {
    const b = calculateCapexBreakdown("pellet");
    expect(b.totalGross.lowPln).toBe(C.PELLET_BOILER_INSTALLED_COST.low);
    expect(b.totalGross.midPln).toBe(C.PELLET_BOILER_INSTALLED_COST.mid);
    expect(b.totalGross.highPln).toBe(C.PELLET_BOILER_INSTALLED_COST.high);
  });

  it("pellet installation is a smaller share of its total than the heat pumps", () => {
    // A boiler swap is plumbing and a flue, not refrigerant lines and an
    // outdoor unit — the sourced shares should reflect that, not just happen
    // to.
    const pellet = calculateCapexBreakdown("pellet");
    const airToWater = calculateCapexBreakdown("airToWaterHp");
    const pelletShare = pellet.installation.midPln / pellet.totalGross.midPln;
    const hpShare =
      airToWater.installation.midPln / airToWater.totalGross.midPln;
    expect(pelletShare).toBeLessThan(hpShare);
  });

  it("air-to-water costs more than air-to-air, matching a hydronic retrofit vs. a multisplit", () => {
    const airToWater = calculateCapexBreakdown("airToWaterHp");
    const airToAir = calculateCapexBreakdown("airToAirHp");
    expect(airToWater.totalGross.midPln).toBeGreaterThan(
      airToAir.totalGross.midPln,
    );
  });

  it("names a source string for every option", () => {
    for (const option of ALTERNATIVE_HEATING_OPTIONS) {
      const b = calculateCapexBreakdown(option.id);
      expect(b.source.length).toBeGreaterThan(0);
    }
  });
});

describe("calculateCapexBreakdown never involves PV", () => {
  // PV is not part of the heating system's own cost — see calculateSolarAddOn
  // below for the separate, opt-in add-on. calculateCapexBreakdown takes no
  // PV-related input at all, so this is really just re-confirming the
  // heating-only invariant holds regardless of anyone's PV status.
  it("totals exactly hardware plus installation, for every option", () => {
    for (const option of ALTERNATIVE_HEATING_OPTIONS) {
      const b = calculateCapexBreakdown(option.id);
      expect(b.hardware.midPln + b.installation.midPln).toBeCloseTo(
        b.totalGross.midPln,
        6,
      );
    }
  });
});

describe("calculateSolarAddOn", () => {
  it("reads production straight from the sheet's flat PV assumption", () => {
    const solar = calculateSolarAddOn();
    expect(solar.productionKwhPerYear).toBe(S.SHEET_PV.productionKwhPerYear);
  });

  it("prices the array at PV_CAPEX_PLN", () => {
    const solar = calculateSolarAddOn();
    expect(solar.capexPln).toBe(C.PV_CAPEX_PLN.value);
  });
});

describe("ZUM_DATABASE_URL", () => {
  it("is a real, well-formed https URL", () => {
    expect(() => new URL(ZUM_DATABASE_URL)).not.toThrow();
    expect(ZUM_DATABASE_URL.startsWith("https://")).toBe(true);
  });
});
