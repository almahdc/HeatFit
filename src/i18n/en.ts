/**
 * English dictionary. This file is the SHAPE of every dictionary: `Dictionary`
 * in ./types.ts is derived from it, so `pl.ts` will not compile until it
 * defines exactly these keys with exactly these signatures.
 *
 * Adding a string: add it here first, then TypeScript will point at pl.ts.
 *
 * Values that interpolate are functions rather than "{count} items" templates:
 * a function gets argument names, types and arity checked at the call site,
 * where a template string gets nothing.
 */

export const en = {
  language: {
    label: "Language",
    en: "EN",
    pl: "PL",
    switchToEnglish: "Switch to English",
    switchToPolish: "Switch to Polish",
  },

  nav: {
    back: "Back",
    next: "Next",
    seeResults: "See your numbers",
    backToAnswers: "Back to your answers",
  },

  a11y: {
    decrease: "Decrease",
    increase: "Increase",
    count: "count",
  },

  wizard: {
    steps: {
      welcomeLocation: "Welcome & Location",
      homeProfile: "Home Profile & Comfort",
      currentHeating: "Current Heating & Fuel",
      electricityWater: "Electricity & Water",
    },
    stepProgress: (current: number, total: number, label: string) =>
      `Step ${current} of ${total} · ${label}`,

    welcome: {
      title: "Find Your Lowest Price & Best Financing",
      subtitle:
        "Answer a few quick questions to calculate your exact equipment costs, max government subsidies, and low-interest financing.",
      fitTitle: "Is This Tool for You?",
      fitCoalUsersLabel: "For Coal Users:",
      fitCoalUsersBody:
        "Built for single-family homes (detached, semi-detached, or terraced) currently heated with coal. (Apartments and gas are not supported yet. Want gas? Email ",
      fitCoalUsersEmailSuffix: ")",
      readyPrompt: "Ready to get started?",
    },

    location: {
      title: "Location",
      subtitle:
        "Your location determines climate zones and local anti-smog ordinances.",
      postalCode: "Postal Code",
      postalCodePlaceholder: "e.g., 10-115",
      postalCodeRequired: "Enter a postal code to continue.",
      whySummary: "Why do we ask for postal code",
      info: "We use your postal code to check which regional subsidies apply to your area, what your municipality's deadline for replacing coal boilers is, and whether a local clean-air programme covers part of the cost.",
      cityDeadline: "Has your city/gmina contacted you about a deadline?",
    },

    heatingStepRequired: "Boiler installation year is required to continue.",
  },

  postalCode: {
    invalidFormat:
      "This tool is designed for Polish addresses. Enter a Polish postal code (format: XX-XXX, e.g., 10-115).",
  },

  roadmap: {
    baseline: "Step 1 of 6 · Where you stand today",
    compare: "Step 2 of 6 · Your options",
    savings: "Step 3 of 6 · What changes",
    capex: "Step 4 of 6 · What it costs",
    grants: "Step 5 of 6 · What you get back",
    trueCost: "Step 6 of 6 · Your monthly plan",
    nextStep: "Your next step",
    yourAnswers: "For your records",
  },

  personas: {
    title: "Load a household case study",
    subtitle:
      "Quick-fill every step below from a real interview, or fill it in by hand.",
    fieldLabel: "Household case study",
    cases: {
      warmthGuardian: {
        name: "The Warmth Guardian",
        description: "Uses an old off-class manual coal boiler",
        seed: {
          radiatorNote: "",
          coalPriceNote: "300 zł/t is transport: 1,000 zł/t ex-works",
          freeCoalNote: "",
          electricityBillNote: "Forecast, flat, 6-month settlement",
          additionalNotes: "",
        },
      },
      methodicalPlanner: {
        name: "The Methodical Planner",
        description: "Has an aging Class 4 boiler from 2017",
        seed: {
          radiatorNote: "Small standard panels",
          coalPriceNote: "Mixed grades (groszek / mieszanka)",
          freeCoalNote: "From a relative's farm",
          electricityBillNote: "",
          additionalNotes: "",
        },
      },
      groundFloorManager: {
        name: "The Ground Floor Manager",
        description: "Living alone in unheated upper rooms",
        seed: {
          radiatorNote:
            "Old, massive cast-iron radiators: extremely hot to touch",
          coalPriceNote: "",
          freeCoalNote: "",
          electricityBillNote: "",
          additionalNotes: "",
        },
      },
      nightWatch: {
        name: "The Night Watcher",
        description: "Orzech coal, and night-active water heating",
        seed: {
          radiatorNote:
            "Old, large cast-iron radiators: extremely hot to touch",
          coalPriceNote: "",
          freeCoalNote: "",
          electricityBillNote: "",
          additionalNotes: "",
        },
      },
    },
  },

  home: {
    title: "Home & comfort",
    houseKind: "House type",
    insulation: "Level of insulation",
    windowFrame: "Condition of window frames",
    totalArea: "Total floor area",
    totalAreaUnit: "m²",
    wholeHouseHeatedLabel: "Is the whole house heated?",
    wholeHouseHeatedSublabel: "Every room gets heat, all winter",
    unheatedPortion: "What's not heated?",
    heatedArea: "Heated area",
    estimatedHeatedArea: "Estimated heated area",
    estimatedHeatedAreaEditableNote:
      "Our estimate, based on your answer above. Edit it if you know the real number.",
    heatedAreaValue: (m2: number) => `${m2} m²`,
    radiatorType: "Radiators / underfloor",
    radiatorNote: "Radiator note",
    radiatorNotePlaceholder: "e.g., old cast-iron, extremely hot to touch",
    occupants: "People in house",
    occupantsUnit: "people",
    acLabel: "Air conditioning",
    acSublabel: "Working AC unit available",
    insulationWhySummary: "Why we ask about insulation",
    insulationWhyBody:
      "Insulation decides how much heat your house actually needs each year, measured in kWh per square metre. That single number drives two things: what any new system costs to run, and which Czyste Powietrze funding level is open to you.",
  },

  heating: {
    title: "Current heating",
    subtitle: "Tell us about the coal boiler and how it's fed today.",
    coalType: "Type of coal",
    usesWoodLabel: "Also burns wood",
    usesWoodSublabel: "Wood or offcuts alongside the coal",
    tonnesPerSeason: "Average amount per season",
    tonnesPerSeasonPlaceholder: "e.g., 5",
    tonnesPerSeasonSuffix: "t / season",
    pricePerTonne: "Price per tonne",
    pricePerTonnePlaceholder: "e.g., 1300",
    pricePerTonneSuffix: "zł / t",
    priceNote: "Price details",
    priceNotePlaceholder: "e.g., includes transport, ex-works price...",
    freeCoalLabel: "Free or discounted coal",
    freeCoalSublabel: "Received coal outside a normal purchase",
    freeCoalAmount: "Free coal amount",
    freeCoalAmountPlaceholder: "e.g., 1",
    freeCoalAmountSuffix: "t",
    freeCoalNote: "Free coal note",
    freeCoalNotePlaceholder: "e.g., from a relative's farm",
    boilerYear: "Boiler installation year",
    boilerYearPlaceholder: "e.g., 2013",
    boilerClass: "Boiler class",
    gasLabel: "Gas connection available",
    gasSublabel: "A gas line already reaches the property",
    districtHeatingLabel: "District heating available",
    districtHeatingSublabel:
      "A municipal/district heating network reaches the property",
    replacementPreference:
      "If your boiler had to be replaced tomorrow, what would you put in?",
  },

  electricity: {
    title: "Electricity & water",
    subtitle: "Tell us about electricity use and how hot water is made.",
    tariff: "Electricity tariff",
    bill: "Electricity bill",
    billPlaceholder: "e.g., 200",
    billSuffix: "zł / month",
    billNote: "Bill note",
    billNotePlaceholder: "e.g., prognoza, flat, 6-month settlement",
    waterHeater: "Water heater: How water is heated",
    showers: "Showers / baths per week, per person",
    showersUnit: "per week, per person",
    pvSetup: "PV setup: Do you already have PV panels?",
    pvLabel: "PV panels",
    pvSublabel: "Solar electricity",
    additionalNotes: "Additional notes",
    additionalNotesPlaceholder:
      "Anything else worth knowing about the household...",
  },

  options: {
    houseKind: {
      detached: { label: "Detached" },
      semiDetached: { label: "Semi-detached / terraced" },
    },
    insulation: {
      none: { label: "No insulation" },
      standard: { label: "10 cm Styrofoam", sublabel: "Standard" },
      veryGood: { label: "15–20 cm Styrofoam", sublabel: "Very good" },
    },
    windowFrame: {
      woodenOld: { label: "Wooden", sublabel: "Old" },
      doublePanePvc: { label: "Double-pane PVC" },
      triplePanePvc: { label: "3-pane PVC", sublabel: "New" },
    },
    radiatorType: {
      standard: { label: "Radiators" },
      floorHeating: { label: "Floor heating" },
      mixed: { label: "Mixed" },
    },
    unheatedPortion: {
      wholeFloor: {
        label: "One whole floor",
        sublabel: "e.g., the upper floor",
      },
      someRooms: { label: "Some rooms", sublabel: "A handful, not a floor" },
      basementOrGarage: { label: "Basement or garage only" },
    },
    coalType: {
      orzech: { label: "Orzech" },
      groszek: { label: "Groszek" },
      kostka: { label: "Kostka" },
      mul: { label: "Muł" },
      other: { label: "Other" },
    },
    boilerClass: {
      bezklasowy: { label: "Off-class", sublabel: "Bezklasowy" },
      class3: { label: "Class 3" },
      class4: { label: "Class 4" },
      class5: { label: "Class 5" },
      ecodesign: {
        label: "Ecodesign-certified",
        sublabel: "EU standard, not the same as Class 5",
      },
    },
    cityDeadlineNotice: {
      none: { label: "No contact" },
      pressOrMediaOnly: { label: "Press / media only" },
      officialLetter: { label: "Official letter" },
      chimneySweep: { label: "Chimney sweep visit" },
    },
    replacementPreference: {
      gas: { label: "Gas" },
      pelletBoiler: { label: "Pellet boiler" },
      heatPump: { label: "Heat pump" },
      pelletOrHeatPump: { label: "Pellet or heat pump" },
      undecided: { label: "Undecided" },
    },
    electricityTariff: {
      G11: { label: "G11", sublabel: "Flat, all day" },
      G12: { label: "G12", sublabel: "Cheaper nights & midday" },
    },
    waterHeating: {
      electricBoilerNew: { label: "New electric boiler" },
      electricSummerCoalWinter: { label: "Electric summer, coal winter" },
      coalCentralAllYear: { label: "Coal boiler, all year" },
      electricNightTariff: { label: "Electric, night tariff" },
    },
    /** Boiler class as it reads inside a sentence, not on a card. */
    boilerClassInline: {
      bezklasowy: "no-class (bezklasowy)",
      class3: "class 3",
      class4: "class 4",
      class5: "class 5",
      ecodesign: "Ecodesign-certified",
    },
  },

  baseline: {
    title: "What you're paying now",
    subtitle:
      "Your year on coal, built from your answers. Does this match your life? Adjust if not.",
    totalOutflow: "",
    perMonth: "per month",
    perYear: "per year",
    perYearTotal: (amount: string) => `${amount} per year`,
    spaceHeating: "Space heating",
    spaceHeatingSub: "Coal burned to keep the house warm",
    waterHeating: "Water heating",
    waterHeatingSub: "Hot water, however it is made",
    electricityAndCooling: "Electricity & cooling",
    electricityAndCoolingSub: "Everything else on the meter",
    breakdownLabel: "See the cost breakdown",
    heatDelivered: "Heat delivered by your boiler",
    buildingCondition: "Building condition",
    kwhPerYear: (value: string) => `${value} kWh/year`,
    kwhPerM2PerYear: (value: string) => `${value} kWh/m²/year`,
    gapBefore: "Your bill implies ",
    gapAmount: (value: string, over: boolean) =>
      `${value} kWh/year ${over ? "more" : "less"}`,
    gapAfter: " than we would expect from your answers. ",
    gapReasonOver:
      "That usually means something electric we have not asked about yet: a space heater, an immersion tank, or a workshop.",
    gapReasonUnderWaterOrCooling:
      "That usually means our hot water or cooling estimate is too generous for your household.",
    gapReasonUnderBaseline:
      "That usually means the typical household we compare everyday electricity use against (lighting, fridge, and similar) uses more than your household does.",
    gapClosing: " We priced the bill you gave us, not our estimate.",
    assumptionsSummary: (count: number) => `What we assumed (${count})`,
    assumptionsIntro:
      "We take the coal you provided, the energy contained in that grade, and how much of it your boiler class actually converts into heat. Hot water and the rest of the meter are estimated from the national average.",
    whyCoalAccuracySummary: "Why these could be off",
    coalAccuracyIntro: (
      reference: string,
      actual: string,
      comparison: string,
    ) =>
      `We'd typically expect a building like yours to need around ${reference} kWh/m²/year of space heat. Yours comes out at ${actual} kWh/m²/year${comparison}. Here's what that figure assumes:`,
    coalAccuracyComparisonHigh: (pct: number) => `, ${pct}% higher than that`,
    coalAccuracyComparisonLow: (pct: number) => `, ${pct}% lower than that`,
    coalAccuracyComparisonClose: () => " — in line with that",
    coalAccuracyBoiler: (pct: number, classLabel: string, ageSuffix: string) =>
      `Boiler efficiency: assumed ${pct}% for your ${classLabel} boiler${ageSuffix}. An older or poorly maintained unit often runs below this.`,
    coalAccuracyBoilerAge: (year: number, age: number) =>
      `, installed in ${year} (${age} yr old)`,
    coalAccuracyCoal: (
      tonnes: string,
      kwhPerTonne: string,
      fuelLabel: string,
      pct: number,
      resultKwh: string,
    ) =>
      `Coal energy: about ${tonnes} t of ${fuelLabel} at ${kwhPerTonne} kWh/t, burned at ${pct}% efficiency ≈ ${resultKwh} kWh delivered. Quality varies even within a declared grade.`,
    coalAccuracyInsulationNone: (label: string) =>
      `Insulation: you told us ${label}. A likely factor if the real number runs higher than this.`,
    coalAccuracyInsulationStandard: (label: string) =>
      `Insulation: you told us ${label}. A moderate factor: real losses could run a bit higher.`,
    coalAccuracyInsulationVeryGood: (label: string) =>
      `Insulation: you told us ${label}. Well insulated, unlikely to be adding to this number.`,
    whyConditionSummary: "Why this number decides so much",
    whyConditionBody:
      "kWh/m²/year is your building's condition in one figure: the heat it needs per square metre. Czyste Powietrze uses the same measure. Above 140, the programme will not fund a heat source on its own without insulation work, and only above 140 does the highest funding level open up. Nothing is scored behind the scenes: this is the number, and step 5 shows exactly what it means for your grant.",
    editValue: "Edit this figure",
    saveEdit: "Save",
    cancelEdit: "Cancel",
    resetValue: "Reset to our estimate",
    editedTag: "edited",
    overriddenNote:
      "You've corrected one or more figures below. Everything from this point on (savings, grants, financing) uses your numbers instead of our estimate.",
    resetAll: "Reset all to our estimate",
  },

  alternatives: {
    options: {
      airToAirHp: {
        name: "Air-to-air heat pump",
        shortLabel: "About 4x on electricity",
        description:
          "Wall or ceiling units that heat air directly, the way a reverse-cycle air conditioner does.",
        efficiencyLabel:
          "delivers about 4 kWh of heat for every 1 kWh of electricity it uses",
      },
      airToWaterHp: {
        name: "Air-to-water heat pump",
        shortLabel: "About 3x on electricity",
        description:
          "Connects to your existing radiators, heating the water that runs through them the way your coal boiler does now.",
        efficiencyLabel:
          "delivers about 3 kWh of heat for every 1 kWh of electricity it uses",
      },
      pellet: {
        name: "Pellet boiler",
        shortLabel: "85% efficient",
        description:
          "Burns compressed wood pellets automatically in place of coal, through a similar boiler and the same radiators.",
        efficiencyLabel: "turns about 85% of the pellets' energy into heat",
      },
    },

    compare: {
      title: "Compare a replacement",
      subtitle:
        "This step is energy cost only: solar, grants and financing each get a step of their own below.",
      fieldLabel: "Replacement option",
      bestValueBadge: "Biggest saving",
      districtHeatingPelletWarningSilesia:
        "Silesia's anti-smog resolution bans solid-fuel heating - including pellet boilers - wherever district heating is available.",
      districtHeatingPelletWarningOther:
        "Some other regions restrict solid fuel where district heating is available too. Worth checking with your gmina before committing to a pellet boiler.",
      addSolarLabel: "Add solar to this project",
      switchToDynamicLabel: "Switch to a dynamic tariff",
      newOutflow: (name: string) => `${name}`,
      perMonth: "per month",
      perYearAndEfficiency: (amount: string, efficiency: string) =>
        `${amount} per year · ${efficiency}`,
      spaceHeating: "Space heating",
      fuelPerYear: (amount: string, unit: string) => `${amount} ${unit} a year`,
      fuelUnitKwh: "kWh of electricity",
      fuelUnitTonnes: "tonnes of pellets",
      waterHeating: "Water heating",
      unchanged: "Same usage as today",
      electricityAndCooling: "Electricity & cooling",
      breakdownLabel: "See the cost breakdown",
      assumptionsSummary: (count: number) => `What we assumed (${count})`,
      assumptionsIntro:
        "These are about the replacement itself, not your household: standard efficiency figures, not something you told us.",
    },

    savings: {
      title: "Savings vs. coal",
      subtitle: (name: string, withSolar: boolean) =>
        `${name}${withSolar ? " with solar" : ""} compared directly against what you are paying now.`,
      headline: (verb: string, amount: string, worse: boolean) =>
        `${verb} ${amount}/month${worse ? " more" : ""}`,
      saves: "Saves",
      costs: "Costs",
      detail: (
        verb: string,
        amount: string,
        worse: boolean,
        baseline: string,
      ) =>
        `${verb} ${amount} a year${worse ? " more" : ""}, compared against ${baseline}/year on coal today.`,
      caveat:
        "Energy cost alone is only part of the picture, and this is the point in the roadmap where it looks worst. Coal has no installation cost left to pay off, while a replacement has not yet had its grant or financing applied. Keep going: the next three steps add both.",
    },

    capex: {
      title: "What it costs to install",
      subtitle: (name: string, withSolar: boolean) =>
        `Hardware and installation for ${name}${withSolar ? ", plus solar" : ""}. This is the full price before any help arrives: the grant comes in step 5, financing in step 6.`,
      hardware: "Hardware",
      installation: "Installation",
      typically: (range: string) => `Typically ${range}`,
      unitEquipment: "equipment",
      unitLabour: "labour",
      unitAdded: "added",
      solarLabel: "Solar panels (PV)",
      solarSub: (kwh: string) => `New, ${kwh} kWh/year array`,
      breakdownLabel: "See the cost breakdown",
      totalGross: "Total gross capex",
      totalGrossWithSolar: "Total gross capex (incl. solar)",
      turnkey: "turnkey, incl. VAT",
      spread: (range: string) =>
        `Typically ${range}: installer quotes vary this much by sizing, radiators, and region.`,
      zumNote:
        "Note: Selected heat pumps and pellet boilers must be listed on the official ZUM database to qualify for Czyste Powietrze subsidies.",
      zumLink: "Check the official Lista ZUM",
    },

    grants: {
      title: "Grants (Czyste Powietrze)",
      subtitle:
        "What the programme pays towards this, and what genuinely remains for you. Pick the income level that matches your household: until you do, we assume the least generous one, so the real figure can only be better.",
      incomeLevel: "Your income level",
      tiers: {
        basic: "Basic",
        increased: "Increased",
        highest: "Highest",
      },
      tierSublabelBasic: (max: string) =>
        `Up to ${max}/month for the household`,
      tierSublabelPerPerson: (multi: string, single: string) =>
        `Up to ${multi}/month each (${single} living alone)`,
      grantTowards: (name: string) => `Grant toward ${name}`,
      grantTowardsSolar: "Grant toward solar",
      cappedAt: (cap: string, line: string) =>
        `Capped at ${cap} for this device (sheet line ${line})`,
      rateOf: (pct: number, cost: string, line: string) =>
        `${pct}% of ${cost} (sheet line ${line})`,
      solarRateOf: (pct: number, cost: string) => `${pct}% of ${cost}`,
      offThePrice: "off the price",
      assumesInsulationTag: "Assumes insulation",
      netCapex: "Net capex, after grants",
      leftToPay: "left to pay",
      netCapexDetail: (gross: string, grants: string) =>
        `${gross} gross, less ${grants} in grants.`,
    },

    taxRelief: {
      fieldLabel: "Your income tax rate",
      rates: {
        pit12: { label: "12%", sublabel: "The first PIT bracket" },
        pit32: { label: "32%", sublabel: "Above 120 000 zł a year" },
        flat19: { label: "19%", sublabel: "Flat rate, self-employed" },
        none: {
          label: "No income tax",
          sublabel: "The relief is worth nothing",
        },
      },
      lineLabel: "Estimated tax return (Ulga Termomodernizacyjna)",
      lineSub: (pct: number, base: string) =>
        `${pct}% of ${base} deducted from your taxable income`,
      cappedSub: (cap: string, pct: number) =>
        `Deduction capped at ${cap} per taxpayer, returning ${pct}% of it`,
      unit: "back later",
      finalNetCost: "Final net cost, after grant and tax relief",
      finalNetCostDetail: (net: string, relief: string) =>
        `${net} left after the grant, less ${relief} returned through your tax return.`,
      noteSummary: "How this relief actually works",
      note: "The relief is a deduction from taxable income, not a payment: you get your own tax rate back on it, and it arrives with your annual tax return rather than up front. That is why step 6 still sizes the loan on the full amount left after the grant.",
      capAndIncomeNote: (cap: string, years: number) =>
        `At most ${cap} per taxpayer across all thermal modernisation work, with any unused part carried forward for up to ${years} years. This assumes your taxable income is high enough to absorb the deduction.`,
    },

    trueCost: {
      title: "Your true monthly cost",
      subtitle:
        "Running cost plus the repayment on what is left: the number you would actually feel each month.",
      loanTerm: "Loan term",
      years: (n: number) => `${n} years`,
      interest: (pct: number) => `${pct}% interest`,
      runningCost: "Running cost",
      runningCostSub: (name: string, withSolar: boolean) =>
        `Energy for ${name}${withSolar ? ", with solar" : ""}`,
      loanRepayment: "Loan repayment",
      loanRepaymentSub: (amount: string, years: number, pct: number) =>
        `${amount} over ${years} years at ${pct}%`,
      perMonth: "per month",
      heading: "True monthly cost",
      whileRepaying: "per month while you repay",
      comparison: (
        amount: string,
        cheaper: boolean,
        baseline: string,
        afterLoan: string,
        years: number,
      ) =>
        `${cheaper ? "Still " : ""}${amount}/month ${cheaper ? "cheaper than" : "more than"} the ${baseline} you pay on coal today. Drops to ${afterLoan}/month once the loan is repaid in ${years} years.`,
    },
  },

  summary: {
    title: "Take it with you",
    subtitle:
      "Download a PDF with everything above: your numbers, the comparison, and the answers behind them.",
    postalCode: "Postal code",
    cityDeadline: "City deadline notice",
    empty: "—",
    homeSection: "Home & comfort",
    houseType: "House type",
    insulation: "Insulation",
    windowFrames: "Window frames",
    totalArea: "Total floor area",
    totalAreaValue: (m2: number) => `${m2} m²`,
    heatedArea: "Heated area",
    estimatedHeatedArea: "Estimated heated area",
    heatedAreaValue: (m2: number) => `${m2} m²`,
    unheatedPortion: "What's not heated",
    radiators: "Radiators",
    occupants: "Occupants",
    acAvailable: "AC available",
    heatingSection: "Current heating & fuel",
    coalType: "Coal type",
    alsoBurnsWood: "Also burns wood",
    coalBought: "Coal bought",
    coalBoughtValue: (tonnes: number, price: number) =>
      `${tonnes} t/season @ ${price} zł/t`,
    boiler: "Boiler",
    boilerValue: (classLabel: string, year: number | "") =>
      year === "" ? classLabel : `${classLabel}, ${year}`,
    freeCoal: "Free/discounted coal",
    freeCoalValue: (tonnes: number | "") => `Yes (${tonnes} t)`,
    gasConnection: "Gas connection",
    districtHeating: "District heating",
    replacementPreference: "Replacement preference",
    electricitySection: "Electricity & water",
    electricity: "Electricity",
    electricityValue: (tariff: string, bill: number) =>
      `${tariff}, ${bill} zł/mo`,
    waterHeating: "Water heating",
    showers: "Showers/baths per week, per person",
    pvBatteryStorage: "PV / battery / storage",
    pv: "PV",
    battery: "Battery",
    heatStorage: "Heat storage",
    none: "None",
    yes: "Yes",
    no: "No",
  },

  earlyAccess: {
    title: "A real person takes it from here",
    subtitle:
      "You have the numbers. The next part is where most households get stuck, and it is the part we do with you rather than hand you a list and wish you luck.",
    reviewNote:
      "Whichever you pick, it starts the same way. Before anyone contacts you, someone at HeatFit reads through the audit you just completed: your building, your figures, your constraints.",
    valueProps: {
      installers: {
        title: "We match you with vetted local installers",
        description:
          "We check who genuinely works in your area and introduce you personally. Not a directory, not a list of numbers to ring.",
      },
      grant: {
        title: "We handle the Czyste Powietrze paperwork with you",
        description:
          "A person walks your application through, so funding does not slip away on a technicality or a missed deadline.",
      },
      financing: {
        title: "We line up green financing with partner banks",
        description:
          "If you would rather spread the cost, we bring you loan options already matched to this specific job.",
      },
      insulation: {
        title: "We can help you price the insulation work",
        description:
          "HeatFit does not estimate insulation yet, but if your building needs it to qualify for a grant, tell us and we will help you get it scoped.",
      },
    },
    modal: {
      title: "Get early access",
      subtitle:
        "Leave your details and we'll reach out personally once HeatFit opens its doors.",
      regarding: (topic: string) => `Regarding: ${topic}`,
      nameLabel: "Name",
      namePlaceholder: "e.g., Jan Kowalski",
      contactLabel: "Phone or email",
      contactPlaceholder: "e.g., 600 123 456 or jan@example.com",
      noteLabel: "A short note (optional)",
      notePlaceholder: "Anything you'd like us to know...",
      submit: "Send my details",
      submitting: "Sending...",
      close: "Close",
      nameRequired: "Enter your name.",
      contactRequired: "Enter a phone number or email so we can reach you.",
      successTitle: "You're on the list",
      successBody:
        "Thank you! Your request has been sent to the HeatFit team. We will be in touch soon.",
      successBodyMailtoFallback: (email: string) =>
        `Your email app should have opened with your details ready to send. If it didn't, email us directly at ${email}.`,
      errorTitle: "That didn't go through",
      errorBody: (email: string) =>
        `We couldn't send that automatically. Please try again, or email us directly at ${email}.`,
      emailSubject: "HeatFit early access request",
      emailInterest: "Interest",
      emailName: "Name",
      emailContact: "Phone or email",
      emailNote: "Note",
      pdfHint:
        "We've put together a PDF report of your numbers. A copy goes to our team automatically, and you can keep your own below.",
      downloadPdf: "Download PDF report",
      pdfGenerating: "Preparing your PDF...",
      pdfFailed:
        "We couldn't put your PDF together just now, but your request still went through.",
    },
    disclaimer:
      "Note: You are signing up for early access. HeatFit is currently in development and not yet fully operational: we will reach out as soon as we launch!",
  },

  regulatoryCountdown: {
    eyebrow: "Worth knowing",
    title: "Silesian anti-smog resolution",
    headlineUpcoming: (date: string) =>
      `Your boiler's grace period ends ${date}`,
    headlinePassed: "Your boiler no longer meets Silesian air-quality rules",
    headlinePassedUncertain:
      "Your boiler may not meet Silesian air-quality rules",
    requirementUpcoming: (date: string) =>
      `Silesia's anti-smog resolution requires a boiler like yours to be upgraded to Class 5 by ${date}. It remains legal to operate until then.`,
    requirementPassed: (date: string) =>
      `Silesia's anti-smog resolution required a boiler like yours to be upgraded to Class 5 by ${date}. That date has passed.`,
    requirementPassedUncertain: (date: string) =>
      `Silesia's anti-smog resolution required a boiler like yours to be upgraded to Class 5 by ${date}. Ecodesign certification is a separate EU standard and doesn't by itself confirm Class 5, so we can't say for certain whether yours does: but based on its age, it may already fall short of what the resolution requires.`,
    countdownLabel: "Time remaining",
    countdown: (months: number, days: number) =>
      `${months} months, ${days} days`,
    consequenceTitle: "What the resolution provides for",
    consequenceBody:
      "A fine of up to 500 zł on the spot, or up to 5,000 zł if pursued through a court motion. It can be imposed again each time the installation is found in use after the deadline.",
    sourceLabel:
      "Uchwała antysmogowa dla województwa śląskiego (V/36/1/2017), §8",
    sourceLink: "Read the resolution",
  },

  /**
   * Engine-generated messages. `baseline.ts` and `grants.ts` emit typed
   * descriptors ({ code, ...params }) rather than prose, so the sentence a
   * household reads is chosen here, in the language they picked.
   */
  assumptions: {
    coalGradeAssumed: (fuel: string) =>
      `We assumed ${fuel.toLowerCase()} coal, since you did not tell us the grade.`,
    boilerEfficiencyKnown: (boilerLabel: string, pct: number) =>
      `We assumed your ${boilerLabel} boiler converts ${pct}% of the coal's energy into heat.`,
    boilerEfficiencyUnknown: (pct: number) =>
      `We assumed your boiler converts ${pct}% of the coal's energy into heat, since you did not tell us its class.`,
    coalPriceAssumed: (pricePerTonne: number) =>
      `We assumed a coal price of ${pricePerTonne} zł per tonne, since you did not give one.`,
    hotWaterPerShower: (litres: number, heatedPct: number) =>
      `We assumed ${litres} litres of water per shower or bath, of which ${heatedPct}% needed to be heated. The rest mixes in as cold water at the tap.`,
    summerElectricWater: (pct: number) =>
      `We assumed ${pct}% of your hot water is heated electrically over summer, since your boiler is shut down for the season.`,
    electricWaterHeaterEfficiency: (pct: number) =>
      `We assumed your electric water heater is ${pct}% efficient.`,
    electricityUseModelled: (kwh: number) =>
      `We assumed your yearly electricity use is about ${kwh} kWh, based on a typical household's usage plus your hot water and cooling, since you did not give a bill.`,
    electricityPriceAssumedFlat: (pricePerKwh: string) =>
      `We priced your G11 electricity at ${pricePerKwh}/kWh: one flat rate used across this tool, not your exact supplier's rate.`,
    electricityPriceAssumedDynamic: (pricePerKwh: string) =>
      `We priced your G12 electricity at ${pricePerKwh}/kWh: a flat rate that assumes most of your use already falls in the cheaper off-peak hours.`,
  },

  /** Same idea as `assumptions` above, for `alternativeHeating.ts`'s typed
   *  descriptors: one modelling choice per line, said in the language on
   *  screen, for the "What we assumed" section under Step 2. */
  alternativeAssumptions: {
    usefulHeatCarriedOver: (kwhPerYear: string) =>
      `We assumed this replacement needs to deliver the same ${kwhPerYear} kWh a year of heat your coal system delivers today: a building needs the same warmth no matter what makes it.`,
    pelletEfficiencyAndPrice: (pct: number, pricePerTonne: string) =>
      `We assumed a pellet boiler that is ${pct}% efficient, burning pellets priced at ${pricePerTonne} per tonne.`,
    heatPumpCop: (
      optionName: string,
      cop: number,
      pricePerKwh: string,
      tariffLabel: string,
      tariff: "G11" | "G12",
    ) =>
      `We assumed a ${optionName.toLowerCase()} running at COP ${cop.toFixed(1)} (each kWh of electricity delivers ${cop.toFixed(1)} kWh of heat), priced at your ${tariffLabel} tariff${tariff === "G12" ? "'s average rate" : " rate"} of ${pricePerKwh}/kWh.`,
    pvMarginalPricing: (pct: number) =>
      `Because you have solar, we assumed ${pct}% of this heat pump's extra electricity draw is covered directly by your panels; the rest is priced at what it actually changes your bill by, not a flat rate.`,
    dynamicTariffHabitShift:
      "We assumed you shift most of this heating's electricity use to off-peak hours to actually get that price.",
    carriedOverFromBaseline:
      "Water heating and electricity & cooling keep the same usage as today: this replacement only changes space heating. If you switch tariff or add solar above, the price behind those two lines updates too, since they run on the same electricity meter.",
    coalWaterHeatingSwitchesToElectric: (
      electricBoilerPlnPerYear: string,
      heatPumpPlnPerYear: string | null,
      cheaperPct: number | null,
    ) =>
      heatPumpPlnPerYear !== null && cheaperPct !== null
        ? `Some of your hot water currently rides along on your coal boiler. Since it's being replaced, we assumed that share switches to a plain electric boiler, like the rest of your hot water already uses: about ${electricBoilerPlnPerYear}/year to run. Buying that boiler is a small extra cost, not included in step 4's install price. Running the same hot water through this heat pump instead would typically cost about ${heatPumpPlnPerYear}/year, ${cheaperPct}% less to run, but it means buying a dedicated water-heating device instead, which would add to step 4's install price rather than replace it.`
        : `Some of your hot water currently rides along on your coal boiler. Since it's being replaced, we assumed that share switches to a plain electric boiler, like the rest of your hot water already uses: about ${electricBoilerPlnPerYear}/year to run. Buying that boiler is a small extra cost, not included in step 4's install price. We haven't modelled switching it onto the pellet boiler itself.`,
  },

  grantWarnings: {
    highestTierUnavailable: (spaceHeatPerM2: number) =>
      `The highest funding level is only open to buildings above 140 kWh/m²/y. This one is around ${spaceHeatPerM2}, so the increased level applies instead.`,
    heatSourceNotEligibleAloneSummary: (spaceHeatPerM2: number) =>
      `Needs insulation to qualify, at around ${spaceHeatPerM2} kWh/m²/y`,
    heatSourceNotEligibleAloneBody: (requiredEndState: string) =>
      `Czyste Powietrze will not fund a new heat source alone here. The grant and loan below assume insulation happens, reaching ${requiredEndState}, and that an energy audit confirms it. HeatFit does not price that work yet: talk to an installer or auditor first, or tell us in the form further down the page if you'd like us to.`,
    solarPvPaused: (cap: string) =>
      `The solar figure follows the sheet's own PV rate. The subsidies tab records PV support running through przydomowemagazyny.gov.pl, capped at ${cap}, and marks that programme PAUSED: so treat this line as indicative, not as money you can count on.`,
    /** The end state each scope band demands, said in words. */
    requiredEndState: {
      1: "must stay below 80 kWh/m²/y",
      2: "heat source only: no increase. With thermal modernisation: max 80 and at least a 40% reduction",
      3: "max 140 kWh/m²/y and at least a 40% reduction",
    },
  },

  /**
   * The downloadable PDF report: src/pdf/generateReportPdf.ts. Its own
   * namespace because a printed document reads differently from a screen
   * (no icons, no colour-only cues, longer-lived), even though a lot of the
   * numbers it shows are the same ones baseline/alternatives already price.
   */
  report: {
    filename: "heating_estimation.pdf",
    docTitle: "Heating Replacement Estimate",
    docSubtitle:
      "A personal summary of your numbers, prepared by HeatFit from your own answers.",
    generatedOn: (date: string) => `Generated on ${date}`,
    preparedFor: (postalCode: string) => `Prepared for ${postalCode}`,
    preparedForWithRegion: (postalCode: string, region: string) =>
      `Prepared for ${postalCode}, ${region}`,
    confidential:
      "For your personal use. An estimate only, not a binding offer or a guarantee of financing or grant approval.",
    pageFooter: (page: number, total: number) => `Page ${page} of ${total}`,
    contactFooter: (email: string) => `Questions? ${email}`,

    sections: {
      executiveSummary: "Executive summary",
      yourDetails: "Your details",
      runningCosts: "Running cost comparison",
      financialBreakdown: "Financial breakdown",
      assumptions: "Key assumptions & data sources",
    },

    /** Generic download error, used wherever a PDF is generated outside the
     *  contact-form flow (e.g. the "For your records" section), where
     *  earlyAccess.modal.pdfFailed's "your request still went through" line
     *  would not make sense. */
    downloadError: "We couldn't generate the PDF just now. Please try again.",

    verdict: {
      currentSpend: (monthly: string, yearly: string) =>
        `You are currently spending ${monthly}/month (${yearly}/year) heating with coal.`,
      bestOption: (option: string) =>
        `On running cost alone, the best option for your household is the ${option}.`,
      saving: (option: string, monthly: string, yearly: string) =>
        `Switching to the ${option} would save you about ${monthly}/month (${yearly}/year) against coal.`,
      costing: (option: string, monthly: string, yearly: string) =>
        `On today's numbers, the ${option} would cost about ${monthly}/month (${yearly}/year) more than coal.`,
      netCostLine: (net: string) =>
        `After the Czyste Powietrze grant and the thermal modernisation tax relief, your estimated final out-of-pocket cost is ${net}.`,
      trueCostLine: (monthly: string, years: number) =>
        `Financed over ${years} years, your true monthly cost (running cost plus loan repayment) is about ${monthly}.`,
    },

    details: {
      location: "Location",
      postalCode: "Postal code",
      region: "Region (voivodeship)",
      building: "Building",
      currentHeating: "Current heating & fuel",
      electricityWater: "Electricity & water",
      yourSelections: "Your selections for this report",
      selectedOption: "Replacement option considered",
      addSolar: "Solar add-on included",
      incomeLevel: "Income level used",
      loanTerm: "Loan term used",
      taxRateUsed: "Income tax rate used",
    },

    runningCostsTable: {
      columnBaseline: "Coal (today)",
      columnWithoutPv: "No PV",
      columnWithPv: "With PV",
      rowSpaceHeating: "Space heating",
      rowWaterHeating: "Water heating",
      rowElectricityAndCooling: "Electricity & cooling",
      rowTotalPerYear: "Total / year",
      rowTotalPerMonth: "Total / month",
      rowSavingsPerYear: "Savings vs. coal / year",
      note: 'Water heating and electricity & cooling keep your baseline\'s usage: only the space heating source changes. Their price still reflects the tariff and PV state of each column, since they run on the same electricity meter. "With PV" prices the same option as if the household already had solar panels feeding that meter.',
    },

    financials: {
      optionLabel: (option: string) => `For: ${option}`,
      grossCapex: "Gross capex (turnkey, incl. VAT)",
      grant: "Czyste Powietrze grant",
      netCapex: "Net capex, after grant",
      taxRelief: "Tax relief (Ulga Termomodernizacyjna)",
      finalNetCost: "Final net cost, after grant and tax relief",
      loanAmount: (years: number, pct: number) =>
        `Loan on the remaining balance (${years} yr at ${pct}%)`,
      monthlyLoanRepayment: "Monthly loan repayment",
      runningCostPerMonth: "Running cost / month",
      trueMonthlyCost: "True monthly cost while repaying",
      afterLoanMonthlyCost: "Monthly cost once the loan is repaid",
    },

    assumptions: {
      intro:
        "Every figure above follows directly from the answers you gave and the reference data below. Nothing here is a quote: actual installer, bank and programme terms will vary.",
      yourAnswers: "Assumptions made about your household",
      noAssumptions: "No assumptions were needed: every input came from you.",
      referenceData: "Reference data & sources",
      baselineModel:
        "Baseline running cost reproduces HeatFit's price_calculator reference sheet: coal energy content and boiler efficiency by class, hot water and electricity modelling.",
      capexSource: (source: string) =>
        `Equipment & installation pricing: ${source}`,
      grantProgramme:
        "Grant: Czyste Powietrze programme, subsidies table, sheet line(s) as noted above.",
      zum: (url: string) =>
        `Heat pumps and pellet boilers must be listed on the official ZUM database to qualify: ${url}`,
      taxReliefRule: (cap: string, years: number) =>
        `Tax relief: art. 26h of the Polish PIT act. Capped at ${cap} per taxpayer across all thermal modernisation work; any unused part carries forward up to ${years} years. Assumes taxable income is high enough to absorb the deduction.`,
      loanTerms:
        "Loan repayment: simple interest charged once over the full term, per HeatFit's reference sheet, not a compounded bank annuity.",
    },
  },
};
