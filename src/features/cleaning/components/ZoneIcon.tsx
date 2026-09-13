import React from "react";
import { UtensilsCrossed, Sofa, Bath, Sparkles } from "lucide-react";

interface ZoneIconProps {
  slug?: string;
  icon?: string;
  className?: string;
}

export const ZoneIcon: React.FC<ZoneIconProps> = ({ slug, icon, className = "w-5 h-5" }) => {
  const normalized = (slug || icon || "").toLowerCase();

  if (normalized.includes("cocina") || normalized.includes("kitchen")) {
    return <UtensilsCrossed className={className} />;
  }
  if (normalized.includes("salon") || normalized.includes("salón") || normalized.includes("living")) {
    return <Sofa className={className} />;
  }
  if (normalized.includes("bano") || normalized.includes("baño") || normalized.includes("bath")) {
    return <Bath className={className} />;
  }

  return <Sparkles className={className} />;
};
