/**
 * baseline.ts: what the household is paying TODAY, on coal.
 *
 * The baseline is the counterfactual every other scenario is measured against,
 * so it is worth getting right before any replacement option is priced. Nothing
 * here proposes a change; it only reconstructs the current year.
 *
 * The arithmetic is the `price_calculator` sheet's, deliberately reproduced
 * step for step with point values rather than the low/mid/high bands the other
 * engines use. Two reasons: the steps stay legible next to the sheet, and the
 * sheet's own worked scenarios become regression tests (see baseline.test.ts,
 * which reproduces twelve of them to the grosz).
 *
 * This is the SINGLE source of truth for the baseline. The band-based
 * runningCost.ts that used to compute a second, disagreeing one was deleted
 * when this landed; recover it from git history if its pellet and heat-pump
 * scenario functions are wanted for the replacement-options step.
 *
 * Knows nothing about React, subsidies, loans or verdicts.
 */

import * as S from "../data/sheet.constants";
import { SUMMER_DHW_SHARE } from "../data/constants.pl";
import {
  HOUSEHOLD_CASE_PRESETS,
  initialHouseholdCase,
} from "../wizard/householdCases";
import type {
  BoilerClass,
  CoalType,
  ElectricityTariffCase,
  HouseholdCaseInputs,
  WaterHeatingCase,
} from "../wizard/householdCases";

// --- inputs -----------------------------------------------------------------

export interface BaselineInputs {
  // Home
  /** Heated floor area, m². */
  heatedAreaM2: number;
  /** People living here. Drives hot water volume, nothing else. */
  occupants: number;
  /** Showers or baths per week, per person. */
  showersBathsPerWeek: number;
  /** Split unit or similar. Drives the cooling term only. */
  acAvailable: boolean;

  // Coal
  coalType: CoalType;
  /**
   * Emission class of the boiler burning it. Sets the conversion efficiency,
   * which the sheet flattens to 0.80 for every coal row. Omit it and that flat
   * sheet figure is used, which is what the sheet-regression tests rely on.
   */
  boilerClass?: BoilerClass;
  /** Tonnes bought per season, paid for at `coalPricePerTonnePln`. */
  coalTonnesPerSeason: number;
  /** What they actually paid. Beats the sheet's grade price, so it wins. */
  coalPricePerTonnePln?: number;
  /** Tonnes received free or discounted (deputat). Energy, no cost. */
  freeCoalTonnes?: number;

  // Electricity and water
  electricityTariff: ElectricityTariffCase;
  /** The bill they actually get. Measured, so it beats the modelled figure. */
  electricityBillPlnPerMonth?: number;
  waterHeating: WaterHeatingCase;
  hasPvPanels?: boolean;
}

// --- outputs ----------------------------------------------------------------

export interface BaselineEnergy {
  /** Useful heat the coal boiler actually delivered, kWh/y. */
  coalHeatDeliveredKwh: number;
  /**
   * The three inputs `coalHeatDeliveredKwh` is built from, echoed back so the
   * UI can show the formula rather than just its result (see
   * BaselineSummary's "why these could be off" note). `coalFuel` is the
   * sheet's own row name, not the wizard's coal-type id.
   */
  coalTonnesPerSeason: number;
  coalKwhPerTonne: number;
  coalFuel: S.SheetFuel;
  /** The efficiency actually used, whether from a known class or the sheet's flat fallback. */
  boilerEfficiencyPct: number;
  /**
   * Hot water drawn off, litres/y: the full tap volume, not blended down.
   * `waterEnergyKwh` is the one that reflects `HOT_WATER_BLEND_FACTOR`.
   */
  hotWaterLitresPerYear: number;
  /**
   * Useful energy that hot water needs, kWh/y, however it is made. Already
   * accounts for tap blending: not every litre drawn needed the full lift.
   */
  waterEnergyKwh: number;
  /** The share of that made by the coal boiler, kWh/y. */
  waterEnergyFromCoalKwh: number;
  /** The share bought as electricity, kWh/y of useful energy. */
  waterEnergyFromElectricityKwh: number;
  /** Electricity the water heater draws to deliver the above, kWh/y. */
  waterElectricityKwh: number;
  /** Coal heat left once hot water is taken out, kWh/y. */
  spaceHeatKwh: number;
  /**
   * Space heat per m², kWh/m²/y: the building-condition figure.
   * This is the number the Czyste Powietrze scope gate bands on, so it is the
   * single most consequential output here.
   */
  spaceHeatPerM2: number;
  /** Cooling demand and the electricity to meet it, kWh/y. */
  coolingDemandKwh: number;
  coolingElectricityKwh: number;
}

