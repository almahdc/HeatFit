import { Building2, Home, Layers, Check, HelpCircle } from "lucide-react";
import { HouseArchetypeId, HouseSelectorProps, HouseBadge } from "./Archetype";
import { HOUSE_ARCHETYPES } from "./ArchetypeData";

/** Pomocniczy komponent renderujący ikonę dla danego typu budynku */
const HouseIcon: React.FC<{ id: HouseArchetypeId; isSelected: boolean }> = ({
  id,
  isSelected,
}) => {
  const iconClasses = `w-5 h-5 transition-colors ${
    isSelected ? "text-[#16697a]" : "text-slate-500"
  }`;

  switch (id) {
    case "kostka":
      return <Layers className={iconClasses} />;
    case "nowy-dom":
      return <Home className={iconClasses} />;
    case "spadzisty":
      return <Building2 className={iconClasses} />;
    case "stary-przed-1970":
      return <Home className={iconClasses} />;
    default:
      return <Building2 className={iconClasses} />;
  }
};

/** Renderowanie badge'a informacyjnego */
const BadgeTag: React.FC<{ badge: HouseBadge; isSelected: boolean }> = ({
  badge,
  isSelected,
}) => {
  const getVariantStyles = () => {
    switch (badge.variant) {
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "neutral":
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border tracking-tight ${getVariantStyles()}`}
    >
      {badge.text}
    </span>
  );
};

export const HouseTypeSelector: React.FC<HouseSelectorProps> = ({
  selectedHouseId,
  onSelectHouse,
  className = "",
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm ${className}`}
    >
      {/* Nagłówek sekcji */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#16697a] text-white font-bold text-sm">
            2
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Twój Dom (Typ budynku i stan techniczny)
            </h3>
            <p className="text-xs text-slate-500">
              Wybierz sylwetkę odpowiadającą Twojej nieruchomości, aby dobrać
              profil izolacji
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Pomoc przy wyborze typu domu"
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Siatka 4 kafelków (2 kolumny na desktopie, 1 na mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {HOUSE_ARCHETYPES.map((house) => {
          const isSelected = selectedHouseId === house.id;

          return (
            <button
              key={house.id}
              type="button"
              onClick={() => onSelectHouse(house.id)}
              aria-pressed={isSelected}
              className={`group relative text-left p-4 rounded-xl border-2 transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? "border-[#16697a] bg-[#16697a]/[0.03] shadow-sm ring-1 ring-[#16697a]/20"
                  : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              {/* Górny wiersz: Ikona, Badge oraz Checkmark wyboru */}
              <div className="flex items-start justify-between gap-2 mb-2.5 w-full">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-white shadow-xs border border-[#16697a]/20"
                        : "bg-slate-100"
                    }`}
                  >
                    <HouseIcon id={house.id} isSelected={isSelected} />
                  </div>
                  <BadgeTag badge={house.badge} isSelected={isSelected} />
                </div>

                {/* Zaznaczenie checkbox/checkmark */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-[#16697a] text-white"
                      : "border-2 border-slate-300 opacity-0 group-hover:opacity-60"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              {/* Treść: Tytuł, Subtitle i Opis techniczny */}
              <div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {house.title}
                  </h4>
                  <span className="text-xs font-normal text-slate-500">
                    ({house.subtitle})
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {house.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HouseTypeSelector;
