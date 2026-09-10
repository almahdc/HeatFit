import type { Dictionary } from "./types";

/**
 * Polish dictionary. Typed as `Dictionary`, so this file will not compile
 * until every key in en.ts is present here with a matching signature.
 */
export const pl: Dictionary = {
  language: {
    label: "Język",
    en: "EN",
    pl: "PL",
    switchToEnglish: "Przełącz na angielski",
    switchToPolish: "Przełącz na polski",
  },

  nav: {
    back: "Wstecz",
    next: "Dalej",
    seeResults: "Zobacz wyniki",
    backToAnswers: "Wróć do odpowiedzi",
  },

  a11y: {
    decrease: "Zmniejsz",
    increase: "Zwiększ",
    count: "liczba",
  },

  wizard: {
    steps: {
      welcomeLocation: "Powitanie i lokalizacja",
      homeProfile: "Profil domu i komfort",
      currentHeating: "Obecne ogrzewanie i paliwo",
      electricityWater: "Prąd i ciepła woda",
    },
    stepProgress: (current: number, total: number, label: string) =>
      `Krok ${current} z ${total} · ${label}`,

    welcome: {
      title: "Witamy",
      subtitle:
        "Kilka minut pytań w zamian za jasną odpowiedź, ile naprawdę kosztowałaby wymiana kotła i ile dzięki niej zaoszczędzisz.",
      bodyBefore: "To narzędzie powstało ",
      bodyEmphasis:
        "wyłącznie dla gospodarstw domowych ogrzewających obecnie dom kotłem węglowym",
      bodyAfter:
        ". W kolejnych krokach zapytamy o Twój dom, obecne zużycie węgla oraz o prąd i ciepłą wodę, a następnie oszacujemy koszty eksploatacji, dotacje i finansowanie przejścia na pellet lub pompę ciepła. Jeśli Twój dom nie jest ogrzewany węglem, ten kalkulator nie jest jeszcze dla Ciebie.",
      gasNote:
        "Ogrzewanie gazowe nie jest jeszcze uwzględnione. Jeśli chcesz zobaczyć opcje gazowe lub inne rozwiązania grzewcze, daj nam znać: rozwijamy to narzędzie w oparciu o opinie użytkowników.",
    },

    location: {
      title: "Lokalizacja",
      subtitle:
        "Lokalizacja decyduje o strefie klimatycznej i lokalnych uchwałach antysmogowych.",
      postalCode: "Kod pocztowy",
      postalCodePlaceholder: "np. 10-115",
      postalCodeRequired: "Podaj kod pocztowy, aby przejść dalej.",
      info: "Na podstawie kodu pocztowego sprawdzamy, które dotacje regionalne obejmują Twoją okolicę, jaki termin wymiany kotła węglowego wyznaczyła Twoja gmina i czy lokalny program czystego powietrza pokryje część kosztów.",
    },

    heatingStepRequired:
      "Rok montażu kotła i dostawca węgla są wymagane, aby przejść dalej.",
  },

  postalCode: {
    invalidFormat:
      "To narzędzie działa dla adresów w Polsce. Podaj polski kod pocztowy (format: XX-XXX, np. 10-115).",
  },

  personas: {
    title: "Wczytaj przykładowe gospodarstwo domowe",
    subtitle:
      "Wypełnij wszystkie kroki poniżej danymi z prawdziwego wywiadu albo wpisz je ręcznie.",
    fieldLabel: "Przykładowe gospodarstwo domowe",
    cases: {
      grandmaKrysia: {
        name: "Babcia Krysia",
        tagline: "Po co to ruszać? Po co zmieniać?",
        description: "Używa starego, bezklasowego kotła węglowego zasypowego.",
        seed: {
          radiatorNote: "",
          unheatedRooms: "Brak: cały dom ogrzewany",
          coalPriceNote: "300 zł/t to transport: 1000 zł/t loco kopalnia",
          freeCoalNote: "Nie pytano",
          coalProvider: "PGG (pgg.pl), dostawa przez regionalny skład KDW",
          electricityBillNote: "Prognoza, ryczałt, rozliczenie co pół roku",
          additionalNotes:
            "90% finansuje, 10% nie widzi potrzeby przechodzenia na czystą energię.",
        },
      },
      grandpaJanek: {
        name: "Dziadek Janek",
        tagline: "Wszystko na ostatnią chwilę",
        description:
          "Ma przyłącze gazowe przy płocie i starzejący się kocioł klasy 4 z 2017 roku.",
        seed: {
          radiatorNote: "Małe standardowe grzejniki płytowe",
          unheatedRooms: "Pokój gościnny (~20 m²)",
          coalPriceNote: "Mieszane sortymenty (groszek / mieszanka)",
          freeCoalNote: "Z gospodarstwa krewnego",
          coalProvider: "Prywatny skład rolniczy",
          electricityBillNote: "",
          additionalNotes: "",
        },
      },
      mrsTeresa: {
        name: "Pani Teresa",
        tagline: "W dużym domu",
        description:
          "Mieszka sama w dużym, starym domu z ogromnymi grzejnikami i nieogrzewanymi pokojami na piętrze.",
        seed: {
          radiatorNote:
            "Stare, masywne żeliwne grzejniki: bardzo gorące w dotyku",
          unheatedRooms:
            "Sypialnie / pomieszczenia gospodarcze na piętrze (~50 m²) całkowicie nieogrzewane",
          coalPriceNote: "",
          freeCoalNote: "",
          coalProvider: "Lokalny skład opału z własnym transportem",
          electricityBillNote: "",
          additionalNotes: "",
        },
      },
      mrMarek: {
        name: "Pan Marek",
        tagline: "Na taryfie nocnej",
        description:
          "Praktyczny optymalizator: taryfa nocna G12, węgiel orzech i podgrzewanie wody w nocy.",
        seed: {
          radiatorNote: "Stare, duże żeliwne grzejniki: bardzo gorące w dotyku",
          unheatedRooms: "Nieocieplony strych (~15 m²)",
          coalPriceNote: "",
          freeCoalNote: "",
          coalProvider: "Lokalny prywatny skład opału",
          electricityBillNote: "",
          additionalNotes: "",
        },
      },
    },
  },

  home: {
    title: "Dom i komfort",
    houseKind: "Rodzaj budynku",
    insulation: "Stopień ocieplenia",
    windowFrame: "Stan stolarki okiennej",
    heatedArea: "Powierzchnia ogrzewana",
    heatedAreaUnit: "m²",
    radiatorType: "Grzejniki / ogrzewanie podłogowe",
    radiatorNote: "Uwagi o grzejnikach",
    radiatorNotePlaceholder: "np. stare żeliwne, bardzo gorące w dotyku",
    occupants: "Liczba domowników",
    occupantsUnit: "osób",
    acLabel: "Klimatyzacja",
    acSublabel: "Sprawna klimatyzacja w domu",
    unheatedRooms: "Pomieszczenia nieogrzewane",
    unheatedRoomsPlaceholder: "np. brak: cały dom ogrzewany",
  },

  heating: {
    title: "Obecne ogrzewanie",
    subtitle: "Opowiedz nam o kotle węglowym i o tym, jak jest dziś zasilany.",
    coalType: "Rodzaj węgla",
    usesWoodLabel: "Pali także drewnem",
    usesWoodSublabel: "Drewno lub zrzyny obok węgla",
    tonnesPerSeason: "Średnie zużycie na sezon",
    tonnesPerSeasonPlaceholder: "np. 5",
    tonnesPerSeasonSuffix: "t / sezon",
    pricePerTonne: "Cena za tonę",
    pricePerTonnePlaceholder: "np. 1300",
    pricePerTonneSuffix: "zł / t",
    priceNote: "Uwagi o cenie",
    priceNotePlaceholder: "np. z transportem, cena loco kopalnia...",
    freeCoalLabel: "Węgiel darmowy lub z rabatem",
    freeCoalSublabel: "Węgiel otrzymany poza normalnym zakupem",
    freeCoalAmount: "Ilość darmowego węgla",
    freeCoalAmountPlaceholder: "np. 1",
    freeCoalAmountSuffix: "t",
    freeCoalNote: "Uwagi o darmowym węglu",
    freeCoalNotePlaceholder: "np. z gospodarstwa rodziny",
    boilerYear: "Rok montażu kotła",
    boilerYearPlaceholder: "np. 2013",
    boilerClass: "Klasa kotła",
    cityDeadline: "Informacja o terminie z gminy",
    replacementPreference:
      "Gdyby kocioł trzeba było wymienić jutro, co byś zamontował?",
    coalProvider: "Dostawca węgla",
    coalProviderPlaceholder: "Nazwa składu, strona www, uwagi o dostawie...",
  },

  electricity: {
    title: "Prąd i ciepła woda",
    subtitle:
      "Opowiedz nam o zużyciu prądu i o tym, jak przygotowywana jest ciepła woda.",
    tariff: "Taryfa energii elektrycznej",
    bill: "Rachunek za prąd",
    billPlaceholder: "np. 200",
    billSuffix: "zł / miesiąc",
    billNote: "Uwagi o rachunku",
    billNotePlaceholder: "np. prognoza, ryczałt, rozliczenie co pół roku",
    gasLabel: "Dostępne przyłącze gazowe",
    gasSublabel: "Sieć gazowa dochodzi już do posesji",
    waterHeater: "Podgrzewacz wody",
    showers: "Prysznice / kąpiele tygodniowo, na osobę",
    showersUnit: "tygodniowo, na osobę",
    pvSetup: "Instalacja fotowoltaiczna",
    pvLabel: "Panele fotowoltaiczne",
    pvSublabel: "Prąd ze słońca",
    additionalNotes: "Dodatkowe uwagi",
    additionalNotesPlaceholder:
      "Co jeszcze warto wiedzieć o tym gospodarstwie domowym...",
  },

  options: {
    houseKind: {
      detached: { label: "Wolnostojący" },
      semiDetached: { label: "Bliźniak / szeregowiec" },
      apartment: { label: "Mieszkanie" },
    },
    insulation: {
      none: { label: "Brak ocieplenia" },
      standard: { label: "10 cm styropianu", sublabel: "Standard" },
      veryGood: { label: "15–20 cm styropianu", sublabel: "Bardzo dobre" },
    },
    windowFrame: {
      woodenOld: { label: "Drewniane", sublabel: "Stare" },
      doublePanePvc: { label: "PVC dwuszybowe" },
      triplePanePvc: { label: "PVC trzyszybowe", sublabel: "Nowe" },
    },
    radiatorType: {
      standard: { label: "Grzejniki" },
      floorHeating: { label: "Ogrzewanie podłogowe" },
      mixed: { label: "Mieszane" },
    },
    coalType: {
      orzech: { label: "Orzech" },
      groszek: { label: "Groszek" },
      kostka: { label: "Kostka" },
      mul: { label: "Muł" },
      other: { label: "Inny" },
    },
    boilerClass: {
      bezklasowy: { label: "Bezklasowy", sublabel: "Stary kocioł bez klasy" },
      class3: { label: "Klasa 3" },
      class4: { label: "Klasa 4" },
      class5: { label: "Klasa 5" },
    },
    cityDeadlineNotice: {
      none: { label: "Brak kontaktu" },
      pressOrMediaOnly: { label: "Tylko prasa / media" },
      officialLetter: { label: "Oficjalne pismo" },
    },
    replacementPreference: {
      gas: { label: "Gaz" },
      pelletBoiler: { label: "Kocioł na pellet" },
      heatPump: { label: "Pompa ciepła" },
      pelletOrHeatPump: { label: "Pellet lub pompa ciepła" },
      undecided: { label: "Jeszcze nie wiem" },
    },
    electricityTariff: {
      G11: { label: "G11", sublabel: "Stała, całą dobę" },
      G12: { label: "G12", sublabel: "Tańsze noce" },
    },
    waterHeating: {
      electricBoilerNew: { label: "Nowy bojler elektryczny" },
      electricSummerCoalWinter: { label: "Latem prąd, zimą węgiel" },
      coalCentralAllYear: { label: "Kocioł węglowy przez cały rok" },
      electricNightTariff: { label: "Prąd, taryfa nocna" },
    },
    boilerClassInline: {
      bezklasowy: "bezklasowy",
      class3: "klasy 3",
      class4: "klasy 4",
      class5: "klasy 5",
    },
  },

  baseline: {
    title: "Ile płacisz dzisiaj",
    subtitle:
      "Twój obecny rok na węglu, odtworzony z Twoich odpowiedzi. To jest kwota, z którą porównamy każdą opcję poniżej.",
    totalOutflow: "Łączny wydatek",
    perMonth: "miesięcznie",
    perYear: "rocznie",
    perYearTotal: (amount: string) => `${amount} rocznie`,
    spaceHeating: "Ogrzewanie pomieszczeń",
    spaceHeatingSub: "Węgiel spalony, by ogrzać dom",
    waterHeating: "Podgrzewanie wody",
    waterHeatingSub: "Ciepła woda, niezależnie od źródła",
    electricityAndCooling: "Prąd i chłodzenie",
    electricityAndCoolingSub: "Cała reszta na liczniku",
    heatDelivered: "Ciepło dostarczone przez kocioł",
    buildingCondition: "Stan budynku",
    kwhPerYear: (value: string) => `${value} kWh/rok`,
    kwhPerM2PerYear: (value: string) => `${value} kWh/m²/rok`,
    gapBefore: "Twój rachunek wskazuje na ",
    gapAmount: (value: string, over: boolean) =>
      `${value} kWh/rok ${over ? "więcej" : "mniej"}`,
    gapAfter: " niż wynikałoby z Twoich odpowiedzi. ",
    gapReasonOver:
      "Zwykle oznacza to grzejnik elektryczny, bojler z grzałką albo warsztat, o który jeszcze nie zapytaliśmy.",
    gapReasonUnderWaterOrCooling:
      "Zwykle oznacza to, że nasze oszacowanie ciepłej wody lub chłodzenia jest zbyt hojne jak na Twoje gospodarstwo domowe.",
    gapReasonUnderBaseline:
      "Zwykle oznacza to, że typowe gospodarstwo domowe, z którym porównujemy codzienne zużycie prądu (oświetlenie, lodówka i podobne), zużywa więcej niż Twoje.",
    gapClosing:
      " Wyceniliśmy rachunek, który podałeś, a nie nasze oszacowanie.",
    assumptionsSummary: (count: number) => `Co założyliśmy (${count})`,
  },

  alternatives: {
    options: {
      airToAirHp: {
        name: "Pompa ciepła powietrze-powietrze",
        shortLabel: "Około 4x na prądzie",
        description:
          "Jednostki ścienne lub sufitowe, które ogrzewają powietrze bezpośrednio, tak jak klimatyzator z funkcją grzania.",
        efficiencyLabel:
          "dostarcza około 4 kWh ciepła z każdej 1 kWh zużytego prądu",
      },
      airToWaterHp: {
        name: "Pompa ciepła powietrze-woda",
        shortLabel: "Około 3x na prądzie",
        description:
          "Podłącza się do istniejących grzejników i podgrzewa płynącą w nich wodę tak, jak robi to dziś kocioł węglowy.",
        efficiencyLabel:
          "dostarcza około 3 kWh ciepła z każdej 1 kWh zużytego prądu",
      },
      pellet: {
        name: "Kocioł na pellet",
        shortLabel: "85% sprawności",
        description:
          "Automatycznie spala sprasowany pellet drzewny zamiast węgla, w podobnym kotle i na tych samych grzejnikach.",
        efficiencyLabel: "zamienia około 85% energii pelletu w ciepło",
      },
    },

    compare: {
      title: "Porównaj wymianę",
      subtitle:
        "Wybierz jedną opcję, aby zobaczyć jej koszty eksploatacji na dzisiejszych liczbach. Fotowoltaika, dotacje i finansowanie są niżej: tutaj liczy się sam koszt energii.",
      fieldLabel: "Opcja wymiany",
      addSolarLabel: "Dodaj fotowoltaikę do tej inwestycji",
      addSolarSublabel: (price: string, kwh: string) =>
        `+${price} za instalację ${kwh} kWh/rok`,
      newOutflow: (name: string) => `${name}: nowy roczny wydatek`,
      perMonth: "miesięcznie",
      perYearAndEfficiency: (amount: string, efficiency: string) =>
        `${amount} rocznie · ${efficiency}`,
      spaceHeating: "Ogrzewanie pomieszczeń",
      fuelPerYear: (amount: string, unit: string) =>
        `${amount} ${unit} rocznie`,
      fuelUnitKwh: "kWh prądu",
      fuelUnitTonnes: "ton pelletu",
      waterHeating: "Podgrzewanie wody",
      unchanged: "Bez zmian względem dziś",
      electricityAndCooling: "Prąd i chłodzenie",
    },

    savings: {
      title: "Oszczędności względem węgla",
      subtitle: (name: string, withSolar: boolean) =>
        `${name}${withSolar ? " z fotowoltaiką" : ""} w bezpośrednim porównaniu z tym, co płacisz teraz.`,
      headline: (verb: string, amount: string, worse: boolean) =>
        `${verb} ${amount}/miesiąc${worse ? " więcej" : ""}`,
      saves: "Oszczędza",
      costs: "Kosztuje",
      detail: (
        verb: string,
        amount: string,
        worse: boolean,
        baseline: string,
      ) =>
        `${verb} ${amount} rocznie${worse ? " więcej" : ""}, w porównaniu z ${baseline}/rok na węglu dzisiaj.`,
      caveat:
        "Sam koszt energii to tylko część obrazu. Za węgiel nie zostało już nic do spłacenia za instalację; cena zakupu wymiany, dotacja na nią i finansowanie mogą jeszcze zmienić, która opcja ma sens, gdy je doliczymy.",
    },

    capex: {
      title: "Ile kosztuje montaż",
      subtitle: (name: string, withSolar: boolean) =>
        `Urządzenie i montaż dla opcji: ${name}${withSolar ? ", plus fotowoltaika" : ""}. To cena przed dotacją i kredytem: oba są w kolejnych krokach.`,
      hardware: "Urządzenie",
      installation: "Montaż",
      typically: (range: string) => `Zwykle ${range}`,
      unitEquipment: "sprzęt",
      unitLabour: "robocizna",
      unitAdded: "doliczone",
      solarLabel: "Panele fotowoltaiczne (PV)",
      solarSub: (kwh: string) => `Nowa instalacja ${kwh} kWh/rok`,
      totalGross: "Łączny koszt brutto",
      totalGrossWithSolar: "Łączny koszt brutto (z fotowoltaiką)",
      turnkey: "pod klucz, z VAT",
      spread: (range: string) =>
        `Zwykle ${range}: oferty instalatorów różnią się o tyle w zależności od doboru mocy, grzejników i regionu.`,
      zumNote:
        "Uwaga: wybrane pompy ciepła i kotły na pellet muszą znajdować się w oficjalnej bazie ZUM, aby kwalifikować się do dotacji z Czystego Powietrza.",
      zumLink: "Sprawdź oficjalną Listę ZUM",
    },

    grants: {
      title: "Dotacje (Czyste Powietrze)",
      subtitle:
        "Ile program dopłaca do tej inwestycji i ile zostaje do znalezienia po Twojej stronie.",
      incomeLevel: "Twój poziom dochodów",
      tiers: {
        basic: "Podstawowy",
        increased: "Podwyższony",
        highest: "Najwyższy",
      },
      tierSublabelBasic: (max: string) =>
        `Do ${max}/miesiąc na całe gospodarstwo domowe`,
      tierSublabelPerPerson: (multi: string, single: string) =>
        `Do ${multi}/miesiąc na osobę (${single} dla osoby samotnej)`,
      grantTowards: (name: string) => `Dotacja na: ${name}`,
      grantTowardsSolar: "Dotacja na fotowoltaikę",
      cappedAt: (cap: string, line: string) =>
        `Ograniczone do ${cap} dla tego urządzenia (wiersz arkusza ${line})`,
      rateOf: (pct: number, cost: string, line: string) =>
        `${pct}% z ${cost} (wiersz arkusza ${line})`,
      solarRateOf: (pct: number, cost: string) => `${pct}% z ${cost}`,
      offThePrice: "od ceny",
      netCapex: "Koszt netto, po dotacjach",
      leftToPay: "zostaje do zapłaty",
      netCapexDetail: (gross: string, grants: string) =>
        `${gross} brutto, minus ${grants} dotacji.`,
    },

    trueCost: {
      title: "Twój rzeczywisty koszt miesięczny",
      subtitle:
        "Koszty eksploatacji plus rata za to, co zostało: kwota, którą naprawdę poczujesz co miesiąc.",
      loanTerm: "Okres kredytowania",
      years: (n: number) => `${n} lat`,
      interest: (pct: number) => `${pct}% odsetek`,
      runningCost: "Koszty eksploatacji",
      runningCostSub: (name: string, withSolar: boolean) =>
        `Energia dla opcji: ${name}${withSolar ? ", z fotowoltaiką" : ""}`,
      loanRepayment: "Rata kredytu",
      loanRepaymentSub: (amount: string, years: number, pct: number) =>
        `${amount} na ${years} lat przy ${pct}%`,
      perMonth: "miesięcznie",
      heading: "Rzeczywisty koszt miesięczny",
      whileRepaying: "miesięcznie w czasie spłaty",
      comparison: (
        amount: string,
        cheaper: boolean,
        baseline: string,
        afterLoan: string,
        years: number,
      ) =>
        `${cheaper ? "Wciąż " : ""}${amount}/miesiąc ${cheaper ? "taniej niż" : "więcej niż"} ${baseline}, które płacisz dziś za węgiel. Spada do ${afterLoan}/miesiąc, gdy kredyt zostanie spłacony za ${years} lat.`,
    },
  },

  summary: {
    title: "Odpowiedzi, na których oparliśmy te liczby",
    subtitle:
      "Każda liczba powyżej wynika z tego, co nam powiedziałeś. Oto te dane z powrotem, żebyś mógł sprawdzić, czy coś nie wygląda źle.",
    postalCode: "Kod pocztowy",
    empty: "—",
    homeSection: "Dom i komfort",
    houseType: "Rodzaj budynku",
    insulation: "Ocieplenie",
    windowFrames: "Stolarka okienna",
    heatedArea: "Powierzchnia ogrzewana",
    heatedAreaValue: (m2: number) => `${m2} m²`,
    radiators: "Grzejniki",
    occupants: "Domownicy",
    acAvailable: "Klimatyzacja",
    unheatedRooms: "Pomieszczenia nieogrzewane",
    heatingSection: "Obecne ogrzewanie i paliwo",
    coalType: "Rodzaj węgla",
    alsoBurnsWood: "Pali także drewnem",
    coalBought: "Kupiony węgiel",
    coalBoughtValue: (tonnes: number, price: number) =>
      `${tonnes} t/sezon po ${price} zł/t`,
    boiler: "Kocioł",
    boilerValue: (classLabel: string, year: number | "") =>
      year === "" ? classLabel : `${classLabel}, ${year}`,
    freeCoal: "Węgiel darmowy/z rabatem",
    freeCoalValue: (tonnes: number | "") => `Tak (${tonnes} t)`,
    cityDeadline: "Informacja o terminie z gminy",
    replacementPreference: "Preferowana wymiana",
    coalProvider: "Dostawca węgla",
    electricitySection: "Prąd i ciepła woda",
    electricity: "Prąd",
    electricityValue: (tariff: string, bill: number) =>
      `${tariff}, ${bill} zł/mies.`,
    waterHeating: "Podgrzewanie wody",
    showers: "Prysznice/kąpiele tygodniowo, na osobę",
    gasConnection: "Przyłącze gazowe",
    pvBatteryStorage: "PV / magazyn energii / bufor ciepła",
    pv: "PV",
    battery: "Magazyn energii",
    heatStorage: "Bufor ciepła",
    none: "Brak",
    yes: "Tak",
    no: "Nie",
  },

  assumptions: {
    coalGradeAssumed: (fuel: string) =>
      `Założyliśmy węgiel ${fuel.toLowerCase()}, ponieważ nie podałeś sortymentu.`,
    boilerEfficiencyKnown: (boilerLabel: string, pct: number) =>
      `Założyliśmy, że Twój kocioł ${boilerLabel} zamienia ${pct}% energii węgla w ciepło.`,
    boilerEfficiencyUnknown: (pct: number) =>
      `Założyliśmy, że Twój kocioł zamienia ${pct}% energii węgla w ciepło, ponieważ nie podałeś jego klasy.`,
    coalPriceAssumed: (pricePerTonne: number) =>
      `Założyliśmy cenę węgla ${pricePerTonne} zł za tonę, ponieważ nie podałeś własnej.`,
    hotWaterPerShower: (litres: number, heatedPct: number) =>
      `Założyliśmy ${litres} litrów wody na prysznic lub kąpiel, z czego ${heatedPct}% trzeba było podgrzać. Reszta dolewa się jako zimna woda w kranie.`,
    summerElectricWater: (pct: number) =>
      `Założyliśmy, że ${pct}% ciepłej wody jest latem podgrzewane prądem, ponieważ kocioł jest wtedy wygaszony.`,
    electricWaterHeaterEfficiency: (pct: number) =>
      `Założyliśmy, że Twój elektryczny podgrzewacz wody ma sprawność ${pct}%.`,
    electricityUseModelled: (kwh: number) =>
      `Założyliśmy roczne zużycie prądu na około ${kwh} kWh, na podstawie zużycia typowego gospodarstwa domowego plus Twojej ciepłej wody i chłodzenia, ponieważ nie podałeś rachunku.`,
  },

  grantWarnings: {
    highestTierUnavailable: (spaceHeatPerM2: number) =>
      `Najwyższy poziom dofinansowania jest dostępny tylko dla budynków powyżej 140 kWh/m²/rok. Ten ma około ${spaceHeatPerM2}, więc obowiązuje poziom podwyższony.`,
    heatSourceNotEligibleAlone: (
      spaceHeatPerM2: number,
      requiredEndState: string,
    ) =>
      `Przy około ${spaceHeatPerM2} kWh/m²/rok Czyste Powietrze nie sfinansuje samej wymiany źródła ciepła. Budynek musi zostać ocieplony w ramach tej samej inwestycji, osiągając: ${requiredEndState}. HeatFit nie wycenia jeszcze prac termomodernizacyjnych, więc nie liczymy tu żadnej dotacji.`,
    solarPvPaused: (cap: string) =>
      `Kwota za fotowoltaikę wynika ze stawki PV z arkusza. Zakładka dotacji odnotowuje wsparcie PV prowadzone przez przydomowemagazyny.gov.pl, z limitem ${cap}, i oznacza ten program jako WSTRZYMANY: traktuj tę pozycję orientacyjnie, a nie jako pewne pieniądze.`,
    requiredEndState: {
      1: "poniżej 80 kWh/m²/rok",
      2: "samo źródło ciepła: bez wzrostu. Z termomodernizacją: maks. 80 i co najmniej 40% redukcji",
      3: "maks. 140 kWh/m²/rok i co najmniej 40% redukcji",
    },
  },
};