export interface BaselineCost {
  // --- by what it was bought as --------------------------------------------
  /** Coal bought, PLN/y. Free tonnes contribute energy but no cost. */
  coalPlnPerYear: number;
  /** Electricity, PLN/y, after any PV netting. */
  electricityPlnPerYear: number;

  // --- by what it was spent on ---------------------------------------------
  // The same total, sliced the other way. This is the slicing a household
  // recognises: they do not think "coal and electricity", they think "heating,
  // hot water, and the rest of the bill".
  //
  // Coal is split by energy share (space heat vs the water the boiler made).
  // Electricity is split by modelled kWh share. Both splits are proportional,
  // so the three lines below always sum to the two lines above.
  /** Keeping the house warm, PLN/y. */
  spaceHeatingPlnPerYear: number;
  /** Hot water, PLN/y, whether the coal boiler or a tank made it. */
  waterHeatingPlnPerYear: number;
  /** Everything else on the meter, plus cooling, PLN/y. */
  electricityAndCoolingPlnPerYear: number;

  // --- totals ---------------------------------------------------------------
  totalPlnPerYear: number;
  /** What the household actually reads. */
  totalPlnPerMonth: number;
}

export interface ElectricityReconciliation {
  /** kWh/y implied by the bill they gave us, at their tariff price. */
  measuredKwh: number | null;
  /** kWh/y the model expects: base + water + cooling. */
  modelledKwh: number;
  /**
   * measured - modelled. A large positive gap usually means electric heaters,
   * an immersion tank, or a workshop nobody mentioned. A large negative gap
   * means the modelled hot water or cooling is too generous.
   * Null when no bill was given.
   */
  gapKwh: number | null;
}

/**
 * An assumption the model had to make, as data rather than prose.
 *
 * The sentence lives in the i18n dictionary under `assumptions`, keyed by
 * `code`, with everything it interpolates travelling alongside. Percentages
 * arrive already rounded, so the number a household reads is the number the
 * model used, in every language.
 */
export type BaselineAssumption =
  | { code: "coalGradeAssumed"; fuel: S.SheetFuel }
  | {
      code: "boilerEfficiencyKnown";
      boilerClass: BoilerClass;
      efficiencyPct: number;
    }
  | { code: "boilerEfficiencyUnknown"; efficiencyPct: number }
  | { code: "coalPriceAssumed"; pricePerTonnePln: number }
  | { code: "hotWaterPerShower"; litres: number; heatedSharePct: number }
  | { code: "summerElectricWater"; sharePct: number }
  | { code: "electricWaterHeaterEfficiency"; efficiencyPct: number }
  | { code: "electricityUseModelled"; kwhPerYear: number }
  | { code: "electricityPriceAssumedFlat"; pricePerKwh: number }
  | { code: "electricityPriceAssumedDynamic"; pricePerKwh: number };

export interface Baseline {
  energy: BaselineEnergy;
  cost: BaselineCost;
  electricity: ElectricityReconciliation;
  /**
   * Every assumption that was used because an answer was missing or soft,
   * plus the handful (electricity price, for one) this model always makes
   * regardless of what was answered.
   */
  assumptions: BaselineAssumption[];
}

/**
 * The three "by what it was spent on" lines a household actually sees and can
 * judge on sight (see BaselineSummary.tsx). The only baseline figures a
 * household can correct by hand when the model gets something wrong.
 */
export type EditableBaselineCostField =
  | "spaceHeatingPlnPerYear"
  | "waterHeatingPlnPerYear"
  | "electricityAndCoolingPlnPerYear";

export type BaselineCostOverrides = Partial<
  Record<EditableBaselineCostField, number>
>;

/**
 * Applies household-entered corrections on top of the modelled baseline cost.
 *
 * Only the three lines above are ever overridden. The "by what it was bought
 * as" split (coalPlnPerYear/electricityPlnPerYear) and every energy/kWh
 * figure stay exactly what the model computed: they are not shown next to an
 * edit control, nothing downstream reads them expecting them to reconcile
 * with the edited totals, and a household correcting a cost they disagree
 * with is not saying anything about what the underlying energy model should
 * have assumed instead (grant eligibility, for one, still has to be decided
 * from the model's own kWh/m², not from a corrected złoty figure). Totals are
 * always the sum of the three lines below, overridden or not, so the
 * arithmetic a household can do in their head always holds.
 */
