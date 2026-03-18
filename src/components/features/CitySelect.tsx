"use client";

import { MapPin } from "lucide-react";
import { LOCATIONS } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CitySelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
  allLabel?: string;
  excludeIds?: string[];
};

const CITY_OPTIONS = LOCATIONS.map((location) => ({
  ...location,
  shortName: location.name.split(",")[0]?.trim() ?? location.name,
}));

export function CitySelect({
  value,
  onValueChange,
  className,
  triggerClassName,
  allLabel = "Todas las ciudades",
  excludeIds = [],
}: CitySelectProps) {
  const options =
    excludeIds.length > 0
      ? CITY_OPTIONS.filter((location) => !excludeIds.includes(location.id))
      : CITY_OPTIONS;

  return (
    <div className={cn("relative min-w-[220px]", className)}>
      <MapPin
        className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={cn(
            "h-11 w-full rounded-full border border-gray-200 bg-gray-100/90 pl-10 pr-4 text-sm font-medium text-gray-600 shadow-none transition-colors hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
            triggerClassName
          )}
        >
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.shortName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
