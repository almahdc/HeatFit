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
      ecodesign: "z certyfikatem Ecodesign",
    },
  },

  baseline: {
    title: "Ile płacisz dzisiaj",
    subtitle:
      "Twój obecny rok na węglu, odtworzony z Twoich własnych odpowiedzi. Wszystko, co dalej, mierzymy względem tej jednej kwoty, więc sprawdź przez chwilę, czy wygląda jak Twoje życie.",
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
    whyTotalSummary: "Skąd bierze się ta kwota",
    whyTotalBody:
      "Bierzemy węgiel, który podałeś, energię zawartą w tym sortymencie i to, ile z niej Twoja klasa kotła naprawdę zamienia w ciepło. Ciepłą wodę i całą resztę licznika wyceniamy ze średniej krajowej. Wszystko, co musieliśmy założyć, wypisujemy powyżej.",
    whyConditionSummary: "Dlaczego ta liczba tyle znaczy",
    whyConditionBody:
      "kWh/m²/rok to stan Twojego budynku w jednej liczbie: ile ciepła potrzebuje na metr kwadratowy. Czyste Powietrze posługuje się tą samą miarą. Powyżej 140 program nie sfinansuje samego źródła ciepła bez termomodernizacji i dopiero powyżej 140 otwiera się najwyższy poziom dofinansowania. Nic nie jest punktowane po cichu: to jest ta liczba, a krok 5 pokazuje dokładnie, co oznacza dla Twojej dotacji.",
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

    trust: {
      czystePowietrze: {
        label: "Objęte Czystym Powietrzem",
        detail:
          "Wszystkie trzy opcje to rozwiązania finansowane przez program krajowy. Ile przysługuje właśnie Twojemu gospodarstwu, liczymy w kroku 5, na podstawie Twoich danych.",
      },
      zum: {
        label: "Tylko urządzenia z listy ZUM",
        detail:
          "Dotacja obejmuje wyłącznie sprzęt z oficjalnej rządowej listy ZUM. Link znajdziesz niżej, żeby sprawdzić konkretny model, zanim się na niego zdecydujesz.",
      },
    },

    compare: {
      title: "Porównaj wymianę",
      subtitle:
        "Jedna opcja naraz, żeby porównanie pozostało uczciwe. Ten krok to sam koszt energii: fotowoltaika, dotacje i finansowanie mają niżej własne kroki.",
      fieldLabel: "Opcja wymiany",
      bestValueBadge: "Największa oszczędność",
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
      note: "Ulga to odliczenie od dochodu, a nie wypłata: odzyskujesz swoją stawkę podatku od tej kwoty i dostajesz ją z rocznym zeznaniem, a nie z góry. Dlatego krok 6 wciąż liczy kredyt od pełnej kwoty, która zostaje po dotacji.",
      capAndIncomeNote: (cap: string, years: number) =>
        `Maksymalnie ${cap} na podatnika, łącznie za wszystkie prace termomodernizacyjne, a niewykorzystaną część można rozliczać jeszcze przez ${years} lat. Zakładamy, że Twój dochód jest wystarczająco wysoki, żeby odliczenie się zmieściło: nie pytaliśmy, ile zarabiasz, i nie zamierzamy.`,
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
    title: "Dalej przejmuje to człowiek",
    subtitle:
      "Masz już liczby. Teraz zaczyna się część, na której większość gospodarstw utyka, i tę część robimy razem z Tobą, zamiast wręczyć Ci listę i życzyć powodzenia.",
    reviewNote:
      "Cokolwiek wybierzesz, zaczyna się tak samo. Zanim ktokolwiek się z Tobą skontaktuje, ktoś z zespołu HeatFit przegląda audyt, który właśnie wypełniłeś: Twój budynek, Twoje liczby, Twoje ograniczenia.",
    valueProps: {
      installers: {
        title: "Dobieramy sprawdzonych lokalnych instalatorów",
        description:
          "Sprawdzamy, kto naprawdę pracuje w Twojej okolicy, i przedstawiamy Cię osobiście. To nie katalog ani lista numerów do obdzwonienia.",
      },
      grant: {
        title: "Przechodzimy z Tobą przez formalności Czystego Powietrza",
        description:
          "Człowiek prowadzi Twój wniosek, żeby dofinansowanie nie przepadło przez drobiazg albo przegapiony termin.",
      },
      financing: {
        title: "Układamy zielone finansowanie z bankami partnerskimi",
        description:
          "Jeśli wolisz rozłożyć koszt, przynosimy opcje kredytu już dopasowane do tej konkretnej inwestycji.",
      },
    },
    modal: {
      title: "Zapisz się na wczesny dostęp",
      subtitle:
        "Zostaw swoje dane, a odezwiemy się osobiście, gdy tylko HeatFit ruszy.",
      regarding: (topic: string) => `Dotyczy: ${topic}`,
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