export function applyCostOverrides(
  baseline: Baseline,
  overrides: BaselineCostOverrides,
): Baseline {
  if (Object.keys(overrides).length === 0) return baseline;

  const spaceHeatingPlnPerYear =
    overrides.spaceHeatingPlnPerYear ?? baseline.cost.spaceHeatingPlnPerYear;
  const waterHeatingPlnPerYear =
    overrides.waterHeatingPlnPerYear ?? baseline.cost.waterHeatingPlnPerYear;
  const electricityAndCoolingPlnPerYear =
    overrides.electricityAndCoolingPlnPerYear ??
    baseline.cost.electricityAndCoolingPlnPerYear;
  const totalPlnPerYear =
    spaceHeatingPlnPerYear +
    waterHeatingPlnPerYear +
    electricityAndCoolingPlnPerYear;

  return {
    ...baseline,
    cost: {
      ...baseline.cost,
      spaceHeatingPlnPerYear,
      waterHeatingPlnPerYear,
      electricityAndCoolingPlnPerYear,
      totalPlnPerYear,
      totalPlnPerMonth: totalPlnPerYear / 12,
    },
  };
}

// --- step 1: coal in, useful heat out ---------------------------------------

/**
 * Tonnes of a given grade -> useful heat delivered into the house, kWh/y.
 *
 *   tonnes x kWh per tonne x boiler efficiency
 *
 * The energy content comes from the fuel row; the efficiency does not have to.
 * The sheet folds a flat 0.80 into every coal row, which credits a no-class
 * kopciuch and a class 5 unit with exactly the same output from the same
 * tonnage. Pass `efficiency` (from `boilerEfficiency`) to use the real class
 * instead. Omitting it keeps the sheet's figure, which is what lets the
 * sheet-regression tests stay honest.
 */
export function coalHeatDelivered(
  tonnes: number,
  fuel: S.SheetFuel,
  efficiency?: number,
): number {
  const spec = S.SHEET_FUELS[fuel];
  return tonnes * spec.kwhPerUnit * (efficiency ?? spec.efficiency);
}

/**
 * Emission class -> conversion efficiency.
 *
 * Undefined when the class was not collected, which is the signal to fall back
 * to the fuel row's own figure rather than guess a class.
 */
export function boilerEfficiency(
  boilerClass?: BoilerClass,
): number | undefined {
  return boilerClass ? S.BOILER_EFFICIENCY[boilerClass] : undefined;
}

// --- step 2: hot water ------------------------------------------------------

/**
 * Hot water drawn off per year, litres.
 *
 *   people x showers per week x litres per shower x 52
 *
 * `LITRES_PER_SHOWER` is the one number here the sheet does not provide.
 */
export function hotWaterLitres(
  occupants: number,
  showersBathsPerWeek: number,
): number {
  return occupants * showersBathsPerWeek * S.LITRES_PER_SHOWER * 52;
}

/**
 * Litres -> useful energy, kWh/y, at the sheet's 45 °C lift.
 *
 * Sheet-verbatim: no blending here. `calculateBaseline` runs the litres through
 * `effectiveHotWaterLitres` first: see that function for why: which keeps
 * this one reproducing the sheet's own formula exactly and testable against it
 * on its own.
 */
export function waterEnergyKwh(litres: number): number {
  return litres * S.WATER_KWH_PER_LITRE_45C;
}

/**
 * Litres drawn at the tap -> litres that actually needed the full 45 °C lift.
 *
 * A shower or bath is not neat hot water: a mixing valve tempers water from
 * the tank or boiler coil with cold mains to reach a comfortable temperature,
 * so part of every litre counted by `hotWaterLitres` never touched the heat
 * source. `HOT_WATER_BLEND_FACTOR` is the correction: see its docs for why it
 * exists and what it deliberately does not change.
 */
export function effectiveHotWaterLitres(litres: number): number {
  return litres * S.HOT_WATER_BLEND_FACTOR;
}

