import { HouseArchetype } from "./Archetype";

export const HOUSE_ARCHETYPES: HouseArchetype[] = [
  {
    id: "kostka",
    title: "Dom Kostka",
    subtitle: "lata 70–80",
    description: "Płaski stropodach, mury warstwowe, duże mostki termiczne.",
    badge: {
      text: "Najwyższy potencjał oszczędności",
      variant: "success",
    },
    defaultEnergyDemand: 160,
    subsidyPriority: "highest",
  },
  {
    id: "nowy-dom",
    title: "Nowy Dom",
    subtitle: "po 2015 r.",
    description:
      "Dobra izolacja ścian i okien, niskie zapotrzebowanie cieplne.",
    badge: {
      text: "Standard WT2014+",
      variant: "neutral",
    },
    defaultEnergyDemand: 65,
    subsidyPriority: "standard",
  },
  {
    id: "spadzisty",
    title: "Dom Spadzisty",
    subtitle: "lata 90–2000",
    description:
      "Częściowo docieplone poddasze, standardowa ceramika/gazobeton.",
    badge: {
      text: "Izolacja umiarkowana",
      variant: "neutral",
    },
    defaultEnergyDemand: 115,
    subsidyPriority: "high",
  },
  {
    id: "stary-przed-1970",
    title: "Stary Dom",
    subtitle: "przed 1970 r.",
    description: "Grube mury z cegły, brak izolacji fundamentów i stropu.",
    badge: {
      text: "Wymaga kompleksowej termomodernizacji",
      variant: "warning",
    },
    defaultEnergyDemand: 220,
    subsidyPriority: "highest",
  },
];
