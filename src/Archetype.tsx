export type HouseArchetypeId =
  "kostka" | "nowy-dom" | "spadzisty" | "stary-przed-1970";

export interface HouseBadge {
  text: string;
  variant: "success" | "warning" | "neutral";
}

export interface HouseArchetype {
  id: HouseArchetypeId;
  title: string;
  subtitle: string;
  description: string;
  badge: HouseBadge;
  defaultEnergyDemand: number;
  subsidyPriority: "highest" | "high" | "standard";
}

export interface HouseSelectorProps {
  selectedHouseId: HouseArchetypeId;
  onSelectHouse: (houseId: HouseArchetypeId) => void;
  className?: string;
}