/**
 * What fraction of the year's hot water the COAL boiler makes.
 *
 * This decides the sign of the whole hot-water correction, which is why the
 * wizard asks rather than assuming:
 *
 *   coalCentralAllYear        the boiler is lit in July just for washing water,
 *                             so all of it is already inside the tonnage
 *   electricSummerCoalWinter  the boiler is shut for the summer and an immersion
 *                             tank takes over
 *   electricBoilerNew         none of it is in the tonnage
 *   electricNightTariff       none of it is in the tonnage
 */
export function coalShareOfHotWater(source: WaterHeatingCase): number {
  switch (source) {
    case "coalCentralAllYear":
      return 1;
    case "electricSummerCoalWinter":
      return 1 - SUMMER_DHW_SHARE.mid;
    case "electricBoilerNew":
    case "electricNightTariff":
      return 0;
  }
}

// --- step 3: cooling --------------------------------------------------------

/**
 * Cooling demand and the electricity to meet it, kWh/y.
 *
 *   demand      = area x 25 kWh/m²/y
 *   electricity = demand / SEER
 *
 * Only split-unit AC is modelled at baseline: a household still on coal has no
 * heat pump to cool with.
 */
export function coolingElectricity(areaM2: number, acAvailable: boolean) {
  if (!acAvailable) return { demandKwh: 0, electricityKwh: 0 };
  const demandKwh = areaM2 * S.COOLING_DEMAND_KWH_PER_M2;
  const seer = S.SHEET_COOLING.AC.seer!;
  return { demandKwh, electricityKwh: demandKwh / seer };
}

// --- step 4: electricity, with PV netting -----------------------------------

/**
 * Annual electricity cost, PLN.
 *
 * Without PV this is simply consumption x price. With PV the sheet nets it:
 *
 *   self-consumed = consumption x share used directly
 *   import        = (consumption - self-consumed) x tariff price
 *   export credit = (PV production - self-consumed) x export price
 *   cost          = import - export credit
 *
 * Note that `shareUsedDirectly` multiplies CONSUMPTION, not generation. That is
 * the reading which reproduces the sheet's scenario outputs exactly, and it is
 * verified against nine of them in baseline.test.ts.
 *
 * Two consequences worth knowing before this number is shown to anyone: the
 * result can go negative when a small consumer exports most of a 5 000 kWh
 * array, and a battery changes nothing, because the sheet has no term for one.
 */
export function electricityCost(
  consumptionKwh: number,
  tariff: S.SheetTariff,
  hasPv: boolean,
): number {
  const price = S.SHEET_ELECTRICITY_PRICE[tariff];
  if (!hasPv) return consumptionKwh * price;

  const selfConsumed = consumptionKwh * S.SHEET_PV.shareUsedDirectly;
  const imported = (consumptionKwh - selfConsumed) * price;
  const exported =
    (S.SHEET_PV.productionKwhPerYear - selfConsumed) *
    S.SHEET_PV.exportPricePerKwh;
  return imported - exported;
}

// --- the whole baseline in one call -----------------------------------------

