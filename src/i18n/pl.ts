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
      title: "Znajdź najniższą cenę i najlepsze finansowanie",
      subtitle:
        "Odpowiedz na kilka krótkich pytań, aby obliczyć dokładny koszt urządzenia, maksymalne dotacje rządowe i nisko oprocentowane finansowanie.",
      timeEstimate: "Zajmuje około 10 minut, od początku do końca",
      fitTitle: "Czy to narzędzie jest dla Ciebie?",
      fitCoalUsersLabel: "Dla osób ogrzewających węglem:",
      fitCoalUsersBody:
        "Stworzone dla domów jednorodzinnych (wolnostojących, bliźniaków lub szeregowców) obecnie ogrzewanych węglem. (Mieszkania i ogrzewanie gazowe nie są jeszcze obsługiwane. Chcesz opcję gazową? Napisz na ",
      fitCoalUsersEmailSuffix: ")",
      readyPrompt: "Gotowy, aby zacząć?",
    },

    location: {
      title: "Lokalizacja",
      subtitle:
        "Lokalizacja decyduje o strefie klimatycznej i lokalnych uchwałach antysmogowych.",
      postalCode: "Kod pocztowy",
      postalCodePlaceholder: "np. 10-115",
      postalCodeRequired: "Podaj kod pocztowy, aby przejść dalej.",
      whySummary: "Dlaczego pytamy o kod pocztowy",
      info: "Na podstawie kodu pocztowego sprawdzamy, które dotacje regionalne obejmują Twoją okolicę, jaki termin wymiany kotła węglowego wyznaczyła Twoja gmina i czy lokalny program czystego powietrza pokryje część kosztów.",
      cityDeadline: "Czy gmina skontaktowała się z Tobą w sprawie terminu?",
    },

    heatingStepRequired: "Rok montażu kotła jest wymagany, aby przejść dalej.",
  },

  postalCode: {
    invalidFormat:
      "To narzędzie działa dla adresów w Polsce. Podaj polski kod pocztowy (format: XX-XXX, np. 10-115).",
  },

  roadmap: {
    baseline: "Krok 1 z 6 · Gdzie jesteś dzisiaj",
    compare: "Krok 2 z 6 · Twoje opcje",
    savings: "Krok 3 z 6 · Co się zmienia",
    capex: "Krok 4 z 6 · Ile to kosztuje",
    grants: "Krok 5 z 6 · Co odzyskujesz",
    trueCost: "Krok 6 z 6 · Twój miesięczny plan",
    nextStep: "Twój następny krok",
    yourAnswers: "Do Twojej wiadomości",
  },

  personas: {
    title: "Wczytaj przykładowe gospodarstwo domowe",
    subtitle:
      "Wypełnij wszystkie kroki poniżej danymi z prawdziwego wywiadu albo wpisz je ręcznie.",
    fieldLabel: "Przykładowe gospodarstwo domowe",
    cases: {
      warmthGuardian: {
        name: "Strażniczka Ciepła",
        description: "Używa starego, bezklasowego kotła węglowego zasypowego",
        seed: {
          radiatorNote: "",
          coalPriceNote: "300 zł/t to transport: 1000 zł/t loco kopalnia",
          freeCoalNote: "Nie pytano",
          electricityBillNote: "Prognoza, ryczałt, rozliczenie co pół roku",
          additionalNotes:
            "90% finansuje, 10% nie widzi potrzeby przechodzenia na czystą energię.",
        },
      },
      methodicalPlanner: {
        name: "Metodyczny Planista",
        description: "Ma starzejący się kocioł klasy 4 z 2017 roku",
        seed: {
          radiatorNote: "Małe standardowe grzejniki płytowe",
          coalPriceNote: "Mieszane sortymenty (groszek / mieszanka)",
          freeCoalNote: "Z gospodarstwa krewnego",
          electricityBillNote: "",
          additionalNotes: "",
        },
      },
      groundFloorManager: {
        name: "Zarządczyni Parteru",
        description: "Mieszka sama, z nieogrzewanymi pokojami na piętrze",
        seed: {
          radiatorNote:
            "Stare, masywne żeliwne grzejniki: bardzo gorące w dotyku",
          coalPriceNote: "",
          freeCoalNote: "",
          electricityBillNote: "",
          additionalNotes: "",
        },
      },
      nightWatch: {
        name: "Nocna Warta",
        description: "Węgiel orzech i podgrzewanie wody w nocy",
        seed: {
          radiatorNote: "Stare, duże żeliwne grzejniki: bardzo gorące w dotyku",
          coalPriceNote: "",
          freeCoalNote: "",
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
    totalArea: "Całkowita powierzchnia domu",
    totalAreaUnit: "m²",
    wholeHouseHeatedLabel: "Czy cały dom jest ogrzewany?",
    wholeHouseHeatedSublabel: "Każde pomieszczenie ma ciepło przez całą zimę",
    unheatedPortion: "Co nie jest ogrzewane?",
    heatedArea: "Powierzchnia ogrzewana",
    estimatedHeatedArea: "Szacowana powierzchnia ogrzewana",
    estimatedHeatedAreaEditableNote:
      "Nasze oszacowanie na podstawie odpowiedzi powyżej. Popraw je, jeśli znasz dokładną liczbę.",
    heatedAreaValue: (m2: number) => `${m2} m²`,
    radiatorType: "Grzejniki / ogrzewanie podłogowe",
    radiatorNote: "Uwagi o grzejnikach",
    radiatorNotePlaceholder: "np. stare żeliwne, bardzo gorące w dotyku",
    occupants: "Liczba domowników",
    occupantsUnit: "osób",
    acLabel: "Klimatyzacja",
    acSublabel: "Sprawna klimatyzacja w domu",
    insulationWhySummary: "Dlaczego pytamy o ocieplenie",
    insulationWhyBody:
      "Ocieplenie decyduje o tym, ile ciepła Twój dom naprawdę potrzebuje w ciągu roku, liczone w kWh na metr kwadratowy. Ta jedna liczba wpływa na dwie rzeczy: ile będzie kosztować eksploatacja nowego systemu i który poziom dofinansowania z Czystego Powietrza jest dla Ciebie dostępny. Zobaczysz ją tutaj prosto z mostu.",
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
    gasLabel: "Dostępne przyłącze gazowe",
    gasSublabel: "Sieć gazowa dochodzi już do posesji",
    districtHeatingLabel: "Dostępne ciepło systemowe",
    districtHeatingSublabel: "Sieć ciepłownicza dochodzi już do posesji",
    replacementPreference:
      "Gdyby kocioł trzeba było wymienić jutro, co byś zamontował?",
  },

  electricity: {
    title: "Prąd i ciepła woda",
    subtitle: "Opowiedz nam o zużyciu prądu i o tym, jak ogrzewasz wodę.",
    tariff: "Taryfa energii elektrycznej",
    bill: "Rachunek za prąd",
    billPlaceholder: "np. 200",
    billSuffix: "zł / miesiąc",
    billNote: "Uwagi o rachunku",
    billNotePlaceholder: "np. prognoza, ryczałt, rozliczenie co pół roku",
    waterHeater: "Podgrzewacz wody: sposób ogrzewania wody",
    showers: "Prysznice / kąpiele tygodniowo, na osobę",
    showersUnit: "tygodniowo, na osobę",
    pvSetup: "Instalacja fotowoltaiczna: Czy masz już panele fotowoltaiczne?",
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
    unheatedPortion: {
      wholeFloor: {
        label: "Całe jedno piętro",
        sublabel: "np. górne piętro",
      },
      someRooms: {
        label: "Kilka pomieszczeń",
        sublabel: "Kilka pokoi, nie całe piętro",
      },
      basementOrGarage: { label: "Tylko piwnica lub garaż" },
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
      ecodesign: {
        label: "Certyfikat Ecodesign",
        sublabel: "Norma unijna, to nie to samo co klasa 5",
      },
    },
    cityDeadlineNotice: {
      none: { label: "Brak kontaktu" },
      pressOrMediaOnly: { label: "Tylko prasa / media" },
      officialLetter: { label: "Oficjalne pismo" },
      chimneySweep: { label: "Wizyta kominiarza" },
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
      G12: { label: "G12", sublabel: "Taniej w nocy i w południe" },
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
      ecodesign: "z certyfikatem Ecodesign",
    },
  },

  baseline: {
    title: "Ile płacisz dzisiaj",
    subtitle:
      "Twój roczny bilans węgla oparty na Twoich odpowiedziach. Czy tak wygląda Twoje życie? Jeśli nie, zmień to.",
    totalOutflow: "",
    perMonth: "miesięcznie",
    perYear: "rocznie",
    perYearTotal: (amount: string) => `${amount} rocznie`,
    spaceHeating: "Ogrzewanie pomieszczeń",
    spaceHeatingSub: "Węgiel spalony, by ogrzać dom",
    waterHeating: "Podgrzewanie wody",
    waterHeatingSub: "Ciepła woda, niezależnie od źródła",
    electricityAndCooling: "Prąd i chłodzenie",
    electricityAndCoolingSub: "Cała reszta na liczniku",
    breakdownLabel: "Zobacz podział kosztów",
    heatDelivered: "Ciepło dostarczone przez kocioł",
    buildingCondition: "Stan budynku",
    kwhPerYear: (value: string) => `${value} kWh/rok`,
    kwhPerM2PerYear: (value: string) => `${value} kWh/m²/rok`,
    gapBefore: "Twój rachunek wskazuje na ",
    gapAmount: (value: string, over: boolean) =>
      `${value} kWh/rok ${over ? "więcej" : "mniej"}`,
    gapAfter: " niż wynikałoby z Twoich odpowiedzi. ",
    gapReasonOver:
      "Zwykle oznacza to coś elektrycznego, o co jeszcze nie zapytaliśmy: grzejnik elektryczny, bojler z grzałką albo warsztat.",
    gapReasonUnderWaterOrCooling:
      "Zwykle oznacza to, że nasze oszacowanie ciepłej wody lub chłodzenia jest zbyt hojne jak na Twoje gospodarstwo domowe.",
    gapReasonUnderBaseline:
      "Zwykle oznacza to, że typowe gospodarstwo domowe, z którym porównujemy codzienne zużycie prądu (oświetlenie, lodówka i podobne), zużywa więcej niż Twoje.",
    gapClosing:
      " Wyceniliśmy rachunek, który podałeś, a nie nasze oszacowanie.",
    assumptionsSummary: (count: number) => `Co założyliśmy (${count})`,
    assumptionsIntro:
      "Bierzemy węgiel, który podałeś, energię zawartą w tym sortymencie i to, ile z niej Twoja klasa kotła naprawdę zamienia w ciepło. Ciepłą wodę i resztę licznika szacujemy na podstawie średniej krajowej.",
    whyCoalAccuracySummary: "Dlaczego te liczby mogą się różnić",
    coalAccuracyIntro: (
      reference: string,
      actual: string,
      comparison: string,
    ) =>
      `Dla takiego budynku zwykle spodziewalibyśmy się około ${reference} kWh/m²/rok na ogrzewanie. U Ciebie wychodzi ${actual} kWh/m²/rok${comparison}. Oto, co zakłada ta liczba:`,
    coalAccuracyComparisonHigh: (pct: number) => `, o ${pct}% więcej`,
    coalAccuracyComparisonLow: (pct: number) => `, o ${pct}% mniej`,
    coalAccuracyComparisonClose: () => " — zgodnie z tą wartością",
    coalAccuracyBoiler: (pct: number, classLabel: string, ageSuffix: string) =>
      `Sprawność kotła: założyliśmy ${pct}% dla Twojego kotła ${classLabel}${ageSuffix}. Starszy lub gorzej utrzymany kocioł często działa poniżej tej wartości.`,
    coalAccuracyBoilerAge: (year: number, age: number) =>
      `, zainstalowanego w ${year} r. (${age} lat)`,
    coalAccuracyCoal: (
      tonnes: string,
      kwhPerTonne: string,
      fuelLabel: string,
      pct: number,
      resultKwh: string,
    ) =>
      `Energia węgla: około ${tonnes} t węgla ${fuelLabel} przy ${kwhPerTonne} kWh/t, spalanego ze sprawnością ${pct}% ≈ ${resultKwh} kWh dostarczonego ciepła. Jakość węgla różni się nawet w obrębie tego samego sortymentu.`,
    coalAccuracyInsulationNone: (label: string) =>
      `Izolacja: podałeś ${label}. To prawdopodobny czynnik, jeśli rzeczywista liczba jest wyższa niż ta.`,
    coalAccuracyInsulationStandard: (label: string) =>
      `Izolacja: podałeś ${label}. Umiarkowany czynnik: rzeczywiste straty mogą być nieco wyższe.`,
    coalAccuracyInsulationVeryGood: (label: string) =>
      `Izolacja: podałeś ${label}. Dobrze zaizolowany budynek, mało prawdopodobne, by to on podnosił tę liczbę.`,
    whyConditionSummary: "Dlaczego ta liczba tyle znaczy",
    whyConditionBody:
      "kWh/m²/rok to stan Twojego budynku w jednej liczbie: ile ciepła potrzebuje na metr kwadratowy. Czyste Powietrze posługuje się tą samą miarą. Powyżej 140 program nie sfinansuje samego źródła ciepła bez termomodernizacji i dopiero powyżej 140 otwiera się najwyższy poziom dofinansowania. Nic nie jest punktowane po cichu: to jest ta liczba, a krok 5 pokazuje dokładnie, co oznacza dla Twojej dotacji.",
    editValue: "Edytuj tę kwotę",
    saveEdit: "Zapisz",
    cancelEdit: "Anuluj",
    resetValue: "Przywróć nasze oszacowanie",
    editedTag: "poprawione",
    overriddenNote:
      "Poprawiłeś jedną lub więcej kwot poniżej. Wszystko od tego miejsca dalej (oszczędności, dotacje, finansowanie) korzysta teraz z Twoich liczb zamiast naszego oszacowania.",
    resetAll: "Przywróć wszystkie do naszego oszacowania",
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
        "Ten krok to sam koszt energii: fotowoltaika, dotacje i finansowanie mają niżej własne kroki.",
      fieldLabel: "Opcja wymiany",
      bestValueBadge: "Największa oszczędność",
      districtHeatingPelletWarningSilesia:
        "Uchwała antysmogowa dla woj. śląskiego zakazuje ogrzewania na paliwo stałe - w tym kotłów na pellet - tam, gdzie dostępne jest ciepło systemowe.",
      districtHeatingPelletWarningOther:
        "Inne województwa też mogą ograniczać paliwo stałe tam, gdzie dostępne jest ciepło systemowe. Warto to sprawdzić w swojej gminie przed wyborem kotła na pellet.",
      addSolarLabel: "Dodaj fotowoltaikę do tej inwestycji",
      switchToDynamicLabel: "Przejdź na taryfę dynamiczną",
      newOutflow: (name: string) => `${name}`,
      perMonth: "miesięcznie",
      perYearAndEfficiency: (amount: string, efficiency: string) =>
        `${amount} rocznie · ${efficiency}`,
      spaceHeating: "Ogrzewanie pomieszczeń",
      fuelPerYear: (amount: string, unit: string) =>
        `${amount} ${unit} rocznie`,
      fuelUnitKwh: "kWh prądu",
      fuelUnitTonnes: "ton pelletu",
      waterHeating: "Podgrzewanie wody",
      unchanged: "To samo zużycie co dziś",
      electricityAndCooling: "Prąd i chłodzenie",
      breakdownLabel: "Zobacz podział kosztów",
      assumptionsSummary: (count: number) => `Co założyliśmy (${count})`,
      assumptionsIntro:
        "Dotyczą samej wymiany, nie Twojego gospodarstwa domowego: to standardowe wskaźniki sprawności, a nie coś, co nam podałeś.",
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
        "Sam koszt energii to tylko część obrazu i to jest moment, w którym wygląda on najgorzej. Za węgiel nie zostało już nic do spłacenia za instalację, a wymiana nie ma jeszcze doliczonej ani dotacji, ani finansowania. Czytaj dalej: kolejne trzy kroki dokładają jedno i drugie.",
    },

    capex: {
      title: "Ile kosztuje montaż",
      subtitle: (name: string, withSolar: boolean) =>
        `Urządzenie i montaż dla opcji: ${name}${withSolar ? ", plus fotowoltaika" : ""}. To pełna cena, zanim dojdzie jakakolwiek pomoc: dotacja w kroku 5, finansowanie w kroku 6.`,
      hardware: "Urządzenie",
      installation: "Montaż",
      typically: (range: string) => `Zwykle ${range}`,
      unitEquipment: "sprzęt",
      unitLabour: "robocizna",
      unitAdded: "doliczone",
      solarLabel: "Panele fotowoltaiczne (PV)",
      solarSub: (kwh: string) => `Nowa instalacja ${kwh} kWh/rok`,
      breakdownLabel: "Zobacz podział kosztów",
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
        "Ile program dopłaca do tej inwestycji i ile naprawdę zostaje po Twojej stronie. Wybierz poziom dochodów pasujący do Twojego gospodarstwa: dopóki tego nie zrobisz, zakładamy najmniej korzystny, więc realna kwota może być tylko lepsza.",
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
      assumesInsulationTag: "Zakłada ocieplenie",
      netCapex: "Koszt netto, po dotacjach",
      leftToPay: "zostaje do zapłaty",
      netCapexDetail: (gross: string, grants: string) =>
        `${gross} brutto, minus ${grants} dotacji.`,
    },

    taxRelief: {
      fieldLabel: "Twoja stawka podatku dochodowego",
      rates: {
        pit12: { label: "12%", sublabel: "Pierwszy próg PIT" },
        pit32: { label: "32%", sublabel: "Powyżej 120 000 zł rocznie" },
        flat19: { label: "19%", sublabel: "Podatek liniowy" },
        none: {
          label: "Nie płacę podatku",
          sublabel: "Ulga nic wtedy nie daje",
        },
      },
      lineLabel: "Szacowany zwrot podatku (ulga termomodernizacyjna)",
      lineSub: (pct: number, base: string) =>
        `${pct}% z ${base} odliczone od dochodu`,
      cappedSub: (cap: string, pct: number) =>
        `Odliczenie ograniczone do ${cap} na podatnika, zwrot to ${pct}% tej kwoty`,
      unit: "zwrot później",
      finalNetCost: "Ostateczny koszt netto, po dotacji i uldze",
      finalNetCostDetail: (net: string, relief: string) =>
        `${net} zostaje po dotacji, minus ${relief} zwrócone w rozliczeniu rocznym.`,
      noteSummary: "Jak faktycznie działa ta ulga",
      note: "Ulga to odliczenie od dochodu, a nie wypłata: odzyskujesz swoją stawkę podatku od tej kwoty i dostajesz ją z rocznym zeznaniem, a nie z góry. Dlatego krok 6 wciąż liczy kredyt od pełnej kwoty, która zostaje po dotacji.",
      capAndIncomeNote: (cap: string, years: number) =>
        `Maksymalnie ${cap} na podatnika, łącznie za wszystkie prace termomodernizacyjne, a niewykorzystaną część można rozliczać jeszcze przez ${years} lat. Zakładamy, że Twój dochód jest wystarczająco wysoki, żeby odliczenie się zmieściło.`,
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
      breakdownLabel: "Zobacz podział kosztów",
      perMonth: "miesięcznie",
      heading: "Rzeczywisty koszt miesięczny",
      whileRepaying: (years: number) =>
        `miesięcznie, przez najbliższe ${years} lat`,
      fromYear: (year: number) => `miesięcznie, od ${year}`,
      comparison: (
        duringAmount: string,
        duringCheaper: boolean,
        afterAmount: string,
        afterCheaper: boolean,
        baseline: string,
      ) =>
        `To ${duringAmount}/miesiąc ${duringCheaper ? "taniej niż" : "więcej niż"} ${baseline}, które płacisz dziś za węgiel, w czasie spłaty kredytu. Po jego spłacie robi się to ${afterAmount}/miesiąc ${afterCheaper ? "taniej niż" : "więcej niż"} węgiel.`,
    },
  },

  summary: {
    title: "Zabierz to ze sobą",
    subtitle:
      "Pobierz PDF ze wszystkim powyżej: Twoimi liczbami, porównaniem i odpowiedziami, na których je oparliśmy.",
    postalCode: "Kod pocztowy",
    cityDeadline: "Informacja o terminie z gminy",
    empty: "—",
    homeSection: "Dom i komfort",
    houseType: "Rodzaj budynku",
    insulation: "Ocieplenie",
    windowFrames: "Stolarka okienna",
    totalArea: "Całkowita powierzchnia domu",
    totalAreaValue: (m2: number) => `${m2} m²`,
    heatedArea: "Powierzchnia ogrzewana",
    estimatedHeatedArea: "Szacowana powierzchnia ogrzewana",
    heatedAreaValue: (m2: number) => `${m2} m²`,
    unheatedPortion: "Co nie jest ogrzewane",
    radiators: "Grzejniki",
    occupants: "Domownicy",
    acAvailable: "Klimatyzacja",
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
    gasConnection: "Przyłącze gazowe",
    districtHeating: "Ciepło systemowe",
    replacementPreference: "Preferowana wymiana",
    electricitySection: "Prąd i ciepła woda",
    electricity: "Prąd",
    electricityValue: (tariff: string, bill: number) =>
      `${tariff}, ${bill} zł/mies.`,
    waterHeating: "Podgrzewanie wody",
    showers: "Prysznice/kąpiele tygodniowo, na osobę",
    pvBatteryStorage: "PV / magazyn energii / bufor ciepła",
    pv: "PV",
    battery: "Magazyn energii",
    heatStorage: "Bufor ciepła",
    none: "Brak",
    yes: "Tak",
    no: "Nie",
  },

  earlyAccess: {
    title: "Twoja najlepsza cena i finansowanie, załatwione",
    subtitle:
      "Masz już swoje liczby. Powiedz słowo, a zajmiemy się dotacją, finansowaniem i ociepleniem, jeśli go potrzebujesz.",
    reviewNote:
      "Ktoś z zespołu HeatFit przegląda Twoje liczby, zanim się odezwiemy.",
    included: {
      grant: "Formalności dotacyjne",
      financing: "Dopasowane finansowanie",
      insulation: "Ocieplenie, jeśli trzeba",
    },
    installerCheckbox: "Połącz mnie też ze sprawdzonym lokalnym instalatorem",
    installerCheckboxHint:
      "Sprawdzamy instalatorów w Twojej okolicy i przedstawiamy Cię osobiście.",
    cta: "Chcę mój plan",
    modal: {
      title: "Odbierz swój plan",
      subtitle:
        "Zostaw swoje dane, a odezwiemy się osobiście, gdy tylko HeatFit ruszy.",
      interestFinancing: "Finansowanie, dotacje i ocieplenie",
      interestWithInstaller:
        "Finansowanie, dotacje i ocieplenie, plus kontakt z instalatorem",
      nameLabel: "Imię i nazwisko",
      namePlaceholder: "np. Jan Kowalski",
      contactLabel: "Telefon lub e-mail",
      contactPlaceholder: "np. 600 123 456 lub jan@example.com",
      noteLabel: "Krótka wiadomość (opcjonalnie)",
      notePlaceholder: "Cokolwiek chcesz, żebyśmy wiedzieli...",
      submit: "Wyślij zgłoszenie",
      submitting: "Wysyłanie...",
      close: "Zamknij",
      nameRequired: "Podaj imię i nazwisko.",
      contactRequired:
        "Podaj numer telefonu lub e-mail, żebyśmy mogli się skontaktować.",
      successTitle: "Jesteś na liście",
      successBody:
        "Dziękujemy! Twoje zgłoszenie zostało wysłane do zespołu HeatFit. Odezwiemy się wkrótce.",
      successBodyMailtoFallback: (email: string) =>
        `Twoja aplikacja pocztowa powinna otworzyć się z gotową wiadomością. Jeśli tak się nie stało, napisz do nas bezpośrednio na ${email}.`,
      errorTitle: "Nie udało się wysłać",
      errorBody: (email: string) =>
        `Nie udało się tego wysłać automatycznie. Spróbuj ponownie albo napisz do nas bezpośrednio na ${email}.`,
      emailSubject: "Zgłoszenie o wczesny dostęp do HeatFit",
      emailInterest: "Zainteresowanie",
      emailName: "Imię i nazwisko",
      emailContact: "Telefon lub e-mail",
      emailNote: "Wiadomość",
      pdfHint:
        "Przygotowaliśmy raport PDF z Twoimi liczbami. Kopia trafia automatycznie do naszego zespołu, a swój egzemplarz możesz pobrać poniżej.",
      downloadPdf: "Pobierz raport PDF",
      pdfGenerating: "Przygotowujemy Twój PDF...",
      pdfFailed:
        "Nie udało się teraz przygotować PDF-a, ale Twoje zgłoszenie i tak zostało wysłane.",
    },
    disclaimer:
      "Uwaga: zapisujesz się na wczesny dostęp. HeatFit jest obecnie w budowie i nie działa jeszcze w pełni: odezwiemy się, gdy tylko wystartujemy!",
  },

  regulatoryCountdown: {
    eyebrow: "Warto wiedzieć",
    title: "Uchwała antysmogowa dla województwa śląskiego",
    headlineUpcoming: (date: string) =>
      `Okres przejściowy dla Twojego kotła kończy się ${date}`,
    headlinePassed:
      "Twój kocioł nie spełnia już śląskich norm jakości powietrza",
    headlinePassedUncertain:
      "Twój kocioł może nie spełniać śląskich norm jakości powietrza",
    requirementUpcoming: (date: string) =>
      `Uchwała antysmogowa dla województwa śląskiego wymaga, aby taki kocioł jak Twój został podniesiony do klasy 5 do ${date}. Do tego czasu jego eksploatacja pozostaje legalna.`,
    requirementPassed: (date: string) =>
      `Uchwała antysmogowa dla województwa śląskiego wymagała, aby taki kocioł jak Twój został podniesiony do klasy 5 do ${date}. Ten termin już minął.`,
    requirementPassedUncertain: (date: string) =>
      `Uchwała antysmogowa dla województwa śląskiego wymagała, aby taki kocioł jak Twój został podniesiony do klasy 5 do ${date}. Certyfikat Ecodesign to odrębna norma unijna i sam w sobie nie potwierdza klasy 5, więc nie możemy tego stwierdzić z całą pewnością – ale biorąc pod uwagę wiek kotła, mógł on już nie spełniać wymogów uchwały.`,
    countdownLabel: "Pozostały czas",
    countdown: (months: number, days: number) => `${months} mies., ${days} dni`,
    consequenceTitle: "Co przewiduje uchwała",
    consequenceBody:
      "Mandat do 500 zł, a w przypadku wniosku o ukaranie do sądu – grzywna do 5000 zł. Karę można nałożyć ponownie za każdym razem, gdy instalacja zostanie znaleziona w użyciu po upływie terminu.",
    sourceLabel:
      "Uchwała antysmogowa dla województwa śląskiego (V/36/1/2017), §8",
    sourceLink: "Przeczytaj treść uchwały",
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
    electricityPriceAssumedFlat: (pricePerKwh: string) =>
      `Wyceniliśmy Twój prąd na taryfie G11 na ${pricePerKwh}/kWh: to jedna płaska stawka używana w całym narzędziu, a nie stawka Twojego dostawcy.`,
    electricityPriceAssumedDynamic: (pricePerKwh: string) =>
      `Wyceniliśmy Twój prąd na taryfie G12 na ${pricePerKwh}/kWh: płaska stawka, która zakłada, że większość zużycia przypada na tańsze godziny poza szczytem.`,
  },

  alternativeAssumptions: {
    usefulHeatCarriedOver: (kwhPerYear: string) =>
      `Założyliśmy, że ta wymiana musi dostarczyć tyle samo ${kwhPerYear} kWh ciepła rocznie, ile dziś dostarcza Twój kocioł węglowy: budynek potrzebuje tego samego ciepła bez względu na to, co je wytwarza.`,
    pelletEfficiencyAndPrice: (pct: number, pricePerTonne: string) =>
      `Założyliśmy kocioł na pellet o sprawności ${pct}%, spalający pellet w cenie ${pricePerTonne} za tonę.`,
    heatPumpCop: (
      optionName: string,
      cop: number,
      pricePerKwh: string,
      tariffLabel: string,
      tariff: "G11" | "G12",
    ) =>
      `${optionName}: przyjęliśmy COP ${cop.toFixed(1)} (1 kWh prądu daje ${cop.toFixed(1)} kWh ciepła), wg ${tariff === "G12" ? `średniej stawki Twojej taryfy ${tariffLabel}` : `Twojej taryfy ${tariffLabel}`} po ${pricePerKwh}/kWh.`,
    pvMarginalPricing: (pct: number) =>
      `Ponieważ masz fotowoltaikę, założyliśmy, że ${pct}% dodatkowego prądu tej pompy ciepła pokrywają bezpośrednio Twoje panele; reszta jest wyceniona wg tego, o ile faktycznie zmienia Twój rachunek, a nie wg stawki płaskiej.`,
    dynamicTariffHabitShift:
      "Założyliśmy, że przesuniesz większość zużycia prądu tego ogrzewania na godziny poza szczytem, by faktycznie uzyskać tę cenę.",
    carriedOverFromBaseline:
      "Podgrzewanie wody oraz prąd i chłodzenie zachowują to samo zużycie co dziś: ta wymiana zmienia tylko ogrzewanie pomieszczeń. Jeśli powyżej zmienisz taryfę lub dodasz fotowoltaikę, cena stojąca za tymi dwiema pozycjami też się zaktualizuje, bo działają na tym samym liczniku prądu.",
    coalWaterHeatingSwitchesToElectric: (
      electricBoilerPlnPerYear: string,
      heatPumpPlnPerYear: string | null,
      cheaperPct: number | null,
    ) =>
      heatPumpPlnPerYear !== null && cheaperPct !== null
        ? `Część Twojej ciepłej wody jest dziś podgrzewana przy okazji przez kocioł węglowy. Ponieważ jest on wymieniany, założyliśmy, że ta część przechodzi na zwykły bojler elektryczny, tak jak reszta Twojej ciepłej wody już dziś: to około ${electricBoilerPlnPerYear}/rok eksploatacji. Zakup takiego bojlera to niewielki dodatkowy koszt, nieujęty w cenie instalacji z kroku 4. Podgrzewanie tej samej wody tą pompą ciepła zamiast bojlera kosztowałoby zwykle około ${heatPumpPlnPerYear}/rok, czyli o ${cheaperPct}% mniej w eksploatacji, ale wymagałoby zakupu osobnego urządzenia do podgrzewania wody, co doliczyłoby się do ceny instalacji z kroku 4, zamiast ją zastąpić.`
        : `Część Twojej ciepłej wody jest dziś podgrzewana przy okazji przez kocioł węglowy. Ponieważ jest on wymieniany, założyliśmy, że ta część przechodzi na zwykły bojler elektryczny, tak jak reszta Twojej ciepłej wody już dziś: to około ${electricBoilerPlnPerYear}/rok eksploatacji. Zakup takiego bojlera to niewielki dodatkowy koszt, nieujęty w cenie instalacji z kroku 4. Nie modelowaliśmy przeniesienia jej na kocioł na pellet.`,
  },

  grantWarnings: {
    highestTierUnavailable: (spaceHeatPerM2: number) =>
      `Najwyższy poziom dofinansowania jest dostępny tylko dla budynków powyżej 140 kWh/m²/rok. Ten ma około ${spaceHeatPerM2}, więc obowiązuje poziom podwyższony.`,
    heatSourceNotEligibleAloneSummary: (spaceHeatPerM2: number) =>
      `Wymaga ocieplenia, przy około ${spaceHeatPerM2} kWh/m²/rok`,
    heatSourceNotEligibleAloneBody: (requiredEndState: string) =>
      `Czyste Powietrze nie sfinansuje tu samej wymiany źródła ciepła. Dotacja i kredyt poniżej zakładają, że ocieplenie się odbędzie, osiągając: ${requiredEndState}, i że potwierdzi to audyt energetyczny. Nie musisz sam tego ogarniać: daj nam znać w formularzu niżej na stronie, a sprawdzimy ten szacunek i powiemy dokładnie, co robić dalej.`,
    solarPvPaused: (cap: string) =>
      `Kwota za fotowoltaikę wynika ze stawki PV z arkusza. Zakładka dotacji odnotowuje wsparcie PV prowadzone przez przydomowemagazyny.gov.pl, z limitem ${cap}, i oznacza ten program jako WSTRZYMANY: traktuj tę pozycję orientacyjnie, a nie jako pewne pieniądze.`,
    requiredEndState: {
      1: "poniżej 80 kWh/m²/rok",
      2: "samo źródło ciepła: bez wzrostu. Z termomodernizacją: maks. 80 i co najmniej 40% redukcji",
      3: "maks. 140 kWh/m²/rok i co najmniej 40% redukcji",
    },
  },

  report: {
    filename: "szacunek_grzewczy.pdf",
    docTitle: "Szacunek wymiany ogrzewania",
    docSubtitle:
      "Osobiste podsumowanie Twoich liczb, przygotowane przez HeatFit na podstawie Twoich odpowiedzi.",
    generatedOn: (date: string) => `Wygenerowano ${date}`,
    preparedFor: (postalCode: string) => `Przygotowano dla: ${postalCode}`,
    preparedForWithRegion: (postalCode: string, region: string) =>
      `Przygotowano dla: ${postalCode}, woj. ${region}`,
    confidential:
      "Do Twojego osobistego użytku. To tylko szacunek, a nie wiążąca oferta ani gwarancja finansowania czy przyznania dotacji.",
    pageFooter: (page: number, total: number) => `Strona ${page} z ${total}`,
    contactFooter: (email: string) => `Pytania? ${email}`,

    sections: {
      executiveSummary: "Podsumowanie",
      yourDetails: "Twoje dane",
      runningCosts: "Porównanie kosztów eksploatacji",
      financialBreakdown: "Rozbicie finansowe",
      assumptions: "Kluczowe założenia i źródła danych",
    },

    downloadError: "Nie udało się teraz wygenerować PDF-a. Spróbuj ponownie.",

    verdict: {
      currentSpend: (monthly: string, yearly: string) =>
        `Obecnie wydajesz ${monthly}/miesiąc (${yearly}/rok) na ogrzewanie węglem.`,
      bestOption: (option: string) =>
        `Patrząc tylko na koszt eksploatacji, najlepszą opcją dla Twojego gospodarstwa jest: ${option}.`,
      saving: (option: string, monthly: string, yearly: string) =>
        `Przejście na: ${option} pozwoliłoby zaoszczędzić około ${monthly}/miesiąc (${yearly}/rok) względem węgla.`,
      costing: (option: string, monthly: string, yearly: string) =>
        `Przy dzisiejszych cenach opcja: ${option} kosztowałaby około ${monthly}/miesiąc (${yearly}/rok) więcej niż węgiel.`,
      netCostLine: (net: string) =>
        `Po dotacji z Czystego Powietrza i uldze termomodernizacyjnej Twój szacowany ostateczny koszt z własnej kieszeni to ${net}.`,
      trueCostLine: (monthly: string, years: number) =>
        `Przy finansowaniu rozłożonym na ${years} lat Twój rzeczywisty koszt miesięczny (eksploatacja plus rata kredytu) wynosi około ${monthly}.`,
    },

    details: {
      location: "Lokalizacja",
      postalCode: "Kod pocztowy",
      region: "Region (województwo)",
      building: "Budynek",
      currentHeating: "Obecne ogrzewanie i paliwo",
      electricityWater: "Prąd i ciepła woda",
      yourSelections: "Wybory przyjęte w tym raporcie",
      selectedOption: "Rozważana opcja wymiany",
      addSolar: "Uwzględniono dodatkową fotowoltaikę",
      incomeLevel: "Przyjęty poziom dochodów",
      loanTerm: "Przyjęty okres kredytowania",
      taxRateUsed: "Przyjęta stawka podatku dochodowego",
    },

    runningCostsTable: {
      columnBaseline: "Węgiel (dzisiaj)",
      columnWithoutPv: "Bez PV",
      columnWithPv: "Z PV",
      rowSpaceHeating: "Ogrzewanie pomieszczeń",
      rowWaterHeating: "Podgrzewanie wody",
      rowElectricityAndCooling: "Prąd i chłodzenie",
      rowTotalPerYear: "Razem / rok",
      rowTotalPerMonth: "Razem / miesiąc",
      rowSavingsPerYear: "Oszczędność względem węgla / rok",
      note: "Podgrzewanie wody oraz prąd i chłodzenie zachowują zużycie z Twojego stanu wyjściowego: zmienia się tylko źródło ogrzewania pomieszczeń. Ich cena nadal odzwierciedla taryfę i stan PV danej kolumny, bo działają na tym samym liczniku prądu. Kolumna „z PV” wycenia tę samą opcję tak, jakby gospodarstwo miało już panele słoneczne podłączone do tego licznika.",
    },

    financials: {
      optionLabel: (option: string) => `Dla opcji: ${option}`,
      grossCapex: "Koszt brutto (pod klucz, z VAT)",
      grant: "Dotacja Czyste Powietrze",
      netCapex: "Koszt netto, po dotacji",
      taxRelief: "Ulga podatkowa (ulga termomodernizacyjna)",
      finalNetCost: "Ostateczny koszt netto, po dotacji i uldze",
      loanAmount: (years: number, pct: number) =>
        `Kredyt na pozostałą kwotę (${years} lat przy ${pct}%)`,
      monthlyLoanRepayment: "Miesięczna rata kredytu",
      runningCostPerMonth: "Koszt eksploatacji / miesiąc",
      trueMonthlyCost: "Rzeczywisty koszt miesięczny w trakcie spłaty",
      afterLoanMonthlyCost: "Koszt miesięczny po spłacie kredytu",
    },

    assumptions: {
      intro:
        "Każda liczba powyżej wynika bezpośrednio z odpowiedzi, których udzieliłeś, oraz z danych referencyjnych poniżej. Żadna z nich nie jest ofertą: rzeczywiste warunki instalatora, banku i programu mogą się różnić.",
      yourAnswers: "Założenia przyjęte dla Twojego gospodarstwa",
      noAssumptions:
        "Nie trzeba było przyjmować żadnych założeń: każda dana pochodzi od Ciebie.",
      referenceData: "Dane referencyjne i źródła",
      baselineModel:
        "Koszt eksploatacji stanu wyjściowego odtwarza referencyjny arkusz price_calculator HeatFit: zawartość energii w węglu i sprawność kotła wg klasy, model ciepłej wody i zużycia prądu.",
      capexSource: (source: string) => `Wycena urządzenia i montażu: ${source}`,
      grantProgramme:
        "Dotacja: program Czyste Powietrze, tabela dofinansowania, wiersz(e) arkusza jak podano wyżej.",
      zum: (url: string) =>
        `Pompy ciepła i kotły na pellet muszą znajdować się w oficjalnej bazie ZUM, aby się kwalifikować: ${url}`,
      taxReliefRule: (cap: string, years: number) =>
        `Ulga podatkowa: art. 26h ustawy o PIT. Limit ${cap} na podatnika za wszystkie prace termomodernizacyjne; niewykorzystaną część można rozliczać jeszcze przez ${years} lat. Zakłada się, że dochód podlegający opodatkowaniu jest wystarczająco wysoki, by pokryć odliczenie.`,
      loanTerms:
        "Rata kredytu: odsetki proste naliczone jednorazowo za cały okres, zgodnie z arkuszem referencyjnym HeatFit, a nie jako kredyt annuitetowy z banku.",
    },
  },
};