export function calculateBaseline(input: BaselineInputs): Baseline {
  const assumptions: BaselineAssumption[] = [];

  // --- coal -----------------------------------------------------------------
  const fuel = S.FUEL_FROM_COAL_TYPE[input.coalType];
  if (input.coalType === "other") {
    assumptions.push({ code: "coalGradeAssumed", fuel });
  }

  // The boiler, not the fuel, sets how much of that energy reaches the rooms.
  // Free coal burns in the same boiler, so it gets the same efficiency.
  const efficiency = boilerEfficiency(input.boilerClass);
  if (input.boilerClass) {
    assumptions.push({
      code: "boilerEfficiencyKnown",
      boilerClass: input.boilerClass,
      efficiencyPct: Math.round(S.BOILER_EFFICIENCY[input.boilerClass] * 100),
    });
  } else {
    assumptions.push({
      code: "boilerEfficiencyUnknown",
      efficiencyPct: Math.round(S.SHEET_FUELS[fuel].efficiency * 100),
    });
  }

  const freeTonnes = input.freeCoalTonnes ?? 0;
  const paidHeat = coalHeatDelivered(
    input.coalTonnesPerSeason,
    fuel,
    efficiency,
  );
  const freeHeat = freeTonnes
    ? coalHeatDelivered(freeTonnes, S.FREE_COAL_FUEL, efficiency)
    : 0;
  const coalHeatDeliveredKwh = paidHeat + freeHeat;

  const pricePerTonne =
    input.coalPricePerTonnePln ?? S.SHEET_FUELS[fuel].plnPerUnit;
  if (input.coalPricePerTonnePln === undefined) {
    assumptions.push({
      code: "coalPriceAssumed",
      pricePerTonnePln: pricePerTonne,
    });
  }
  const coalPlnPerYear =
    input.coalTonnesPerSeason * pricePerTonne +
    S.SHEET_FUELS[fuel].fixedPlnPerYear;

  // --- hot water ------------------------------------------------------------
  const litres = hotWaterLitres(input.occupants, input.showersBathsPerWeek);
  const effectiveLitres = effectiveHotWaterLitres(litres);
  const waterEnergy = waterEnergyKwh(effectiveLitres);
  assumptions.push({
    code: "hotWaterPerShower",
    litres: S.LITRES_PER_SHOWER,
    heatedSharePct: Math.round(S.HOT_WATER_BLEND_FACTOR * 100),
  });

  const coalShare = coalShareOfHotWater(input.waterHeating);
  if (input.waterHeating === "electricSummerCoalWinter") {
    assumptions.push({
      code: "summerElectricWater",
      sharePct: Math.round(SUMMER_DHW_SHARE.mid * 100),
    });
  }

  const waterEnergyFromCoalKwh = waterEnergy * coalShare;
  const waterEnergyFromElectricityKwh = waterEnergy - waterEnergyFromCoalKwh;
  const waterElectricityKwh =
    waterEnergyFromElectricityKwh / S.ELECTRIC_BOILER_EFFICIENCY;
  if (waterEnergyFromElectricityKwh > 0) {
    assumptions.push({
      code: "electricWaterHeaterEfficiency",
      efficiencyPct: Math.round(S.ELECTRIC_BOILER_EFFICIENCY * 100),
    });
  }

  // --- space heat -----------------------------------------------------------
  // Whatever the boiler delivered that did not go into the taps.
  const spaceHeatKwh = Math.max(
    0,
    coalHeatDeliveredKwh - waterEnergyFromCoalKwh,
  );
  const spaceHeatPerM2 =
    input.heatedAreaM2 > 0 ? spaceHeatKwh / input.heatedAreaM2 : 0;

  // --- cooling --------------------------------------------------------------
  const cooling = coolingElectricity(input.heatedAreaM2, input.acAvailable);

  // --- electricity ----------------------------------------------------------
  const tariff = S.TARIFF_FROM_WIZARD[input.electricityTariff];
  const price = S.SHEET_ELECTRICITY_PRICE[tariff];
  assumptions.push(
    input.electricityTariff === "G12"
      ? { code: "electricityPriceAssumedDynamic", pricePerKwh: price }
      : { code: "electricityPriceAssumedFlat", pricePerKwh: price },
  );

  const modelledKwh =
    S.DEFAULT_BASE_ELECTRICITY_KWH +
    waterElectricityKwh +
    cooling.electricityKwh;

  const measuredKwh =
    input.electricityBillPlnPerMonth !== undefined
      ? (input.electricityBillPlnPerMonth * 12) / price
      : null;

  // A real bill is measured energy for this specific house. It beats the model
  // every time, so it is what gets priced; the model is kept only to reconcile.
  const consumptionKwh = measuredKwh ?? modelledKwh;
  if (measuredKwh === null) {
    assumptions.push({
      code: "electricityUseModelled",
      kwhPerYear: Math.round(modelledKwh),
    });
  }

  const electricityPlnPerYear = electricityCost(
    consumptionKwh,
    tariff,
    input.hasPvPanels ?? false,
  );

  const totalPlnPerYear = coalPlnPerYear + electricityPlnPerYear;

  // --- slice the same total by end use --------------------------------------
  // Coal by energy share. A boiler that also makes hot water spent some of
  // those tonnes on the taps, and the household should see that separately.
  const coalWaterShare =
    coalHeatDeliveredKwh > 0
      ? waterEnergyFromCoalKwh / coalHeatDeliveredKwh
      : 0;

  // Electricity by modelled kWh share. The bill is priced as a whole (it is
  // measured, so it wins), but the split has to come from the model: the meter
  // does not itemise the immersion tank.
  const elecWaterShare =
    modelledKwh > 0 ? waterElectricityKwh / modelledKwh : 0;

  const spaceHeatingPlnPerYear = coalPlnPerYear * (1 - coalWaterShare);
  const waterHeatingPlnPerYear =
    coalPlnPerYear * coalWaterShare + electricityPlnPerYear * elecWaterShare;
  const electricityAndCoolingPlnPerYear =
    electricityPlnPerYear * (1 - elecWaterShare);

  return {
    energy: {
      coalHeatDeliveredKwh,
      coalTonnesPerSeason: input.coalTonnesPerSeason,
      coalKwhPerTonne: S.SHEET_FUELS[fuel].kwhPerUnit,
      coalFuel: fuel,
      boilerEfficiencyPct: Math.round(
        (efficiency ?? S.SHEET_FUELS[fuel].efficiency) * 100,
      ),
      hotWaterLitresPerYear: litres,
      waterEnergyKwh: waterEnergy,
      waterEnergyFromCoalKwh,
      waterEnergyFromElectricityKwh,
      waterElectricityKwh,
      spaceHeatKwh,
      spaceHeatPerM2,
      coolingDemandKwh: cooling.demandKwh,
      coolingElectricityKwh: cooling.electricityKwh,
    },
    cost: {
      coalPlnPerYear,
      electricityPlnPerYear,
      spaceHeatingPlnPerYear,
      waterHeatingPlnPerYear,
      electricityAndCoolingPlnPerYear,
      totalPlnPerYear,
      totalPlnPerMonth: totalPlnPerYear / 12,
    },
    electricity: {
      measuredKwh,
      modelledKwh,
      gapKwh: measuredKwh === null ? null : measuredKwh - modelledKwh,
    },
    assumptions,
  };
}

// --- the entry point the app calls ------------------------------------------

/**
 * Baseline for a named household, with any answers the user has changed.
 *
 * This is the single door into the baseline model. It exists because there are
 * two ways a household's facts arrive:
 *
 *   - a persona was picked in the wizard, which fills every field at once
 *   - the user then edited some of those fields
 *
 * so the real input is always "a known household, plus overrides". Merging here
 * rather than at each call site means the fallback rule is written down once:
 * an override wins if it is present, otherwise the persona's answer stands.
 *
 * Pass `householdId` of "" (or an unknown id) to work purely from overrides on
 * top of `initialHouseholdCase`, which is what a user who never picked a
 * persona has.
 */
export function calculateUserBaseline(
  householdId: string,
  customInputs?: Partial<HouseholdCaseInputs>,
): Baseline {
  const preset = HOUSEHOLD_CASE_PRESETS.find((p) => p.id === householdId);
  const base = preset?.data ?? initialHouseholdCase;

  // Object spread is the merge rule: every key the caller supplied wins, every
  // key it omitted keeps the household's answer. `undefined` values are
  // stripped first, so `{ coalTonnesPerSeason: undefined }` does not blank a
  // real answer: that is the bug this guard exists to prevent.
  const overrides = Object.fromEntries(
    Object.entries(customInputs ?? {}).filter(([, v]) => v !== undefined),
  ) as Partial<HouseholdCaseInputs>;

  const merged: HouseholdCaseInputs = { ...base, ...overrides };

  return calculateBaseline(toBaselineInputs(merged));
}

/**
 * Wizard answers -> baseline inputs.
 *
 * The wizard collects more than the baseline needs (radiator notes, coal
 * provider, replacement preference). Narrowing here keeps `calculateBaseline`
 * honest about what it actually reads.
 */
export function toBaselineInputs(h: HouseholdCaseInputs): BaselineInputs {
  return {
    heatedAreaM2: h.heatedAreaM2,
    occupants: h.occupants,
    showersBathsPerWeek: h.showersBathsPerWeek,
    acAvailable: h.acAvailable,

    coalType: h.coalType,
    boilerClass: h.boilerClass,
    coalTonnesPerSeason: h.coalTonnesPerSeason,
    coalPricePerTonnePln: h.coalPricePerTonnePln,
    // The wizard keeps the tonnage field blank until the toggle is on, so an
    // empty string here means "none", not "unknown".
    freeCoalTonnes:
      h.freeCoalReceived && h.freeCoalTonnes !== "" ? h.freeCoalTonnes : 0,

    electricityTariff: h.electricityTariff,
    electricityBillPlnPerMonth: h.electricityBillPlnPerMonth,
    waterHeating: h.waterHeating,
    hasPvPanels: h.hasPvPanels,
  };
}
